using Microsoft.EntityFrameworkCore;
using QuickPark.API.Data;
using QuickPark.API.Helpers;
using QuickPark.API.Models;

namespace QuickPark.API.Services.Implementations;

// Ownership and owner-verification gates, and the provider identity stamped onto owned rows.
public partial class ParkingService
{
    private async Task EnsureReservationAccessAsync(Guid userId, Reservation reservation, CancellationToken ct)
    {
        if (reservation.DriverUserId == userId) return;

        var provider = await _context.ParkingProviders.FirstOrDefaultAsync(p => p.UserId == userId, ct);

        if (provider == null || reservation.ProviderId != provider.Id)
        {
            throw new UnauthorizedAccessException("You can only view your own reservations.");
        }
    }

    private async Task EnsureFacilityBelongsToProviderAsync(
        ParkingProvider provider, Guid facilityId, CancellationToken ct)
    {
        var owns = await _context.Set<ParkingFacility>()
            .AnyAsync(f => f.Id == facilityId && f.ProviderId == provider.Id, ct);

        if (!owns)
        {
            throw new UnauthorizedAccessException("You can only manage your own parking properties.");
        }
    }

    private async Task<ParkingProvider> GetVerifiedProviderAsync(Guid providerUserId, CancellationToken ct)
    {
        var provider = await _context.ParkingProviders.FirstOrDefaultAsync(p => p.UserId == providerUserId, ct)
            ?? throw new InvalidOperationException("Upload and get your NIC verified before registering a parking property.");

        if (provider.VerificationStatus != ProviderStatus.APPROVED)
        {
            throw new InvalidOperationException("Your parking owner account is not verified yet.");
        }

        return provider;
    }

    private sealed record ProviderStamp(string Name, string Email, string? BusinessName);

    private const int MaxProviderNameLength = 150;
    private const int MaxProviderEmailLength = 256;
    private const int MaxProviderBusinessNameLength = 150;

    private async Task<ProviderStamp> LoadProviderStampAsync(Guid providerUserId, CancellationToken ct)
    {
        var account = await _context.ParkingProviders
            .Where(p => p.UserId == providerUserId)
            .Select(p => new
            {
                p.User!.FullName,
                p.User!.Email,
                p.BusinessName
            })
            .FirstOrDefaultAsync(ct)
            ?? throw new InvalidOperationException("Parking owner account not found.");

        return new ProviderStamp(
            account.FullName.ClampedTo(MaxProviderNameLength),
            account.Email.ClampedTo(MaxProviderEmailLength),
            account.BusinessName is string business
                ? business.ClampedTo(MaxProviderBusinessNameLength)
                : null);
    }

    private async Task<ParkingFacility> GetOwnedFacilityAsync(
        Guid providerUserId, Guid facilityId, CancellationToken ct)
    {
        var facility = await FacilitiesForResponse()
            .FirstOrDefaultAsync(f => f.Id == facilityId, ct)
            ?? throw new KeyNotFoundException("Parking property not found.");

        await EnsureOwnershipAsync(providerUserId, facility, ct);
        return facility;
    }

    private async Task EnsureOwnershipAsync(Guid providerUserId, ParkingFacility facility, CancellationToken ct)
    {
        var provider = await _context.ParkingProviders.FirstOrDefaultAsync(p => p.UserId == providerUserId, ct)
            ?? throw new UnauthorizedAccessException("You can only manage your own parking properties.");

        if (facility.ProviderId != provider.Id)
        {
            throw new UnauthorizedAccessException("You can only manage your own parking properties.");
        }
    }
}
