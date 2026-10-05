namespace QuickPark.API.DTOs.Parking;

public class FacilityQueueRowResponse
{
    public ParkingResponse Facility { get; set; } = new();
    public Guid ProviderId { get; set; }
    public string ProviderName { get; set; } = string.Empty;
    public string ProviderEmail { get; set; } = string.Empty;
    public string? ProviderBusinessName { get; set; }
    public string ProviderVerificationStatus { get; set; } = string.Empty;
}
