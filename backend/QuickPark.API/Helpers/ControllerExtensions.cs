using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace QuickPark.API.Helpers;

// The two lines every controller action repeats: read the signed-in user out of the cookie, and
// turn a service exception into the matching HTTP status. Kept here so one definition governs all
// of them (§24 — the account in the token, never a route parameter, is what selects the data).
public static class ControllerExtensions
{
    /// <summary>Resolves the authenticated user id from the auth cookie. False means the caller is not signed in.</summary>
    public static bool TryGetUserId(this ControllerBase controller, out Guid userId)
    {
        userId = Guid.Empty;
        var value = controller.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(value, out userId);
    }

    /// <summary>Maps the service-layer exception types to 404 / 401 / 400, anything else to 500.</summary>
    public static IActionResult FromException(this ControllerBase controller, Exception ex) => ex switch
    {
        KeyNotFoundException => new NotFoundObjectResult(new { message = ex.Message }),
        UnauthorizedAccessException => new UnauthorizedObjectResult(new { message = ex.Message }),
        InvalidOperationException => new BadRequestObjectResult(new { message = ex.Message }),
        _ => new ObjectResult(new { message = "An unexpected error occurred." })
            { StatusCode = StatusCodes.Status500InternalServerError },
    };
}
