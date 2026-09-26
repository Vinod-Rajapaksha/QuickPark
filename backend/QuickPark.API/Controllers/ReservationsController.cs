using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickPark.API.DTOs.Reservations;
using QuickPark.API.Enums;
using QuickPark.API.Services.Interfaces;

namespace QuickPark.API.Controllers;

// It runs on IParkingService because that service
// owns the approved facilities, generated slots and per-vehicle-type rates a booking needs.
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReservationsController : ControllerBase
{
    private const string DriverRole = "DRIVER";
    private const string OwnerRole = "PARKING_OWNER";

    private readonly IParkingService _parkingService;

    public ReservationsController(IParkingService parkingService)
    {
        _parkingService = parkingService;
    }

    [HttpPost]
    [Authorize(Roles = DriverRole)]
    public async Task<IActionResult> Create([FromBody] CreateReservationRequest request, CancellationToken ct)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

        try
        {
            var reservation = await _parkingService.CreateReservationAsync(userId, request, ct);
            return StatusCode(StatusCodes.Status201Created, reservation);
        }
        catch (Exception ex)
        {
            return FromException(ex);
        }
    }

    [HttpGet("me")]
    [Authorize(Roles = DriverRole)]
    public async Task<IActionResult> GetMyReservations(
        [FromQuery] string? status, [FromQuery] DateTime? from, [FromQuery] DateTime? to, CancellationToken ct)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

        if (!TryParseStatus(status, out var parsed, out var error)) return error!;

        try
        {
            var reservations = await _parkingService.GetDriverReservationsAsync(userId, parsed, from, to, ct);
            return Ok(reservations);
        }
        catch (Exception ex)
        {
            return FromException(ex);
        }
    }

    // Parking Owner booking list, optionally narrowed to one property.
    [HttpGet("provider")]
    [Authorize(Roles = OwnerRole)]
    public async Task<IActionResult> GetProviderReservations(
        [FromQuery] Guid? facilityId, [FromQuery] string? status,
        [FromQuery] DateTime? from, [FromQuery] DateTime? to, CancellationToken ct)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

        if (!TryParseStatus(status, out var parsed, out var error)) return error!;

        try
        {
            var reservations = await _parkingService.GetProviderReservationsAsync(
                userId, facilityId, parsed, from, to, ct);
            return Ok(reservations);
        }
        catch (Exception ex)
        {
            return FromException(ex);
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

        try
        {
            var reservation = await _parkingService.GetReservationAsync(userId, id, ct);
            return reservation == null
                ? NotFound(new { message = "Reservation not found." })
                : Ok(reservation);
        }
        catch (Exception ex)
        {
            return FromException(ex);
        }
    }

    // Both the driver and the owner end a booking here, and the row is never deleted — it
    // keeps the reason, who ended it and when, so the history still adds up.
    [HttpPost("{id:guid}/cancel")]
    [EndpointSummary("Cancel a booking and free its bay")]
    [ProducesResponseType(typeof(ReservationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Cancel(
        Guid id, [FromBody] CancelReservationRequest? request, CancellationToken ct)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

        try
        {
            var reservation = await _parkingService.CancelReservationAsync(
                userId, id, request?.Reason, ct);
            return Ok(reservation);
        }
        catch (Exception ex)
        {
            return FromException(ex);
        }
    }

    // ---- Helpers ----

    private bool TryParseStatus(string? status, out ReservationStatus? parsed, out IActionResult? error)
    {
        parsed = null;
        error = null;

        if (string.IsNullOrWhiteSpace(status)) return true;

        if (!Enum.TryParse<ReservationStatus>(status, ignoreCase: true, out var value) ||
            !Enum.IsDefined(value))
        {
            error = BadRequest(new
            {
                message = "status must be one of PENDING, CONFIRMED, CANCELLED, COMPLETED, NOSHOW."
            });
            return false;
        }

        parsed = value;
        return true;
    }

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
