using Microsoft.EntityFrameworkCore;
using QuickPark.API.DTOs.Slots;
using QuickPark.API.Enums;
using QuickPark.API.Helpers;
using QuickPark.API.Models;

namespace QuickPark.API.Services.Implementations;

public partial class ParkingService
{
    private static readonly TimeSpan MaxReservationWindow = TimeSpan.FromDays(7);

    public async Task<ProviderSlotBoardResponse> GetProviderSlotBoardAsync(
        Guid providerUserId, Guid facilityId, Guid? vehicleTypeId, string? status,
        DateTime? from, DateTime? to, CancellationToken ct = default)
    {
        if ((from is null) != (to is null))
        {
            throw new InvalidOperationException("Give both a start and an end to check a period.");
        }

        var facility = await GetOwnedFacilityAsync(providerUserId, facilityId, ct);
        var now = DateTime.UtcNow;
        var windowStart = from is DateTime start ? start.AsUtc() : now;
        var windowEnd = to is DateTime end ? end.AsUtc() : windowStart;

        if (windowEnd < windowStart)
        {
            throw new InvalidOperationException("The period must end after it starts.");
        }

        var slotIds = facility.Slots.Select(s => s.Id).ToList();
        var bookings = await LiveBookingsAsync(slotIds, windowStart, ct);
        var rates = RateByVehicleType(facility);

        var rows = facility.Slots
            .OrderBy(s => s.VehicleType!.Name).ThenBy(s => s.SlotNumber)
            .Select(s => MapToSlotRow(
                s, BookingsFor(bookings, s.Id), rates, windowStart, windowEnd, now))
            .ToList();

        var wanted = ParseBoardStatusFilter(status);
        var visible = rows
            .Where(r => vehicleTypeId is null || r.VehicleTypeId == vehicleTypeId)
            .Where(r => wanted is null || r.EffectiveStatus == wanted)
            .ToList();

        return new ProviderSlotBoardResponse
        {
            Facility = MapToResponse(facility),
            Counts = BuildSlotCounts(rows),
            Slots = visible
        };
    }

    public async Task<ProviderSlotDetailsResponse> GetProviderSlotAsync(
        Guid providerUserId, Guid slotId, CancellationToken ct = default)
    {
        var (facility, slot) = await GetOwnedSlotAsync(providerUserId, slotId, ct);
        var now = DateTime.UtcNow;

        var bookings = ReservationsForResponse()
            .Where(r => r.SlotId == slot.Id)
            .OrderBy(r => r.StartTime);

        var all = (await bookings.ToListAsync(ct)).AsReadOnly();

        var live = all
            .Where(r => r.Status is ReservationStatus.PENDING or ReservationStatus.CONFIRMED)
            .ToList();
        var ended = all
            .Where(r => r.Status is not (ReservationStatus.PENDING or ReservationStatus.CONFIRMED))
            .OrderByDescending(r => r.StartTime)
            .Take(10)
            .ToList();

        var row = MapToSlotRow(
            slot, live, RateByVehicleType(facility), now, now, now);

        return new ProviderSlotDetailsResponse
        {
            Slot = row,
            Upcoming = live.Where(r => r.StartTime > now).Select(MapToReservation).ToList(),
            History = ended.Select(MapToReservation).ToList()
        };
    }

    public async Task<ProviderSlotRowResponse> UpdateSlotStatusAsync(
        Guid providerUserId, Guid slotId, UpdateSlotRequest request, CancellationToken ct = default)
    {
        var (facility, slot) = await GetOwnedSlotAsync(providerUserId, slotId, ct);
        var wanted = ParseOwnerSlotStatus(request.Status);
        var now = DateTime.UtcNow;

        if (wanted != SlotStatus.AVAILABLE)
        {
            var holding = await _context.Set<Reservation>()
                .Where(r => r.SlotId == slot.Id &&
                            (r.Status == ReservationStatus.PENDING || r.Status == ReservationStatus.CONFIRMED) &&
                            r.EndTime > now)
                .OrderBy(r => r.StartTime)
                .FirstOrDefaultAsync(ct);

            if (holding is not null)
            {
                throw new InvalidOperationException(
                    $"{slot.SlotNumber} is booked until {holding.EndTime:HH:mm} UTC. End that booking before " +
                    $"putting the bay on {wanted.ToString().ToLowerInvariant()}.");
            }
        }

        slot.Status = wanted;
        slot.UpdatedAt = now;
        facility.UpdatedAt = now;
        await _context.SaveChangesAsync(ct);

        var live = await LiveBookingsAsync(new List<Guid> { slot.Id }, now, ct);

        return MapToSlotRow(
            slot, BookingsFor(live, slot.Id), RateByVehicleType(facility), now, now, now);
    }

    private static void EnsureBookingWindow(DateTime start, DateTime end, DateTime now)
    {
        if (end <= start)
        {
            throw new InvalidOperationException("The reservation must end after it starts.");
        }

        if (start < now.AddMinutes(-5))
        {
            throw new InvalidOperationException("The reservation start time is in the past.");
        }

        if (end - start > MaxReservationWindow)
        {
            throw new InvalidOperationException("A reservation can span at most 7 days.");
        }
    }

    private static int BookingHours(DateTime start, DateTime end) =>
        Math.Max(1, (int)Math.Ceiling((end - start).TotalMinutes / 60d));

    private static Reservation BuildReservation(
        Guid driverUserId, ParkingFacility facility, ParkingSlot slot,
        ParkingFacilityVehicleType allocation, DateTime start, DateTime end)
    {
        var hours = BookingHours(start, end);
        var totalAmount = allocation.HourlyRate * hours;
        var commissionAmount = CommissionAmountFor(totalAmount, allocation.CommissionRate);

        return new Reservation
        {
            DriverUserId = driverUserId,
            FacilityId = facility.Id,
            ProviderId = facility.ProviderId,
            SlotId = slot.Id,
            SlotNumber = slot.SlotNumber,
            VehicleTypeId = allocation.VehicleTypeId,
            StartTime = start,
            EndTime = end,
            Hours = hours,
            HourlyRate = allocation.HourlyRate,
            TotalAmount = totalAmount,
            CommissionRate = allocation.CommissionRate,
            CommissionAmount = commissionAmount,
            ProviderAmount = totalAmount - commissionAmount,
            Status = ReservationStatus.PENDING
        };
    }

    private async Task LockSlotAsync(Guid slotId, CancellationToken ct) =>
        await _context.Database.ExecuteSqlAsync($"SELECT pg_advisory_xact_lock(hashtext({slotId}::text))", ct);

    private async Task EnsureSlotIsFreeAsync(
        ParkingSlot slot, DateTime start, DateTime end, Guid? exceptReservationId, CancellationToken ct)
    {
        await LockSlotAsync(slot.Id, ct);

        var query = _context.Set<Reservation>()
            .Where(r => r.SlotId == slot.Id &&
                        (r.Status == ReservationStatus.PENDING || r.Status == ReservationStatus.CONFIRMED) &&
                        r.StartTime < end && r.EndTime > start);

        if (exceptReservationId is Guid except) query = query.Where(r => r.Id != except);

        var clash = await query.OrderBy(r => r.StartTime).FirstOrDefaultAsync(ct);

        if (clash is not null)
        {
            throw new InvalidOperationException(
                $"{slot.SlotNumber} is already booked from {clash.StartTime:HH:mm} to {clash.EndTime:HH:mm} UTC " +
                "for that period. Choose another bay or another time.");
        }
    }

    private async Task<ParkingSlot> GetBookableSlotAsync(
        ParkingFacility facility, Guid slotId, Guid vehicleTypeId,
        DateTime start, DateTime end, CancellationToken ct, Guid? exceptReservationId = null)
    {
        var slot = await _context.Set<ParkingSlot>()
            .Include(s => s.VehicleType)
            .FirstOrDefaultAsync(s => s.Id == slotId && s.FacilityId == facility.Id, ct)
            ?? throw new InvalidOperationException("That bay does not belong to this property.");

        if (slot.VehicleTypeId != vehicleTypeId)
        {
            throw new InvalidOperationException(
                $"{slot.SlotNumber} is a {slot.VehicleType?.Name ?? "different"} bay, so it cannot take this vehicle.");
        }

        if (slot.Status != SlotStatus.AVAILABLE)
        {
            throw new InvalidOperationException(
                $"{slot.SlotNumber} is on {slot.Status.ToString().ToLowerInvariant()}, so it cannot be booked.");
        }

        await EnsureSlotIsFreeAsync(slot, start, end, exceptReservationId, ct);
        return slot;
    }

    private async Task<ParkingSlot> AssignFreeSlotAsync(
        ParkingFacility facility, Guid vehicleTypeId, DateTime start, DateTime end, CancellationToken ct)
    {
        var candidates = await _context.Set<ParkingSlot>()
            .Where(s => s.FacilityId == facility.Id &&
                        s.VehicleTypeId == vehicleTypeId &&
                        s.Status == SlotStatus.AVAILABLE)
            .OrderBy(s => s.SlotNumber)
            .ToListAsync(ct);

        var busy = await GetBusySlotsAsync(candidates.Select(s => s.Id).ToList(), start, end, ct);

        foreach (var slot in candidates.Where(s => !busy.ContainsKey(s.Id)))
        {
            try
            {
                await EnsureSlotIsFreeAsync(slot, start, end, null, ct);
            }

            catch (InvalidOperationException)
            {
                continue;
            }

            return slot;
        }

        throw new InvalidOperationException(
            "No free bays are left for that vehicle type and period. Try a different time.");
    }

    private async Task<(ParkingFacility Facility, ParkingSlot Slot)> GetOwnedSlotAsync(
        Guid providerUserId, Guid slotId, CancellationToken ct)
    {
        var slot = await _context.Set<ParkingSlot>()
            .Include(s => s.VehicleType)
            .FirstOrDefaultAsync(s => s.Id == slotId, ct)
            ?? throw new KeyNotFoundException("Parking bay not found.");

        var facility = await FacilitiesForResponse()
            .FirstOrDefaultAsync(f => f.Id == slot.FacilityId, ct)
            ?? throw new KeyNotFoundException("Parking property not found.");

        await EnsureOwnershipAsync(providerUserId, facility, ct);
        return (facility, slot);
    }

    private async Task<Dictionary<Guid, List<Reservation>>> LiveBookingsAsync(
        IReadOnlyCollection<Guid> slotIds, DateTime windowStart, CancellationToken ct)
    {
        if (slotIds.Count == 0) return new Dictionary<Guid, List<Reservation>>();

        var ids = slotIds.ToList();

        var bookings = await ReservationsForResponse()
            .AsNoTracking()
            .Where(r => ids.Contains(r.SlotId) &&
                        (r.Status == ReservationStatus.PENDING || r.Status == ReservationStatus.CONFIRMED) &&
                        r.EndTime > windowStart)
            .OrderBy(r => r.StartTime)
            .ToListAsync(ct);

        return bookings.GroupBy(r => r.SlotId).ToDictionary(g => g.Key, g => g.ToList());
    }

    private static List<Reservation> BookingsFor(
        Dictionary<Guid, List<Reservation>> bookings, Guid slotId) =>
        bookings.TryGetValue(slotId, out var found) ? found : new List<Reservation>();

    private static Dictionary<Guid, decimal> RateByVehicleType(ParkingFacility facility) =>
        facility.VehicleAllocations
            .GroupBy(a => a.VehicleTypeId)
            .ToDictionary(g => g.Key, g => g.First().HourlyRate);

    private static ProviderSlotRowResponse MapToSlotRow(
        ParkingSlot slot, List<Reservation> bookings, Dictionary<Guid, decimal> rates,
        DateTime windowStart, DateTime windowEnd, DateTime now)
    {
        var openWindow = windowEnd > windowStart;
        var relevant = bookings
            .Where(r => r.EndTime > windowStart && (!openWindow || r.StartTime < windowEnd))
            .ToList();

        var current = relevant.FirstOrDefault(r => r.StartTime <= now && r.EndTime > now)
            ?? relevant.FirstOrDefault();

        var effective = slot.Status switch
        {
            SlotStatus.DISABLED => nameof(SlotStatus.DISABLED),
            SlotStatus.MAINTENANCE => nameof(SlotStatus.MAINTENANCE),
            _ when current is null => nameof(SlotStatus.AVAILABLE),
            _ => current.StartTime <= now && current.EndTime > now
                ? nameof(SlotStatus.OCCUPIED)
                : nameof(SlotStatus.RESERVED)
        };

        return new ProviderSlotRowResponse
        {
            SlotId = slot.Id,
            FacilityId = slot.FacilityId,
            SlotNumber = slot.SlotNumber,
            VehicleTypeId = slot.VehicleTypeId,
            VehicleTypeName = slot.VehicleType?.Name ?? string.Empty,
            BayLabel = BayLabel(slot.BayLengthMeters, slot.BayWidthMeters),
            Status = slot.Status.ToString(),
            EffectiveStatus = effective,
            Bookable = slot.Status == SlotStatus.AVAILABLE &&
                        (!openWindow || relevant.Count == 0),
            HourlyRate = rates.TryGetValue(slot.VehicleTypeId, out var rate) ? rate : 0m,
            BusyFrom = current?.StartTime,
            BusyUntil = current?.EndTime,
            Current = current is null ? null : MapToReservation(current)
        };
    }

    private static ProviderSlotCountsResponse BuildSlotCounts(List<ProviderSlotRowResponse> rows) =>
        new()
        {
            Total = rows.Count(r => r.Status != nameof(SlotStatus.DISABLED)),
            Available = rows.Count(r => r.EffectiveStatus == nameof(SlotStatus.AVAILABLE)),
            Reserved = rows.Count(r => r.EffectiveStatus == nameof(SlotStatus.RESERVED)),
            Occupied = rows.Count(r => r.EffectiveStatus == nameof(SlotStatus.OCCUPIED)),
            Maintenance = rows.Count(r => r.Status == nameof(SlotStatus.MAINTENANCE)),
            Disabled = rows.Count(r => r.Status == nameof(SlotStatus.DISABLED)),
            ByVehicleType = rows
                .Where(r => r.Status != nameof(SlotStatus.DISABLED))
                .GroupBy(r => r.VehicleTypeId)
                .Select(group => new ProviderSlotTypeCount
                {
                    VehicleTypeId = group.Key,
                    VehicleTypeName = group.First().VehicleTypeName,
                    Total = group.Count(),
                    Available = group.Count(r => r.EffectiveStatus == nameof(SlotStatus.AVAILABLE))
                })
                .OrderBy(g => g.VehicleTypeName)
                .ToList()
        };

    private static string? ParseBoardStatusFilter(string? status)
    {
        var trimmed = status.TrimToNull()?.ToUpperInvariant();
        if (trimmed is null or "ALL") return null;

        var allowed = new[] { "AVAILABLE", "RESERVED", "OCCUPIED", "MAINTENANCE", "DISABLED" };
        if (!allowed.Contains(trimmed))
        {
            throw new InvalidOperationException(
                $"status must be one of {string.Join(", ", allowed)}.");
        }

        return trimmed;
    }

    private static SlotStatus ParseOwnerSlotStatus(string? status)
    {
        var trimmed = Require(status, "A bay status is required.").ToUpperInvariant();

        if (!Enum.TryParse<SlotStatus>(trimmed, out var parsed) ||
            parsed is not (SlotStatus.AVAILABLE or SlotStatus.MAINTENANCE or SlotStatus.DISABLED))
        {
            throw new InvalidOperationException(
                $"{nameof(SlotStatus.MAINTENANCE)}, {nameof(SlotStatus.DISABLED)} and {nameof(SlotStatus.AVAILABLE)} are the states a bay can be set to.");
        }

        return parsed;
    }
}
