using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using QuickPark.API.Models;
using QuickPark.Tests.Helpers;
using QuickPark.Tests.Integration.Infrastructure;

namespace QuickPark.Tests.Integration.Security;

public class AdminSecurityTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;

    public AdminSecurityTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
        _factory = factory;
    }

    [Fact]
    public async Task AdminEndpoints_ShouldRejectXSSPayloads()
    {
        // Arrange
         var maliciousName = "<script>alert('xss')</script>Malicious Facility";
        var requestBody = new 
        {
            Name = maliciousName,
            Location = "Test Location",
            Capacity = 10,
            PricePerHour = 5
        };

        var request = new HttpRequestMessage(HttpMethod.Post, "/api/ParkingFacilities");
        request.Content = JsonContent.Create(requestBody);
        
        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().BeOneOf(HttpStatusCode.Unauthorized, HttpStatusCode.Forbidden, HttpStatusCode.BadRequest);
    }
}

public class AdminResilienceTests
{
    [Fact]
    public async Task DatabaseOutage_ShouldReturnGracefulError()
    {
        // Arrange
        var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureAppConfiguration((context, config) =>
                {
                    var inMemorySettings = new Dictionary<string, string>
                    {
                        { "ConnectionStrings:DefaultConnection", "Host=localhost;Port=9999;Database=fake_db;Username=fake;Password=fake" }
                    };
                    config.AddInMemoryCollection(inMemorySettings);
                });
            });

        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/ParkingFacilities");

        // Assert
        response.StatusCode.Should().BeOneOf(HttpStatusCode.InternalServerError, HttpStatusCode.BadRequest);
        
        var responseBody = await response.Content.ReadAsStringAsync();
        responseBody.Should().NotContain("NpgsqlException");
        responseBody.Should().NotContain("Connection refused");
    }
}
