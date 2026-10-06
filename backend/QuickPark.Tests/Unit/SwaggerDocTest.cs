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
        _factory = factory;
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
