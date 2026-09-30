using System.Globalization;
using System.Reflection;
using System.Text;
using Microsoft.Extensions.Configuration;
using QuickPark.API.Enums;
using QuickPark.API.Integrations.Payments;
using QuickPark.API.Models;
using QuickPark.API.Services.Implementations;
using QuickPark.API.Services.Interfaces;

namespace QuickPark.Tests.Unit.Services;

public class PaymentServiceTests
{

    private static ICommissionService Commission() => new CommissionService(null!);

    [Theory]
    [InlineData(1000.00, 10.00, 100.00, 900.00)]
    [InlineData(600.00, 12.50, 75.00, 525.00)]
    [InlineData(300.00, 0.00, 0.00, 300.00)]
    [InlineData(1.00, 100.00, 1.00, 0.00)]
    [InlineData(0.00, 15.00, 0.00, 0.00)]
    public void Calculate_SplitsTheAmount_AndTheTwoHalvesAddBackUp(
        decimal gross, decimal rate, decimal expectedCommission, decimal expectedProvider)
    {
        var split = Commission().Calculate(gross, rate);

        Assert.Equal(gross, split.GrossAmount);
        Assert.Equal(rate, split.CommissionRate);
        Assert.Equal(expectedCommission, split.CommissionAmount);
        Assert.Equal(expectedProvider, split.ProviderAmount);

        Assert.Equal(gross, split.CommissionAmount + split.ProviderAmount);
    }

    [Theory]
    [InlineData(333.33, 12.5, 41.67)]
    [InlineData(0.25, 10, 0.03)]
    [InlineData(1234.56, 7.5, 92.59)]
    public void Calculate_RoundsHalfUpToThePaisa(decimal gross, decimal rate, decimal expected)
    {
        Assert.Equal(expected, Commission().Calculate(gross, rate).CommissionAmount);
        Assert.Equal(expected, CommissionService.Compute(gross, rate));
    }

    [Theory]
    [InlineData(-1.00, 10.00)]
    [InlineData(0.00, -0.01)]
    [InlineData(100.00, 100.01)]
    public void Calculate_RejectsAmountsAndRatesOutOfRange(decimal gross, decimal rate)
    {
        Assert.Throws<InvalidOperationException>(() => Commission().Calculate(gross, rate));
    }

    [Fact]
    public void Calculate_KeepsTheRateThatWasApplied_NotTheOneConfiguredNow()
    {
        var bookedLastYear = Commission().Calculate(800.00m, 10.00m);

        Assert.Equal(10.00m, bookedLastYear.CommissionRate);
        Assert.Equal(80.00m, bookedLastYear.CommissionAmount);
    }

    [Theory]
    [InlineData(PaymentStatus.PENDING, PaymentStatus.PAID)]
    [InlineData(PaymentStatus.PENDING, PaymentStatus.FAILED)]
    [InlineData(PaymentStatus.PENDING, PaymentStatus.CANCELLED)]
    [InlineData(PaymentStatus.PAID, PaymentStatus.REFUNDED)]
    public void EnsureCanMove_AllowsTheArrowsTheLifecycleHas(PaymentStatus from, PaymentStatus to)
    {
        Move(from, to);
    }

    [Theory]
    // A refund is the end of the road
    [InlineData(PaymentStatus.REFUNDED, PaymentStatus.PAID)]
    [InlineData(PaymentStatus.PAID, PaymentStatus.PENDING)]
    [InlineData(PaymentStatus.PAID, PaymentStatus.FAILED)]
    [InlineData(PaymentStatus.PAID, PaymentStatus.CANCELLED)]
    [InlineData(PaymentStatus.FAILED, PaymentStatus.PAID)]
    [InlineData(PaymentStatus.CANCELLED, PaymentStatus.PAID)]
    [InlineData(PaymentStatus.PENDING, PaymentStatus.REFUNDED)]
    [InlineData(PaymentStatus.REFUNDED, PaymentStatus.REFUNDED)]
    public void EnsureCanMove_RefusesEveryOtherArrow(PaymentStatus from, PaymentStatus to)
    {
        var ex = Assert.Throws<InvalidOperationException>(() => Move(from, to));
        Assert.Contains("cannot become", ex.Message);
    }

    private static void Move(PaymentStatus from, PaymentStatus to)
    {
        var ensure = typeof(PaymentService)
            .GetMethod("EnsureCanMove", BindingFlags.NonPublic | BindingFlags.Static)!;

        try
        {
            ensure.Invoke(null, new object[] { from, to });
        }
        catch (TargetInvocationException ex) when (ex.InnerException is not null)
        {
            throw ex.InnerException;
        }
    }

    private static SandboxCardPaymentGateway Gateway(string? secret = null) =>
        new(BuildConfig(secret is null
            ? new Dictionary<string, string?>()
            : new Dictionary<string, string?> { ["PaymentGateway:SandboxSecret"] = secret }));

    private static IConfiguration BuildConfig(Dictionary<string, string?> values) =>
        new ConfigurationBuilder().AddInMemoryCollection(values).Build();

    private const string ApprovedCard = "4242424242424242";
    private static readonly CardCheckoutDetails GoodCard =
        new(ApprovedCard, "N. Driver", "12/34", "123");

    private static readonly Guid PaymentId = Guid.NewGuid();
    private static readonly Guid ReservationId = Guid.NewGuid();

    [Fact]
    public void CreateCheckout_HandsBackAReferenceTheDriverCanTakeToTheGateway()
    {
        var gateway = Gateway();

        var checkout = gateway.CreateCheckout(PaymentId, ReservationId, 600.00m);

        Assert.Equal(gateway.Provider, checkout.Provider);
        Assert.StartsWith("v1.", checkout.Reference);
        Assert.Contains(checkout.Reference, checkout.CheckoutPath);
        Assert.True(checkout.ExpiresAt > DateTime.UtcNow.AddMinutes(-1));
        Assert.True(checkout.ExpiresAt <= DateTime.UtcNow.AddMinutes(15));
    }

    [Fact]
    public void CompleteCheckout_ApprovesTheSandboxCard_AndTheCallbackCarriesThePayment()
    {
        var gateway = Gateway();
        var reference = gateway.CreateCheckout(PaymentId, ReservationId, 600.00m).Reference;

        var result = gateway.CompleteCheckout(reference, GoodCard);

        Assert.True(result.Approved);
        Assert.Null(result.DeclineReason);
        Assert.Equal(600.00m, result.Amount);

        var callback = gateway.VerifyCallback(result.CallbackToken);
        Assert.Equal(PaymentId, callback.PaymentId);
        Assert.Equal(600.00m, callback.Amount);
        Assert.True(callback.Approved);
        Assert.Equal(result.TransactionId, callback.TransactionId);
    }

    [Fact]
    public void CompleteCheckout_IsIdempotent_TheSameCheckoutGivesTheSameTransaction()
    {
        // A driver who hits "pay" twice, or a gateway that retries its own callback, produces one transaction id.
        var gateway = Gateway();
        var reference = gateway.CreateCheckout(PaymentId, ReservationId, 600.00m).Reference;

        var first = gateway.CompleteCheckout(reference, GoodCard);
        var second = gateway.CompleteCheckout(reference, GoodCard);

        Assert.Equal(first.TransactionId, second.TransactionId);
        Assert.Equal(first.CallbackToken, second.CallbackToken);
        Assert.StartsWith("QPSBX-", first.TransactionId);
    }

    [Theory]
    [InlineData("4000000000000002", "declined by the issuer")]
    [InlineData("4000000000009995", "expired")]
    [InlineData("5555555555554444", "Insufficient funds")]
    [InlineData("4111111111111111", "not part of the sandbox test set")]
    public void CompleteCheckout_DeclinesTheCardsItShould_GivingTheReasonForIt(string card, string expectedReason)
    {
        var gateway = Gateway();
        var reference = gateway.CreateCheckout(PaymentId, ReservationId, 600.00m).Reference;

        var result = gateway.CompleteCheckout(reference, new CardCheckoutDetails(card, "N. Driver", "12/34", "123"));

        Assert.False(result.Approved);
        Assert.Contains(expectedReason, result.DeclineReason);

        // The decline is still a signed statement from the gateway
        Assert.False(gateway.VerifyCallback(result.CallbackToken).Approved);
    }

    [Theory]
    [InlineData("4242")]
    [InlineData("")]
    [InlineData("4242 4242 4242")]
    public void CompleteCheckout_RejectsACardNumberThatIsNot13To19Digits(string card)
    {
        var gateway = Gateway();
        var reference = gateway.CreateCheckout(PaymentId, ReservationId, 600.00m).Reference;

        var ex = Assert.Throws<InvalidOperationException>(() =>
            gateway.CompleteCheckout(reference, new CardCheckoutDetails(card, "N. Driver", "12/34", "123")));

        Assert.Contains("13 to 19 digits", ex.Message);
    }

    [Theory]
    [InlineData("13/30")]
    [InlineData("12/2999")]
    [InlineData("2099/12")]
    [InlineData("")]
    public void CompleteCheckout_RejectsAnExpiryThatIsNotAMonthAndATwoDigitYear(string expiry)
    {
        var gateway = Gateway();
        var reference = gateway.CreateCheckout(PaymentId, ReservationId, 600.00m).Reference;

        Assert.Throws<InvalidOperationException>(() =>
            gateway.CompleteCheckout(reference, new CardCheckoutDetails(ApprovedCard, "N. Driver", expiry, "123")));
    }

    [Fact]
    public void CompleteCheckout_RejectsACardThatHasAlreadyExpired()
    {
        var gateway = Gateway();
        var reference = gateway.CreateCheckout(PaymentId, ReservationId, 600.00m).Reference;

        var ex = Assert.Throws<InvalidOperationException>(() =>
            gateway.CompleteCheckout(reference, new CardCheckoutDetails(ApprovedCard, "N. Driver", "01/20", "123")));

        Assert.Contains("expired", ex.Message);
    }

    [Theory]
    [InlineData("12")]
    [InlineData("12345")]
    [InlineData("abc")]
    public void CompleteCheckout_RejectsASecurityCodeThatIsNot3Or4Digits(string cvv)
    {
        var gateway = Gateway();
        var reference = gateway.CreateCheckout(PaymentId, ReservationId, 600.00m).Reference;

        Assert.Throws<InvalidOperationException>(() =>
            gateway.CompleteCheckout(reference, new CardCheckoutDetails(ApprovedCard, "N. Driver", "12/34", cvv)));
    }

    [Fact]
    public void VerifyCallback_RejectsATokenThatWasTamperedWith()
    {
        var gateway = Gateway();
        var reference = gateway.CreateCheckout(PaymentId, ReservationId, 600.00m).Reference;
        var token = gateway.CompleteCheckout(reference, GoodCard).CallbackToken;

        var parts = token.Split('.');
        var forgedBody = Base64Url(Encoding.UTF8.GetBytes(
            "{\"Purpose\":\"callback\",\"PaymentId\":\"" + PaymentId +
            "\",\"Amount\":\"0.01\",\"TransactionId\":\"FREE\",\"Approved\":true,\"ExpiresAt\":9999999999}"));
        var forged = $"{parts[0]}.{forgedBody}.{parts[2]}";

        var ex = Assert.Throws<InvalidOperationException>(() => gateway.VerifyCallback(forged));
        Assert.Contains("signature check", ex.Message);
    }

    [Fact]
    public void VerifyCallback_RejectsATokenSignedByAnotherSecret()
    {
        // Two instances must agree on the key or a confirmation from one is garbage to the other.
        var issued = Gateway("secret-for-instance-a").CreateCheckout(PaymentId, ReservationId, 600.00m).Reference;
        var token = Gateway("secret-for-instance-a").CompleteCheckout(issued, GoodCard).CallbackToken;

        var ex = Assert.Throws<InvalidOperationException>(() =>
            Gateway("secret-for-instance-b").VerifyCallback(token));

        Assert.Contains("signature check", ex.Message);
    }

    [Fact]
    public void VerifyCallback_RejectsACheckoutReferenceUsedAsACallback()
    {
        var gateway = Gateway();
        var checkout = gateway.CreateCheckout(PaymentId, ReservationId, 600.00m).Reference;

        var ex = Assert.Throws<InvalidOperationException>(() => gateway.VerifyCallback(checkout));
        Assert.Contains("not a gateway callback reference", ex.Message);
    }

    [Fact]
    public void CompleteCheckout_RejectsACallbackTokenUsedAsACheckout()
    {
        var gateway = Gateway();
        var reference = gateway.CreateCheckout(PaymentId, ReservationId, 600.00m).Reference;
        var token = gateway.CompleteCheckout(reference, GoodCard).CallbackToken;

        var ex = Assert.Throws<InvalidOperationException>(() => gateway.CompleteCheckout(token, GoodCard));
        Assert.Contains("not a gateway checkout reference", ex.Message);
    }

    [Theory]
    [InlineData("")]
    [InlineData("not-a-token")]
    [InlineData("v2.abcdefgh.ijklmnop")]
    public void Gateway_RejectsAnythingThatIsNotItsOwnToken(string junk)
    {
        var gateway = Gateway();

        Assert.Throws<InvalidOperationException>(() => gateway.VerifyCallback(junk));
        Assert.Throws<InvalidOperationException>(() =>
            gateway.CompleteCheckout(junk, GoodCard));
    }

    [Fact]
    public void CheckoutWindow_ComesFromConfiguration_NotFromHardcodedTrust()
    {
        // The length of the checkout grace period is a knob; the expired-token refusal it protects is asserted above.
        var configured = new SandboxCardPaymentGateway(BuildConfig(new Dictionary<string, string?>
        {
            ["PaymentGateway:CheckoutTtlMinutes"] = "1"
        }));

        var shortWindow = configured.CreateCheckout(PaymentId, ReservationId, 600.00m).ExpiresAt;
        var defaultWindow = Gateway().CreateCheckout(PaymentId, ReservationId, 600.00m).ExpiresAt;

        Assert.True(shortWindow <= defaultWindow.AddMinutes(-5),
            "The configured TTL should shorten the checkout window from its 15 minute default.");
    }

    [Fact]
    public void RefundReceiptId_IsStablePerTransaction_AndDifferentForEachOne()
    {
        var gateway = Gateway();

        var first = gateway.RefundReceiptId("QPSBX-AAA");
        var second = gateway.RefundReceiptId("QPSBX-AAA");
        var other = gateway.RefundReceiptId("QPSBX-BBB");

        Assert.Equal(first, second);
        Assert.NotEqual(first, other);
        Assert.StartsWith("QPSBX-RF-", first);
    }

    // ---- the booking fee and the parking charge ----

    [Theory]
    [InlineData(ReservationStatus.PENDING, PaymentStage.BOOKING_FEE)]
    [InlineData(ReservationStatus.CONFIRMED, PaymentStage.PARKING_CHARGE)]
    [InlineData(ReservationStatus.CHECKED_IN, PaymentStage.PARKING_CHARGE)]
    [InlineData(ReservationStatus.CHECKED_OUT, PaymentStage.PARKING_CHARGE)]
    public void The_booking_lifecycle_decides_which_charge_is_owed(
        ReservationStatus status, PaymentStage expected)
    {
        Assert.Equal(expected, (PaymentStage)Invoke("StageFor", status)!);
    }

    [Theory]
    // The examples the rule is written down with: two hours' hold at Rs.50 an hour, half an hour,
    // ninety minutes, and a booking placed for the very moment it starts.
    [InlineData(50.00, 120, "100.00")]
    [InlineData(50.00, 30, "25.00")]
    [InlineData(50.00, 90, "75.00")]
    [InlineData(50.00, 0, "0.00")]
    [InlineData(50.00, 15, "12.50")]
    [InlineData(50.00, 20, "16.67")]
    [InlineData(333.33, 5, "27.78")]
    [InlineData(500.00, 120, "1000.00")]
    [InlineData(10.00, 360, "60.00")]
    public void The_fee_is_the_lead_time_the_bay_was_held_for_at_this_bookings_own_rate(
        decimal hourlyRate, int leadMinutes, string expected)
    {
        var fee = Amount(Held(hourlyRate, leadMinutes), PaymentStage.BOOKING_FEE);

        Assert.Equal(expected, fee.ToString("0.00", CultureInfo.InvariantCulture));
    }

    [Theory]
    // A bay needed before the clock that placed the booking is worth nothing, and it is never a
    // negative the driver is paid back for.
    [InlineData(-30)]
    [InlineData(-1)]
    public void A_booking_with_no_lead_time_owes_no_fee(int leadMinutes) =>
        Assert.Equal(0.00m, Amount(Held(50.00m, leadMinutes), PaymentStage.BOOKING_FEE));

    [Fact]
    public void The_same_lead_time_is_a_different_fee_for_two_vehicle_types()
    {
        // One hour of hold: a motorbike priced at Rs.40 and a van priced at Rs.90 are not the same charge.
        Assert.Equal(40.00m, Amount(Held(40.00m, 60), PaymentStage.BOOKING_FEE));
        Assert.Equal(90.00m, Amount(Held(90.00m, 60), PaymentStage.BOOKING_FEE));
    }

    [Fact]
    public void The_fee_is_counted_from_the_booking_and_not_from_the_clock_it_is_read_on()
    {
        // One argument, the booking: nothing about the moment the fee is read can move the amount the
        // driver was quoted, so the same attempt re-priced later settles for the same money. Two
        // bookings placed months apart and held for the same ninety minutes are the same fee.
        var parameters = typeof(PaymentService)
            .GetMethod("BookingFee", BindingFlags.NonPublic | BindingFlags.Static)!
            .GetParameters().Select(p => p.ParameterType).ToArray();

        Assert.Equal(new[] { typeof(Reservation) }, parameters);
        Assert.Equal(
            Amount(Held(50.00m, PlacedAt, 90), PaymentStage.BOOKING_FEE),
            Amount(Held(50.00m, PlacedAt.AddMonths(3), 90), PaymentStage.BOOKING_FEE));
    }

    [Fact]
    public void The_service_holds_no_platform_fee_of_its_own()
    {
        // Nothing reads Payments:BookingFee any more: a configured value is dead weight, and the
        // service keeps no decimal of its own to charge.
        var service = new PaymentService(null!, BuildConfig(
            new Dictionary<string, string?> { ["Payments:BookingFee"] = "500" }));

        Assert.Empty(typeof(PaymentService)
            .GetFields(BindingFlags.NonPublic | BindingFlags.Instance)
            .Where(f => f.FieldType == typeof(decimal))
            .Select(f => f.Name));
    }

    [Fact]
    public void The_booking_is_only_confirmed_by_paying_its_fee()
    {
        Assert.Equal(ReservationStatus.CONFIRMED,
            (ReservationStatus?)Invoke("ConfirmedBy", PaymentStage.BOOKING_FEE, ReservationStatus.PENDING)!);
    }

    [Theory]
    [InlineData(PaymentStage.BOOKING_FEE, ReservationStatus.CANCELLED)]
    [InlineData(PaymentStage.BOOKING_FEE, ReservationStatus.CONFIRMED)]
    [InlineData(PaymentStage.PARKING_CHARGE, ReservationStatus.PENDING)]
    [InlineData(PaymentStage.PARKING_CHARGE, ReservationStatus.CHECKED_IN)]
    [InlineData(PaymentStage.PARKING_CHARGE, ReservationStatus.CHECKED_OUT)]
    public void Nothing_else_moves_a_booking_to_confirmed(PaymentStage stage, ReservationStatus current)
    {
        Assert.Null(Invoke("ConfirmedBy", stage, current));
    }

    [Fact]
    public void Before_the_gate_opens_the_charge_is_the_amount_the_booking_was_quoted_at()
    {
        Assert.Equal(1000.00m, Amount(Booked(200.00m, 5), PaymentStage.PARKING_CHARGE));
    }

    [Fact]
    public void The_charge_after_checkout_is_the_time_the_bay_was_actually_used()
    {
        // The business example: in at 14:00 and out at 17:30 at Rs.200 an hour is Rs.700, whatever
        // the five hours the driver first booked the bay for.
        var stayed = Booked(200.00m, 5);
        stayed.CheckedInAt = At(14, 0);
        stayed.CheckedOutAt = At(17, 30);

        Assert.Equal(700.00m, Amount(stayed, PaymentStage.PARKING_CHARGE));

        // Rs.150 for holding the bay the 45 minutes before it was needed, plus Rs.700 for the stay:
        // the fee is timed off the lead, the charge off the stay, and neither is inside the other.
        Assert.Equal(150.00m, Amount(stayed, PaymentStage.BOOKING_FEE));
        Assert.Equal(850.00m, Amount(stayed, PaymentStage.BOOKING_FEE) + Amount(stayed, PaymentStage.PARKING_CHARGE));
    }

    [Fact]
    public void The_parking_charge_never_becomes_a_lead_time_fee_and_the_fee_never_a_stay()
    {
        var placed_late = Booked(200.00m, 5);
        placed_late.StartTime = PlacedAt.AddMinutes(5);

        var placed_early = Booked(200.00m, 5);
        placed_early.StartTime = PlacedAt.AddHours(20);

        // Same stay, so the same parking charge however far ahead the bay was held.
        Assert.Equal(Amount(placed_late, PaymentStage.PARKING_CHARGE),
            Amount(placed_early, PaymentStage.PARKING_CHARGE));
        // And the fee does move with that lead, which is the half of the bill the booking decides:
        // five minutes' hold at Rs.200 an hour is a third of an hour's rate, not a minimum one hour.
        Assert.Equal(16.67m, Amount(placed_late, PaymentStage.BOOKING_FEE));
        Assert.Equal(4000.00m, Amount(placed_early, PaymentStage.BOOKING_FEE));
    }

    [Theory]
    [InlineData(14, 0, 17, 30, 3.5)]
    [InlineData(14, 0, 18, 0, 4)]
    [InlineData(9, 0, 9, 20, 1)]
    [InlineData(17, 30, 14, 0, 1)]
    public void Half_hours_bill_as_half_hours_and_the_floor_stays_one_hour(
        int inHour, int inMinute, int outHour, int outMinute, decimal expectedHours)
    {
        var hours = (decimal)Invoke("ActualHours", At(inHour, inMinute), At(outHour, outMinute))!;

        Assert.Equal(expectedHours, hours);
    }

    [Theory]
    [InlineData(ReservationStatus.PENDING)]
    [InlineData(ReservationStatus.CHECKED_OUT)]
    public void Each_stage_is_only_payable_at_its_own_moment_of_the_booking(ReservationStatus status) =>
        Invoke("EnsureOpenForPayment", Booked(200.00m, 5, status));

    [Theory]
    // While the car sits in the bay the stay's hours are still being written, so a charge taken now
    // would be the booked estimate and would block the real one that follows.
    [InlineData(ReservationStatus.CONFIRMED)]
    [InlineData(ReservationStatus.CHECKED_IN)]
    public void The_stay_cannot_be_paid_for_before_it_ends(ReservationStatus status)
    {
        var ex = Assert.Throws<InvalidOperationException>(() =>
            Invoke("EnsureOpenForPayment", Booked(200.00m, 5, status)));

        Assert.Contains("once the car leaves the bay", ex.Message);
    }

    [Theory]
    [InlineData(ReservationStatus.CANCELLED)]
    [InlineData(ReservationStatus.NOSHOW)]
    [InlineData(ReservationStatus.COMPLETED)]
    public void A_booking_that_ended_elsewhere_has_nothing_left_to_pay_for(ReservationStatus status)
    {
        var ex = Assert.Throws<InvalidOperationException>(() =>
            Invoke("EnsureOpenForPayment", Booked(200.00m, 5, status)));

        Assert.Contains("can no longer be paid for", ex.Message);
    }

    [Fact]
    public void A_paid_fee_is_not_refundable_and_says_what_is()
    {
        var ex = Assert.Throws<InvalidOperationException>(() =>
            Invoke("EnsureRefundable", PaymentStage.BOOKING_FEE));

        Assert.Equal("A booking fee is not refundable. Refund the parking charge instead.", ex.Message);
    }

    [Fact]
    public void The_parking_charge_keeps_the_refund_path_it_already_had() =>
        Invoke("EnsureRefundable", PaymentStage.PARKING_CHARGE);

    [Fact]
    public void The_card_is_charged_the_lead_time_fee_and_the_callback_comes_back_with_that_same_amount()
    {
        // The fee the booking is worth is the fee the gateway takes: nothing on the card path rescales it.
        var gateway = Gateway();
        var fee = Amount(Held(50.00m, 90), PaymentStage.BOOKING_FEE);

        var result = gateway.CompleteCheckout(
            gateway.CreateCheckout(PaymentId, ReservationId, fee).Reference, GoodCard);

        Assert.True(result.Approved);
        Assert.Equal(75.00m, result.Amount);
        Assert.Equal(75.00m, gateway.VerifyCallback(result.CallbackToken).Amount);
    }

    [Fact]
    public void Cash_at_the_property_settles_the_same_lead_time_fee_the_card_was_charged()
    {
        var held = Held(50.00m, 90);
        var gross = Amount(held, PaymentStage.BOOKING_FEE);

        // The owner is confirming the fee stage of a booking that is still PENDING, so it is settleable
        // and the note the commission line carries names the fee that was actually owed.
        Invoke("EnsureSettleable", held);

        var note = (string)Invoke("BuildCashReference",
            held, PaymentStage.BOOKING_FEE, gross, true, "Paid at the gate")!;

        Assert.Contains("set to the 75.00 booking fee", note);
        Assert.Equal(75.00m, Amount(held, PaymentStage.BOOKING_FEE));
    }

    private static readonly DateTime PlacedAt = new(2026, 9, 15, 8, 0, 0, DateTimeKind.Utc);

    private static Reservation Booked(
        decimal hourlyRate, int hours, ReservationStatus status = ReservationStatus.PENDING) => new()
    {
        HourlyRate = hourlyRate,
        Hours = hours,
        TotalAmount = hourlyRate * hours,
        Status = status,
        CreatedAt = PlacedAt,
        StartTime = PlacedAt.AddMinutes(45)
    };

    // A booking held for `leadMinutes` before the bay is needed, at that vehicle type's own rate.
    private static Reservation Held(decimal hourlyRate, int leadMinutes) =>
        Held(hourlyRate, PlacedAt, leadMinutes);

    private static Reservation Held(decimal hourlyRate, DateTime placedAt, int leadMinutes) => new()
    {
        HourlyRate = hourlyRate,
        CreatedAt = placedAt,
        StartTime = placedAt.AddMinutes(leadMinutes)
    };

    private static decimal Amount(Reservation reservation, PaymentStage stage) =>
        (decimal)Invoke("AmountFor", reservation, stage)!;

    private static DateTime At(int hour, int minute) =>
        new DateTime(2026, 9, 15, hour, minute, 0, DateTimeKind.Utc);

    // The stage rules are private for the same reason the transition tables are: only the service
    // should widen them, so the tests reach them without opening them up.
    private static object? Invoke(string name, params object?[] args)
    {
        var method = typeof(PaymentService)
            .GetMethod(name, BindingFlags.NonPublic | BindingFlags.Static)!;

        try
        {
            return method.Invoke(null, args);
        }
        catch (TargetInvocationException ex) when (ex.InnerException is not null)
        {
            throw ex.InnerException;
        }
    }

    private static string Base64Url(byte[] bytes) =>
        Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}
