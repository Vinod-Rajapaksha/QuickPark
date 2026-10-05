using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickPark.API.DTOs.Staff;
using QuickPark.API.Services.Interfaces;
using QuickPark.API.Helpers;

namespace QuickPark.API.Controllers;

[ApiController]
[Route("api/provider/staff")]
[Authorize(Roles = "PARKING_OWNER")]
public class ProviderStaffController : ControllerBase
{
    private readonly IStaffService _staffService;

    public ProviderStaffController(
        IStaffService staffService)
    {
        _staffService = staffService;
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateStaffRequest request)
    {

        if (!this.TryGetUserId(out var userId))
            return Unauthorized();
        try
        {
            var result =
                await _staffService.CreateStaffAsync(
                    userId,
                    request);

            return StatusCode(
                StatusCodes.Status201Created,
                result);

        }
        catch (Exception ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }

    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {

        if (!this.TryGetUserId(out var userId))
            return Unauthorized();
        try
        {
            return Ok(
                await _staffService.GetProviderStaffAsync(userId));
        }
        catch (Exception ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }

    }

    [HttpPut("{staffId:guid}")]
    public async Task<IActionResult> Update(
        Guid staffId,
        [FromBody] UpdateStaffRequest request)
    {
        if (!this.TryGetUserId(out var userId))
            return Unauthorized();
        try
        {
            var result = await _staffService.UpdateStaffAsync(
                userId,
                staffId,
                request);

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("{staffId:guid}/status")]
    public async Task<IActionResult> UpdateStatus(
        Guid staffId,
        [FromBody] UpdateStaffStatusRequest request)
    {

        if (!this.TryGetUserId(out var userId))
            return Unauthorized();
        try
        {
            await _staffService.UpdateStatusAsync(
                userId,
                staffId,
                request.IsActive);

            return Ok(new
            {
                message = "Staff status updated"
            });

        }
        catch (Exception ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }

    }

    [HttpPatch("{staffId:guid}/assignment")]
    public async Task<IActionResult> UpdateAssignment(
        Guid staffId,
        [FromBody] UpdateStaffAssignmentRequest request)
    {

        if (!this.TryGetUserId(out var userId))
            return Unauthorized();
        try
        {
            await _staffService.UpdateAssignmentAsync(
                userId,
                staffId,
                request.FacilityId);

            return Ok(new
            {
                message = "Staff branch updated"
            });

        }
        catch (Exception ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }

    }

}