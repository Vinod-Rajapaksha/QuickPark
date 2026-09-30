using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using QuickPark.API.Data;
using QuickPark.API.DTOs.Reservations;
using QuickPark.API.Enums;
using QuickPark.API.Models;

namespace QuickPark.API.Services.Implementations;

public partial class ParkingService
{
    private IQueryable<ParkingFacility> FacilitiesForResponse() =>
        _context.Set<ParkingFacility>()
            .Include(f => f.Documents)
            .Include(f => f.Slots).ThenInclude(s => s.VehicleType)
            .Include(f => f.VehicleAllocations).ThenInclude(a => a.VehicleType)
            .Include(f => f.SectionReviews);

    private IQueryable<Reservation> ReservationsForResponse() =>
        _context.Set<Reservation>()
            .Include(r => r.Driver)
            .Include(r => r.Facility)
            .Include(r => r.VehicleType);

    private static IQueryable<Reservation> ApplyReservationFilters(
        IQueryable<Reservation> query, ReservationStatus? status, DateTime? from, DateTime? to)
    {
        if (status is ReservationStatus wanted) query = query.Where(r => r.Status == wanted);
        if (from is DateTime start) query = query.Where(r => r.EndTime >= start);
        if (to is DateTime end) query = query.Where(r => r.StartTime <= end);
        return query;
    }

    private static Expression<Func<Reservation, bool>> HoldsSlot(DateTime from, DateTime to) =>
        r => (r.Status == ReservationStatus.PENDING || r.Status == ReservationStatus.CONFIRMED)
                ? r.StartTime < to && r.EndTime > from
                : r.Status == ReservationStatus.CHECKED_IN && (r.CheckedInAt ?? r.StartTime) < to;

    private static bool HoldsNow(Reservation r, DateTime from, DateTime to) =>
        (r.Status == ReservationStatus.PENDING || r.Status == ReservationStatus.CONFIRMED)
            ? r.StartTime < to && r.EndTime > from
            : r.Status == ReservationStatus.CHECKED_IN && (r.CheckedInAt ?? r.StartTime) < to;

    private static string EffectiveSlotStatus(SlotStatus stored, ReservationStatus? hold) =>
        stored switch
        {
            SlotStatus.DISABLED => nameof(SlotStatus.DISABLED),
            SlotStatus.MAINTENANCE => nameof(SlotStatus.MAINTENANCE),
            _ => hold switch
            {
                null => nameof(SlotStatus.AVAILABLE),
                ReservationStatus.PENDING => nameof(ReservationStatus.PENDING),
                ReservationStatus.CHECKED_IN => nameof(SlotStatus.OCCUPIED),
                // CONFIRMED, and anything else that holds a bay
                _ => nameof(SlotStatus.RESERVED)
            }
        };

    private sealed record SlotBusy(
        Guid ReservationId, DateTime Start, DateTime End, ReservationStatus Status);

    private async Task<Dictionary<Guid, SlotBusy>> GetBusySlotsAsync(
        IReadOnlyCollection<Guid> slotIds, DateTime start, DateTime end, CancellationToken ct)
    {
        if (slotIds.Count == 0) return new Dictionary<Guid, SlotBusy>();

        var ids = slotIds.ToList();

        var clashes = await _context.Set<Reservation>()
            .Where(r => ids.Contains(r.SlotId))
            .Where(HoldsSlot(start, end))
            .OrderBy(r => r.StartTime)
            .Select(r => new { r.Id, r.SlotId, r.StartTime, r.EndTime, r.Status })
            .ToListAsync(ct);

        return clashes
            .GroupBy(r => r.SlotId)
            .ToDictionary(g => g.Key, g =>
            {
                var hold = g.FirstOrDefault(r => r.Status == ReservationStatus.CHECKED_IN) ?? g.First();

                return new SlotBusy(hold.Id, hold.StartTime, hold.EndTime, hold.Status);
            });
    }

    private async Task<ReservationResponse?> LoadReservationAsync(Guid reservationId, CancellationToken ct)
    {
        var reservation = await ReservationsForResponse()
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == reservationId, ct);

        return reservation == null ? null : MapToReservation(reservation);
    }
}
