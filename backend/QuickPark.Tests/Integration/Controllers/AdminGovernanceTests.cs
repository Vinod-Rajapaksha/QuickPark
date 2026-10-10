using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using QuickPark.API.DTOs.Providers;
using QuickPark.API.Models;
using QuickPark.Tests.Helpers;
using QuickPark.Tests.Integration.Infrastructure;

namespace QuickPark.Tests.Integration.Controllers;

public class AdminGovernanceTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;

    public AdminGovernanceTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
        _factory = factory;
    }

    private async Task<string> GetAuthCookieAsync(string role)
    {
        var email = $"admin_test_{Guid.NewGuid():N}@example.com";

        if (role == "PLATFORM_ADMIN")
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<QuickPark.API.Data.AppDbContext>();
            var user = TestDataBuilder.CreateUser(email, UserRole.PLATFORM_ADMIN);
            db.Users.Add(user);
            await db.SaveChangesAsync();
        }
        else
        {
            var registerRequest = TestDataBuilder.CreateRegisterRequest(email);
            registerRequest.Role = Enum.Parse<UserRole>(role);

            var registerResponse = await _client.PostAsJsonAsync("/api/auth/register", registerRequest);

            if (!registerResponse.IsSuccessStatusCode)
            {
                var errorContent = await registerResponse.Content.ReadAsStringAsync();
                throw new Exception($"Registration failed with status {registerResponse.StatusCode}: {errorContent}");
            }
        }

        var loginRequest = TestDataBuilder.CreateLoginRequest(email);

        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", loginRequest);

        if (!loginResponse.IsSuccessStatusCode)
        {
            var errorContent = await loginResponse.Content.ReadAsStringAsync();
            throw new Exception($"Login failed with status {loginResponse.StatusCode}: {errorContent}");
        }

        if (loginResponse.Headers.TryGetValues("Set-Cookie", out var setCookieHeaders))
        {
            return setCookieHeaders.First().Split(';')[0];
        }

        throw new Exception("Set-Cookie header was not found in the successful login response.");
    }

    [Fact]
    public async Task AdminEndpoints_ShouldReturnForbidden_ForNonAdminUsers()
    {
        // Arrange
        var driverCookie = await GetAuthCookieAsync("DRIVER");

        var request = new HttpRequestMessage(HttpMethod.Get, "/api/users");
        request.Headers.Add("Cookie", driverCookie);

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task AdminEndpoints_ShouldAllowAccess_ForAdminUsers()
    {
        // Arrange
        var adminCookie = await GetAuthCookieAsync("PLATFORM_ADMIN");

        var request = new HttpRequestMessage(HttpMethod.Get, "/api/users");
        request.Headers.Add("Cookie", adminCookie);

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ProviderVerification_Approval_ShouldSucceed()
    {
        // Arrange
        var adminCookie = await GetAuthCookieAsync("PLATFORM_ADMIN");
        var providerId = Guid.NewGuid();

        var updateRequest = new UpdateVerificationStatusRequest
        {
            Status = "APPROVED",
            Remarks = "All documents verified."
        };

        var request = new HttpRequestMessage(HttpMethod.Put, $"/api/providers/{providerId}/verification-status");
        request.Headers.Add("Cookie", adminCookie);
        request.Content = JsonContent.Create(updateRequest);

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().NotBe(HttpStatusCode.Unauthorized);
        response.StatusCode.Should().NotBe(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Commission_Calculation_ShouldReturnDataForAdmin()
    {
        // Arrange
        var adminCookie = await GetAuthCookieAsync("PLATFORM_ADMIN");

        var request = new HttpRequestMessage(HttpMethod.Get, "/api/commission");
        request.Headers.Add("Cookie", adminCookie);

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
