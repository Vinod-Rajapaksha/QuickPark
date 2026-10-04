using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using QuickPark.API.Data;
using QuickPark.API.DTOs.Auth;
using QuickPark.API.Models;
using QuickPark.API.Options;
using QuickPark.API.Services.Implementations;

namespace QuickPark.Tests.Unit.Services;

public class AuthServiceTests
{
    private readonly AppDbContext _context;
    private readonly IOptions<JwtOptions> _jwtOptions;
    private readonly AuthService _authService;

    public AuthServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        
        _context = new AppDbContext(options);
        
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
        var request = new RegisterRequest
        {
            FullName = "Test User",
            Email = "test@example.com",
            Password = "Password123",
            Phone = "1234567890",
            NIC = "123456789V",
            Role = UserRole.DRIVER
        };

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
        var existingUser = new User
        {
            FullName = "Existing User",
            Email = "duplicate@example.com",
            PasswordHash = "hashed",
            Role = UserRole.DRIVER
        };
        _context.Users.Add(existingUser);
        await _context.SaveChangesAsync();

        var request = new RegisterRequest
        {
            FullName = "New User",
            Email = "duplicate@example.com",
            Password = "Password123",
            Role = UserRole.DRIVER
        };

        // Act
        Func<Task> act = async () => await _authService.RegisterAsync(request);

        // Assert
        await act.Should().ThrowAsync<Exception>().WithMessage("Email is already registered.");
    }

    [Fact]
    public async Task LoginAsync_WithValidCredentials_ReturnsJwtToken()
    {
        // Arrange
        var user = new User
        {
            FullName = "Login User",
            Email = "login@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123"),
            Role = UserRole.DRIVER,
            IsActive = true
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var request = new LoginRequest
        {
            Email = "login@example.com",
            Password = "Password123"
        };

        // Act
        var token = await _authService.LoginAsync(request);

        // Assert
        token.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task LoginAsync_WithInvalidPassword_ThrowsException()
    {
        // Arrange
        var user = new User
        {
            FullName = "Login User",
            Email = "wrongpass@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123"),
            Role = UserRole.DRIVER,
            IsActive = true
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var request = new LoginRequest
        {
            Email = "wrongpass@example.com",
            Password = "WrongPassword"
        };

        // Act
        Func<Task> act = async () => await _authService.LoginAsync(request);

        // Assert
        await act.Should().ThrowAsync<Exception>().WithMessage("Invalid email or password.");
    }

    [Fact]
    public async Task GetUserByIdAsync_WithValidId_ReturnsUser()
    {
        // Arrange
        var user = new User
        {
            FullName = "Test User",
            Email = "findme@example.com",
            PasswordHash = "hashed",
            Role = UserRole.DRIVER
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Act
        var result = await _authService.GetUserByIdAsync(user.Id);

        // Assert
        result.Should().NotBeNull();
        result!.Email.Should().Be(user.Email);
    }
}
