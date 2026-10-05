using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using QuickPark.API.Data;
using QuickPark.API.Options;
using QuickPark.API.Services.Implementations;
using QuickPark.Tests.Fixtures;
using QuickPark.Tests.Helpers;

namespace QuickPark.Tests.Unit.Services;

public class AuthServiceTests : IClassFixture<DatabaseFixture>
{
    private readonly AppDbContext _context;
    private readonly IOptions<JwtOptions> _jwtOptions;
    private readonly AuthService _authService;

    public AuthServiceTests(DatabaseFixture fixture)
    {
        _context = fixture.Context;

        _jwtOptions = Options.Create(new JwtOptions
        {
            Key = "a_very_long_secret_key_for_testing_purposes_only_123456789",
            Issuer = "QuickParkTest",
            Audience = "QuickParkTest",
            ExpirationMinutes = 60
        });

        _authService = new AuthService(_context, _jwtOptions);
    }

    [Fact]
    public async Task RegisterAsync_WithValidData_ReturnsUserResponse()
    {
        // Arrange
        var request = TestDataBuilder.CreateRegisterRequest("test_register@example.com");

        // Act
        var result = await _authService.RegisterAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.Email.Should().Be(request.Email);
        result.FullName.Should().Be(request.FullName);

        var userInDb = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        userInDb.Should().NotBeNull();
        BCrypt.Net.BCrypt.Verify(request.Password, userInDb!.PasswordHash).Should().BeTrue();
    }

    [Fact]
    public async Task RegisterAsync_WithDuplicateEmail_ThrowsException()
    {
        // Arrange
        var existingUser = TestDataBuilder.CreateUser("duplicate@example.com");
        _context.Users.Add(existingUser);
        await _context.SaveChangesAsync();

        var request = TestDataBuilder.CreateRegisterRequest("duplicate@example.com");

        // Act
        Func<Task> act = async () => await _authService.RegisterAsync(request);

        // Assert
        await act.Should().ThrowAsync<Exception>().WithMessage("Email is already registered.");
    }

    [Fact]
    public async Task LoginAsync_WithValidCredentials_ReturnsJwtToken()
    {
        // Arrange
        var user = TestDataBuilder.CreateUser("login@example.com");
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var request = TestDataBuilder.CreateLoginRequest("login@example.com");

        // Act
        var token = await _authService.LoginAsync(request);

        // Assert
        token.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task LoginAsync_WithInvalidPassword_ThrowsException()
    {
        // Arrange
        var user = TestDataBuilder.CreateUser("wrongpass@example.com");
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var request = TestDataBuilder.CreateLoginRequest("wrongpass@example.com");
        request.Password = "WrongPassword";

        // Act
        Func<Task> act = async () => await _authService.LoginAsync(request);

        // Assert
        await act.Should().ThrowAsync<Exception>().WithMessage("Invalid email or password.");
    }

    [Fact]
    public async Task GetUserByIdAsync_WithValidId_ReturnsUser()
    {
        // Arrange
        var user = TestDataBuilder.CreateUser("findme@example.com");
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Act
        var result = await _authService.GetUserByIdAsync(user.Id);

        // Assert
        result.Should().NotBeNull();
        result!.Email.Should().Be(user.Email);
    }
}
