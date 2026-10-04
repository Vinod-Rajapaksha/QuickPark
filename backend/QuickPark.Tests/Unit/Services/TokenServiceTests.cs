using System.IdentityModel.Tokens.Jwt;
using Microsoft.Extensions.Configuration;
using QuickPark.API.Services.Implementations;

namespace QuickPark.Tests.Unit.Services;

public class TokenServiceTests
{
    private readonly IConfiguration _configuration;
    private readonly TokenService _tokenService;

    public TokenServiceTests()
    {
        var inMemorySettings = new Dictionary<string, string>
        {
            {"Jwt:Key", "a_very_long_secret_key_for_testing_purposes_only_123456789"},
            {"Jwt:Issuer", "QuickParkTest"},
            {"Jwt:Audience", "QuickParkTest"}
        };

        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings!)
            .Build();

        _tokenService = new TokenService(_configuration);
    }

    [Fact]
    public void GenerateReservationToken_ReturnsValidToken()
    {
        // Arrange
        var reservationId = Guid.NewGuid();

        // Act
        var token = _tokenService.GenerateReservationToken(reservationId);

        // Assert
        token.Should().NotBeNullOrEmpty();
        
        var handler = new JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(token);
        
        jwtToken.Claims.Should().Contain(c => c.Type == "ReservationId" && c.Value == reservationId.ToString());
    }

    [Fact]
    public void ValidateReservationToken_WithValidToken_ReturnsReservationId()
    {
        // Arrange
        var reservationId = Guid.NewGuid();
        var token = _tokenService.GenerateReservationToken(reservationId);

        // Act
        var resultId = _tokenService.ValidateReservationToken(token);

        // Assert
        resultId.Should().NotBeNull();
        resultId.Should().Be(reservationId);
    }

    [Fact]
    public void ValidateReservationToken_WithInvalidToken_ReturnsNull()
    {
        // Arrange
        var invalidToken = "invalid.token.string";

        // Act
        var resultId = _tokenService.ValidateReservationToken(invalidToken);

        // Assert
        resultId.Should().BeNull();
    }
}
