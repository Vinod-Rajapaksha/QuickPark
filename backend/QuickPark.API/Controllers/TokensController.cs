using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickPark.API.Services.Interfaces;

namespace QuickPark.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TokensController : ControllerBase
{
    private readonly ITokenService _tokenService;

    public TokensController(ITokenService tokenService)
    {
        _tokenService = tokenService;
    }

    [HttpGet("reservation/{reservationId}")]
    [Authorize]
    public IActionResult GenerateQrToken(Guid reservationId)
    {
        var token = _tokenService.GenerateReservationToken(reservationId);
        return Ok(new { Token = token, ReservationId = reservationId, ExpiresAt = DateTime.UtcNow.AddHours(24) });
    }

    public class ScanTokenRequest
    {
        public string Token { get; set; } = string.Empty;
    }

    [HttpPost("scan")]
    [Authorize]
    public IActionResult ScanQrToken([FromBody] ScanTokenRequest request)
    {
        var reservationId = _tokenService.ValidateReservationToken(request.Token);
        if (reservationId == null)
        {
            return BadRequest(new { Message = "Invalid or expired QR token." });
        }
        return Ok(new { Message = "Token valid.", ReservationId = reservationId });
    }
}
