namespace QuickPark.API.DTOs.Providers;

// view of a Parking Owner profile and its verification state.
public class ProviderProfileResponse
{
    // Guid.
    public Guid ProviderId { get; set; }
    public Guid UserId { get; set; }

    // Account details.
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string NicNumber { get; set; } = string.Empty;

    // Business details the owner supplies.
    public string? BusinessName { get; set; }
    public string? Address { get; set; }

    // Verification state: PENDING / APPROVED / REJECTED, plus the admin's remarks.
    public string VerificationStatus { get; set; } = string.Empty;
    public string? VerificationRemarks { get; set; }

    // The uploaded NIC document.
    public bool HasNicDocument { get; set; }
    public string? NicDocumentUrl { get; set; }
    public string? NicDocumentContentType { get; set; }
    public long NicDocumentSize { get; set; }
    public DateTime? NicSubmittedAt { get; set; }

    // Decision made date
    public DateTime? VerifiedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
