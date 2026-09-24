using Microsoft.EntityFrameworkCore;
using QuickPark.API.Data;
using QuickPark.API.DTOs.Providers;
using QuickPark.API.Services.Interfaces;

namespace QuickPark.API.Services.Implementations;

public class ProviderService : IProviderService
{
    private readonly AppDbContext _context;

    public ProviderService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ProviderProfileResponse> GetProfileAsync(Guid userId, CancellationToken ct = default)
    {
        // Find the owner's account
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new KeyNotFoundException("Parking Owner account not found.");

        var provider = await _context.ParkingProviders.FirstOrDefaultAsync(p => p.UserId == userId, ct);
        // Combine user and provider data into the profile response.
        return ProviderProfileMapper.ToProfileResponse(user, provider);
    }
}
