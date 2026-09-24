using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickPark.API.DTOs.Slots;
using QuickPark.API.Helpers;
using QuickPark.API.Services.Interfaces;

namespace QuickPark.API.Controllers;

// The owner's bay board and bay states.
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "PARKING_OWNER")]
[Tags("Parking slots")]
public class ParkingSlotsController : ControllerBase
{
    private readonly IParkingService _parkingService;

    public ParkingSlotsController(IParkingService parkingService)
    {
        _parkingService = parkingService;
    }

    [HttpGet("provider/facilities/{facilityId:guid}")]
    [EndpointSummary("List one property's bays for the owner")]
    [ProducesResponseType(typeof(ProviderSlotBoardResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBoard(
        Guid facilityId, [FromQuery] Guid? vehicleTypeId, [FromQuery] string? status,
        [FromQuery] DateTime? from, [FromQuery] DateTime? to, CancellationToken ct)
    {
        if (!this.TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            return Ok(await _parkingService.GetProviderSlotBoardAsync(
                userId, facilityId, vehicleTypeId, status, from, to, ct));
        }

        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }

    [HttpGet("provider/slots/{slotId:guid}")]
    [EndpointSummary("Read one bay with its current and upcoming bookings")]
    [ProducesResponseType(typeof(ProviderSlotDetailsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSlot(Guid slotId, CancellationToken ct)
    {
        if (!this.TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            return Ok(await _parkingService.GetProviderSlotAsync(userId, slotId, ct));
        }

        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }

    [HttpPatch("provider/slots/{slotId:guid}/status")]
    [EndpointSummary("Put a bay on maintenance, retire it, or bring it back")]
    [ProducesResponseType(typeof(ProviderSlotRowResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateSlotStatus(
        Guid slotId, [FromBody] UpdateSlotRequest request, CancellationToken ct)
    {
        if (!this.TryGetUserId(out var userId)) return Unauthorized();

        try
        {
            return Ok(await _parkingService.UpdateSlotStatusAsync(userId, slotId, request, ct));
        }

        catch (Exception ex)
        {
            return this.FromException(ex);
        }
    }
}
