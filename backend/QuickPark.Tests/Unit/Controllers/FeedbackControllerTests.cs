using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickPark.API.Controllers;

namespace QuickPark.Tests.Unit.Controllers;

public class FeedbackControllerTests
{
    [Fact]
    public void FeedbackController_ShouldHaveApiControllerAttribute()
    {
        var controllerType = typeof(FeedbackController);

        var attribute = controllerType
            .GetCustomAttributes(
                typeof(ApiControllerAttribute),
                true)
            .FirstOrDefault();

        attribute.Should().NotBeNull();
    }

    [Fact]
    public void FeedbackController_ShouldHaveRouteAttribute()
    {
        var controllerType = typeof(FeedbackController);

        var attribute = controllerType
            .GetCustomAttributes(
                typeof(RouteAttribute),
                true)
            .Cast<RouteAttribute>()
            .FirstOrDefault();

        attribute.Should().NotBeNull();
        attribute!.Template.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void FeedbackController_ShouldInheritFromControllerBase()
    {
        typeof(FeedbackController)
            .Should()
            .BeDerivedFrom<ControllerBase>();
    }

    [Fact]
    public void FeedbackController_ShouldContainHttpGetActions()
    {
        var methods = typeof(FeedbackController)
            .GetMethods()
            .Where(method =>
                method.GetCustomAttributes(
                        typeof(HttpGetAttribute),
                        true)
                    .Any())
            .ToList();

        methods.Should().NotBeEmpty();
    }

    [Fact]
    public void FeedbackController_ShouldContainHttpPostActions()
    {
        var methods = typeof(FeedbackController)
            .GetMethods()
            .Where(method =>
                method.GetCustomAttributes(
                        typeof(HttpPostAttribute),
                        true)
                    .Any())
            .ToList();

        methods.Should().NotBeEmpty();
    }

    [Fact]
    public void FeedbackController_ShouldContainHttpPutOrPatchActions()
    {
        var methods = typeof(FeedbackController)
            .GetMethods()
            .Where(method =>
                method.GetCustomAttributes(
                        typeof(HttpPutAttribute),
                        true)
                    .Any()
                ||
                method.GetCustomAttributes(
                        typeof(HttpPatchAttribute),
                        true)
                    .Any())
            .ToList();

        methods.Should().NotBeEmpty();
    }

    [Fact]
    public void FeedbackController_ShouldContainHttpDeleteActions()
    {
        var methods = typeof(FeedbackController)
            .GetMethods()
            .Where(method =>
                method.GetCustomAttributes(
                        typeof(HttpDeleteAttribute),
                        true)
                    .Any())
            .ToList();

        methods.Should().NotBeEmpty();
    }
}