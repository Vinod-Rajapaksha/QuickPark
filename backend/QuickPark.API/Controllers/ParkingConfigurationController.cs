using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickPark.API.DTOs.Parking;
using QuickPark.API.Services.Interfaces;

namespace QuickPark.API.Controllers;

// Admin-managed master data.
[ApiController]
[Route("api/admin/parking-configuration")]
[Authorize(Roles = "PLATFORM_ADMIN")]
public class ParkingConfigurationController : ControllerBase
{
    private readonly IParkingService _parkingService;

    public ParkingConfigurationController(IParkingService parkingService)
    {
        _parkingService = parkingService;
    }

    [HttpGet("vehicle-types")]
    public async Task<IActionResult> GetVehicleTypes(CancellationToken ct)
    {
        try
        {
            return Ok(await _parkingService.GetVehicleTypesAsync(ct));
        }
        catch (Exception ex)
        {
            return FromException(ex);
        }
    }

    [HttpPost("vehicle-types")]
    public async Task<IActionResult> CreateVehicleType(
        [FromBody] SaveVehicleTypeRequest request, CancellationToken ct)
    {
        try
        {
            var vehicleType = await _parkingService.CreateVehicleTypeAsync(request, ct);
            return StatusCode(StatusCodes.Status201Created, vehicleType);
        }
        catch (Exception ex)
        {
            return FromException(ex);
        }
    }

    [HttpPut("vehicle-types/{id:guid}")]
    public async Task<IActionResult> UpdateVehicleType(
        Guid id, [FromBody] SaveVehicleTypeRequest request, CancellationToken ct)
    {
        try
        {
            return Ok(await _parkingService.UpdateVehicleTypeAsync(id, request, ct));
        }
        catch (Exception ex)
        {
            return FromException(ex);
        }
    }

    [HttpGet("pricing")]
    public async Task<IActionResult> GetVehiclePricing(CancellationToken ct)
    {
        try
        {
            return Ok(await _parkingService.GetVehiclePricingAsync(ct));
        }
        catch (Exception ex)
        {
            return FromException(ex);
        }
    }

    // One configuration per vehicle type, so the route carries the vehicle type and PUT upserts.
    [HttpPut("pricing/{vehicleTypeId:guid}")]
    public async Task<IActionResult> SaveVehiclePricing(
        Guid vehicleTypeId, [FromBody] SaveVehiclePricingRequest request, CancellationToken ct)
    {
        try
        {
            return Ok(await _parkingService.SaveVehiclePricingAsync(vehicleTypeId, request, ct));
        }
        catch (Exception ex)
        {
            return FromException(ex);
        }
    }

    [HttpDelete("pricing/{vehicleTypeId:guid}")]
    public async Task<IActionResult> DeleteVehiclePricing(Guid vehicleTypeId, CancellationToken ct)
    {
        try
        {
            await _parkingService.DeleteVehiclePricingAsync(vehicleTypeId, ct);
            return NoContent();
        }
        catch (Exception ex)
        {
            return FromException(ex);
        }
    }

    private IActionResult FromException(Exception ex) => ex switch
    {
        KeyNotFoundException => NotFound(new { message = ex.Message }),
        UnauthorizedAccessException => Unauthorized(new { message = ex.Message }),
        InvalidOperationException => BadRequest(new { message = ex.Message }),
        _ => StatusCode(StatusCodes.Status500InternalServerError, new { message = "An unexpected error occurred." })
    };
}
