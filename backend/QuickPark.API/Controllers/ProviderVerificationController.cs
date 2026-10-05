using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickPark.API.DTOs.Providers;
using QuickPark.API.Helpers;
using QuickPark.API.Models;
using QuickPark.API.Services.Interfaces;

namespace QuickPark.API.Controllers;

// Parking Owner NIC verification API. 
[ApiController]
[Route("api/providers")]
[Authorize]
public class ProviderVerificationController : ControllerBase
{
    private const string OwnerRole = "PARKING_OWNER";
    private const string AdminRole = "PLATFORM_ADMIN";

    private readonly IProviderVerificationService _verificationService;

    public ProviderVerificationController(IProviderVerificationService verificationService)
    {
        _verificationService = verificationService;
    }

    // Upload  NIC and set status to PENDING
    [HttpPost("me/nic")]
    [Authorize(Roles = OwnerRole)]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<IActionResult> UploadMyNic([FromForm] IFormFile file, CancellationToken ct)
    {
        if (!this.TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            var profile = await _verificationService.UploadNicDocumentAsync(userId, file, ct);
            return Ok(profile);
        }
        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }

    // Get NIC image URL from Cloudinary
    [HttpGet("me/nic-document")]
    [Authorize(Roles = OwnerRole)]
    public async Task<IActionResult> GetMyNicDocument(CancellationToken ct)
    {
        if (!this.TryGetUserId(out var userId)) return Unauthorized();

        var url = await _verificationService.GetNicDocumentUrlAsync(userId, ct);
        if (string.IsNullOrEmpty(url))
        {
            return NotFound(new { message = "No NIC document has been uploaded." });
        }

        return Ok(new { url });
    }

    // Get pending owner NIC verification queue
    [HttpGet("pending")]
    [Authorize(Roles = AdminRole)]
    public async Task<IActionResult> GetPendingVerifications(CancellationToken ct)
    {
        var providers = await _verificationService.GetPendingVerificationsAsync(ct);
        return Ok(providers);
    }

    // Get the NIC document URL for review.
    [HttpGet("{userId:guid}/nic-document")]
    [Authorize(Roles = AdminRole)]
    public async Task<IActionResult> GetProviderNicDocument(Guid userId, CancellationToken ct)
    {
        var url = await _verificationService.GetNicDocumentUrlAsync(userId, ct);
        if (string.IsNullOrEmpty(url))
        {
            return NotFound(new { message = "No NIC document has been uploaded." });
        }

        return Ok(new { url });
    }

    // Approve or reject with remarks.
    [HttpPut("{userId:guid}/verification-status")]
    [Authorize(Roles = AdminRole)]
    public async Task<IActionResult> UpdateVerificationStatus(
        Guid userId, [FromBody] UpdateVerificationStatusRequest request, CancellationToken ct)
    {
        if (!this.TryGetUserId(out var adminId)) return Unauthorized();

        if (!Enum.TryParse<ProviderStatus>(request.Status, ignoreCase: true, out var status))
        {
            return BadRequest(new { message = "Status must be either APPROVED or REJECTED." });
        }

        try
        {
            var profile = await _verificationService.UpdateVerificationStatusAsync(
                userId, status, request.Remarks, adminId, ct);
            return Ok(profile);
        }
        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }
}
