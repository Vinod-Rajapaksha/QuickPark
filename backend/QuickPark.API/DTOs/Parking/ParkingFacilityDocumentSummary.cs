namespace QuickPark.API.DTOs.Parking;

public class ParkingFacilityDocumentSummary
{
    public string Type { get; set; } = string.Empty;
    public int Count { get; set; }
    public DateTime? LatestUploadedAt { get; set; }
}
