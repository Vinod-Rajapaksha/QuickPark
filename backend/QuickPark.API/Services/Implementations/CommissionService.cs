using Microsoft.EntityFrameworkCore;
using QuickPark.API.Data;
using QuickPark.API.Models;
using QuickPark.API.Services.Interfaces;

namespace QuickPark.API.Services.Implementations;

public class CommissionService : ICommissionService
{
    private readonly AppDbContext _context;

    public CommissionService(AppDbContext context)
    {
        _context = context;
    }

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

    public async Task<decimal> RateForAsync(Guid vehicleTypeId, decimal commissionRate, CancellationToken ct = default)
    {
    
        if (commissionRate > 0m) return commissionRate;

        var configured = await _context.Set<VehiclePricingConfiguration>()
            .Where(v => v.VehicleTypeId == vehicleTypeId && v.IsActive)
            .Select(v => (decimal?)v.CommissionRate)
            .FirstOrDefaultAsync(ct);

        if (configured is null)
        {
            throw new InvalidOperationException(
                "No commission rate is configured for this vehicle type, so this booking cannot be settled.");
        }

        return configured.Value;
    }

    public static decimal Compute(decimal grossAmount, decimal commissionRate) =>
        Math.Round(grossAmount * commissionRate / 100m, 2, MidpointRounding.AwayFromZero);
}
