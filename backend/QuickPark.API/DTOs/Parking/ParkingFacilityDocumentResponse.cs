namespace QuickPark.API.DTOs.Parking;

public class ParkingFacilityDocumentResponse
{
    public Guid DocumentId { get; set; }
    public Guid FacilityId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string? FileName { get; set; }
    public string? ContentType { get; set; }
    public long SizeBytes { get; set; }
    public DateTime UploadedAt { get; set; }
}
