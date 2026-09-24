using QuickPark.API.Enums;

namespace QuickPark.API.Models;

// One admin decision about one section
public class ParkingFacilitySectionReview
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid FacilityId { get; set; }
    public ParkingFacility? Facility { get; set; }

    public FacilitySection Section { get; set; }
    public SectionReviewStatus Status { get; set; } = SectionReviewStatus.PENDING;

    public string? Remarks { get; set; }
    public Guid? ReviewedBy { get; set; }
    public DateTime? ReviewedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
