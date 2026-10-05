using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickPark.API.DTOs.Reservations;
using QuickPark.API.Enums;
using QuickPark.API.Services.Interfaces;

namespace QuickPark.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReservationsController : ControllerBase
{
    private const string DriverRole = "DRIVER";
    private const string OwnerRole = "PARKING_OWNER";
    private const string StaffRole = "PARKING_STAFF";

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

    [HttpGet("price")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPrice(
        [FromQuery] Guid facilityId, [FromQuery] string vehicleType, [FromQuery] DateTime startTime, [FromQuery] DateTime endTime, CancellationToken ct)
    {
        try
        {
            var vehicleTypes = await _parkingService.GetVehicleTypesAsync(ct);
            var vt = vehicleTypes.FirstOrDefault(v => v.Name.Equals(vehicleType, StringComparison.OrdinalIgnoreCase));
            if (vt == null) return BadRequest(new { message = "Invalid vehicle type" });

            var price = await _parkingService.CalculatePriceAsync(facilityId, vt.Id, startTime, endTime, ct);
            return Ok(price);
        }
        catch (Exception ex)
        {
            return FromException(ex);
        }
    }

    [HttpGet("availability")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAvailability(
        [FromQuery] Guid facilityId, [FromQuery] string vehicleType, [FromQuery] DateTime startTime, [FromQuery] DateTime endTime, CancellationToken ct)
    {
        try
        {
            var vehicleTypes = await _parkingService.GetVehicleTypesAsync(ct);
            var vt = vehicleTypes.FirstOrDefault(v => v.Name.Equals(vehicleType, StringComparison.OrdinalIgnoreCase));
            if (vt == null) return BadRequest(new { message = "Invalid vehicle type" });

            var availability = await _parkingService.CheckAvailabilityAsync(facilityId, vt.Id, startTime, endTime, ct);
            return Ok(availability);
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

    [HttpGet("provider")]
    [Authorize(Roles = OwnerRole + "," + StaffRole)]
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

    [HttpPost("{id:guid}/approve")]
    [Authorize(Roles = OwnerRole)]
    [EndpointSummary("Approve a pending reservation by provider")]
    [ProducesResponseType(typeof(ReservationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Approve(Guid id, CancellationToken ct)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

        try
        {
            var reservation = await _parkingService.ApproveReservationAsync(userId, id, ct);
            return Ok(reservation);
        }
        catch (Exception ex)
        {
            return FromException(ex);
        }
    }

    [HttpPost("{id:guid}/reject")]
    [Authorize(Roles = OwnerRole)]
    [EndpointSummary("Reject a pending reservation by provider")]
    [ProducesResponseType(typeof(ReservationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Reject(
        Guid id, [FromBody] CancelReservationRequest? request, CancellationToken ct)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

        try
        {
            var reservation = await _parkingService.CancelReservationAsync(userId, id, request?.Reason, ct);
            return Ok(reservation);
        }
        catch (Exception ex)
        {
            return FromException(ex);
        }
    }

    [HttpPost("{id:guid}/message")]
    [Authorize(Roles = OwnerRole)]
    [EndpointSummary("Send a message to the driver via Agent")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SendMessage(
        Guid id, [FromBody] QuickPark.API.DTOs.Reservations.SendProviderMessageRequest request, CancellationToken ct)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

        try
        {
            await _parkingService.SendProviderMessageAsync(userId, id, request.Message, ct);
            return Ok();
        }
        catch (Exception ex)
        {
            return FromException(ex);
        }
    }

    [HttpPost("{id:guid}/check-in")]
    [Authorize(Roles = OwnerRole + "," + StaffRole)]
    [EndpointSummary("Check-in a confirmed reservation")]
    [ProducesResponseType(typeof(ReservationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CheckIn(Guid id, CancellationToken ct)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

        try
        {
            var reservation = await _parkingService.CheckInAsync(userId, id, ct);
            return Ok(reservation);
        }
        catch (Exception ex)
        {
            return FromException(ex);
        }
    }

    [HttpPost("{id:guid}/check-out")]
    [Authorize(Roles = OwnerRole + "," + StaffRole)]
    [EndpointSummary("Check-out a checked-in reservation")]
    [ProducesResponseType(typeof(ReservationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CheckOut(Guid id, CancellationToken ct)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

        try
        {
            var reservation = await _parkingService.CheckOutAsync(userId, id, ct);
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

                message = "status must be one of PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT, COMPLETED, CANCELLED, NOSHOW."

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
