using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using QuickPark.API.Controllers;
using QuickPark.API.DTOs.Auth;
using QuickPark.API.Models;
using QuickPark.API.Options;
using QuickPark.API.Services.Interfaces;

namespace QuickPark.Tests.Unit.Controllers;

public class AuthControllerTests
{
    private readonly Mock<IAuthService> _authServiceMock;
    private readonly IOptions<AuthCookieOptions> _cookieOptions;
    private readonly AuthController _authController;

    public AuthControllerTests()
    {
        _authServiceMock = new Mock<IAuthService>();
        
        _cookieOptions = Options.Create(new AuthCookieOptions
        {
            Name = "AuthCookie",
            ExpirationMinutes = 60
        });

        _authController = new AuthController(_authServiceMock.Object, _cookieOptions)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            }
        };
    }

    [Fact]
    public async Task Register_WithValidData_ReturnsCreatedResult()
    {
        // Arrange
        var request = new RegisterRequest { Email = "test@example.com" };
        var response = new UserResponse { Email = "test@example.com" };
        _authServiceMock.Setup(s => s.RegisterAsync(request)).ReturnsAsync(response);

        // Act
        var result = await _authController.Register(request);

        // Assert
        var createdResult = result.Should().BeOfType<CreatedResult>().Subject;
        createdResult.Value.Should().BeEquivalentTo(response);
    }

    [Fact]
    public async Task Register_WithInvalidData_ReturnsBadRequest()
    {
        // Arrange
        var request = new RegisterRequest { Email = "test@example.com" };
        _authServiceMock.Setup(s => s.RegisterAsync(request)).ThrowsAsync(new Exception("Email exists."));

        // Act
        var result = await _authController.Register(request);

        // Assert
        var badRequestResult = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        badRequestResult.Value.Should().BeEquivalentTo(new { message = "Email exists." });
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsOkAndSetsCookie()
    {
        // Arrange
        var request = new LoginRequest { Email = "test@example.com", Password = "Password123" };
        _authServiceMock.Setup(s => s.LoginAsync(request)).ReturnsAsync("jwt_token");

        // Act
        var result = await _authController.Login(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().BeEquivalentTo(new { message = "Logged in successfully" });

        var setCookieHeader = _authController.HttpContext.Response.Headers["Set-Cookie"].ToString();
        setCookieHeader.Should().Contain("AuthCookie=jwt_token");
    }

    [Fact]
    public async Task Login_WithInvalidCredentials_ReturnsUnauthorized()
    {
        // Arrange
        var request = new LoginRequest { Email = "test@example.com" };
        _authServiceMock.Setup(s => s.LoginAsync(request)).ThrowsAsync(new Exception("Invalid credentials."));

        // Act
        var result = await _authController.Login(request);

        // Assert
        var unauthorizedResult = result.Should().BeOfType<UnauthorizedObjectResult>().Subject;
        unauthorizedResult.Value.Should().BeEquivalentTo(new { message = "Invalid credentials." });
    }

    [Fact]
    public async Task GetCurrentUser_WhenAuthenticated_ReturnsOkResult()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var userResponse = new UserResponse { Id = userId, Email = "test@example.com" };

        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, userId.ToString()) };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _authController.ControllerContext.HttpContext.User = claimsPrincipal;
        _authServiceMock.Setup(s => s.GetUserByIdAsync(userId)).ReturnsAsync(userResponse);

        // Act
        var result = await _authController.GetCurrentUser();

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().BeEquivalentTo(userResponse);
    }
}
