using QuickPark.API.Enums;

namespace QuickPark.API.Models;

// One booking of a bay by a driver: who booked it, where, for which vehicle,
// what it costs and how the money splits between the platform and the owner.
public class Reservation
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid DriverId { get; set; } // FK → User
    public User? Driver { get; set; }

    public Guid FacilityId { get; set; } // FK → ParkingFacility
    public ParkingFacility? Facility { get; set; }

    // ParkingProvider.Id, copied from the facility so an owner's bookings are one indexed lookup away.
    public Guid ProviderId { get; set; }

    public Guid SlotId { get; set; }
    public string SlotNumber { get; set; } = string.Empty;

    public Guid VehicleTypeId { get; set; } // FK → VehicleType
    public VehicleType? VehicleType { get; set; }

    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public int Hours { get; set; }

    public decimal HourlyRate { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal CommissionRate { get; set; }
    public decimal CommissionAmount { get; set; }
    public decimal ProviderAmount { get; set; }

    public ReservationStatus Status { get; set; } = ReservationStatus.PENDING;

    public DateTime? CheckedInAt { get; set; }
    public DateTime? CheckedOutAt { get; set; }

    public string? CancelReason { get; set; }
    public string? CancelledBy { get; set; }
    public DateTime? CancelledAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
