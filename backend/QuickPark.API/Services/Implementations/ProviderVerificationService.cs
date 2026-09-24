using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using QuickPark.API.Data;
using QuickPark.API.DTOs.Providers;
using QuickPark.API.Integrations.Storage;
using QuickPark.API.Models;
using QuickPark.API.Services.Interfaces;

namespace QuickPark.API.Services.Implementations;

// Parking Owner NIC verification
public class ProviderVerificationService : IProviderVerificationService
{
    private readonly AppDbContext _context;
    private readonly CloudinaryStorageClient _storage;

    public ProviderVerificationService(AppDbContext context, IConfiguration configuration)
    {
        _context = context;

        var cloudName = Resolve(configuration["Cloudinary:CloudName"], "CLOUDINARY_CLOUD_NAME");
        var apiKey = Resolve(configuration["Cloudinary:ApiKey"], "CLOUDINARY_API_KEY");
        var apiSecret = Resolve(configuration["Cloudinary:ApiSecret"], "CLOUDINARY_API_SECRET");
        var folder = Resolve(configuration["Cloudinary:Folder"], "CLOUDINARY_FOLDER", "quickpark/nic");

        _storage = new CloudinaryStorageClient(cloudName, apiKey, apiSecret, folder);
    }

    private static string Resolve(string? configValue, string envVar, string fallback = "")
    {
        if (!string.IsNullOrWhiteSpace(configValue)) return configValue!;
        var fromEnv = Environment.GetEnvironmentVariable(envVar);
        return string.IsNullOrWhiteSpace(fromEnv) ? fallback : fromEnv!;
    }

    // Store the NIC image and put the owner back into the queue as PENDING.
    public async Task<ProviderProfileResponse> UploadNicDocumentAsync(Guid userId, IFormFile file, CancellationToken ct = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new KeyNotFoundException("Parking Owner account not found.");

        if (user.Role != UserRole.PARKING_OWNER)
        {
            throw new InvalidOperationException("Only Parking Owner accounts can submit NIC verification.");
        }

        var validated = await DocumentFileValidator.ValidateAndReadAsync(file, "NIC document", ct);
        var bytes = validated.Bytes;

        var provider = await _context.ParkingProviders.FirstOrDefaultAsync(p => p.UserId == userId, ct);
        if (provider is { VerificationStatus: ProviderStatus.APPROVED })
        {
            throw new InvalidOperationException("Profile is already verified. Contact support to update your NIC document.");
        }

        var contentType = validated.ContentType;
        var extension = DocumentFileValidator.ExtensionFor(contentType);
        var fileName = $"nic_{userId:N}_{DateTime.UtcNow:yyyyMMddHHmmss}.{extension}";

        var upload = await _storage.UploadImageAsync(bytes, fileName, contentType, ct);

        var previousPublicId = provider?.NicDocumentPublicId;

        var isNew = provider == null;
        if (isNew)
        {
            provider = new ParkingProvider
            {
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };
            _context.ParkingProviders.Add(provider);
        }

        provider!.NicDocumentUrl = upload.SecureUrl;
        provider.NicDocumentPublicId = upload.PublicId;
        provider.NicDocumentContentType = contentType;
        provider.NicDocumentSize = bytes.Length;
        provider.NicSubmittedAt = DateTime.UtcNow;
        provider.VerificationStatus = ProviderStatus.PENDING;
        provider.VerificationRemarks = null;
        provider.VerifiedAt = null;
        provider.VerifiedBy = null;
        provider.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        if (!string.IsNullOrEmpty(previousPublicId) && previousPublicId != upload.PublicId)
        {
            try { await _storage.DestroyAsync(previousPublicId, ct); }
            catch { /* non-fatal: orphaned asset can be cleaned up later */ }
        }

        return ProviderProfileMapper.ToProfileResponse(user, provider);
    }

    // Record the admin's decision and remarks
    public async Task<ProviderProfileResponse> UpdateVerificationStatusAsync(
        Guid userId, ProviderStatus status, string? remarks, Guid adminUserId, CancellationToken ct = default)
    {
        if (status == ProviderStatus.PENDING)
        {
            throw new InvalidOperationException("Status can only be set to APPROVED or REJECTED.");
        }

        if (status == ProviderStatus.REJECTED && string.IsNullOrWhiteSpace(remarks))
        {
            throw new InvalidOperationException("Remarks are required when rejecting a verification.");
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new KeyNotFoundException("Parking Owner account not found.");

        var provider = await _context.ParkingProviders.FirstOrDefaultAsync(p => p.UserId == userId, ct)
            ?? throw new KeyNotFoundException("No verification submission found for this Parking Owner.");

        if (string.IsNullOrEmpty(provider.NicDocumentUrl))
        {
            throw new InvalidOperationException("This Parking Owner has not uploaded a NIC document yet.");
        }

        provider.VerificationStatus = status;
        provider.VerificationRemarks = remarks?.Trim();
        provider.VerifiedAt = DateTime.UtcNow;
        provider.VerifiedBy = adminUserId;
        provider.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        return ProviderProfileMapper.ToProfileResponse(user, provider);
    }

    // The admin's verification queue, oldest submission first.
    public async Task<IReadOnlyList<ProviderProfileResponse>> GetPendingVerificationsAsync(CancellationToken ct = default)
    {
        var pending = await _context.ParkingProviders
            .Include(p => p.User)
            .Where(p => p.VerificationStatus == ProviderStatus.PENDING && p.NicDocumentUrl != null)
            .OrderBy(p => p.NicSubmittedAt)
            .ToListAsync(ct);

        return pending
            .Where(p => p.User != null)
            .Select(p => ProviderProfileMapper.ToProfileResponse(p.User!, p))
            .ToList();
    }

    // The stored NIC document URL
    public async Task<string?> GetNicDocumentUrlAsync(Guid userId, CancellationToken ct = default)
    {
        var provider = await _context.ParkingProviders.FirstOrDefaultAsync(p => p.UserId == userId, ct);
        return provider?.NicDocumentUrl;
    }
}
