using QuickPark.API.DTOs.Payments;

namespace QuickPark.API.Services.Interfaces;

// The money read side
public interface IReportService
{
    // the owner's dashboard totals.
    Task<ProviderEarningsResponse> GetProviderEarningsAsync(Guid providerUserId, CancellationToken ct = default);

    // the owner's transaction history
    Task<IReadOnlyList<LedgerEntryResponse>> GetProviderLedgerAsync(
        Guid providerUserId, PaymentFilter? filter = null, CancellationToken ct = default);

    Task<IReadOnlyList<CommissionLineResponse>> GetProviderCommissionsAsync(
        Guid providerUserId, string? status = null, CancellationToken ct = default);

    Task<IReadOnlyList<CommissionLineResponse>> GetCashCommissionDueAsync(Guid providerUserId, CancellationToken ct = default);

    // the admin's dashboard totals.
    Task<IReadOnlyList<CommissionLineResponse>> GetPlatformCommissionsAsync(
        Guid adminUserId, string? status = null, CancellationToken ct = default);

    // revenue analytics for one owner's properties.
    Task<RevenueOverviewResponse> GetProviderRevenueAsync(
        Guid providerUserId, DateTime? from, DateTime? to, bool byProperty,
        Guid? facilityId = null, CancellationToken ct = default);

    // the same analytics across every property, admin only.
    Task<RevenueOverviewResponse> GetPlatformRevenueAsync(
        DateTime? from, DateTime? to, bool byProperty, CancellationToken ct = default);
}
