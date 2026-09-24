using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickPark.API.DTOs.Parking;
using QuickPark.API.Enums;
using QuickPark.API.Helpers;
using QuickPark.API.Services.Interfaces;

namespace QuickPark.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ParkingFacilitiesController : ControllerBase
{
    private const string OwnerRole = "PARKING_OWNER";
    private const string AdminRole = "PLATFORM_ADMIN";

    private readonly IParkingService _parkingService;

    public ParkingFacilitiesController(IParkingService parkingService)
    {
        _parkingService = parkingService;
    }

    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] ParkingSearchRequest request, CancellationToken ct)
    {
        try
        {
            var facilities = await _parkingService.SearchApprovedAsync(request, ct);
            return Ok(facilities);
        }

        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        try
        {
            var facility = await _parkingService.GetApprovedFacilityAsync(id, ct);
            return facility == null
                ? NotFound(new { message = "Approved parking property not found." })
                : Ok(facility);
        }

        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }

    // Slot availability for an approved property.
    [HttpGet("{id:guid}/slots")]
    public async Task<IActionResult> GetSlots(
        Guid id, [FromQuery] Guid? vehicleTypeId,
        [FromQuery] DateTime? from, [FromQuery] DateTime? to, CancellationToken ct)
    {
        try
        {
            var slots = await _parkingService.GetFacilitySlotsAsync(id, vehicleTypeId, from, to, ct);
            return Ok(slots);
        }

        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }

    [HttpGet("me")]
    [Authorize(Roles = OwnerRole)]
    public async Task<IActionResult> GetMyFacilities(CancellationToken ct)
    {
        if (!this.TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            var facilities = await _parkingService.GetProviderFacilitiesAsync(userId, ct);
            return Ok(facilities);
        }

        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }

    [HttpPost]
    [Authorize(Roles = OwnerRole)]
    public async Task<IActionResult> Create([FromBody] CreateParkingRequest request, CancellationToken ct)
    {
        if (!this.TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            var facility = await _parkingService.CreateFacilityAsync(userId, request, ct);
            return StatusCode(StatusCodes.Status201Created, facility);
        }

        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = OwnerRole)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateParkingRequest request, CancellationToken ct)
    {
        if (!this.TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            var facility = await _parkingService.UpdateFacilityAsync(userId, id, request, ct);
            return Ok(facility);
        }

        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }

    [HttpGet("{id:guid}/documents")]
    [Authorize(Roles = OwnerRole)]
    public async Task<IActionResult> GetDocuments(Guid id, CancellationToken ct)
    {
        if (!this.TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            var documents = await _parkingService.GetFacilityDocumentsAsync(userId, id, ct);
            return Ok(documents);
        }

        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }

    [HttpPost("{id:guid}/documents")]
    [Authorize(Roles = OwnerRole)]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<IActionResult> UploadDocument(
        Guid id, [FromForm] string? documentType, IFormFile? file, CancellationToken ct)
    {
        if (!this.TryGetUserId(out var userId)) return Unauthorized();

        if (!Enum.TryParse<FacilityDocumentType>(documentType, ignoreCase: true, out var type) ||
            !Enum.IsDefined(type))
        {
            return BadRequest(new
            {
                message = "documentType must be one of LAND_DOCUMENT, LAND_OWNER_NIC, VERIFIED_DEED, " +
                          "PROPERTY_PHOTO, SLOT_SKETCH."
            });
        }

        try
        {
            var document = await _parkingService.UploadDocumentAsync(userId, id, type, file, ct);
            return StatusCode(StatusCodes.Status201Created, document);
        }

        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }

    [HttpDelete("documents/{documentId:guid}")]
    [Authorize(Roles = OwnerRole)]
    public async Task<IActionResult> DeleteDocument(Guid documentId, CancellationToken ct)
    {
        if (!this.TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            await _parkingService.DeleteDocumentAsync(userId, documentId, ct);
            return NoContent();
        }

        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }

    [HttpGet("registration-options")]
    [Authorize(Roles = OwnerRole)]
    public async Task<IActionResult> GetRegistrationOptions(CancellationToken ct)
    {
        try
        {
            var options = await _parkingService.GetRegistrationOptionsAsync(ct);
            return Ok(options);
        }

        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }

    [HttpPut("{id:guid}/allocations")]
    [Authorize(Roles = OwnerRole)]
    public async Task<IActionResult> SaveAllocations(
        Guid id, [FromBody] SaveAllocationsRequest request, CancellationToken ct)
    {
        if (!this.TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            var facility = await _parkingService.SaveAllocationsAsync(userId, id, request, ct);
            return Ok(facility);
        }

        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }

    [HttpPost("{id:guid}/submit")]
    [Authorize(Roles = OwnerRole)]
    public async Task<IActionResult> SubmitForReview(Guid id, CancellationToken ct)
    {
        if (!this.TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            var facility = await _parkingService.SubmitForReviewAsync(userId, id, ct);
            return Ok(facility);
        }

        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }

    [HttpGet("admin/pending")]
    [Authorize(Roles = AdminRole)]
    public async Task<IActionResult> GetPendingFacilities(CancellationToken ct)
    {
        try
        {
            var facilities = await _parkingService.GetFacilitiesForReviewAsync(
                ParkingStatus.PENDING_APPROVAL, null, ct);
            return Ok(facilities);
        }

        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }

    [HttpGet("admin")]
    [Authorize(Roles = AdminRole)]
    public async Task<IActionResult> GetFacilitiesForReview(
        [FromQuery] string? status, [FromQuery] string? provider, CancellationToken ct)
    {
        ParkingStatus? parsed = null;
        if (!string.IsNullOrWhiteSpace(status))
        {
            if (!Enum.TryParse<ParkingStatus>(status, ignoreCase: true, out var value) || !Enum.IsDefined(value))
            {
                return BadRequest(new
                {
                    message = "status must be one of DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, SUSPENDED."
                });
            }

            parsed = value;
        }

        try
        {
            var facilities = await _parkingService.GetFacilitiesForReviewAsync(parsed, provider, ct);
            return Ok(facilities);
        }

        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }

    [HttpPost("admin/owner-identity/sync")]
    [Authorize(Roles = AdminRole)]
    public async Task<IActionResult> SyncOwnerIdentity(
        [FromQuery] Guid providerUserId, CancellationToken ct)
    {
        try
        {
            var result = await _parkingService.SyncProviderIdentityAsync(providerUserId, ct);
            return Ok(result);
        }

        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }

    [HttpGet("admin/{id:guid}")]
    [Authorize(Roles = AdminRole)]
    public async Task<IActionResult> GetFacilityForReview(Guid id, CancellationToken ct)
    {
        try
        {
            var review = await _parkingService.GetFacilityReviewAsync(id, ct);
            return review == null
                ? NotFound(new { message = "Parking property not found." })
                : Ok(review);
        }

        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }

    [HttpPut("admin/{id:guid}")]
    [Authorize(Roles = AdminRole)]
    public async Task<IActionResult> ReviewFacility(
        Guid id, [FromBody] ReviewFacilityRequest request, CancellationToken ct)
    {
        if (!this.TryGetUserId(out var adminId)) return Unauthorized();

        if (!Enum.TryParse<ParkingStatus>(request.Decision, ignoreCase: true, out var decision) ||
            !Enum.IsDefined(decision))
        {
            return BadRequest(new { message = "Decision must be either APPROVED or REJECTED." });
        }

        try
        {
            var facility = await _parkingService.ReviewFacilityAsync(
                adminId, id, decision, request.RejectionReason, ct);
            return Ok(facility);
        }

        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }

    // Review an individual registration section.
    [HttpPut("admin/{id:guid}/sections/{section}")]
    [Authorize(Roles = AdminRole)]
    public async Task<IActionResult> ReviewFacilitySection(
        Guid id, string section, [FromBody] ReviewFacilitySectionRequest request, CancellationToken ct)
    {
        if (!this.TryGetUserId(out var adminId)) return Unauthorized();

        if (!Enum.TryParse<FacilitySection>(section, ignoreCase: true, out var parsed) ||
            !Enum.IsDefined(parsed))
        {
            return BadRequest(new
            {
                message = "section must be one of BASIC_INFORMATION, PROPERTY_LOCATION, DOCUMENTS, PRICING."
            });
        }

        if (!Enum.TryParse<ParkingStatus>(request.Decision, ignoreCase: true, out var decision) ||
            !Enum.IsDefined(decision))
        {
            return BadRequest(new { message = "Decision must be either APPROVED or REJECTED." });
        }

        try
        {
            var facility = await _parkingService.ReviewFacilitySectionAsync(
                adminId, id, parsed, decision, request.Remarks, ct);
            return Ok(facility);
        }

        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }
}
