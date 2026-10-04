using System.Net;
using System.Net.Http.Json;
using QuickPark.API.Controllers;
using QuickPark.Tests.Integration.Infrastructure;
using QuickPark.Tests.Helpers;

namespace QuickPark.Tests.Integration.Controllers;

public class TokenIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public TokenIntegrationTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    private async Task<string> GetAuthCookieAsync()
    {
        var registerRequest = TestDataBuilder.CreateRegisterRequest("token_test@example.com");

        await _client.PostAsJsonAsync("/api/auth/register", registerRequest);

        var loginRequest = TestDataBuilder.CreateLoginRequest("token_test@example.com");

        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", loginRequest);
        var setCookieHeader = loginResponse.Headers.GetValues("Set-Cookie").FirstOrDefault();
        return setCookieHeader!.Split(';')[0];
    }

    [Fact]
    public async Task GenerateAndScanQrToken_Flow_Succeeds()
    {
        // Authenticate
        var authCookie = await GetAuthCookieAsync();

        var reservationId = Guid.NewGuid();

        // Generate Token
        var generateRequest = new HttpRequestMessage(HttpMethod.Get, $"/api/tokens/reservation/{reservationId}");
        generateRequest.Headers.Add("Cookie", authCookie);

        var generateResponse = await _client.SendAsync(generateRequest);
        generateResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var generateResult = await generateResponse.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        var generatedToken = generateResult!["token"].ToString();
        generatedToken.Should().NotBeNullOrEmpty();

        // Scan Token
        var scanRequest = new HttpRequestMessage(HttpMethod.Post, "/api/tokens/scan");
        scanRequest.Headers.Add("Cookie", authCookie);
        scanRequest.Content = JsonContent.Create(new TokensController.ScanTokenRequest { Token = generatedToken! });

        var scanResponse = await _client.SendAsync(scanRequest);
        scanResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var scanResult = await scanResponse.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        scanResult!["reservationId"].ToString().Should().Be(reservationId.ToString());
    }

    [Fact]
    public async Task ScanQrToken_WithInvalidToken_ReturnsBadRequest()
    {
        // Authenticate
        var authCookie = await GetAuthCookieAsync();

        var scanRequest = new HttpRequestMessage(HttpMethod.Post, "/api/tokens/scan");
        scanRequest.Headers.Add("Cookie", authCookie);
        scanRequest.Content = JsonContent.Create(new TokensController.ScanTokenRequest { Token = "some_invalid_random_string_token" });

        var scanResponse = await _client.SendAsync(scanRequest);
        scanResponse.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
