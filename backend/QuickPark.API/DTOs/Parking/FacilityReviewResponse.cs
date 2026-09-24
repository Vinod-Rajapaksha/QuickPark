namespace QuickPark.API.DTOs.Parking;

// Admin-only review payload
public class FacilityReviewResponse
{
    public ParkingResponse Facility { get; set; } = new();
    public Guid ProviderUserId { get; set; }
    public string ProviderName { get; set; } = string.Empty;
    public string ProviderEmail { get; set; } = string.Empty;
    public string ProviderPhone { get; set; } = string.Empty;
    public string? BusinessName { get; set; }
    public string ProviderVerificationStatus { get; set; } = string.Empty;
    public Guid? ReviewedBy { get; set; }
    public IReadOnlyList<ParkingFacilityDocumentResponse> Documents { get; set; } =
        Array.Empty<ParkingFacilityDocumentResponse>();
}
