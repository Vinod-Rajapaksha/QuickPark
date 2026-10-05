using System.Reflection;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using QuickPark.API.Controllers;
using QuickPark.API.DTOs.Parking;
using QuickPark.API.DTOs.Slots;
using QuickPark.API.Services.Interfaces;

namespace QuickPark.Tests.Integration.Controllers;

// Separate class on purpose: ParkingControllerTests covers the owner/admin surface and both suites
// declare private helpers with the same names, so one class cannot hold both.
public class ParkingControllerDiscoveryTests
{
    private static readonly Type Catalogue = typeof(ParkingFacilitiesController);

    [Fact]
    public void ParkingFacilitiesController_ExposesExactlyTheAgreedRoutes()
    {
        var expected = new[]
        {
            "GET api/parkingfacilities",
            "POST api/parkingfacilities",
            "GET api/parkingfacilities/{id:guid}",
            "PUT api/parkingfacilities/{id:guid}",
            "DELETE api/parkingfacilities/{id:guid}",
            "GET api/parkingfacilities/{id:guid}/slots",
            "GET api/parkingfacilities/{id:guid}/documents",
            "POST api/parkingfacilities/{id:guid}/documents",
            "POST api/parkingfacilities/{id:guid}/submit",
            "PUT api/parkingfacilities/{id:guid}/allocations",
            "GET api/parkingfacilities/me",
            "GET api/parkingfacilities/me/{id:guid}",
            "DELETE api/parkingfacilities/documents/{documentId:guid}",
            "GET api/parkingfacilities/registration-options",
            "GET api/parkingfacilities/admin",
            "GET api/parkingfacilities/admin/pending",
            "GET api/parkingfacilities/admin/{id:guid}",
            "PUT api/parkingfacilities/admin/{id:guid}",
            "PUT api/parkingfacilities/admin/{id:guid}/sections/{section}",
            "POST api/parkingfacilities/admin/owner-identity/sync"
        };

        var routes = RoutesOf(Catalogue).ToHashSet(StringComparer.OrdinalIgnoreCase);

        Assert.Equal(expected.Length, routes.Count);

        foreach (var route in expected) Assert.Contains(route, routes);
    }

    [Fact]
    public void ADriverReachesTheCatalogueThroughThreeReadsOnly()
    {
        var routes = RoutesOf(Catalogue).ToHashSet(StringComparer.OrdinalIgnoreCase);

        Assert.Contains("GET api/parkingfacilities", routes);
        Assert.Contains("GET api/parkingfacilities/{id:guid}", routes);
        Assert.Contains("GET api/parkingfacilities/{id:guid}/slots", routes);
    }

    [Theory]
    [InlineData(nameof(ParkingFacilitiesController.Search))]
    [InlineData(nameof(ParkingFacilitiesController.GetById))]
    [InlineData(nameof(ParkingFacilitiesController.GetSlots))]
    public void AnySignedInRole_MayBrowseTheCatalogue(string actionName)
    {
        Assert.True(ClassRequiresAuthentication(Catalogue),
            "The catalogue can be browsed without an account.");

        Assert.Empty(RequiresRoles(ActionOf(Catalogue, actionName), Catalogue));
    }

    [Theory]
    [InlineData(nameof(ParkingFacilitiesController.GetMyFacilities), "PARKING_OWNER")]
    [InlineData(nameof(ParkingFacilitiesController.GetMyFacility), "PARKING_OWNER")]
    [InlineData(nameof(ParkingFacilitiesController.Create), "PARKING_OWNER")]
    [InlineData(nameof(ParkingFacilitiesController.Update), "PARKING_OWNER")]
    [InlineData(nameof(ParkingFacilitiesController.Delete), "PARKING_OWNER")]
    [InlineData(nameof(ParkingFacilitiesController.GetDocuments), "PARKING_OWNER")]
    [InlineData(nameof(ParkingFacilitiesController.UploadDocument), "PARKING_OWNER")]
    [InlineData(nameof(ParkingFacilitiesController.DeleteDocument), "PARKING_OWNER")]
    [InlineData(nameof(ParkingFacilitiesController.GetRegistrationOptions), "PARKING_OWNER")]
    [InlineData(nameof(ParkingFacilitiesController.SaveAllocations), "PARKING_OWNER")]
    [InlineData(nameof(ParkingFacilitiesController.SubmitForReview), "PARKING_OWNER")]
    [InlineData(nameof(ParkingFacilitiesController.GetPendingFacilities), "PLATFORM_ADMIN")]
    [InlineData(nameof(ParkingFacilitiesController.GetFacilitiesForReview), "PLATFORM_ADMIN")]
    [InlineData(nameof(ParkingFacilitiesController.GetFacilityForReview), "PLATFORM_ADMIN")]
    [InlineData(nameof(ParkingFacilitiesController.ReviewFacility), "PLATFORM_ADMIN")]
    [InlineData(nameof(ParkingFacilitiesController.ReviewFacilitySection), "PLATFORM_ADMIN")]
    [InlineData(nameof(ParkingFacilitiesController.SyncOwnerIdentity), "PLATFORM_ADMIN")]
    public void TheOwnersPaperworkAndTheApprovalDesk_NeverAnswerADriver(string actionName, string expectedRole)
    {
        var action = ActionOf(Catalogue, actionName);

        Assert.Equal(new[] { expectedRole }, RequiresRoles(action, Catalogue));
        Assert.Null(action.GetCustomAttribute<AllowAnonymousAttribute>());
    }

    [Fact]
    public void NothingOnTheCatalogue_IsOpenToTheWorld()
    {
        Assert.Null(Catalogue.GetCustomAttribute<AllowAnonymousAttribute>());

        Assert.Empty(RoutedActions(Catalogue)
            .Where(action => action.GetCustomAttribute<AllowAnonymousAttribute>() is not null));
    }

    [Theory]
    [InlineData("GetBoard")]
    [InlineData("GetSlot")]
    [InlineData("UpdateSlotStatus")]
    public void TheOwnersBayBoard_IsNotHowADriverFindsABay(string actionName)
    {
        var board = typeof(ParkingSlotsController);

        Assert.Equal(new[] { "PARKING_OWNER", "PARKING_STAFF" }, RequiresRoles(ActionOf(board, actionName), board));

        // A driver reads bays from the property itself, which is why that route carries no role at all.
        Assert.Empty(RequiresRoles(
            ActionOf(Catalogue, nameof(ParkingFacilitiesController.GetSlots)), Catalogue));
    }

    [Fact]
    public async Task EveryRouteThatNeedsToKnowWhoIsAsking_TurnsAwayAnAnonymousCaller()
    {
        var parking = new ParkingFacilitiesController(Mock.Of<IParkingService>())
        {
            ControllerContext = AnonymousContext()
        };

        var id = Guid.NewGuid();

        Assert.IsType<UnauthorizedResult>(await parking.GetMyFacilities(default));
        Assert.IsType<UnauthorizedResult>(await parking.GetMyFacility(id, default));
        Assert.IsType<UnauthorizedResult>(await parking.Create(new CreateParkingRequest(), default));
        Assert.IsType<UnauthorizedResult>(await parking.Update(id, new UpdateParkingRequest(), default));
        Assert.IsType<UnauthorizedResult>(await parking.Delete(id, default));
        Assert.IsType<UnauthorizedResult>(await parking.GetDocuments(id, default));
        Assert.IsType<UnauthorizedResult>(await parking.UploadDocument(id, null, null, default));
        Assert.IsType<UnauthorizedResult>(await parking.DeleteDocument(id, default));
        Assert.IsType<UnauthorizedResult>(await parking.SaveAllocations(id, new SaveAllocationsRequest(), default));
        Assert.IsType<UnauthorizedResult>(await parking.SubmitForReview(id, default));
        Assert.IsType<UnauthorizedResult>(await parking.ReviewFacility(id, new ReviewFacilityRequest(), default));
        Assert.IsType<UnauthorizedResult>(
            await parking.ReviewFacilitySection(id, "DOCUMENTS", new ReviewFacilitySectionRequest(), default));
    }

    [Fact]
    public async Task TheCatalogueRoutes_AnswerWithExactlyWhatTheCatalogueFound()
    {
        var facility = new ParkingResponse { FacilityId = Guid.NewGuid(), Name = "Fort Park" };
        var bay = new SlotResponse { SlotId = Guid.NewGuid(), SlotNumber = "C-01" };

        var service = new Mock<IParkingService>();
        service.Setup(s => s.SearchApprovedAsync(It.IsAny<ParkingSearchRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[] { facility });
        service.Setup(s => s.GetApprovedFacilityAsync(facility.FacilityId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(facility);
        service.Setup(s => s.GetFacilitySlotsAsync(facility.FacilityId, null, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[] { bay });

        var parking = new ParkingFacilitiesController(service.Object)
        {
            ControllerContext = SignedInAs(Guid.NewGuid())
        };

        var found = Assert.IsType<OkObjectResult>(
            await parking.Search(new ParkingSearchRequest { Name = "fort" }, default));
        Assert.Same(facility, Assert.Single((IReadOnlyList<ParkingResponse>)found.Value!));

        var opened = Assert.IsType<OkObjectResult>(await parking.GetById(facility.FacilityId, default));
        Assert.Same(facility, opened.Value);

        var bays = Assert.IsType<OkObjectResult>(
            await parking.GetSlots(facility.FacilityId, null, null, null, default));
        Assert.Same(bay, Assert.Single((IReadOnlyList<SlotResponse>)bays.Value!));
    }

    [Fact]
    public async Task TheSlotsRoute_HandsTheDriversWholeWindowToTheCatalogue()
    {
        var facilityId = Guid.NewGuid();
        var vehicleTypeId = Guid.NewGuid();
        var from = new DateTime(2026, 3, 9, 10, 0, 0, DateTimeKind.Utc);
        var to = from.AddHours(2);

        var service = new Mock<IParkingService>();
        service.Setup(s => s.GetFacilitySlotsAsync(facilityId, vehicleTypeId, from, to, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<SlotResponse>());

        var parking = new ParkingFacilitiesController(service.Object)
        {
            ControllerContext = SignedInAs(Guid.NewGuid())
        };

        await parking.GetSlots(facilityId, vehicleTypeId, from, to, default);

        service.Verify(s =>
            s.GetFacilitySlotsAsync(facilityId, vehicleTypeId, from, to, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task APropertyThatIsNotInTheCatalogue_IsReportedMissingNotBroken()
    {
        var service = new Mock<IParkingService>();
        service.Setup(s => s.GetApprovedFacilityAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ParkingResponse?)null);

        var parking = new ParkingFacilitiesController(service.Object)
        {
            ControllerContext = SignedInAs(Guid.NewGuid())
        };

        var result = Assert.IsType<NotFoundObjectResult>(await parking.GetById(Guid.NewGuid(), default));

        Assert.Equal(StatusCodes.Status404NotFound, result.StatusCode);
        Assert.Equal("Approved parking property not found.", MessageOf(result.Value));
    }

    [Fact]
    public async Task ARefusalFromTheCatalogueComesBackAsABadRequestThatSaysWhy()
    {
        var service = new Mock<IParkingService>();
        service.Setup(s => s.SearchApprovedAsync(It.IsAny<ParkingSearchRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException(
                "A radius needs a location to measure from. Send latitude and longitude too."));

        var parking = new ParkingFacilitiesController(service.Object)
        {
            ControllerContext = SignedInAs(Guid.NewGuid())
        };

        var result = Assert.IsType<BadRequestObjectResult>(
            await parking.Search(new ParkingSearchRequest { RadiusKm = 5 }, default));

        Assert.Equal(StatusCodes.Status400BadRequest, result.StatusCode);
        Assert.Equal(
            "A radius needs a location to measure from. Send latitude and longitude too.",
            MessageOf(result.Value));
    }

    [Fact]
    public async Task AReferenceToAPropertyNobodyRegisteredIsStillAMissingResource()
    {
        var service = new Mock<IParkingService>();
        service.Setup(s => s.GetFacilitySlotsAsync(It.IsAny<Guid>(), It.IsAny<Guid?>(),
                It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new KeyNotFoundException("Parking property not found."));

        var parking = new ParkingFacilitiesController(service.Object)
        {
            ControllerContext = SignedInAs(Guid.NewGuid())
        };

        var result = Assert.IsType<NotFoundObjectResult>(
            await parking.GetSlots(Guid.NewGuid(), null, null, null, default));

        Assert.Equal(StatusCodes.Status404NotFound, result.StatusCode);
        Assert.Equal("Parking property not found.", MessageOf(result.Value));
    }

    [Fact]
    public async Task AFailureInsideTheCatalogue_NeverRepeatsItsOwnWordsToTheDriver()
    {
        var service = new Mock<IParkingService>();
        service.Setup(s => s.SearchApprovedAsync(It.IsAny<ParkingSearchRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("connection string opened: Password=hunter2"));

        var parking = new ParkingFacilitiesController(service.Object)
        {
            ControllerContext = SignedInAs(Guid.NewGuid())
        };

        var result = Assert.IsType<ObjectResult>(await parking.Search(new ParkingSearchRequest(), default));

        Assert.Equal(StatusCodes.Status500InternalServerError, result.StatusCode);
        Assert.Equal("An unexpected error occurred.", MessageOf(result.Value));
    }

    // ---- Payload shape ----

    [Fact]
    public void ADriverAsksTheCatalogueWithWordsACoordinateAndAWalletBand()
    {
        Assert.Equal(
            new[] { "City", "District", "HasEvCharging", "Latitude", "Longitude", "MaxHourlyRate",
                    "MinHourlyRate", "Name", "Province", "RadiusKm" },
            typeof(ParkingSearchRequest).GetProperties().Select(p => p.Name).OrderBy(n => n).ToArray());
    }

    [Fact]
    public void ASearchCannotPointAtOnePropertyOneVehicleTypeOrAnApprovalState()
    {
        var properties = typeof(ParkingSearchRequest).GetProperties();

        Assert.DoesNotContain(properties, p =>
            p.PropertyType == typeof(Guid) || p.PropertyType == typeof(Guid?));

        Assert.DoesNotContain(properties, p => p.Name.Contains("Status", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void ThePublicBayBoardNamesTheBayNeverTheDriverStandingInIt()
    {
        var personal = typeof(SlotResponse).GetProperties()
            .Where(p => p.Name.StartsWith("Driver", StringComparison.OrdinalIgnoreCase) ||
                        p.Name.Contains("Phone", StringComparison.OrdinalIgnoreCase))
            .Select(p => p.Name)
            .ToArray();

        Assert.True(personal.Length == 0,
            $"SlotResponse publishes {string.Join(", ", personal)} to anyone who asks for a bay.");
    }

    // ---- Helpers ----

    private static string MessageOf(object? body) =>
        body?.GetType().GetProperty("message")?.GetValue(body) as string ?? string.Empty;

    private static MethodInfo ActionOf(Type controller, string actionName) => controller.GetMethod(actionName)!;

    private static ControllerContext AnonymousContext() => new() { HttpContext = new DefaultHttpContext() };

    private static ControllerContext SignedInAs(Guid userId) => new()
    {
        HttpContext = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString())
            }, "test"))
        }
    };

    private static IEnumerable<string> RoutesOf(Type controller) =>
        RoutedActions(controller).Select(action =>
        {
            var verb = action.GetCustomAttributes()
                .Select(a => VerbOf(a.GetType().Name))
                .First(v => v is not null)!;

            return $"{verb} {Join(TemplateOf(controller), TemplateOf(action), controller)}";
        }).OrderBy(t => t).ToArray();

    private static readonly string[] Verbs = { "Get", "Post", "Put", "Patch", "Delete" };

    private static string? VerbOf(string attributeTypeName) =>
        Verbs.FirstOrDefault(v => attributeTypeName == $"Http{v}Attribute")?.ToUpperInvariant();

    private static string? TemplateOf(MemberInfo member) =>
        member.GetCustomAttributes()
            .Select(a => a.GetType().GetProperty("Template")?.GetValue(a) as string)
            .FirstOrDefault(t => !string.IsNullOrEmpty(t));

    private static string Join(string? prefix, string? suffix, Type controller)
    {
        var left = Expand(prefix, controller);
        var right = Expand(suffix, controller);

        return (left, right) switch
        {
            ("", "") => string.Empty,
            (_, "") => left,
            ("", _) => right,
            _ => $"{left}/{right}"
        };
    }

    private static string Expand(string? template, Type controller)
    {
        if (string.IsNullOrEmpty(template)) return string.Empty;

        var token = controller.Name.EndsWith("Controller", StringComparison.Ordinal)
            ? controller.Name[..^"Controller".Length]
            : controller.Name;

        return template.Replace("[controller]", token);
    }

    private static IEnumerable<MethodInfo> RoutedActions(Type controller) =>
        controller.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly)
            .Where(m => m.GetCustomAttributes().Any(a => VerbOf(a.GetType().Name) is not null));

    private static IReadOnlyList<string> RequiresRoles(MethodInfo action, Type controller) =>
        action.GetCustomAttributes<AuthorizeAttribute>(inherit: false)
            .Concat(controller.GetCustomAttributes<AuthorizeAttribute>(inherit: false))
            .Where(a => !string.IsNullOrWhiteSpace(a.Roles))
            .SelectMany(a => a.Roles!.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            .Distinct()
            .ToArray();

    private static bool ClassRequiresAuthentication(Type controller) =>
        controller.GetCustomAttributes<AuthorizeAttribute>(inherit: false).Any();
}
