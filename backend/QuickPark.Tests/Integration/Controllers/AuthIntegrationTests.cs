using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using QuickPark.API.Data;
using QuickPark.API.DTOs.Auth;
using QuickPark.API.Models;

namespace QuickPark.Tests.Integration.Controllers;

public class AuthIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    private readonly WebApplicationFactory<Program> _factory;

    public AuthIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));

                if (descriptor != null)
                {
                    services.Remove(descriptor);
                }

                services.AddDbContext<AppDbContext>(options =>
                {
                    options.UseInMemoryDatabase("QuickParkTestDb_Auth");
                });
            });
        });

        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task RegisterAndLogin_Flow_Succeeds()
    {
        // Register
        var registerRequest = new RegisterRequest
        {
            FullName = "Integration User",
            Email = "integration@example.com",
            Password = "Password123",
            Phone = "1234567890",
            NIC = "123456789V",
            Role = UserRole.DRIVER
        };

        var registerResponse = await _client.PostAsJsonAsync("/api/auth/register", registerRequest);
        registerResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        // Login
        var loginRequest = new LoginRequest
        {
            Email = "integration@example.com",
            Password = "Password123"
        };

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
        user!.Email.Should().Be("integration@example.com");

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
