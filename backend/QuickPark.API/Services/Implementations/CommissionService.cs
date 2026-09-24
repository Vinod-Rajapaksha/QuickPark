using Microsoft.EntityFrameworkCore;
using QuickPark.API.Data;
using QuickPark.API.Models;
using QuickPark.API.Services.Interfaces;

namespace QuickPark.API.Services.Implementations;

// §6/§25: CommissionAmount = Gross x Rate / 100, ProviderAmount = Gross - Commission, rounded once
// so the halves always add back to the whole. ParkingService calls through here too — the split
// must not be able to disagree with itself.
public class CommissionService : ICommissionService
{
    private readonly AppDbContext _context;

    public CommissionService(AppDbContext context)
    {
        _context = context;
    }

    // §6: the split of one gross amount at one rate.
    public CommissionBreakdown Calculate(decimal grossAmount, decimal commissionRate)
    {
        if (grossAmount < 0m)
        {
            throw new InvalidOperationException("A commission cannot be taken on a negative amount.");
        }

        if (commissionRate is < 0m or > 100m)
        {
            throw new InvalidOperationException("The commission rate must be between 0 and 100 percent.");
        }

        var commission = Compute(grossAmount, commissionRate);

        return new CommissionBreakdown(grossAmount, commissionRate, commission, grossAmount - commission);
    }

    // The rate to settle this booking at: its own stamp if it has one, else today's configuration.
    public async Task<decimal> RateForAsync(Reservation reservation, CancellationToken ct = default)
    {
        // The stamp is authoritative — a config change must not reach back into a booking made
        // under the old rate (§25).
        if (reservation.CommissionRate > 0m) return reservation.CommissionRate;

        var configured = await _context.Set<VehiclePricingConfiguration>()
            .Where(v => v.VehicleTypeId == reservation.VehicleTypeId && v.IsActive)
            .Select(v => (decimal?)v.CommissionRate)
            .FirstOrDefaultAsync(ct);

        // No stamp and no rule is a missing configuration, not a free booking: settling at 0% would
        // take nobody's money silently. A configured 0% is a real decision and is honoured (§25).
        if (configured is null)
        {
            throw new InvalidOperationException(
                "No commission rate is configured for this vehicle type, so this booking cannot be settled.");
        }

        return configured.Value;
    }

    // Shared by the booking maths and the payment maths so a stay priced at 10% and a payment
    // settled at 10% can never round to two different numbers.
    public static decimal Compute(decimal grossAmount, decimal commissionRate) =>
        Math.Round(grossAmount * commissionRate / 100m, 2, MidpointRounding.AwayFromZero);
}
