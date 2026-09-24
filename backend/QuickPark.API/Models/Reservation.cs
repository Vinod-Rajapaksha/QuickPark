using QuickPark.API.Enums;

namespace QuickPark.API.Models;

// Driver-side booking of one concrete slot in an approved property (§13). The slot number,
// hourly rate and provider are copied at booking time so a later layout or pricing change
// never rewrites an existing reservation. The commission split is copied for the same reason:
// the admin may move a rate tomorrow, but this booking keeps the money it was priced at (§8).
// Payment and entry tokens link back to this row.
public class Reservation
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid DriverUserId { get; set; }
    public User Driver { get; set; } = null!;

    public Guid FacilityId { get; set; }
    public ParkingFacility Facility { get; set; } = null!;

    public Guid ProviderId { get; set; }
    public ParkingProvider Provider { get; set; } = null!;

    // Copied from the property so a booking can be filtered by the owner's name, email or company.
    // Unlike the money fields these are re-stamped when the owner's account changes, so a row
    // always says who runs the property today.
    public string ProviderName { get; set; } = string.Empty;
    public string ProviderEmail { get; set; } = string.Empty;
    public string? ProviderBusinessName { get; set; }

    public Guid SlotId { get; set; }
    public ParkingSlot Slot { get; set; } = null!;
    public string SlotNumber { get; set; } = string.Empty;

    public Guid VehicleTypeId { get; set; }
    public VehicleType VehicleType { get; set; } = null!;

    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public int Hours { get; set; }

    public decimal HourlyRate { get; set; }
    public decimal TotalAmount { get; set; }

    public decimal CommissionRate { get; set; }
    public decimal CommissionAmount { get; set; }
    public decimal ProviderAmount { get; set; }

    public ReservationStatus Status { get; set; } = ReservationStatus.PENDING;

    // The owner's gate log. Checking a driver in keeps the booking live; checking them out ends
    // it and is the moment the stay is billed for what it actually used. Both stay on the row so
    // the property can show what happened today.
    public DateTime? CheckedInAt { get; set; }
    public DateTime? CheckedOutAt { get; set; }

    // A cancelled booking is never removed: who ended it and when stays on the row so the
    // history and the earnings report still add up.
    public string? CancelReason { get; set; }
    public string? CancelledBy { get; set; }
    public DateTime? CancelledAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
