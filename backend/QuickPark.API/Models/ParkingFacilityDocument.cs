using QuickPark.API.Enums;

namespace QuickPark.API.Models;

// Uploaded proof on a property; binary lives in Cloudinary, only URL and metadata
public class ParkingFacilityDocument
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid FacilityId { get; set; }
    public ParkingFacility? Facility { get; set; }

    public FacilityDocumentType Type { get; set; }

    public string Url { get; set; } = string.Empty;
    public string? PublicId { get; set; }
    public string? FileName { get; set; }
    public string? ContentType { get; set; }
    public long SizeBytes { get; set; }

    public string ProviderName { get; set; } = string.Empty;
    public string ProviderEmail { get; set; } = string.Empty;
    public string? ProviderBusinessName { get; set; }

    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}
