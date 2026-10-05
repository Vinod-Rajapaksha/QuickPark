using Microsoft.AspNetCore.Mvc;
using QuickPark.API.Controllers;
using QuickPark.API.Services.Interfaces;

namespace QuickPark.Tests.Unit.Controllers;

public class TokensControllerTests
{
    private readonly Mock<ITokenService> _tokenServiceMock;
    private readonly TokensController _tokensController;

    public TokensControllerTests()
    {
        _tokenServiceMock = new Mock<ITokenService>();
        _tokensController = new TokensController(_tokenServiceMock.Object);
    }

    [Fact]
    public void GenerateQrToken_ReturnsOkResultWithToken()
    {
        // Arrange
        var reservationId = Guid.NewGuid();
        var generatedToken = "mock_jwt_token";
        _tokenServiceMock.Setup(s => s.GenerateReservationToken(reservationId)).Returns(generatedToken);

        // Act
        var result = _tokensController.GenerateQrToken(reservationId);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var value = okResult.Value;
        var tokenProperty = value!.GetType().GetProperty("Token")?.GetValue(value, null);
        var resIdProperty = value.GetType().GetProperty("ReservationId")?.GetValue(value, null);

        tokenProperty.Should().Be(generatedToken);
        resIdProperty.Should().Be(reservationId);
    }

    [Fact]
    public void ScanQrToken_WithValidToken_ReturnsOkResult()
    {
        // Arrange
        var reservationId = Guid.NewGuid();
        var request = new TokensController.ScanTokenRequest { Token = "valid_token" };
        _tokenServiceMock.Setup(s => s.ValidateReservationToken(request.Token)).Returns(reservationId);

        // Act
        var result = _tokensController.ScanQrToken(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var value = okResult.Value;
        var resIdProperty = value!.GetType().GetProperty("ReservationId")?.GetValue(value, null);
        
        resIdProperty.Should().Be(reservationId);
    }

    [Fact]
    public void ScanQrToken_WithInvalidToken_ReturnsBadRequest()
    {
        // Arrange
        var request = new TokensController.ScanTokenRequest { Token = "invalid_token" };
        _tokenServiceMock.Setup(s => s.ValidateReservationToken(request.Token)).Returns((Guid?)null);

        // Act
        var result = _tokensController.ScanQrToken(request);

        // Assert
        var badRequestResult = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        var value = badRequestResult.Value;
        var messageProperty = value!.GetType().GetProperty("Message")?.GetValue(value, null);

        messageProperty.Should().Be("Invalid or expired QR token.");
    }
}
