using System.Net;
using System.Net.Http.Json;
using QuickPark.API.DTOs.Auth;
using QuickPark.Tests.Integration.Infrastructure;
using QuickPark.Tests.Helpers;

namespace QuickPark.Tests.Integration.Controllers;

public class AuthIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public AuthIntegrationTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task RegisterAndLogin_Flow_Succeeds()
    {
        var email = $"integration_{Guid.NewGuid():N}@example.com";
        // Register
        var registerRequest = TestDataBuilder.CreateRegisterRequest(email);

        var registerResponse = await _client.PostAsJsonAsync("/api/auth/register", registerRequest);
        registerResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        // Login
        var loginRequest = TestDataBuilder.CreateLoginRequest(email);

        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", loginRequest);
        loginResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var setCookieHeader = loginResponse.Headers.GetValues("Set-Cookie").FirstOrDefault();
        setCookieHeader.Should().NotBeNull();
        setCookieHeader.Should().Contain("quickpark_auth");

        // Get Current User
        var requestMessage = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me");
        var cookieValue = setCookieHeader!.Split(';')[0];
        requestMessage.Headers.Add("Cookie", cookieValue);

        var meResponse = await _client.SendAsync(requestMessage);
        meResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var jsonOptions = new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        jsonOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        var user = await meResponse.Content.ReadFromJsonAsync<UserResponse>(jsonOptions);
        user.Should().NotBeNull();
        user!.Email.Should().Be(email);

        // Logout
        var logoutRequest = new HttpRequestMessage(HttpMethod.Post, "/api/auth/logout");
        var logoutResponse = await _client.SendAsync(logoutRequest);
        logoutResponse.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetCurrentUser_WithoutCookie_ReturnsUnauthorized()
    {
        var response = await _client.GetAsync("/api/auth/me");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
