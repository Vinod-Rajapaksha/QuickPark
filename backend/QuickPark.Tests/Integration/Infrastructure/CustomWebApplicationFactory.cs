using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using QuickPark.API.Data;
using Testcontainers.PostgreSql;

namespace QuickPark.Tests.Integration.Infrastructure;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _dbContainer;

    public CustomWebApplicationFactory()
    {
        _dbContainer = new PostgreSqlBuilder("postgres:15-alpine")
            .WithDatabase("quickpark_test_db")
            .WithUsername("postgres")
            .WithPassword("postgres")
            .Build();

        Environment.SetEnvironmentVariable("Jwt__Key", "a_very_long_secret_key_for_testing_purposes_only_123456789");
        Environment.SetEnvironmentVariable("Jwt__Issuer", "QuickParkTest");
        Environment.SetEnvironmentVariable("Jwt__Audience", "QuickParkTest");
        Environment.SetEnvironmentVariable("Jwt__ExpirationMinutes", "60");
        Environment.SetEnvironmentVariable("Cookie__Name", "quickpark_auth");
        Environment.SetEnvironmentVariable("Cookie__ExpirationMinutes", "60");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((context, config) =>
        {
            var inMemorySettings = new Dictionary<string, string>
            {
                {"Jwt:Key", "a_very_long_secret_key_for_testing_purposes_only_123456789"},
                {"Jwt:Issuer", "QuickParkTest"},
                {"Jwt:Audience", "QuickParkTest"},
                {"Jwt:ExpirationMinutes", "60"},
                {"AuthCookie:Name", "quickpark_auth"}
            };
            config.AddInMemoryCollection(inMemorySettings!);
        });

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
                options.UseNpgsql(_dbContainer.GetConnectionString());
            });
        });
    }

    public async Task InitializeAsync()
    {
        await _dbContainer.StartAsync();
    }

    new public async Task DisposeAsync()
    {
        await _dbContainer.StopAsync();
        await _dbContainer.DisposeAsync();
    }
}
