using Microsoft.EntityFrameworkCore;
using QuickPark.API.Data;
using QuickPark.API.DTOs.Reservations;
using QuickPark.API.Enums;
using QuickPark.API.Models;

namespace QuickPark.API.Services.Implementations;

// Query composition shared by the reads, and the reservation rows built on top of it.
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

    private async Task<Dictionary<Guid, (DateTime Start, DateTime End)>> GetBusySlotsAsync(
        IReadOnlyCollection<Guid> slotIds, DateTime start, DateTime end, CancellationToken ct)
    {
        if (slotIds.Count == 0) return new Dictionary<Guid, (DateTime Start, DateTime End)>();

        var ids = slotIds.ToList();

        var clashes = await _context.Set<Reservation>()
            .Where(r => ids.Contains(r.SlotId) &&
                        (r.Status == ReservationStatus.PENDING || r.Status == ReservationStatus.CONFIRMED) &&
                        r.StartTime < end && r.EndTime > start)
            .OrderBy(r => r.StartTime)
            .Select(r => new { r.SlotId, r.StartTime, r.EndTime })
            .ToListAsync(ct);

        return clashes
            .GroupBy(r => r.SlotId)
            .ToDictionary(g => g.Key, g => (g.First().StartTime, g.First().EndTime));
    }

    private async Task<ReservationResponse?> LoadReservationAsync(Guid reservationId, CancellationToken ct)
    {
        var reservation = await ReservationsForResponse()
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == reservationId, ct);

        return reservation == null ? null : MapToReservation(reservation);
    }
}
