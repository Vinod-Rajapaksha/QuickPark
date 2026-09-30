using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickPark.API.Services.Interfaces;
using QuickPark.API.Helpers;

namespace QuickPark.API.Controllers;

[ApiController]
[Route("api/staff")]
[Authorize(Roles = "PARKING_STAFF")]
public class StaffController : ControllerBase
{
    private readonly IStaffService _staffService;

    public StaffController(
        IStaffService staffService)
    {
        _staffService = staffService;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetProfile()
    {

        if (!this.TryGetUserId(out var userId))
            return Unauthorized();

        var profile =
            await _staffService.GetMyProfileAsync(userId);

        if (profile == null)
            return NotFound();

        return Ok(profile);

    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard(
    CancellationToken ct)
    {

        if (!this.TryGetUserId(out var userId))
            return Unauthorized();

        return Ok(
            await _staffService
            .GetDashboardAsync(
                userId,
                ct));
    }

}