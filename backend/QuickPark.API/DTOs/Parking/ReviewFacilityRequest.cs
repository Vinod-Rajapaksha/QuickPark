namespace QuickPark.API.DTOs.Parking;

// Whole-property decision; rejection requires a reason the owner can act on.
public class ReviewFacilityRequest
{
    // Expected values: "APPROVED" or "REJECTED".
    public string Decision { get; set; } = string.Empty;
    public string? RejectionReason { get; set; }
}
