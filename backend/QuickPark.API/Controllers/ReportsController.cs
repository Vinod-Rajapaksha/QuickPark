using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickPark.API.Data;
using QuickPark.API.DTOs.Payments;
using QuickPark.API.Helpers;
using QuickPark.API.Services.Implementations;
using QuickPark.API.Services.Interfaces;

namespace QuickPark.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ReportsController(AppDbContext context)
    {
        _context = context;
    }

    private IReportService Reports() => new ReportService(_context);

    [HttpGet("provider")]
    [Authorize(Roles = "PARKING_OWNER")]
    [ProducesResponseType(typeof(RevenueOverviewResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetProviderRevenue(
        [FromQuery] DateTime? from, [FromQuery] DateTime? to,
        [FromQuery] bool byProperty, CancellationToken ct)
    {
        if (!this.TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            return Ok(await Reports().GetProviderRevenueAsync(userId, from, to, byProperty, ct));
        }
        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }

    [HttpGet("platform")]
    [Authorize(Roles = "PLATFORM_ADMIN")]
    [ProducesResponseType(typeof(RevenueOverviewResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetPlatformRevenue(
        [FromQuery] DateTime? from, [FromQuery] DateTime? to,
        [FromQuery] bool byProperty, CancellationToken ct)
    {
        try
        {
            return Ok(await Reports().GetPlatformRevenueAsync(from, to, byProperty, ct));
        }
        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }
}
