using QuickPark.API.Models;

namespace QuickPark.API.DTOs.Providers;

// Maps an owner's account row plus its optional verification
public static class ProviderProfileMapper
{
    
    public static ProviderProfileResponse ToProfileResponse(User user, ParkingProvider? provider)
    {
        var status = provider?.VerificationStatus ?? ProviderStatus.PENDING;
        var hasDocument = !string.IsNullOrEmpty(provider?.NicDocumentUrl);

        return new ProviderProfileResponse
        {
            ProviderId = provider?.Id ?? Guid.Empty,
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Phone = user.Phone,
            NicNumber = user.NIC,
            BusinessName = provider?.BusinessName,
            Address = provider?.Address,
            VerificationStatus = status.ToString(),
            VerificationRemarks = provider?.VerificationRemarks,
            HasNicDocument = hasDocument,
            NicDocumentUrl = provider?.NicDocumentUrl,
            NicDocumentContentType = provider?.NicDocumentContentType,
            NicDocumentSize = provider?.NicDocumentSize ?? 0,
            NicSubmittedAt = provider?.NicSubmittedAt,
            VerifiedAt = provider?.VerifiedAt,
            CreatedAt = provider?.CreatedAt ?? user.CreatedAt,
            UpdatedAt = provider?.UpdatedAt ?? user.UpdatedAt
        };
    }
}
