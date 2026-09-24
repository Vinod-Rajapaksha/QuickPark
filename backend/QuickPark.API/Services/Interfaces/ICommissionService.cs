using QuickPark.API.Models;

namespace QuickPark.API.Services.Interfaces;

// The split of one booking, exactly as it was worked out (§6). GrossAmount is what the driver
// paid; CommissionAmount is QuickPark's; ProviderAmount is the owner's. They always add back up.
public readonly record struct CommissionBreakdown(
    decimal GrossAmount,
    decimal CommissionRate,
    decimal CommissionAmount,
    decimal ProviderAmount);

// §6/§25: the only place in the system that decides what QuickPark's cut is, and the only place
// the rounding rule lives. The rate is never taken from a client and never hard-coded at a call
// site — it comes from the admin's vehicle pricing configuration, and the value actually applied
// is stored with the money it produced so history keeps its own rate.
public interface ICommissionService
{
    CommissionBreakdown Calculate(decimal grossAmount, decimal commissionRate);

    // The rate to charge this booking with: the one stamped on it when it was made, or the
    // configured one when the booking carries no stamp.
    Task<decimal> RateForAsync(Reservation reservation, CancellationToken ct = default);
}
