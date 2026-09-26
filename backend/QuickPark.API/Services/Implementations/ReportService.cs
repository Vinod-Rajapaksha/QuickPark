using Microsoft.EntityFrameworkCore;
using QuickPark.API.Data;
using QuickPark.API.DTOs.Payments;
using QuickPark.API.Enums;
using QuickPark.API.Models;
using QuickPark.API.Services.Interfaces;

namespace QuickPark.API.Services.Implementations;

public class ReportService : IReportService
{
    private readonly AppDbContext _context;

    public ReportService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ProviderEarningsResponse> GetProviderEarningsAsync(
        Guid providerUserId, CancellationToken ct = default)
    {
        var provider = await RequireProviderAsync(providerUserId, ct);
        var rows = await MoneyRowsAsync(p => p.ProviderId == provider.Id, ct);

        var paid = rows.Where(r => r.Status == PaymentStatus.PAID).ToList();
        var kept = paid.Where(r => r.CommissionStatus is not null && r.CommissionStatus != CommissionStatus.REVERSED).ToList();

        var card = kept.Where(r => r.Method == PaymentMethod.CARD).ToList();
        var cash = kept.Where(r => r.Method == PaymentMethod.CASH).ToList();

        var stayFinished = card.Where(r => r.BookingStatus == ReservationStatus.COMPLETED).ToList();
        var stayOpen = card.Where(r => r.BookingStatus != ReservationStatus.COMPLETED).ToList();

        return new ProviderEarningsResponse
        {
            ProviderId = provider.Id,
            TotalRevenue = Sum(paid.Select(r => r.Amount)),
            CardRevenue = Sum(card.Select(r => r.Amount)),
            CashRevenue = Sum(cash.Select(r => r.Amount)),
            QuickParkCommission = Sum(kept.Select(r => r.CommissionAmount)),
            ProviderEarnings = Sum(kept.Select(r => r.ProviderAmount)),
            PendingEarnings = Sum(stayOpen.Select(r => r.ProviderAmount)),
            AvailableEarnings = Sum(stayFinished.Select(r => r.ProviderAmount)),
            CashCommissionDue = Sum(cash.Where(r => r.CommissionStatus == CommissionStatus.DUE)
                .Select(r => r.CommissionAmount)),
            CashCommissionsOutstanding = cash.Count(r => r.CommissionStatus == CommissionStatus.DUE),
            BookingsPaid = paid.Count,
            BookingsCard = card.Count,
            BookingsCash = cash.Count,
            PendingCashConfirmations = rows.Count(PendingCash),
            FailedPayments = rows.Count(r => r.Status == PaymentStatus.FAILED),
            CancelledPayments = rows.Count(r => r.Status == PaymentStatus.CANCELLED),
            RefundedPayments = rows.Count(r => r.Status == PaymentStatus.REFUNDED)
        };
    }

    public async Task<IReadOnlyList<LedgerEntryResponse>> GetProviderLedgerAsync(
        Guid providerUserId, PaymentFilter? filter = null, CancellationToken ct = default)
    {
        var provider = await RequireProviderAsync(providerUserId, ct);

        var query = _context.Set<ProviderLedger>()
            .Where(l => l.ProviderId == provider.Id);

        if (filter is not null)
        {
            if (!string.IsNullOrWhiteSpace(filter.PaymentMethod))
            {
                var method = ParseMethod(filter.PaymentMethod);
                query = query.Where(l => l.Payment!.PaymentMethod == method);
            }

            if (filter.FacilityId is Guid facility)
            {
                query = query.Where(l => l.Payment!.Reservation!.FacilityId == facility);
            }

            if (filter.From is DateTime from)
            {
                var start = AsUtc(from);
                query = query.Where(l => l.CreatedAt >= start);
            }

            if (filter.To is DateTime to)
            {
                var end = AsUtc(to);
                query = query.Where(l => l.CreatedAt <= end);
            }
        }

        var entries = await query
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => new LedgerEntryResponse
            {
                EntryId = l.Id,
                ProviderId = l.ProviderId,
                TransactionType = l.TransactionType.ToString(),
                Amount = l.Amount,
                Reference = l.Reference,
                ReservationId = l.ReservationId,
                PaymentId = l.PaymentId,
                CommissionId = l.CommissionId,
                FacilityName = l.Payment!.Reservation!.Facility != null ? l.Payment.Reservation.Facility.Name : null,
                SlotNumber = l.Payment!.Reservation!.SlotNumber,
                PaymentMethod = l.Payment.PaymentMethod.ToString(),
                CreatedAt = l.CreatedAt
            })
            .ToListAsync(ct);

        return entries;
    }

    public async Task<IReadOnlyList<CommissionLineResponse>> GetProviderCommissionsAsync(
        Guid providerUserId, string? status = null, CancellationToken ct = default)
    {
        var provider = await RequireProviderAsync(providerUserId, ct);

        CommissionStatus? wanted = ParseCommissionStatus(status);

        return await CommissionLinesAsync(c => c.ProviderId == provider.Id &&
            (wanted == null || c.Status == wanted), ct);
    }

    public async Task<IReadOnlyList<CommissionLineResponse>> GetCashCommissionDueAsync(
        Guid providerUserId, CancellationToken ct = default)
    {
        var provider = await RequireProviderAsync(providerUserId, ct);

        return await CommissionLinesAsync(c =>
            c.ProviderId == provider.Id &&
            c.Status == CommissionStatus.DUE &&
            c.Payment!.PaymentMethod == PaymentMethod.CASH, ct);
    }

    public async Task<IReadOnlyList<CommissionLineResponse>> GetPlatformCommissionsAsync(
        Guid adminUserId, string? status = null, CancellationToken ct = default)
    {
        await RequireAdminAsync(adminUserId, ct);

        CommissionStatus? wanted = ParseCommissionStatus(status);

        return await CommissionLinesAsync(c => wanted == null || c.Status == wanted, ct);
    }

    public async Task<RevenueOverviewResponse> GetProviderRevenueAsync(
        Guid providerUserId, DateTime? from, DateTime? to, bool byProperty, CancellationToken ct = default)
    {
        var provider = await RequireProviderAsync(providerUserId, ct);
        var rows = Window(await MoneyRowsAsync(p => p.ProviderId == provider.Id, ct), from, to);

        return BuildOverview(rows, byProperty, from);
    }

    public async Task<RevenueOverviewResponse> GetPlatformRevenueAsync(
        DateTime? from, DateTime? to, bool byProperty, CancellationToken ct = default)
    {
        var rows = Window(await MoneyRowsAsync(_ => true, ct), from, to);

        return BuildOverview(rows, byProperty, from);
    }

    // ---- shared plumbing ----

    private static RevenueOverviewResponse BuildOverview(
        List<MoneyRow> rows, bool byProperty, DateTime? windowFrom)
    {
        var paid = rows.Where(r => r.Status == PaymentStatus.PAID).ToList();
        var kept = paid.Where(r => r.CommissionStatus is not null && r.CommissionStatus != CommissionStatus.REVERSED).ToList();

        var overview = new RevenueOverviewResponse
        {
            TotalRevenue = Sum(paid.Select(r => r.Amount)),
            TotalCommission = Sum(kept.Select(r => r.CommissionAmount)),
            TotalProviderAmount = Sum(kept.Select(r => r.ProviderAmount)),
            CashCommissionDue = Sum(kept.Where(r =>
                r.Method == PaymentMethod.CASH && r.CommissionStatus == CommissionStatus.DUE)
                .Select(r => r.CommissionAmount)),
            PaidPayments = paid.Count,
            CardPayments = kept.Count(r => r.Method == PaymentMethod.CARD),
            CashPayments = kept.Count(r => r.Method == PaymentMethod.CASH),
            FailedPayments = rows.Count(r => r.Status == PaymentStatus.FAILED),
            CancelledPayments = rows.Count(r => r.Status == PaymentStatus.CANCELLED),
            RefundedPayments = rows.Count(r => r.Status == PaymentStatus.REFUNDED),
            PendingCashConfirmations = rows.Count(PendingCash)
        };

        overview.ByMethod = kept
            .GroupBy(r => r.Method)
            .Select(g => new RevenueMethodResponse
            {
                PaymentMethod = g.Key.ToString(),
                Amount = Sum(g.Select(r => r.Amount)),
                Commission = Sum(g.Select(r => r.CommissionAmount)),
                ProviderAmount = Sum(g.Select(r => r.ProviderAmount)),
                Payments = g.Count()
            })
            .OrderByDescending(m => m.Amount)
            .ToList();

        overview.Trend = kept
            .GroupBy(r => Bucket(r.MoneyDate, windowFrom))
            .OrderBy(g => g.Key)
            .Select(g => new RevenueBucketResponse
            {
                Period = g.Key,
                Amount = Sum(g.Select(r => r.Amount)),
                Commission = Sum(g.Select(r => r.CommissionAmount)),
                ProviderAmount = Sum(g.Select(r => r.ProviderAmount)),
                CardAmount = Sum(g.Where(r => r.Method == PaymentMethod.CARD).Select(r => r.Amount)),
                CashAmount = Sum(g.Where(r => r.Method == PaymentMethod.CASH).Select(r => r.Amount)),
                Payments = g.Count()
            })
            .ToList();

        if (byProperty)
        {
            overview.ByProperty = kept
                .GroupBy(r => new { r.FacilityId, r.FacilityName })
                .OrderByDescending(g => Sum(g.Select(r => r.Amount)))
                .Select(g => new RevenuePropertyResponse
                {
                    FacilityId = g.Key.FacilityId,
                    FacilityName = g.Key.FacilityName,
                    Amount = Sum(g.Select(r => r.Amount)),
                    Commission = Sum(g.Select(r => r.CommissionAmount)),
                    ProviderAmount = Sum(g.Select(r => r.ProviderAmount)),
                    Payments = g.Count()
                })
                .ToList();
        }

        return overview;
    }

    private static string Bucket(DateTime moneyDate, DateTime? windowFrom)
    {
        var spanDays = windowFrom is DateTime start
            ? (DateTime.UtcNow - AsUtc(start)).TotalDays
            : double.MaxValue;

        return spanDays <= 92 ? moneyDate.ToString("yyyy-MM-dd") : moneyDate.ToString("yyyy-MM");
    }

    private static List<MoneyRow> Window(List<MoneyRow> rows, DateTime? from, DateTime? to)
    {
        if (from is DateTime f)
        {
            var start = AsUtc(f);
            rows = rows.Where(r => r.MoneyDate >= start).ToList();
        }

        if (to is DateTime t)
        {
            var end = AsUtc(t);
            rows = rows.Where(r => r.MoneyDate <= end).ToList();
        }

        return rows;
    }

    private async Task<List<MoneyRow>> MoneyRowsAsync(
        System.Linq.Expressions.Expression<Func<Payment, bool>> scope, CancellationToken ct) =>
        await _context.Set<Payment>()
            .Where(scope)
            .Select(p => new MoneyRow
            {
                PaymentId = p.Id,
                ReservationId = p.ReservationId,
                Amount = p.Amount,
                Method = p.PaymentMethod,
                Status = p.Status,
                PaidAt = p.PaidAt,
                CreatedAt = p.CreatedAt,
                BookingStart = p.Reservation!.StartTime,
                BookingStatus = p.Reservation.Status,
                FacilityId = p.Reservation.FacilityId,
                FacilityName = p.Reservation.Facility != null ? p.Reservation.Facility.Name : string.Empty,
                SlotNumber = p.Reservation.SlotNumber,
                CommissionId = p.Commission == null ? null : p.Commission.Id,
                CommissionRate = p.Commission == null ? null : p.Commission.CommissionRate,
                CommissionAmount = p.Commission == null ? null : p.Commission.CommissionAmount,
                ProviderAmount = p.Commission == null ? null : p.Commission.ProviderAmount,
                CommissionStatus = p.Commission == null ? null : p.Commission.Status
            })
            .ToListAsync(ct);

    private async Task<IReadOnlyList<CommissionLineResponse>> CommissionLinesAsync(
        System.Linq.Expressions.Expression<Func<Commission, bool>> scope, CancellationToken ct) =>
        await _context.Set<Commission>()
            .Include(c => c.Payment)
            .ThenInclude(p => p.Reservation)
            .ThenInclude(r => r.Facility)
            .ThenInclude(f => f!.Provider)
            .ThenInclude(p => p.User)
            .Where(scope)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new CommissionLineResponse
            {
                CommissionId = c.Id,
                PaymentId = c.PaymentId,
                ReservationId = c.ReservationId,
                ProviderId = c.ProviderId,
                GrossAmount = c.GrossAmount,
                CommissionRate = c.CommissionRate,
                CommissionAmount = c.CommissionAmount,
                ProviderAmount = c.ProviderAmount,
                Status = c.Status.ToString(),
                PaymentMethod = c.Payment!.PaymentMethod.ToString(),
                PaymentStatus = c.Payment.Status.ToString(),
                ProviderName = c.Payment.Reservation != null && c.Payment.Reservation.Facility != null
                    ? c.Payment.Reservation.Facility.Provider!.User!.FullName
                    : string.Empty,
                FacilityName = c.Payment.Reservation!.Facility != null
                    ? c.Payment.Reservation.Facility.Name
                    : string.Empty,
                BookingStart = c.Payment.Reservation.StartTime,
                SettledAt = c.SettledAt,
                CreatedAt = c.CreatedAt
            })
            .ToListAsync(ct);

    private async Task<ParkingProvider> RequireProviderAsync(Guid providerUserId, CancellationToken ct) =>
        await _context.ParkingProviders.AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == providerUserId, ct)
        ?? throw new UnauthorizedAccessException("This account is not a parking owner.");

    private async Task RequireAdminAsync(Guid userId, CancellationToken ct)
    {
        if (!await _context.Users.AnyAsync(u => u.Id == userId && u.Role == UserRole.PLATFORM_ADMIN, ct))
        {
            throw new UnauthorizedAccessException("Only the platform admin can read the platform commission book.");
        }
    }

    private static CommissionStatus? ParseCommissionStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status)) return null;

        if (!Enum.TryParse<CommissionStatus>(status, ignoreCase: true, out var parsed) || !Enum.IsDefined(parsed))
        {
            throw new InvalidOperationException("Commission status must be DUE, SETTLED or REVERSED.");
        }

        return parsed;
    }

    private static decimal Sum(IEnumerable<decimal?> amounts) => amounts.Sum(a => a ?? 0m);

    private static decimal Sum(IEnumerable<decimal> amounts) => amounts.Sum();

    private static bool PendingCash(MoneyRow row) =>
        row.Method == PaymentMethod.CASH &&
        row.Status == PaymentStatus.PENDING &&
        row.BookingStatus != ReservationStatus.CANCELLED;

    private static PaymentMethod ParseMethod(string value) =>
        value.Trim().ToUpperInvariant() switch
        {
            "CARD" => PaymentMethod.CARD,
            "CASH" => PaymentMethod.CASH,
            _ => throw new InvalidOperationException("Payment method must be either CARD or CASH.")
        };

    private static DateTime AsUtc(DateTime value) => value.Kind switch
    {
        DateTimeKind.Utc => value,
        DateTimeKind.Local => value.ToUniversalTime(),
        _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
    };

    private sealed class MoneyRow
    {
        public Guid PaymentId { get; set; }
        public Guid ReservationId { get; set; }
        public decimal Amount { get; set; }
        public PaymentMethod Method { get; set; }
        public PaymentStatus Status { get; set; }
        public DateTime? PaidAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime BookingStart { get; set; }
        public ReservationStatus BookingStatus { get; set; }
        public Guid FacilityId { get; set; }
        public string FacilityName { get; set; } = string.Empty;
        public string SlotNumber { get; set; } = string.Empty;
        public Guid? CommissionId { get; set; }
        public decimal? CommissionRate { get; set; }
        public decimal? CommissionAmount { get; set; }
        public decimal? ProviderAmount { get; set; }
        public CommissionStatus? CommissionStatus { get; set; }

        // Money is dated when it arrived
        public DateTime MoneyDate => PaidAt ?? CreatedAt;
    }
}
