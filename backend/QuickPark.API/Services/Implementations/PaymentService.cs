using Microsoft.EntityFrameworkCore;
using QuickPark.API.Data;
using QuickPark.API.DTOs.Payments;
using QuickPark.API.Enums;
using QuickPark.API.Helpers;
using QuickPark.API.Integrations.Payments;
using QuickPark.API.Models;
using QuickPark.API.Services.Interfaces;

namespace QuickPark.API.Services.Implementations;

public class PaymentService : IPaymentService
{
    private const string CashGatewayProvider = "CASH_AT_PROPERTY";

    private readonly AppDbContext _context;
    private readonly ICardPaymentGateway _gateway;
    private readonly ICommissionService _commission;

    public PaymentService(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _gateway = new SandboxCardPaymentGateway(configuration);
        _commission = new CommissionService(context);
    }

    public async Task<PaymentResponse> CreateAsync(
        Guid driverUserId, CreatePaymentRequest request, CancellationToken ct = default)
    {
        var method = ParseMethod(request.PaymentMethod);

        await using var transaction = await _context.Database.BeginTransactionAsync(ct);

        await LockAsync(request.ReservationId, ct);

        var reservation = await _context.Set<Reservation>()
            .FirstOrDefaultAsync(r => r.Id == request.ReservationId, ct)
            ?? throw new KeyNotFoundException("Reservation not found.");

        if (reservation.DriverUserId != driverUserId)
        {
            throw new UnauthorizedAccessException("You can only pay for your own booking.");
        }

        EnsureOpenForPayment(reservation);

        var live = await _context.Set<Payment>()
            .Where(p => p.ReservationId == reservation.Id &&
                        (p.Status == PaymentStatus.PENDING || p.Status == PaymentStatus.PAID))
            .ToListAsync(ct);

        if (live.Any(p => p.Status == PaymentStatus.PAID))
        {
            throw new InvalidOperationException("This booking has already been paid for.");
        }

        foreach (var abandoned in live.Where(p => p.PaymentMethod != method))
        {
            abandoned.Status = PaymentStatus.CANCELLED;
            abandoned.CancelledAt = DateTime.UtcNow;
            abandoned.UpdatedAt = DateTime.UtcNow;
            abandoned.FailureReason = $"Replaced by a {Describe(method)} payment.";
        }

        var payment = live.FirstOrDefault(p => p.PaymentMethod == method)
            ?? await NewAttemptAsync(reservation, driverUserId, method, ct);

        GatewayCheckout? checkout = null;
        if (method == PaymentMethod.CARD)
        {
            checkout = _gateway.CreateCheckout(payment.Id, reservation.Id, payment.Amount);
            payment.GatewayProvider = _gateway.Provider;
            payment.GatewayReference = checkout.Reference;
            payment.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);

        var response = await ReadAsync(payment.Id, driverUserId, ct)
            ?? throw new KeyNotFoundException("Payment not found.");

        if (checkout is not null)
        {
            response.CheckoutReference = checkout.Reference;
            response.CheckoutPath = checkout.CheckoutPath;
            response.CheckoutExpiresAt = checkout.ExpiresAt;
        }

        return response;
    }

    public async Task<CardCheckoutResponse> CheckoutCardAsync(
        Guid driverUserId, CardCheckoutRequest request, CancellationToken ct = default)
    {
        var reference = Require(request.Reference, "A payment gateway checkout reference is required.");

        var located = await _context.Set<Payment>()
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.GatewayReference == reference, ct)
            ?? throw new InvalidOperationException("This payment gateway reference is not recognised.");

        if (located.DriverUserId != driverUserId)
        {
            throw new UnauthorizedAccessException("You can only complete your own payment.");
        }

        if (located.Status == PaymentStatus.PAID)
        {
            return new CardCheckoutResponse
            {
                PaymentId = located.Id,
                Status = located.Status.ToString(),
                Amount = located.Amount,
                Approved = true,
                TransactionId = located.GatewayTransactionId
            };
        }

        if (located.Status != PaymentStatus.PENDING)
        {
            throw new InvalidOperationException(
                $"This payment is {Describe(located.Status)} and can no longer be taken to the gateway.");
        }

        var result = _gateway.CompleteCheckout(
            reference,
            new CardCheckoutDetails(request.CardNumber, request.HolderName, request.Expiry, request.Cvv));

        if (!result.Approved)
        {
            await FailAsync(located.Id, result.DeclineReason ?? "The card was declined.", ct);
        }

        return new CardCheckoutResponse
        {
            PaymentId = located.Id,
            Status = result.Approved ? PaymentStatus.PENDING.ToString() : PaymentStatus.FAILED.ToString(),
            Amount = result.Amount,
            Approved = result.Approved,
            TransactionId = result.Approved ? null : result.TransactionId,
            DeclineReason = result.DeclineReason,
            CallbackToken = result.CallbackToken
        };
    }

    public async Task<PaymentResponse> ConfirmCardAsync(
        Guid driverUserId, ConfirmCardPaymentRequest request, CancellationToken ct = default) =>
        await SettleFromGatewayAsync(request.CallbackToken, driverUserId, ct);

    public async Task<PaymentResponse> HandleGatewayCallbackAsync(string? callbackToken, CancellationToken ct = default) =>
        await SettleFromGatewayAsync(callbackToken, null, ct);

    private async Task<PaymentResponse> SettleFromGatewayAsync(
        string? callbackToken, Guid? driverUserId, CancellationToken ct)
    {
        var callback = _gateway.VerifyCallback(Require(callbackToken, "A payment gateway confirmation token is required."));

        await using var transaction = await _context.Database.BeginTransactionAsync(ct);
        await LockAsync(callback.PaymentId, ct);

        var payment = await _context.Set<Payment>()
            .FirstOrDefaultAsync(p => p.Id == callback.PaymentId, ct)
            ?? throw new KeyNotFoundException("Payment not found.");

        if (driverUserId is Guid driver && payment.DriverUserId != driver)
        {
            throw new UnauthorizedAccessException("You can only confirm your own payment.");
        }

        var viewerId = driverUserId ?? payment.DriverUserId;

        if (payment.PaymentMethod != PaymentMethod.CARD)
        {
            throw new InvalidOperationException("Only a card payment is confirmed by the gateway.");
        }

        if (payment.Status == PaymentStatus.PAID)
        {
            await transaction.CommitAsync(ct);
            return await ReadOrThrow(payment.Id, viewerId, ct);
        }

        if (callback.Approved &&
            payment.GatewayTransactionId is string other &&
            other != callback.TransactionId)
        {
            throw new InvalidOperationException("This payment was already confirmed under a different gateway transaction.");
        }

        if (Math.Round(callback.Amount, 2, MidpointRounding.AwayFromZero) != payment.Amount)
        {
            throw new InvalidOperationException(
                $"The gateway confirmed {callback.Amount:0.00} but this payment is for {payment.Amount:0.00}.");
        }

        if (!callback.Approved)
        {
            EnsureCanMove(payment.Status, PaymentStatus.FAILED);
            payment.Status = PaymentStatus.FAILED;
            payment.FailedAt = DateTime.UtcNow;
            payment.FailureReason = Truncate(callback.DeclineReason ?? "The card was declined.", 300);
            payment.GatewayTransactionId ??= callback.TransactionId;
            payment.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);

            return await ReadOrThrow(payment.Id, viewerId, ct);
        }

        var reservation = await _context.Set<Reservation>()
            .FirstOrDefaultAsync(r => r.Id == payment.ReservationId, ct)
            ?? throw new KeyNotFoundException("Reservation not found.");

        EnsureSettleable(reservation);

        payment.GatewayTransactionId = callback.TransactionId;

        try
        {
            await SettleAsync(payment, reservation, isCash: false, note: null, ct);
            await _context.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
        }
        catch (DbUpdateException)
        {
        
            await transaction.RollbackAsync(ct);
            _context.ChangeTracker.Clear();

            var settled = await _context.Set<Payment>()
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.GatewayTransactionId == callback.TransactionId, ct);

            if (settled is null) throw;

            return await ReadOrThrow(settled.Id, viewerId, ct);
        }

        return await ReadOrThrow(payment.Id, viewerId, ct);
    }

    public async Task<PaymentResponse> ConfirmCashAsync(
        Guid providerUserId, Guid paymentId, CashConfirmationRequest? request, CancellationToken ct = default)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync(ct);
        await LockAsync(paymentId, ct);

        var payment = await _context.Set<Payment>()
            .FirstOrDefaultAsync(p => p.Id == paymentId, ct)
            ?? throw new KeyNotFoundException("Payment not found.");

        if (payment.PaymentMethod != PaymentMethod.CASH)
        {
            throw new InvalidOperationException("Only a cash payment can be confirmed by a parking owner.");
        }

        var provider = await _context.ParkingProviders.FirstOrDefaultAsync(p => p.UserId == providerUserId, ct)
            ?? throw new UnauthorizedAccessException("This account is not a parking owner.");

        if (payment.ProviderId != provider.Id)
        {
            throw new UnauthorizedAccessException("You can only confirm cash payments made at your own properties.");
        }

        if (payment.Status == PaymentStatus.PAID)
        {
            await transaction.CommitAsync(ct);
            return await ReadOrThrow(payment.Id, providerUserId, ct);
        }

        var reservation = await _context.Set<Reservation>()
            .FirstOrDefaultAsync(r => r.Id == payment.ReservationId, ct)
            ?? throw new KeyNotFoundException("Reservation not found.");

        EnsureSettleable(reservation);

        var gross = reservation.TotalAmount;
        var reconciled = gross != payment.Amount;

        payment.Amount = gross;
        payment.CashConfirmedBy = providerUserId;
        payment.CashConfirmedByName = Truncate(await NameOfAsync(providerUserId, ct), 150);
        payment.CashConfirmedAt = DateTime.UtcNow;
        payment.GatewayProvider = CashGatewayProvider;

        await SettleAsync(payment, reservation, isCash: true, BuildCashReference(reservation, reconciled, request?.Note), ct);
        await _context.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);

        return await ReadOrThrow(payment.Id, providerUserId, ct);
    }

    public async Task<PaymentResponse?> GetAsync(Guid userId, Guid paymentId, CancellationToken ct = default)
    {
        var payment = await _context.Set<Payment>()
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == paymentId, ct)
            ?? throw new KeyNotFoundException("Payment not found.");

        return await ReadAsync(paymentId, await ViewerAsync(userId, payment, ct), ct);
    }

    public async Task<PaymentResponse?> GetForReservationAsync(
        Guid userId, Guid reservationId, CancellationToken ct = default)
    {
        var payment = await _context.Set<Payment>()
            .AsNoTracking()
            .Where(p => p.ReservationId == reservationId)
            .OrderByDescending(p => p.AttemptNumber)
            .FirstOrDefaultAsync(ct);

        if (payment is null) return null;

        return await ReadAsync(payment.Id, await ViewerAsync(userId, payment, ct), ct);
    }

    public async Task<IReadOnlyList<PaymentResponse>> ListForDriverAsync(
        Guid driverUserId, PaymentFilter? filter = null, CancellationToken ct = default)
    {
        var query = PaymentsForResponse().Where(p => p.DriverUserId == driverUserId);
        return await ListAsync(ApplyFilter(query, filter), includeCommission: false, ct);
    }

    public async Task<IReadOnlyList<PaymentResponse>> ListForProviderAsync(
        Guid providerUserId, PaymentFilter? filter = null, CancellationToken ct = default)
    {
        var provider = await _context.ParkingProviders.AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == providerUserId, ct)
            ?? throw new UnauthorizedAccessException("This account is not a parking owner.");

        var query = PaymentsForResponse().Where(p => p.ProviderId == provider.Id);
        return await ListAsync(ApplyFilter(query, filter), includeCommission: true, ct);
    }

    public async Task<IReadOnlyList<PaymentResponse>> ListForAdminAsync(
        PaymentFilter? filter = null, CancellationToken ct = default)
    {
        var query = PaymentsForResponse();
        return await ListAsync(ApplyFilter(query, filter), includeCommission: true, ct);
    }

    public async Task<PaymentResponse> RefundAsync(
        Guid adminUserId, Guid paymentId, RefundPaymentRequest? request, CancellationToken ct = default)
    {
        if (!await IsAdminAsync(adminUserId, ct))
        {
            throw new UnauthorizedAccessException("Only the platform admin can refund a payment.");
        }

        await using var transaction = await _context.Database.BeginTransactionAsync(ct);
        await LockAsync(paymentId, ct);

        var payment = await _context.Set<Payment>()
            .FirstOrDefaultAsync(p => p.Id == paymentId, ct)
            ?? throw new KeyNotFoundException("Payment not found.");

        EnsureCanMove(payment.Status, PaymentStatus.REFUNDED);

        var reason = Truncate(Require(request?.Reason, "A refund needs a reason to go on the record."), 300);
        var now = DateTime.UtcNow;

        var commission = await _context.Set<Commission>()
            .FirstOrDefaultAsync(c => c.PaymentId == payment.Id, ct);

        payment.Status = PaymentStatus.REFUNDED;
        payment.RefundedAt = now;
        payment.RefundedBy = adminUserId;
        payment.RefundReason = reason;
        payment.UpdatedAt = now;

        if (commission is not null)
        {
            commission.Status = CommissionStatus.REVERSED;
            commission.Note = Truncate($"Reversed by refund: {reason}", 300);
            commission.UpdatedAt = now;

            if (payment.PaymentMethod == PaymentMethod.CARD)
            {
                Write(commission, payment, LedgerTransactionType.REFUND, -commission.ProviderAmount,
                    $"Refund of booking {SlotRef(payment.ReservationId)}: the owner's share is taken back.", adminUserId);
            }

            Write(commission, payment, LedgerTransactionType.ADJUSTMENT, -commission.CommissionAmount,
                $"Refund of booking {SlotRef(payment.ReservationId)}: the platform's share is reversed.", adminUserId);
        }

        await _context.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);

        return await ReadOrThrow(payment.Id, adminUserId, ct);
    }

    public async Task<PaymentResponse> SettleCashCommissionAsync(
        Guid adminUserId, Guid paymentId, SettleCommissionRequest? request, CancellationToken ct = default)
    {
        if (!await IsAdminAsync(adminUserId, ct))
        {
            throw new UnauthorizedAccessException("Only the platform admin can clear a cash commission.");
        }

        await using var transaction = await _context.Database.BeginTransactionAsync(ct);
        await LockAsync(paymentId, ct);

        var payment = await _context.Set<Payment>()
            .FirstOrDefaultAsync(p => p.Id == paymentId, ct)
            ?? throw new KeyNotFoundException("Payment not found.");

        if (payment.PaymentMethod != PaymentMethod.CASH)
        {
            throw new InvalidOperationException("Only a cash booking leaves a commission owed to the platform.");
        }

        var commission = await _context.Set<Commission>()
            .FirstOrDefaultAsync(c => c.PaymentId == payment.Id, ct)
            ?? throw new KeyNotFoundException("This payment has no commission record to settle.");

        if (commission.Status == CommissionStatus.SETTLED)
        {
            await transaction.CommitAsync(ct);
            return await ReadOrThrow(payment.Id, adminUserId, ct);
        }

        if (commission.Status != CommissionStatus.DUE)
        {
            throw new InvalidOperationException(
                "This commission was reversed by a refund and cannot be collected.");
        }

        if (payment.Status != PaymentStatus.PAID)
        {
            throw new InvalidOperationException("The owner has not confirmed the cash for this booking yet.");
        }

        var note = Truncate(Require(request?.Note, "Say how the commission was collected."), 300);
        var now = DateTime.UtcNow;

        commission.Status = CommissionStatus.SETTLED;
        commission.SettledAt = now;
        commission.SettledBy = adminUserId;
        commission.Note = Truncate($"Collected from the owner: {note}", 300);
        commission.UpdatedAt = now;

        Write(commission, payment, LedgerTransactionType.CASH_COMMISSION, -commission.CommissionAmount,
            $"Cash commission of booking {SlotRef(payment.ReservationId)} collected: {note}", adminUserId);

        await _context.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);

        return await ReadOrThrow(payment.Id, adminUserId, ct);
    }

    // Settles a verified payment:.
    private async Task SettleAsync(
        Payment payment, Reservation reservation, bool isCash, string? note, CancellationToken ct)
    {
        var now = DateTime.UtcNow;

        payment.Status = PaymentStatus.PAID;
        payment.PaidAt = now;
        payment.UpdatedAt = now;

        var rate = await _commission.RateForAsync(reservation.VehicleTypeId, reservation.CommissionRate, ct);
        var split = _commission.Calculate(payment.Amount, rate);

        var commission = new Commission
        {
            PaymentId = payment.Id,
            ProviderId = payment.ProviderId,
            ReservationId = reservation.Id,
            GrossAmount = split.GrossAmount,
            CommissionRate = split.CommissionRate,
            CommissionAmount = split.CommissionAmount,
            ProviderAmount = split.ProviderAmount,
            Status = isCash ? CommissionStatus.DUE : CommissionStatus.SETTLED,
            SettledAt = isCash ? null : now,
            Note = note is null ? null : Truncate(note, 300),
            UpdatedAt = now
        };

        _context.Set<Commission>().Add(commission);

        Write(commission, payment, LedgerTransactionType.EARNING, split.ProviderAmount,
            $"Booking {SlotRef(reservation.Id)} settled at {reservation.SlotNumber}: the owner's share is kept.", null);

        if (!isCash)
        {
            Write(commission, payment, LedgerTransactionType.COMMISSION, -split.CommissionAmount,
                $"Card commission of booking {SlotRef(reservation.Id)} kept by the platform.", null);
        }

        NotifyAsync(payment.DriverUserId, reservation.FacilityId,
            isCash ? "Cash payment recorded" : "Booking paid",
            isCash
                ? $"The parking owner confirmed your cash payment of {payment.Amount:0.00} for booking {reservation.SlotNumber}."
                : $"Your card payment of {payment.Amount:0.00} for booking {reservation.SlotNumber} is confirmed.");
    }

    private async Task<Payment> NewAttemptAsync(
        Reservation reservation, Guid driverUserId, PaymentMethod method, CancellationToken ct)
    {
        var lastAttempt = await _context.Set<Payment>()
            .Where(p => p.ReservationId == reservation.Id)
            .Select(p => (int?)p.AttemptNumber)
            .MaxAsync(ct) ?? 0;

        var payment = new Payment
        {
            ReservationId = reservation.Id,
            ProviderId = reservation.ProviderId,
            DriverUserId = driverUserId,
            Amount = reservation.TotalAmount,
            PaymentMethod = method,
            Status = PaymentStatus.PENDING,
            AttemptNumber = lastAttempt + 1
        };

        _context.Set<Payment>().Add(payment);
        await _context.SaveChangesAsync(ct);
        return payment;
    }

    private static void EnsureOpenForPayment(Reservation reservation)
    {
        var status = Describe(reservation.Status);

        if (reservation.Status is not (ReservationStatus.PENDING or ReservationStatus.CONFIRMED))
        {
            throw new InvalidOperationException(
                $"This booking is {status} and can no longer be paid for.");
        }

        if (reservation.TotalAmount <= 0m)
        {
            throw new InvalidOperationException("This booking has no amount to pay.");
        }
    }

    private static void EnsureSettleable(Reservation reservation)
    {
        if (reservation.Status is ReservationStatus.CANCELLED or ReservationStatus.NOSHOW)
        {
            throw new InvalidOperationException(
                $"This booking is {Describe(reservation.Status)}, so there is nothing to pay for it.");
        }
    }

    private static string BuildCashReference(Reservation reservation, bool reconciled, string? note)
    {
        var text = $"Cash commission due for booking {reservation.SlotNumber} at " +
                   $"{reservation.Facility?.Name ?? "the property"}";

        if (reconciled) text += $" (re-priced to the stay actually used: {reservation.Hours}h)";
        if (!string.IsNullOrWhiteSpace(note)) text += $" — {note.Trim()}";

        return text;
    }

    private async Task FailAsync(Guid paymentId, string reason, CancellationToken ct)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync(ct);
        await LockAsync(paymentId, ct);

        var payment = await _context.Set<Payment>()
            .FirstOrDefaultAsync(p => p.Id == paymentId, ct)
            ?? throw new KeyNotFoundException("Payment not found.");

        if (payment.Status != PaymentStatus.PENDING)
        {
            await transaction.CommitAsync(ct);
            return;
        }

        EnsureCanMove(payment.Status, PaymentStatus.FAILED);

        payment.Status = PaymentStatus.FAILED;
        payment.FailedAt = DateTime.UtcNow;
        payment.FailureReason = Truncate(reason, 300);
        payment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
    }

    // ---- small helpers ----

    // The bay the booking was for, in the wording a ledger line reads with.
    private static string SlotRef(Guid reservationId) =>
        $"#{reservationId.ToString("N")[..8]}";

    // One bookkeeping line on the owner's statement.
    private void Write(
        Commission commission, Payment payment, LedgerTransactionType type,
        decimal amount, string reference, Guid? createdBy)
    {
        _context.Set<ProviderLedger>().Add(new ProviderLedger
        {
            ProviderId = commission.ProviderId,
            ReservationId = payment.ReservationId,
            PaymentId = payment.Id,
            CommissionId = commission.Id,
            TransactionType = type,
            Amount = amount,
            Reference = Truncate(reference, 300),
            CreatedBy = createdBy
        });
    }

    // Money never moves backwards: only these transitions are legal.
    private static void EnsureCanMove(PaymentStatus from, PaymentStatus to)
    {
        var legal = (from, to) switch
        {
            (PaymentStatus.PENDING, PaymentStatus.PAID) => true,
            (PaymentStatus.PENDING, PaymentStatus.FAILED) => true,
            (PaymentStatus.PENDING, PaymentStatus.CANCELLED) => true,
            (PaymentStatus.PAID, PaymentStatus.REFUNDED) => true,
            _ => false
        };

        if (!legal)
        {
            throw new InvalidOperationException(
                $"A payment that is {Describe(from)} cannot become {Describe(to)}.");
        }
    }

    private IQueryable<Payment> PaymentsForResponse() =>
        _context.Set<Payment>()
            .Include(p => p.Reservation)
            .ThenInclude(r => r!.Facility)
            .Include(p => p.Reservation)
            .ThenInclude(r => r!.VehicleType)
            .Include(p => p.Commission);

    private static IQueryable<Payment> ApplyFilter(IQueryable<Payment> query, PaymentFilter? filter)
    {
        if (filter == null) return query;

        if (filter.Status is string status) query = query.Where(p => p.Status == ParseStatus(status));
        if (filter.PaymentMethod is string method) query = query.Where(p => p.PaymentMethod == ParseMethod(method));

        if (filter.FacilityId is Guid facility)
        {
            query = query.Where(p => p.Reservation != null && p.Reservation.FacilityId == facility);
        }

        if (filter.From is DateTime from)
        {
            var start = AsUtc(from);
            query = query.Where(p => p.CreatedAt >= start);
        }

        if (filter.To is DateTime to)
        {
            var end = AsUtc(to);
            query = query.Where(p => p.CreatedAt <= end);
        }

        return query;
    }

    private async Task<IReadOnlyList<PaymentResponse>> ListAsync(
        IQueryable<Payment> query, bool includeCommission, CancellationToken ct)
    {
        var payments = await query.OrderByDescending(p => p.CreatedAt).ToListAsync(ct);

        return payments
            .Select(p => MapToResponse(p, includeCommission))
            .ToList();
    }

    private async Task<PaymentResponse?> ReadAsync(Guid paymentId, Guid viewerId, CancellationToken ct)
    {
        var payment = await PaymentsForResponse()
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == paymentId, ct);

        return payment == null ? null : MapToResponse(payment, includeCommission: true);
    }

    private async Task<PaymentResponse> ReadOrThrow(Guid paymentId, Guid viewerId, CancellationToken ct) =>
        await ReadAsync(paymentId, viewerId, ct) ?? throw new KeyNotFoundException("Payment not found.");

    // The driver always views their own rows
    private async Task<Guid> ViewerAsync(Guid userId, Payment payment, CancellationToken ct)
    {
        if (payment.DriverUserId == userId) return userId;

        if (await IsAdminAsync(userId, ct)) return userId;

        var provider = await _context.ParkingProviders.AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId, ct)
            ?? throw new UnauthorizedAccessException("You can only view your own payments.");

        if (payment.ProviderId != provider.Id)
        {
            throw new UnauthorizedAccessException("You can only view your own payments.");
        }

        return userId;
    }

    private static PaymentResponse MapToResponse(Payment payment, bool includeCommission)
    {
        var reservation = payment.Reservation;
        var commission = payment.Commission;

        return new PaymentResponse
        {
            PaymentId = payment.Id,
            AttemptNumber = payment.AttemptNumber,
            ReservationId = payment.ReservationId,
            DriverUserId = payment.DriverUserId,
            ProviderId = payment.ProviderId,
            FacilityId = reservation?.FacilityId ?? Guid.Empty,
            FacilityName = reservation?.Facility?.Name ?? string.Empty,
            SlotNumber = reservation?.SlotNumber ?? string.Empty,
            VehicleTypeName = reservation?.VehicleType?.Name ?? string.Empty,
            StartTime = reservation?.StartTime ?? default,
            EndTime = reservation?.EndTime ?? default,
            Hours = reservation?.Hours ?? 0,
            Amount = payment.Amount,
            PaymentMethod = payment.PaymentMethod.ToString(),
            Status = payment.Status.ToString(),
            ReservationStatus = reservation?.Status.ToString() ?? string.Empty,
            CommissionRate = includeCommission ? commission?.CommissionRate : null,
            CommissionAmount = includeCommission ? commission?.CommissionAmount : null,
            ProviderAmount = includeCommission ? commission?.ProviderAmount : null,
            CommissionStatus = includeCommission ? commission?.Status.ToString() : null,
            CashCommissionDue = includeCommission && commission?.Status == CommissionStatus.DUE,
            GatewayProvider = payment.GatewayProvider,
            GatewayTransactionId = payment.GatewayTransactionId,
            FailureReason = payment.FailureReason,
            CashConfirmedBy = payment.CashConfirmedBy,
            CashConfirmedByName = payment.CashConfirmedByName,
            CashConfirmedAt = payment.CashConfirmedAt,
            PaidAt = payment.PaidAt,
            FailedAt = payment.FailedAt,
            CancelledAt = payment.CancelledAt,
            RefundedAt = payment.RefundedAt,
            RefundReason = payment.RefundReason,
            CreatedAt = payment.CreatedAt,
            UpdatedAt = payment.UpdatedAt
        };
    }

    // NotifyAsync with primitive types instead of Reservation
    private void NotifyAsync(Guid driverUserId, Guid facilityId, string title, string body) =>
        _context.Set<Notification>().Add(new Notification
        {
            UserId = driverUserId,
            FacilityId = facilityId,
            Title = Truncate(title, 120),
            Body = Truncate(body, 1000)
        });

    private async Task<bool> IsAdminAsync(Guid userId, CancellationToken ct) =>
        await _context.Users.AnyAsync(u => u.Id == userId && u.Role == UserRole.PLATFORM_ADMIN, ct);

    private async Task<string> NameOfAsync(Guid userId, CancellationToken ct) =>
        await _context.Users.Where(u => u.Id == userId).Select(u => u.FullName).FirstOrDefaultAsync(ct)
        ?? "A parking owner";

    private async Task LockAsync(Guid key, CancellationToken ct) =>
        await _context.Database.ExecuteSqlAsync($"SELECT pg_advisory_xact_lock(hashtext({key}::text))", ct);

    private static DateTime AsUtc(DateTime value) => value.Kind switch
    {
        DateTimeKind.Utc => value,
        DateTimeKind.Local => value.ToUniversalTime(),
        _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
    };

    private static PaymentMethod ParseMethod(string? value)
    {
        var text = Require(value, "Choose how you want to pay: card or cash.");

        return text.ToUpperInvariant() switch
        {
            "CARD" => PaymentMethod.CARD,
            "CASH" => PaymentMethod.CASH,
            _ => throw new InvalidOperationException("Payment method must be either CARD or CASH.")
        };
    }

    private static PaymentStatus ParseStatus(string? value)
    {
        var text = Require(value, "A payment status is required.");

        return Enum.TryParse<PaymentStatus>(text, ignoreCase: true, out var status) && Enum.IsDefined(status)
            ? status
            : throw new InvalidOperationException(
                "Payment status must be one of PENDING, PAID, FAILED, CANCELLED, REFUNDED.");
    }

    private static string Describe(PaymentMethod method) =>
        method == PaymentMethod.CARD ? "card" : "cash";

    private static string Describe(PaymentStatus status) => status.ToString().ToLowerInvariant();

    private static string Describe(ReservationStatus status) => status.ToString().ToLowerInvariant();

    private static string Require(string? value, string message)
    {
        if (string.IsNullOrWhiteSpace(value)) throw new InvalidOperationException(message);
        return value.Trim();
    }

    private static string Truncate(string value, int max) =>
        value.Length <= max ? value : value[..max];
}
