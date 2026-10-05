using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickPark.API.Helpers;
using QuickPark.API.Services.Interfaces;

namespace QuickPark.API.Controllers;

// Parking Owner profile API.
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProvidersController : ControllerBase
{
    private const string OwnerRole = "PARKING_OWNER";
    private const string AdminRole = "PLATFORM_ADMIN";

    private readonly IProviderService _providerService;

    public ProvidersController(IProviderService providerService)
    {
        _providerService = providerService;
    }

    // Get current parking owner's profile
    [HttpGet("me")]
    [Authorize(Roles = OwnerRole)]
    public async Task<IActionResult> GetMyProfile(CancellationToken ct)
    {
        if (!this.TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            var profile = await _providerService.GetProfileAsync(userId, ct);
            return Ok(profile);
        }
        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }

    // Get owner's profile by GUID for admin review.
    [HttpGet("{userId:guid}")]
    [Authorize(Roles = AdminRole)]
    public async Task<IActionResult> GetProviderProfile(Guid userId, CancellationToken ct)
    {
        try
        {
            var profile = await _providerService.GetProfileAsync(userId, ct);
            return Ok(profile);
        }
        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }
}
