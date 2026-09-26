using System.Reflection;
using System.Text;
using Microsoft.Extensions.Configuration;
using QuickPark.API.Enums;
using QuickPark.API.Integrations.Payments;
using QuickPark.API.Services.Implementations;
using QuickPark.API.Services.Interfaces;

namespace QuickPark.Tests.Unit.Services;

// The money rules, tested without a database.
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

        // The owner's share is whatever is left, so the pair can never drift from the total.
        Assert.Equal(gross, split.CommissionAmount + split.ProviderAmount);
    }

    [Theory]
    // 12.5% of Rs.333.33 = 41.66625, and the paisa it rounds to must be the same paisa the booking was priced with.
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
        // The rate is stored next to the money it produced, so a later config change cannot rewrite history.
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
    // A refund is the end of the road: the way back is a new payment, not an edit.
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

    // EnsureCanMove is deliberately not public; reflection tests the transition table without widening it.
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

        // The decline is still a signed statement from the gateway, not a claim from the page.
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

    private static string Base64Url(byte[] bytes) =>
        Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}
