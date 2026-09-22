using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickPark.API.DTOs.Feedback;
using QuickPark.API.Models;
using QuickPark.API.Services.Interfaces;
using System.Security.Claims;

namespace QuickPark.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FeedbackReplyController : ControllerBase
{

    private readonly IFeedbackReplyService _service;

    public FeedbackReplyController(
        IFeedbackReplyService service)
    {
        _service = service;
    }

    private Guid GetUserId()
    {
        var value =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(value, out var id))
        {
            throw new UnauthorizedAccessException();
        }

        return id;
    }

    private UserRole GetUserRole()
    {
        var role =
            User.FindFirstValue(
                ClaimTypes.Role);

        if (string.IsNullOrEmpty(role))
        {
            throw new UnauthorizedAccessException(
                "User role missing.");
        }

        if (!Enum.TryParse<UserRole>(
            role,
            out var result))
        {
            throw new UnauthorizedAccessException(
                "Invalid user role.");
        }

        return result;
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create(
        CreateFeedbackReplyRequest request)
    {
        var result =
            await _service.CreateAsync(
                GetUserId(),
                GetUserRole(),
                request
            );

        return Ok(result);

    }

}