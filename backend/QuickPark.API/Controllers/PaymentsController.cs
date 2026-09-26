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
public class PaymentsController : ControllerBase
{
    private const string DriverRole = "DRIVER";
    private const string OwnerRole = "PARKING_OWNER";
    private const string AdminRole = "PLATFORM_ADMIN";

    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public PaymentsController(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    private IPaymentService Payments() => new PaymentService(_context, _configuration);

    [HttpPost("create")]
    [Authorize(Roles = DriverRole)]
    [EndpointSummary("Open a card or cash payment for one of your bookings")]
    [ProducesResponseType(typeof(PaymentResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Create([FromBody] CreatePaymentRequest request, CancellationToken ct)
    {
        if (!this.TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            var payment = await Payments().CreateAsync(userId, request, ct);
            return StatusCode(StatusCodes.Status201Created, payment);
        }
        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }

    [HttpPost("card/checkout")]
    [Authorize(Roles = DriverRole)]
    [EndpointSummary("Run a card through the sandbox gateway")]
    [ProducesResponseType(typeof(CardCheckoutResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CheckoutCard(
        [FromBody] CardCheckoutRequest request, CancellationToken ct)
    {
        if (!this.TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            return Ok(await Payments().CheckoutCardAsync(userId, request, ct));
        }
        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }

    [HttpPost("card/confirm")]
    [Authorize(Roles = DriverRole)]
    [EndpointSummary("Settle a card payment from the gateway's signed confirmation")]
    [ProducesResponseType(typeof(PaymentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ConfirmCard(
        [FromBody] ConfirmCardPaymentRequest request, CancellationToken ct)
    {
        if (!this.TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            return Ok(await Payments().ConfirmCardAsync(userId, request, ct));
        }
        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }

    [HttpPost("webhook")]
    [AllowAnonymous]
    [EndpointSummary("Receive the gateway's payment confirmation")]
    [ProducesResponseType(typeof(PaymentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Webhook(
        [FromBody] ConfirmCardPaymentRequest? request, CancellationToken ct)
    {
        try
        {
            return Ok(await Payments().HandleGatewayCallbackAsync(request?.CallbackToken, ct));
        }
        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }

    [HttpPost("{paymentId:guid}/cash/confirm")]
    [Authorize(Roles = OwnerRole)]
    [EndpointSummary("Confirm that a driver paid you cash for one of your bookings")]
    [ProducesResponseType(typeof(PaymentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ConfirmCash(
        Guid paymentId, [FromBody] CashConfirmationRequest? request, CancellationToken ct)
    {
        if (!this.TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            return Ok(await Payments().ConfirmCashAsync(userId, paymentId, request, ct));
        }
        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }

    [HttpPost("{paymentId:guid}/refund")]
    [Authorize(Roles = AdminRole)]
    [EndpointSummary("Refund a paid payment and reverse the money it produced")]
    [ProducesResponseType(typeof(PaymentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Refund(
        Guid paymentId, [FromBody] RefundPaymentRequest? request, CancellationToken ct)
    {
        if (!this.TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            return Ok(await Payments().RefundAsync(userId, paymentId, request, ct));
        }
        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }

    [HttpGet("{paymentId:guid}")]
    [ProducesResponseType(typeof(PaymentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid paymentId, CancellationToken ct)
    {
        if (!this.TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            var payment = await Payments().GetAsync(userId, paymentId, ct);
            return payment == null
                ? NotFound(new { message = "Payment not found." })
                : Ok(payment);
        }
        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }

    [HttpGet("reservation/{reservationId:guid}")]
    [ProducesResponseType(typeof(PaymentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetForReservation(Guid reservationId, CancellationToken ct)
    {
        if (!this.TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            var payment = await Payments().GetForReservationAsync(userId, reservationId, ct);
            return payment == null
                ? NotFound(new { message = "No payment has been opened for this booking." })
                : Ok(payment);
        }
        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }

    [HttpGet("me")]
    [Authorize(Roles = DriverRole)]
    public async Task<IActionResult> GetMyPayments([FromQuery] PaymentFilter? filter, CancellationToken ct)
    {
        if (!this.TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            return Ok(await Payments().ListForDriverAsync(userId, filter, ct));
        }
        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }

    [HttpGet("provider")]
    [Authorize(Roles = OwnerRole)]
    public async Task<IActionResult> GetProviderPayments([FromQuery] PaymentFilter? filter, CancellationToken ct)
    {
        if (!this.TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            return Ok(await Payments().ListForProviderAsync(userId, filter, ct));
        }
        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }

    [HttpGet("admin")]
    [Authorize(Roles = AdminRole)]
    public async Task<IActionResult> GetAdminPayments([FromQuery] PaymentFilter? filter, CancellationToken ct)
    {
        try
        {
            return Ok(await Payments().ListForAdminAsync(filter, ct));
        }
        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }
}
