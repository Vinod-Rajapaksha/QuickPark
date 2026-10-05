using QuickPark.API.Enums;

namespace QuickPark.API.Models;

// A parking property the owner registers
public class ParkingFacility
{
    public Guid Id { get; set; } = Guid.NewGuid(); 

    public Guid ProviderId { get; set; } 
    public ParkingProvider Provider { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Province { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public decimal LandAreaPerches { get; set; }
    public TimeOnly OpeningTime { get; set; } = new(0, 0);
    public TimeOnly ClosingTime { get; set; } = new(23, 59);
    public bool HasEvCharging { get; set; }
    public ParkingStatus Status { get; set; } = ParkingStatus.DRAFT;
    public string? RejectionReason { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public Guid? ReviewedBy { get; set; }

    public ICollection<ParkingSlot> Slots { get; set; } = new List<ParkingSlot>();
    public ICollection<ParkingFacilityDocument> Documents { get; set; } = new List<ParkingFacilityDocument>();
    public ICollection<ParkingFacilityVehicleType> VehicleAllocations { get; set; } = new List<ParkingFacilityVehicleType>();
    public ICollection<ParkingFacilitySectionReview> SectionReviews { get; set; } = new List<ParkingFacilitySectionReview>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
