using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickPark.API.DTOs.Feedback;
using QuickPark.API.Services.Interfaces;
using System.Security.Claims;


namespace QuickPark.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FeedbackController : ControllerBase
{
    private readonly IFeedbackService _service;
    public FeedbackController(
        IFeedbackService service)
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

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create(
        CreateFeedbackRequest request)
    {
        var result =
            await _service.CreateAsync(
                GetUserId(),
                request);

        return Ok(result);

    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(
            await _service.GetAllAsync()
        );

    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(
        Guid id)
    {
        return Ok(
            await _service.GetByIdAsync(id)
        );

    }

    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(
        Guid id,
        UpdateFeedbackRequest request)
    {
        return Ok(
            await _service.UpdateAsync(
                GetUserId(),
                id,
                request)
        );

    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(
        Guid id)
    {
        await _service.DeleteAsync(
            GetUserId(),
            id);

        return Ok(
            "Feedback deleted");

    }

    [Authorize(Roles="PLATFORM_ADMIN")]
    [HttpGet("pending")]
    public async Task<IActionResult> GetPending()
    {

        return Ok(
            await _service.GetPendingAsync()
        );

    }

    [Authorize(Roles="PLATFORM_ADMIN")]
    [HttpGet("reports")]
    public async Task<IActionResult> GetReports()
    {
        return Ok(
            await _service.GetReportsAsync()
        );

    }

    [Authorize(Roles="PLATFORM_ADMIN")]
    [HttpPatch("{id}/approve")]
    public async Task<IActionResult> Approve(
        Guid id)
    {
        await _service.ApproveAsync(id);

        return Ok(
            "Feedback approved");

    }


    [Authorize(Roles="PLATFORM_ADMIN")]
    [HttpPatch("{id}/hide")]
    public async Task<IActionResult> Hide(
        Guid id)
    {

        await _service.HideAsync(id);

        return Ok(
            "Feedback hidden");

    }


    [Authorize(Roles="PLATFORM_ADMIN")]
    [HttpPatch("{id}/restore")]
    public async Task<IActionResult> Restore(
        Guid id)
    {
        await _service.RestoreAsync(id);

        return Ok(
            "Feedback restored");

    }


    [Authorize(Roles="PLATFORM_ADMIN")]
    [HttpDelete("admin/{id}")]
    public async Task<IActionResult> AdminDelete(
        Guid id)
    {
        await _service.AdminDeleteAsync(id);

        return Ok(
            "Feedback removed by admin");

    }

}