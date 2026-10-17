using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Swashbuckle.AspNetCore.Swagger;
using Xunit;
using Xunit.Abstractions;

namespace QuickPark.Tests.Unit;

public class SwaggerDocTest : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly ITestOutputHelper _output;

    public SwaggerDocTest(WebApplicationFactory<Program> factory, ITestOutputHelper output)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureAppConfiguration((context, config) =>
            {
                var inMemorySettings = new Dictionary<string, string?>
                {
                    { "ConnectionStrings:DefaultConnection", "Host=localhost;Port=5432;Database=QuickParkDB;Username=postgres;Password=postgres" },
                    { "Jwt:Key", "q9nsebbI3EfgQGO0KDr5CrDylTBYH5z9sHBQ8A9QTDd" },
                    { "Jwt:Issuer", "QuickPark.Api" },
                    { "Jwt:Audience", "QuickPark.Client" },
                    { "Jwt:ExpirationMinutes", "60" },
                    { "Cookie:Name", "quickpark_auth" },
                    { "Cookie:ExpirationMinutes", "60" }
                };
                config.AddInMemoryCollection(inMemorySettings);
            });
        });
        _output = output;
    }

    [Fact]
    public void SwaggerGenerator_ShouldGenerateSwaggerDocumentWithoutException()
    {
        using var scope = _factory.Services.CreateScope();
        var swaggerProvider = scope.ServiceProvider.GetRequiredService<ISwaggerProvider>();
        
        try
        {
            var doc = swaggerProvider.GetSwagger("v1");
            Assert.NotNull(doc);
        }
        catch (Exception ex)
        {
            _output.WriteLine($"Swagger generation failed: {ex}");
            throw;
        }
    }
}
