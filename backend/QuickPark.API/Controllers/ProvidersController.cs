using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickPark.API.DTOs.Providers;
using QuickPark.API.Models;
using QuickPark.API.Services.Interfaces;

namespace QuickPark.API.Controllers;

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

    // ---- Parking Owner (self-service) ----

    [HttpGet("me")]
    [Authorize(Roles = OwnerRole)]
    public async Task<IActionResult> GetMyProfile(CancellationToken ct)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

        try
        {
            var profile = await _providerService.GetProfileAsync(userId, ct);
            return Ok(profile);
        }
        catch (Exception ex)
        {
            return FromException(ex);
        }
    }

    [HttpPost("me/nic")]
    [Authorize(Roles = OwnerRole)]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<IActionResult> UploadMyNic([FromForm] IFormFile file, CancellationToken ct)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

        try
        {
            var profile = await _providerService.UploadNicDocumentAsync(userId, file, ct);
            return Ok(profile);
        }
        catch (Exception ex)
        {
            return FromException(ex);
        }
    }

    [HttpGet("me/nic-document")]
    [Authorize(Roles = OwnerRole)]
    public async Task<IActionResult> GetMyNicDocument(CancellationToken ct)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

        var url = await _providerService.GetNicDocumentUrlAsync(userId, ct);
        if (string.IsNullOrEmpty(url))
        {
            return NotFound(new { message = "No NIC document has been uploaded." });
        }

        return Ok(new { url });
    }

    // ---- Platform Admin (verification management) ----

    [HttpGet("pending")]
    [Authorize(Roles = AdminRole)]
    public async Task<IActionResult> GetPendingVerifications(CancellationToken ct)
    {
        var providers = await _providerService.GetPendingVerificationsAsync(ct);
        return Ok(providers);
    }

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
            return FromException(ex);
        }
    }

    [HttpGet("{userId:guid}/nic-document")]
    [Authorize(Roles = AdminRole)]
    public async Task<IActionResult> GetProviderNicDocument(Guid userId, CancellationToken ct)
    {
        var url = await _providerService.GetNicDocumentUrlAsync(userId, ct);
        if (string.IsNullOrEmpty(url))
        {
            return NotFound(new { message = "No NIC document has been uploaded." });
        }

        return Ok(new { url });
    }

    [HttpPut("{userId:guid}/verification-status")]
    [Authorize(Roles = AdminRole)]
    public async Task<IActionResult> UpdateVerificationStatus(
        Guid userId, [FromBody] UpdateVerificationStatusRequest request, CancellationToken ct)
    {
        if (!TryGetCurrentUserId(out var adminId)) return Unauthorized();

        if (!Enum.TryParse<ProviderStatus>(request.Status, ignoreCase: true, out var status))
        {
            return BadRequest(new { message = "Status must be either APPROVED or REJECTED." });
        }

        try
        {
            var profile = await _providerService.UpdateVerificationStatusAsync(userId, status, request.Remarks, adminId, ct);
            return Ok(profile);
        }
        catch (Exception ex)
        {
            return FromException(ex);
        }
    }

    // ---- Helpers ----

    private bool TryGetCurrentUserId(out Guid userId)
    {
        userId = Guid.Empty;
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(value, out userId);
    }

    private IActionResult FromException(Exception ex) => ex switch
    {
        KeyNotFoundException => NotFound(new { message = ex.Message }),
        UnauthorizedAccessException => Unauthorized(new { message = ex.Message }),
        InvalidOperationException => BadRequest(new { message = ex.Message }),
        _ => StatusCode(StatusCodes.Status500InternalServerError, new { message = "An unexpected error occurred." })
    };
}
