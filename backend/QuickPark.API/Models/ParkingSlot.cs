using QuickPark.API.Enums;

namespace QuickPark.API.Models;

// One concrete bay the driver is sent to, owned by a facility and sized for a vehicle type.
public class ParkingSlot
{
    public Guid Id { get; set; } = Guid.NewGuid(); // PK

    public Guid FacilityId { get; set; } // FK → ParkingFacility
    public ParkingFacility Facility { get; set; } = null!;

    public Guid VehicleTypeId { get; set; } // FK → VehicleType
    public VehicleType VehicleType { get; set; } = null!;

    public decimal? BayLengthMeters { get; set; }
    public decimal? BayWidthMeters { get; set; }

    // The full unique bay number ("C-01"). It is built from VehicleType.SlotCode + "-" + number,
    // but that link is logical only — there is no foreign key between SlotCode and SlotNumber.
    public string SlotNumber { get; set; } = string.Empty;

    public SlotStatus Status { get; set; } = SlotStatus.AVAILABLE;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
