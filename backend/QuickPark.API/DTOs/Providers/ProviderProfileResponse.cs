namespace QuickPark.API.DTOs.Providers;

// Owner-facing view of a Parking Owner profile and its verification state.
public class ProviderProfileResponse
{
    public Guid ProviderId { get; set; }
    public Guid UserId { get; set; }

    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string NicNumber { get; set; } = string.Empty;

    public string? BusinessName { get; set; }
    public string? Address { get; set; }

    public string VerificationStatus { get; set; } = string.Empty;
    public string? VerificationRemarks { get; set; }

    public bool HasNicDocument { get; set; }
    public string? NicDocumentUrl { get; set; }
    public string? NicDocumentContentType { get; set; }
    public long NicDocumentSize { get; set; }
    public DateTime? NicSubmittedAt { get; set; }

    public DateTime? VerifiedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
