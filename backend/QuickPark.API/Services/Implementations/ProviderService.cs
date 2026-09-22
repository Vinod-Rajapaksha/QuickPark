using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using QuickPark.API.Data;
using QuickPark.API.DTOs.Providers;
using QuickPark.API.Integrations.Storage;
using QuickPark.API.Models;
using QuickPark.API.Services.Interfaces;

namespace QuickPark.API.Services.Implementations;

public class ProviderService : IProviderService
{
    private readonly AppDbContext _context;
    private readonly CloudinaryStorageClient _storage;

    public ProviderService(AppDbContext context, IConfiguration configuration)
    {
        _context = context;

        // Read Cloudinary settings from configuration (e.g. appsettings.Local.json, which is git-ignored)
        // with an environment-variable fallback. Never hardcode secrets in source.
        var cloudName = Resolve(configuration["Cloudinary:CloudName"], "CLOUDINARY_CLOUD_NAME");
        var apiKey = Resolve(configuration["Cloudinary:ApiKey"], "CLOUDINARY_API_KEY");
        var apiSecret = Resolve(configuration["Cloudinary:ApiSecret"], "CLOUDINARY_API_SECRET");
        var folder = Resolve(configuration["Cloudinary:Folder"], "CLOUDINARY_FOLDER", "quickpark/nic");

        _storage = new CloudinaryStorageClient(cloudName, apiKey, apiSecret, folder);
    }

    // Prefer an explicit config value; fall back to an environment variable when it is missing or blank.
    private static string Resolve(string? configValue, string envVar, string fallback = "")
    {
        if (!string.IsNullOrWhiteSpace(configValue)) return configValue!;
        var fromEnv = Environment.GetEnvironmentVariable(envVar);
        return string.IsNullOrWhiteSpace(fromEnv) ? fallback : fromEnv!;
    }

    public async Task<ProviderProfileResponse> GetProfileAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new KeyNotFoundException("Parking Owner account not found.");

        var provider = await _context.ParkingProviders.FirstOrDefaultAsync(p => p.UserId == userId, ct);
        return MapToResponse(user, provider);
    }

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

        // Best-effort cleanup of the previous sensitive document.
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

        return MapToResponse(user, provider);
    }

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

        return MapToResponse(user, provider);
    }

    public async Task<IReadOnlyList<ProviderProfileResponse>> GetPendingVerificationsAsync(CancellationToken ct = default)
    {
        var pending = await _context.ParkingProviders
            .Include(p => p.User)
            .Where(p => p.VerificationStatus == ProviderStatus.PENDING && p.NicDocumentUrl != null)
            .OrderBy(p => p.NicSubmittedAt)
            .ToListAsync(ct);

        return pending
            .Where(p => p.User != null)
            .Select(p => MapToResponse(p.User!, p))
            .ToList();
    }

    public async Task<string?> GetNicDocumentUrlAsync(Guid userId, CancellationToken ct = default)
    {
        var provider = await _context.ParkingProviders.FirstOrDefaultAsync(p => p.UserId == userId, ct);
        return provider?.NicDocumentUrl;
    }

    private static ProviderProfileResponse MapToResponse(User user, ParkingProvider? provider)
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
