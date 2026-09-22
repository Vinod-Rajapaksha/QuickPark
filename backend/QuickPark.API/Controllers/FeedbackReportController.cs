using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickPark.API.DTOs.Feedback;
using QuickPark.API.Models;
using QuickPark.API.Services.Interfaces;
using System.Security.Claims;


namespace QuickPark.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FeedbackReportController : ControllerBase
{
    private readonly IFeedbackReportService _service;

    public FeedbackReportController(
        IFeedbackReportService service)
    {
        _service = service;
    }

    private Guid GetUserId()
    {
        var userId =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        if(!Guid.TryParse(
            userId,
            out var id))
        {
            throw new UnauthorizedAccessException(
                "Invalid authenticated user.");
        }

        return id;

    }

    private UserRole GetUserRole()
    {

        var role =
            User.FindFirstValue(
                ClaimTypes.Role);

        if(string.IsNullOrEmpty(role))
        {
            throw new UnauthorizedAccessException(
                "Role missing.");
        }

        if(!Enum.TryParse<UserRole>(
            role,
            out var result))
        {
            throw new UnauthorizedAccessException(
                "Invalid role.");
        }

        return result;

    }

    [Authorize(Roles="DRIVER")]
    [HttpPost]
    public async Task<IActionResult> Create(
        CreateFeedbackReportRequest request)
    {
        await _service.CreateAsync(
            GetUserId(),
            GetUserRole(),
            request);

        return Ok(
            "Feedback reported successfully");

    }

}