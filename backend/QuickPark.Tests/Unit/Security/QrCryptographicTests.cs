using Microsoft.Extensions.Configuration;
using QuickPark.API.Services.Implementations;

namespace QuickPark.Tests.Unit.Security;

public class QrCryptographicTests
{
    private readonly TokenService _tokenService;
    private readonly IConfiguration _configuration;

    public QrCryptographicTests()
    {
        var inMemorySettings = new Dictionary<string, string?> {
            {"Jwt:Key", "SuperSecretKeyForJwtTokenGenerationThatIsLongEnough"},
            {"Jwt:Issuer", "QuickParkTest"},
            {"Jwt:Audience", "QuickParkTest"}
        };

        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();

        _tokenService = new TokenService(_configuration);
    }

    [Fact]
    public void GenerateReservationToken_ShouldCreateValidJwtToken()
    {
        // Arrange
        var reservationId = Guid.NewGuid();

        // Act
        var token = _tokenService.GenerateReservationToken(reservationId);

        // Assert
        token.Should().NotBeNullOrEmpty();
        token.Split('.').Length.Should().Be(3);
    }

    [Fact]
    public void ValidateReservationToken_ShouldReturnReservationId_ForValidToken()
    {
        // Arrange
        var reservationId = Guid.NewGuid();
        var token = _tokenService.GenerateReservationToken(reservationId);

        // Act
        var result = _tokenService.ValidateReservationToken(token);

        // Assert
        result.Should().Be(reservationId);
    }

    [Fact]
    public void ValidateReservationToken_ShouldReturnNull_ForInvalidSignature()
    {
        // Arrange
        var reservationId = Guid.NewGuid();
        var token = _tokenService.GenerateReservationToken(reservationId);

        // Tamper with the token 
        var tamperedToken = token.Substring(0, token.Length - 1) + (token.EndsWith("a") ? "b" : "a");

        // Act
        var result = _tokenService.ValidateReservationToken(tamperedToken);

        // Assert
        result.Should().BeNull();
    }
}
