using QuickPark.API.Enums;

namespace QuickPark.API.Models;

public class ParkingSlot
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid FacilityId { get; set; }
    public ParkingFacility Facility { get; set; } = null!;

    public Guid VehicleTypeId { get; set; }
    public VehicleType VehicleType { get; set; } = null!;

    public decimal? BayLengthMeters { get; set; }
    public decimal? BayWidthMeters { get; set; }

    public string SlotNumber { get; set; } = string.Empty;
    public SlotStatus Status { get; set; } = SlotStatus.AVAILABLE;

    public string ProviderName { get; set; } = string.Empty;
    public string ProviderEmail { get; set; } = string.Empty;
    public string? ProviderBusinessName { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
