using System.Net;
using Microsoft.Extensions.DependencyInjection;
using QuickPark.API.Services.Implementations;
using QuickPark.API.Services.Interfaces;
using QuickPark.Tests.Integration.Infrastructure;

namespace QuickPark.Tests.Integration.Controllers;

public class ProviderStaffControllerTests
    : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public ProviderStaffControllerTests(
        CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public void StaffService_IsRegistered()
    {
        using var scope =
            _factory.Services.CreateScope();

        var service = scope.ServiceProvider
            .GetService<IStaffService>();

        service.Should().NotBeNull();
    }

    [Fact]
    public void StaffService_UsesStaffServiceImplementation()
    {
        using var scope =
            _factory.Services.CreateScope();

        var service = scope.ServiceProvider
            .GetRequiredService<IStaffService>();

        service.Should()
            .BeOfType<StaffService>();
    }

    [Fact]
    public async Task GetStaff_WithoutAuthentication_ReturnsUnauthorized()
    {
        var client =
            _factory.CreateClient();

        var response =
            await client.GetAsync(
                "/api/provider/staff");

        response.StatusCode.Should()
            .Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateStaff_WithoutAuthentication_ReturnsUnauthorized()
    {
        var client =
            _factory.CreateClient();

        using var content =
            new StringContent(
                """
                {
                    "facilityId":
                        "11111111-1111-1111-1111-111111111111",
                    "fullName": "Test Staff",
                    "email": "staff@example.com",
                    "password": "Password123",
                    "phone": "0771234567",
                    "nic": "200012345678",
                    "type": "ADMINISTRATIVE",
                    "position": "Manager"
                }
                """,
                System.Text.Encoding.UTF8,
                "application/json");

        var response =
            await client.PostAsync(
                "/api/provider/staff",
                content);

        response.StatusCode.Should()
            .Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ProviderStaffEndpoint_ApplicationStartsSuccessfully()
    {
        var client =
            _factory.CreateClient();

        var response =
            await client.GetAsync(
                "/api/provider/staff");

        response.Should().NotBeNull();
    }
}