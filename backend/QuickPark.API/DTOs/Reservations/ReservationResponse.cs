namespace QuickPark.API.DTOs.Reservations;

// One booking, shown to the driver who made it, the property owner and the admin.
// SlotNumber is the actual bay the driver is sent to (§13).
public class ReservationResponse
{
    public Guid ReservationId { get; set; }
    public Guid DriverUserId { get; set; }
    public string DriverName { get; set; } = string.Empty;
    public string DriverPhone { get; set; } = string.Empty;

    public Guid FacilityId { get; set; }
    public string FacilityName { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Province { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public Guid ProviderId { get; set; }

    public Guid SlotId { get; set; }
    public string SlotNumber { get; set; } = string.Empty;
    public Guid VehicleTypeId { get; set; }
    public string VehicleTypeName { get; set; } = string.Empty;

    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public int Hours { get; set; }
    public decimal HourlyRate { get; set; }
    public decimal TotalAmount { get; set; }

    // Copied from the admin pricing at booking time; never recalculated afterwards (§8).
    public decimal CommissionRate { get; set; }
    public decimal CommissionAmount { get; set; }
    public decimal ProviderAmount { get; set; }

    public string Status { get; set; } = string.Empty;

    // The owner's gate log (§16). Checked in keeps the booking live; checked out means it has
    // ended and the money below is what the stay actually used.
    public DateTime? CheckedInAt { get; set; }
    public DateTime? CheckedOutAt { get; set; }

    // §15: a cancelled booking stays on file, so who ended it and when travels with it.
    public string? CancelReason { get; set; }
    public string? CancelledBy { get; set; }
    public DateTime? CancelledAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
