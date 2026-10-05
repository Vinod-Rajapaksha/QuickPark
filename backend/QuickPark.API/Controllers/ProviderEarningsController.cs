using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickPark.API.Data;
using QuickPark.API.DTOs.Payments;
using QuickPark.API.Helpers;
using QuickPark.API.Services.Implementations;
using QuickPark.API.Services.Interfaces;

namespace QuickPark.API.Controllers;

// The parking owner's money screens (§18, §19, §20): what the bookings at their properties came to,
// the statement behind the figures, the commission splits, and the cash commission they still owe
// the platform.
//
// There is no owner id in any of these routes. The account in the cookie selects the data, so an
// owner cannot ask for somebody else's takings by changing a parameter (§24).
//
// Read-only by design: nothing here can mark a payment as paid. Cash is confirmed on
// PaymentsController, and the numbers on this screen are what that wrote.
[ApiController]
[Route("api/provider")]
[Authorize(Roles = "PARKING_OWNER")]
public class ProviderEarningsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ProviderEarningsController(AppDbContext context)
    {
        _context = context;
    }

    private IReportService Reports() => new ReportService(_context);

    // §19: the dashboard totals. Card revenue is money the platform holds for the owner; cash
    // revenue is money the owner already has, and only its commission is owed here.
    [HttpGet("earnings")]
    [ProducesResponseType(typeof(ProviderEarningsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetEarnings(CancellationToken ct)
    {
        if (!this.TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            return Ok(await Reports().GetProviderEarningsAsync(userId, ct));
        }
        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }

    // §20: the transaction history, newest first, with the booking each line belongs to.
    [HttpGet("transactions")]
    [ProducesResponseType(typeof(IReadOnlyList<LedgerEntryResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTransactions([FromQuery] PaymentFilter? filter, CancellationToken ct)
    {
        if (!this.TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            return Ok(await Reports().GetProviderLedgerAsync(userId, filter, ct));
        }
        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }

    // §11: every split this owner's bookings produced, with the rate that was applied at the time
    // — which is the record that survives a later change to the admin's configuration (§25).
    [HttpGet("commissions")]
    [ProducesResponseType(typeof(IReadOnlyList<CommissionLineResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCommissions([FromQuery] string? status, CancellationToken ct)
    {
        if (!this.TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            return Ok(await Reports().GetProviderCommissionsAsync(userId, status, ct));
        }
        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }

    // §8: the cash bookings whose commission is still with the owner, as a list to work through.
    [HttpGet("cash-commission")]
    [ProducesResponseType(typeof(IReadOnlyList<CommissionLineResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCashCommission(CancellationToken ct)
    {
        if (!this.TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            return Ok(await Reports().GetCashCommissionDueAsync(userId, ct));
        }
        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }
}
