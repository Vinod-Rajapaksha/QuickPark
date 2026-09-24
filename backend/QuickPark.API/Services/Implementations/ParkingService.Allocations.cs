using Microsoft.EntityFrameworkCore;
using QuickPark.API.Data;
using QuickPark.API.DTOs.Parking;
using QuickPark.API.Enums;
using QuickPark.API.Models;

namespace QuickPark.API.Services.Implementations;

// Bay rows and allocation rows rebuilt when the owner changes the property layout.
public partial class ParkingService
{
    private static bool LayoutDiffers(
        ParkingFacility facility, List<VehicleAllocationInput> allocations)
    {
        var existing = facility.VehicleAllocations;
        if (existing.Count != allocations.Count) return true;

        return allocations.Any(allocation =>
            existing.FirstOrDefault(a => a.VehicleTypeId == allocation.VehicleTypeId) is not { } current ||
            current.NumberOfSlots != allocation.NumberOfSlots);
    }

    private void ReconcileSlots(
        ParkingFacility facility,
        List<VehicleAllocationInput> allocations,
        Dictionary<Guid, VehicleType> vehicleTypes,
        HashSet<Guid> heldSlotIds,
        DateTime now)
    {
        var wanted = allocations.ToDictionary(a => a.VehicleTypeId, a => a.NumberOfSlots);
        var rowsByType = facility.Slots.GroupBy(s => s.VehicleTypeId).ToDictionary(g => g.Key, g => g.ToList());

        foreach (var (vehicleTypeId, rows) in rowsByType)
        {
            vehicleTypes.TryGetValue(vehicleTypeId, out var vehicleType);
            FitSlotCount(facility, rows, wanted.TryGetValue(vehicleTypeId, out var count) ? count : 0,
                vehicleType, heldSlotIds, now);
        }

        foreach (var allocation in allocations.Where(a => !rowsByType.ContainsKey(a.VehicleTypeId)))
        {
            FitSlotCount(facility, new List<ParkingSlot>(), allocation.NumberOfSlots,
                vehicleTypes[allocation.VehicleTypeId], heldSlotIds, now);
        }
    }

    private void FitSlotCount(
        ParkingFacility facility,
        List<ParkingSlot> rows,
        int target,
        VehicleType? vehicleType,
        HashSet<Guid> heldSlotIds,
        DateTime now)
    {
        var inLayout = rows.Where(s => s.Status != SlotStatus.DISABLED).ToList();
        var retired = rows.Where(s => s.Status == SlotStatus.DISABLED).OrderBy(s => s.SlotNumber).ToList();

        if (inLayout.Count > target)
        {
            var surplus = inLayout.Count - target;
            var free = inLayout
                .Where(s => !heldSlotIds.Contains(s.Id))
                .OrderByDescending(s => s.SlotNumber)
                .ToList();

            if (free.Count < surplus)
            {
                var holding = inLayout
                    .Where(s => heldSlotIds.Contains(s.Id))
                    .Select(s => s.SlotNumber)
                    .OrderBy(n => n)
                    .Take(surplus - free.Count);

                throw new InvalidOperationException(
                    $"{string.Join(", ", holding)} still has bookings that have not ended. Move or cancel " +
                    "them before reducing the bays.");
            }

            foreach (var slot in free.Take(surplus))
            {
                slot.Status = SlotStatus.DISABLED;
                slot.UpdatedAt = now;
            }

            return;
        }

        var missing = target - inLayout.Count;
        if (missing == 0) return;

        var type = vehicleType!;
        EnsureStandardBay(type);

        foreach (var slot in retired.Take(missing))
        {
            slot.Status = SlotStatus.AVAILABLE;
            slot.BayLengthMeters = type.BayLengthMeters;
            slot.BayWidthMeters = type.BayWidthMeters;
            slot.UpdatedAt = now;
        }

        missing -= Math.Min(missing, retired.Count);
        if (missing == 0) return;

        var next = NextSlotSequence(rows, type.SlotCode);

        for (var sequence = next + 1; sequence <= next + missing; sequence++)
        {
            var slot = new ParkingSlot
            {
                VehicleTypeId = type.Id,
                BayLengthMeters = type.BayLengthMeters,
                BayWidthMeters = type.BayWidthMeters,
                SlotNumber = SlotNumberFor(type.SlotCode, sequence),
                Status = SlotStatus.AVAILABLE,
                ProviderName = facility.ProviderName,
                ProviderEmail = facility.ProviderEmail,
                ProviderBusinessName = facility.ProviderBusinessName
            };
            facility.Slots.Add(slot);
            _context.Set<ParkingSlot>().Add(slot);
        }
    }

    private static string SlotNumberFor(string slotCode, int sequence) => $"{slotCode}-{sequence:000}";

    private static int NextSlotSequence(IEnumerable<ParkingSlot> rows, string slotCode)
    {
        var prefix = $"{slotCode}-";

        return rows.Select(s => s.SlotNumber)
            .Where(n => n.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            .Select(n => int.TryParse(n[prefix.Length..], out var sequence) ? sequence : 0)
            .DefaultIfEmpty(0)
            .Max();
    }

    private void SyncAllocationRows(
        ParkingFacility facility,
        List<VehicleAllocationInput> allocations,
        Dictionary<Guid, VehicleType> vehicleTypes,
        Dictionary<Guid, VehiclePricingConfiguration> pricing,
        DateTime now)
    {
        foreach (var allocation in allocations)
        {
            var vehicleType = vehicleTypes[allocation.VehicleTypeId];
            var row = facility.VehicleAllocations.FirstOrDefault(a => a.VehicleTypeId == allocation.VehicleTypeId);

            if (row is null)
            {
                row = new ParkingFacilityVehicleType
                {
                    VehicleTypeId = vehicleType.Id,
                    ProviderName = facility.ProviderName,
                    ProviderEmail = facility.ProviderEmail,
                    ProviderBusinessName = facility.ProviderBusinessName
                };
                _context.Set<ParkingFacilityVehicleType>().Add(row);
                facility.VehicleAllocations.Add(row);
            }

            row.NumberOfSlots = allocation.NumberOfSlots;
            row.HourlyRate = allocation.HourlyRate;
            row.CommissionRate = pricing[allocation.VehicleTypeId].CommissionRate;
            row.BayLengthMeters = vehicleType.BayLengthMeters;
            row.BayWidthMeters = vehicleType.BayWidthMeters;
            row.UpdatedAt = now;
        }

        var wanted = allocations.Select(a => a.VehicleTypeId).ToHashSet();

        foreach (var row in facility.VehicleAllocations.Where(a => !wanted.Contains(a.VehicleTypeId)).ToList())
        {
            _context.Set<ParkingFacilityVehicleType>().Remove(row);
            facility.VehicleAllocations.Remove(row);
        }
    }
}
