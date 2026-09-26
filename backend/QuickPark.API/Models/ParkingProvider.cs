namespace QuickPark.API.Models;

// Parking Owner profile + identity-verification record, linked one-to-one with the User account.
public class ParkingProvider
{
    public Guid Id { get; set; } = Guid.NewGuid(); // PK

    public Guid UserId { get; set; } // FK → User
    public User User { get; set; } = null!;

    // Owner profile details
    public string? BusinessName { get; set; }
    public string? Address { get; set; }

    // NIC document (stored in Cloudinary; only the URL + metadata live here)
    public string? NicDocumentUrl { get; set; }
    public string? NicDocumentPublicId { get; set; }
    public string? NicDocumentContentType { get; set; }
    public long NicDocumentSize { get; set; }
    public DateTime? NicSubmittedAt { get; set; }

    // Verification workflow
    public ProviderStatus VerificationStatus { get; set; } = ProviderStatus.PENDING;
    public string? VerificationRemarks { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public Guid? VerifiedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
