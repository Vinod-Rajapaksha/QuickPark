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
[Authorize(Roles = "PLATFORM_ADMIN")]
public class CommissionController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public CommissionController(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    private IReportService Reports() => new ReportService(_context);

    private IPaymentService Payments() => new PaymentService(_context, _configuration);

    // §21: the commission book.
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<CommissionLineResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCommissions([FromQuery] string? status, CancellationToken ct)
    {
        if (!this.TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            return Ok(await Reports().GetPlatformCommissionsAsync(userId, status, ct));
        }
        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }

    
    [HttpPost("{paymentId:guid}/cash-commission/settle")]
    [EndpointSummary("Mark the commission on a cash booking as collected from the owner")]
    [ProducesResponseType(typeof(PaymentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SettleCashCommission(
        Guid paymentId, [FromBody] SettleCommissionRequest? request, CancellationToken ct)
    {
        if (!this.TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            return Ok(await Payments().SettleCashCommissionAsync(userId, paymentId, request, ct));
        }
        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }
}
