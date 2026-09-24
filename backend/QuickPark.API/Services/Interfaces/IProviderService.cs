using QuickPark.API.DTOs.Providers;

namespace QuickPark.API.Services.Interfaces;

// Parking Owner account profile.
public interface IProviderService
{
    // Get the profile and verification status
    Task<ProviderProfileResponse> GetProfileAsync(Guid userId, CancellationToken ct = default);
}
