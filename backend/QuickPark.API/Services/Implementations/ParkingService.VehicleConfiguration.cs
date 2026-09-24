using Microsoft.EntityFrameworkCore;
using QuickPark.API.Data;
using QuickPark.API.DTOs.Parking;
using QuickPark.API.Enums;
using QuickPark.API.Helpers;
using QuickPark.API.Models;

namespace QuickPark.API.Services.Implementations;

public partial class ParkingService
{
    private async Task ReapplyVehicleTypeConfigurationAsync(
        VehicleType vehicleType, VehiclePricingConfiguration? pricing, CancellationToken ct)
    {
        var allocations = await _context.Set<ParkingFacilityVehicleType>()
            .Where(a => a.VehicleTypeId == vehicleType.Id)
            .ToListAsync(ct);
        if (allocations.Count == 0) return;

        var facilityIds = allocations.Select(a => a.FacilityId).Distinct().ToList();

        var facilities = await _context.Set<ParkingFacility>()
            .Where(f => facilityIds.Contains(f.Id))
            .ToDictionaryAsync(f => f.Id, ct);

        var ownerIds = await _context.Set<ParkingProvider>()
            .Where(p => facilities.Values.Select(f => f.ProviderId).Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, p => p.UserId, ct);

        var slots = await _context.Set<ParkingSlot>()
            .Where(s => facilityIds.Contains(s.FacilityId) && s.VehicleTypeId == vehicleType.Id)
            .ToListAsync(ct);

        var heldSlotIds = (await _context.Set<Reservation>()
            .Where(r => facilityIds.Contains(r.FacilityId) &&
                        r.VehicleTypeId == vehicleType.Id &&
                        (r.Status == ReservationStatus.PENDING || r.Status == ReservationStatus.CONFIRMED) &&
                        r.EndTime > DateTime.UtcNow)
            .Select(r => r.SlotId)
            .ToListAsync(ct)).ToHashSet();

        var now = DateTime.UtcNow;
        var notices = new List<(Guid FacilityId, Guid UserId, string Body)>();

        foreach (var allocation in allocations)
        {
            if (!facilities.TryGetValue(allocation.FacilityId, out var facility)) continue;
            if (!ownerIds.TryGetValue(facility.ProviderId, out var ownerId)) continue;

            var lines = new List<string>();

            if (pricing is null)
            {
                lines.Add($"The platform admin withdrew the rate window for {vehicleType.Name}, so it " +
                          $"cannot be allocated any more. Your {allocation.HourlyRate.FormatRate()} price " +
                          "and any bookings stay as they are until they set a window again.");
            }

            else
            {
                var clamped = ClampToWindow(allocation.HourlyRate, pricing.MinimumPrice, pricing.MaximumPrice);
                if (clamped != allocation.HourlyRate)
                {
                    lines.Add($"The allowed rate for {vehicleType.Name} is now " +
                              $"{pricing.MinimumPrice.FormatRate()} - {pricing.MaximumPrice.FormatRate()}, so your " +
                              $"{allocation.HourlyRate.FormatRate()} was moved to the nearest allowed " +
                              $"{clamped.FormatRate()}. Change it whenever you like inside that window.");
                    allocation.HourlyRate = clamped;
                }

                if (allocation.CommissionRate != pricing.CommissionRate)
                {
                    lines.Add($"The platform commission for {vehicleType.Name} changed from " +
                              $"{allocation.CommissionRate:0.##}% to {pricing.CommissionRate:0.##}%, so you now " +
                              $"keep {(clamped - CommissionAmountFor(clamped, pricing.CommissionRate)).FormatRate()} " +
                              "per hour.");
                    allocation.CommissionRate = pricing.CommissionRate;
                }
            }

            if (BayNeedsRestamp(vehicleType, allocation.BayLengthMeters, allocation.BayWidthMeters))
            {
                var typeSlots = slots.Where(s => s.FacilityId == allocation.FacilityId).ToList();
                var free = typeSlots.Where(s => !heldSlotIds.Contains(s.Id)).ToList();
                foreach (var slot in free)
                {
                    slot.BayLengthMeters = vehicleType.BayLengthMeters;
                    slot.BayWidthMeters = vehicleType.BayWidthMeters;
                    slot.UpdatedAt = now;
                }

                allocation.BayLengthMeters = vehicleType.BayLengthMeters;
                allocation.BayWidthMeters = vehicleType.BayWidthMeters;
                lines.Add(typeSlots.Count == free.Count
                    ? $"The bay for {vehicleType.Name} is now {BayLabel(vehicleType)}, and all " +
                      $"{free.Count} of your bays were rebuilt to it."
                    : $"The bay for {vehicleType.Name} is now {BayLabel(vehicleType)}. " +
                      $"{free.Count} of your {typeSlots.Count} bays were rebuilt to it; " +
                      $"{typeSlots.Count - free.Count} stay at their old size until their bookings end.");
            }

            if (lines.Count == 0) continue;

            allocation.UpdatedAt = now;
            facility.UpdatedAt = now;
            notices.Add((facility.Id, ownerId, string.Join(" ", lines)));
        }

        foreach (var (facilityId, userId, body) in notices)
        {
            var notification = new Notification
            {
                UserId = userId,
                FacilityId = facilityId,
                Title = $"{facilities[facilityId].Name} was adjusted to the platform's new rules".ClampedTo(120),
                Body = body.ClampedTo(1000),
            };
            _context.Set<Notification>().Add(notification);
        }
    }

    private static decimal ClampToWindow(decimal rate, decimal minimum, decimal maximum) =>
        rate < minimum ? minimum : rate > maximum ? maximum : rate;

    private static string BayLabel(VehicleType vehicleType) =>
        BayLabel(vehicleType.BayLengthMeters, vehicleType.BayWidthMeters);

    private static string BayLabel(decimal? lengthMeters, decimal? widthMeters) =>
        lengthMeters is > 0 && widthMeters is > 0
            ? $"{lengthMeters:0.##} m × {widthMeters:0.##} m"
            : "no size set";

    private static bool BayNeedsRestamp(
        VehicleType vehicleType, decimal? storedLengthMeters, decimal? storedWidthMeters) =>
        vehicleType.BayLengthMeters is > 0 && vehicleType.BayWidthMeters is > 0 &&
        (storedLengthMeters != vehicleType.BayLengthMeters || storedWidthMeters != vehicleType.BayWidthMeters);

    private async Task EnsureStoredConfigurationCurrentAsync(ParkingFacility facility, CancellationToken ct)
    {
        var vehicleTypeIds = facility.VehicleAllocations.Select(a => a.VehicleTypeId).ToList();
        if (vehicleTypeIds.Count == 0) return;

        var pricing = await _context.Set<VehiclePricingConfiguration>()
            .Where(p => p.IsActive && vehicleTypeIds.Contains(p.VehicleTypeId))
            .ToDictionaryAsync(p => p.VehicleTypeId, ct);

        var vehicleTypes = await _context.Set<VehicleType>()
            .Where(v => vehicleTypeIds.Contains(v.Id))
            .ToDictionaryAsync(v => v.Id, ct);

        foreach (var allocation in facility.VehicleAllocations)
        {
            var name = allocation.VehicleType?.Name
                ?? vehicleTypes.GetValueOrDefault(allocation.VehicleTypeId)?.Name
                ?? "This vehicle type";

            if (!pricing.TryGetValue(allocation.VehicleTypeId, out var configuration))
            {
                throw new InvalidOperationException(
                    $"The platform admin has no pricing set for {name} any more, so this property cannot be submitted.");
            }

            EnsurePriceWithinWindow(allocation.HourlyRate, configuration, name);

            allocation.CommissionRate = configuration.CommissionRate;

            if (vehicleTypes.TryGetValue(allocation.VehicleTypeId, out var vehicleType) &&
                BayNeedsRestamp(vehicleType, allocation.BayLengthMeters, allocation.BayWidthMeters))
            {
                throw new InvalidOperationException(
                    $"The bay for {name} is now {BayLabel(vehicleType)}. Save this layout again so its bays are re-cut to it.");
            }
        }
    }

    private async Task<VehicleType> GetConfiguredVehicleTypeAsync(Guid vehicleTypeId, CancellationToken ct) =>
        await _context.Set<VehicleType>().FirstOrDefaultAsync(v => v.Id == vehicleTypeId, ct)
        ?? throw new KeyNotFoundException("Vehicle type not found.");

    private static decimal CommissionAmountFor(decimal totalAmount, decimal commissionRate) =>
        CommissionService.Compute(totalAmount, commissionRate);

    private async Task EnsureVehicleTypeIsFree(string name, string code, Guid? exceptId, CancellationToken ct)
    {
        var lowerName = name.ToLower();

        var sameName = _context.Set<VehicleType>().Where(v => v.Name.ToLower() == lowerName);
        var sameCode = _context.Set<VehicleType>().Where(v => v.SlotCode == code);

        if (exceptId is Guid id)
        {
            sameName = sameName.Where(v => v.Id != id);
            sameCode = sameCode.Where(v => v.Id != id);
        }

        if (await sameName.AnyAsync(ct))
        {
            throw new InvalidOperationException($"A vehicle type named '{name}' already exists.");
        }

        if (await sameCode.AnyAsync(ct))
        {
            throw new InvalidOperationException($"Slot code '{code}' is already used by another vehicle type.");
        }
    }
}
