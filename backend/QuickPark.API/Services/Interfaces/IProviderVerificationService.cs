using Microsoft.AspNetCore.Http;
using QuickPark.API.DTOs.Providers;
using QuickPark.API.Models;

namespace QuickPark.API.Services.Interfaces;

// NIC document verification
public interface IProviderVerificationService
{
    // Validate and store the owner's NIC document, status to PENDING.
    Task<ProviderProfileResponse> UploadNicDocumentAsync(Guid userId, IFormFile file, CancellationToken ct = default);

    // admin decision with remarks.
    Task<ProviderProfileResponse> UpdateVerificationStatusAsync(
        Guid userId, ProviderStatus status, string? remarks, Guid adminUserId, CancellationToken ct = default);

    // Every owner waiting in the verification queue, oldest submission first.
    Task<IReadOnlyList<ProviderProfileResponse>> GetPendingVerificationsAsync(CancellationToken ct = default);

    // Get the stored NIC document URL
    Task<string?> GetNicDocumentUrlAsync(Guid userId, CancellationToken ct = default);
}
