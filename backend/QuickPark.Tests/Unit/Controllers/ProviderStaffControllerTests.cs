using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickPark.API.Controllers;

namespace QuickPark.Tests.Unit.Controllers;

public class ProviderStaffControllerTests
{
    [Fact]
    public void ProviderStaffController_ShouldHaveApiControllerAttribute()
    {
        var controllerType =
            typeof(ProviderStaffController);

        var attribute = controllerType
            .GetCustomAttributes(
                typeof(ApiControllerAttribute),
                true)
            .FirstOrDefault();

        attribute.Should().NotBeNull();
    }

    [Fact]
    public void ProviderStaffController_ShouldHaveCorrectRoute()
    {
        var controllerType =
            typeof(ProviderStaffController);

        var attribute = controllerType
            .GetCustomAttributes(
                typeof(RouteAttribute),
                true)
            .Cast<RouteAttribute>()
            .FirstOrDefault();

        attribute.Should().NotBeNull();

        attribute!.Template.Should()
            .Be("api/provider/staff");
    }

    [Fact]
    public void ProviderStaffController_ShouldRequireAuthorization()
    {
        var controllerType =
            typeof(ProviderStaffController);

        var attribute = controllerType
            .GetCustomAttributes(
                typeof(AuthorizeAttribute),
                true)
            .Cast<AuthorizeAttribute>()
            .FirstOrDefault();

        attribute.Should().NotBeNull();
    }

    [Fact]
    public void ProviderStaffController_ShouldRequireParkingOwnerRole()
    {
        var controllerType =
            typeof(ProviderStaffController);

        var attribute = controllerType
            .GetCustomAttributes(
                typeof(AuthorizeAttribute),
                true)
            .Cast<AuthorizeAttribute>()
            .FirstOrDefault();

        attribute.Should().NotBeNull();

        attribute!.Roles.Should()
            .Be("PARKING_OWNER");
    }

    [Fact]
    public void Create_ShouldHaveHttpPostAttribute()
    {
        var method =
            typeof(ProviderStaffController)
            .GetMethod("Create");

        method.Should().NotBeNull();

        method!
            .GetCustomAttributes(
                typeof(HttpPostAttribute),
                true)
            .Should()
            .NotBeEmpty();
    }

    [Fact]
    public void GetAll_ShouldHaveHttpGetAttribute()
    {
        var method =
            typeof(ProviderStaffController)
            .GetMethod("GetAll");

        method.Should().NotBeNull();

        method!
            .GetCustomAttributes(
                typeof(HttpGetAttribute),
                true)
            .Should()
            .NotBeEmpty();
    }

    [Fact]
    public void Update_ShouldHaveHttpPutAttribute()
    {
        var method =
            typeof(ProviderStaffController)
            .GetMethod("Update");

        method.Should().NotBeNull();

        var attribute = method!
            .GetCustomAttributes(
                typeof(HttpPutAttribute),
                true)
            .Cast<HttpPutAttribute>()
            .FirstOrDefault();

        attribute.Should().NotBeNull();

        attribute!.Template.Should()
            .Be("{staffId:guid}");
    }

    [Fact]
    public void UpdateStatus_ShouldHaveHttpPatchAttribute()
    {
        var method =
            typeof(ProviderStaffController)
            .GetMethod("UpdateStatus");

        method.Should().NotBeNull();

        var attribute = method!
            .GetCustomAttributes(
                typeof(HttpPatchAttribute),
                true)
            .Cast<HttpPatchAttribute>()
            .FirstOrDefault();

        attribute.Should().NotBeNull();

        attribute!.Template.Should()
            .Be("{staffId:guid}/status");
    }

    [Fact]
    public void UpdateAssignment_ShouldHaveHttpPatchAttribute()
    {
        var method =
            typeof(ProviderStaffController)
            .GetMethod("UpdateAssignment");

        method.Should().NotBeNull();

        var attribute = method!
            .GetCustomAttributes(
                typeof(HttpPatchAttribute),
                true)
            .Cast<HttpPatchAttribute>()
            .FirstOrDefault();

        attribute.Should().NotBeNull();

        attribute!.Template.Should()
            .Be("{staffId:guid}/assignment");
    }

    [Fact]
    public void ProviderStaffController_ShouldInheritFromControllerBase()
    {
        typeof(ProviderStaffController)
            .Should()
            .BeDerivedFrom<ControllerBase>();
    }

    [Fact]
    public void ProviderStaffController_ShouldExposeFiveApiActions()
    {
        var methods =
            typeof(ProviderStaffController)
            .GetMethods()
            .Where(method =>
                method.GetCustomAttributes(
                    typeof(HttpGetAttribute),
                    true).Any()
                ||
                method.GetCustomAttributes(
                    typeof(HttpPostAttribute),
                    true).Any()
                ||
                method.GetCustomAttributes(
                    typeof(HttpPutAttribute),
                    true).Any()
                ||
                method.GetCustomAttributes(
                    typeof(HttpPatchAttribute),
                    true).Any())
            .ToList();

        methods.Should().HaveCount(5);
    }
}