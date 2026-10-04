using Microsoft.Extensions.DependencyInjection;
using QuickPark.API.Data;
using QuickPark.Tests.Integration.Infrastructure;

namespace QuickPark.Tests.Integration.Database;

public class DatabaseIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public DatabaseIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public void Database_CanBeResolved_AndIsAvailable()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // Act & Assert
        context.Should().NotBeNull();
        bool canConnect = context.Database.CanConnect();
        canConnect.Should().BeTrue();
    }
}
