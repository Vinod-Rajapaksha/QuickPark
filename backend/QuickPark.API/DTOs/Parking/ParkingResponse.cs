namespace QuickPark.API.DTOs.Parking;
// Owner-facing view: document counts only, never the URLs.
public class ParkingResponse
{
    public Guid FacilityId { get; set; }
    public Guid ProviderId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Province { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    // Set only when the search carried a reference point.
    public double? DistanceKm { get; set; }
    public decimal LandAreaPerches { get; set; }
    public TimeOnly OpeningTime { get; set; }
    public TimeOnly ClosingTime { get; set; }
    public bool HasEvCharging { get; set; }
    public string Status { get; set; } = string.Empty;
    public int SlotCount { get; set; }
    public IReadOnlyList<ParkingFacilityDocumentSummary> Documents { get; set; } = Array.Empty<ParkingFacilityDocumentSummary>();
    public bool DocumentsComplete { get; set; }
    public IReadOnlyList<DocumentRequirementResponse> DocumentRequirements { get; set; } = Array.Empty<DocumentRequirementResponse>();
    // The four approval sections in wizard order.
    public IReadOnlyList<FacilitySectionResponse> Sections { get; set; } = Array.Empty<FacilitySectionResponse>();
    public IReadOnlyList<FacilityAllocationResponse> Allocations { get; set; } = Array.Empty<FacilityAllocationResponse>();
    public IReadOnlyList<FacilitySlotGroup> SlotGroups { get; set; } = Array.Empty<FacilitySlotGroup>();
    public IReadOnlyList<string> MissingRequirements { get; set; } = Array.Empty<string>();
    public bool ReadyForSubmission { get; set; }
    public bool IsEditable { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
