using Microsoft.Extensions.DependencyInjection;
using QuickPark.API.Services.Implementations;
using QuickPark.API.Services.Interfaces;
using QuickPark.Tests.Integration.Infrastructure;

namespace QuickPark.Tests.Integration.Controllers;

public class FeedbackControllerTests
    : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public FeedbackControllerTests(
        CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public void FeedbackService_IsRegistered()
    {
        using var scope = _factory.Services.CreateScope();

        var service = scope.ServiceProvider
            .GetService<IFeedbackService>();

        service.Should().NotBeNull();
    }

    [Fact]
    public void FeedbackService_UsesFeedbackServiceImplementation()
    {
        using var scope = _factory.Services.CreateScope();

        var service = scope.ServiceProvider
            .GetRequiredService<IFeedbackService>();

        service.Should().BeOfType<FeedbackService>();
    }

    [Fact]
    public void FeedbackReplyService_IsRegistered()
    {
        using var scope = _factory.Services.CreateScope();

        var service = scope.ServiceProvider
            .GetService<IFeedbackReplyService>();

        service.Should().NotBeNull();
    }

    [Fact]
    public void FeedbackReportService_IsRegistered()
    {
        using var scope = _factory.Services.CreateScope();

        var service = scope.ServiceProvider
            .GetService<IFeedbackReportService>();

        service.Should().NotBeNull();
    }

    [Fact]
    public async Task FeedbackEndpoint_ApplicationStartsSuccessfully()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/feedback");

        response.Should().NotBeNull();
    }
}