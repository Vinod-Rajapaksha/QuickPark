namespace QuickPark.API.Models;

// Allocated type, bay count and hourly price.
public class ParkingFacilityVehicleType
{
    public Guid Id { get; set; } = Guid.NewGuid(); // PK

    public Guid FacilityId { get; set; } // FK → ParkingFacility
    public ParkingFacility Facility { get; set; } = null!;

    public Guid VehicleTypeId { get; set; } // FK → VehicleType
    public VehicleType VehicleType { get; set; } = null!;

    public decimal? BayLengthMeters { get; set; }
    public decimal? BayWidthMeters { get; set; }

    public int NumberOfSlots { get; set; }
    public decimal HourlyRate { get; set; }
    public decimal CommissionRate { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
