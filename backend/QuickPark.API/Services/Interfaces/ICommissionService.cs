using QuickPark.API.Models;

namespace QuickPark.API.Services.Interfaces;

public readonly record struct CommissionBreakdown(
    decimal GrossAmount,
    decimal CommissionRate,
    decimal CommissionAmount,
    decimal ProviderAmount);

public interface ICommissionService
{
    CommissionBreakdown Calculate(decimal grossAmount, decimal commissionRate);

    Task<decimal> RateForAsync(Guid vehicleTypeId, decimal commissionRate, CancellationToken ct = default);
}
