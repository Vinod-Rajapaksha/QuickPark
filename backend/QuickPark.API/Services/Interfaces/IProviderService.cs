using Microsoft.AspNetCore.Http;
using QuickPark.API.DTOs.Providers;
using QuickPark.API.Models;

namespace QuickPark.API.Services.Interfaces;

public interface IProviderService
{
    Task<ProviderProfileResponse> GetProfileAsync(Guid userId, CancellationToken ct = default);

    Task<ProviderProfileResponse> UploadNicDocumentAsync(Guid userId, IFormFile file, CancellationToken ct = default);

    Task<ProviderProfileResponse> UpdateVerificationStatusAsync(
        Guid userId, ProviderStatus status, string? remarks, Guid adminUserId, CancellationToken ct = default);

    Task<IReadOnlyList<ProviderProfileResponse>> GetPendingVerificationsAsync(CancellationToken ct = default);

    Task<string?> GetNicDocumentUrlAsync(Guid userId, CancellationToken ct = default);
}
