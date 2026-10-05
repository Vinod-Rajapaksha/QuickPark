using System.Reflection;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using QuickPark.API.Controllers;
using QuickPark.API.DTOs.Reservations;
using QuickPark.API.Enums;
using QuickPark.API.Services.Interfaces;

namespace QuickPark.Tests.Integration.Controllers;

// The driver's booking surface: the URLs a driver may use, the role each owner-side route names,
// how a claim becomes a user id, and which HTTP status each service refusal turns into.
public class ReservationControllerTests
{
    private static readonly Type Bookings = typeof(ReservationsController);

    // ---- The route table ----

    [Fact]
    public void ReservationsController_ExposesExactlyTheAgreedRoutes()
    {
        var expected = new[]
        {
            "POST api/reservations",
            "GET api/reservations/me",
            "GET api/reservations/provider",
            "GET api/reservations/{id:guid}",
            "POST api/reservations/{id:guid}/cancel",
            "POST api/reservations/{id:guid}/approve",
            "POST api/reservations/{id:guid}/reject",
            "POST api/reservations/{id:guid}/message",
            "POST api/reservations/{id:guid}/check-in",
            "POST api/reservations/{id:guid}/check-out"
        };

        var routes = RoutesOf(Bookings).ToHashSet(StringComparer.OrdinalIgnoreCase);

        Assert.Equal(expected.Length, routes.Count);

        foreach (var route in expected) Assert.Contains(route, routes);
    }

    [Fact]
    public void TheDriverReadsTheirOwnBookings_NotEveryones()
    {
        var routes = RoutesOf(Bookings).ToHashSet(StringComparer.OrdinalIgnoreCase);

        Assert.Contains("GET api/reservations/me", routes);
        Assert.Contains("GET api/reservations/provider", routes);
        Assert.DoesNotContain("GET api/reservations", routes);
    }

    [Fact]
    public void ABookingADriverHasMadeCannotBeEditedOrDeletedThroughThisApi()
    {
        var writable = RoutesOf(Bookings)
            .Where(route => route.StartsWith("PUT", StringComparison.OrdinalIgnoreCase) ||
                            route.StartsWith("PATCH", StringComparison.OrdinalIgnoreCase) ||
                            route.StartsWith("DELETE", StringComparison.OrdinalIgnoreCase))
            .ToArray();

        // Cancelling is the only change a driver may make to a booking that already exists.
        Assert.True(writable.Length == 0,
            $"ReservationsController also offers {string.Join(", ", writable)}.");

        Assert.Contains("POST api/reservations/{id:guid}/cancel",
            RoutesOf(Bookings).ToHashSet(StringComparer.OrdinalIgnoreCase));
    }

    // ---- Who may reach what ----

    [Theory]
    [InlineData(nameof(ReservationsController.Create), "DRIVER")]
    [InlineData(nameof(ReservationsController.GetMyReservations), "DRIVER")]
    [InlineData(nameof(ReservationsController.GetProviderReservations), "PARKING_OWNER,PARKING_STAFF")]
    [InlineData(nameof(ReservationsController.Approve), "PARKING_OWNER")]
    [InlineData(nameof(ReservationsController.Reject), "PARKING_OWNER")]
    [InlineData(nameof(ReservationsController.SendMessage), "PARKING_OWNER")]
    [InlineData(nameof(ReservationsController.CheckIn), "PARKING_OWNER,PARKING_STAFF")]
    [InlineData(nameof(ReservationsController.CheckOut), "PARKING_OWNER,PARKING_STAFF")]
    public void EveryRouteThatIsNotTheDriversOwn_NamesTheRoleThatMayUseIt(
        string actionName, string expectedRoles)
    {
        var action = ActionOf(actionName);

        Assert.Equal(
            expectedRoles.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries),
            RequiresRoles(action, Bookings));

        Assert.True(ClassRequiresAuthentication(Bookings));
        Assert.Null(action.GetCustomAttribute<AllowAnonymousAttribute>());
    }

    [Theory]
    [InlineData(nameof(ReservationsController.GetById))]
    [InlineData(nameof(ReservationsController.Cancel))]
    public void OpeningAndCancellingOneBooking_AreGuardedByTheServiceNotByARole(string actionName)
    {
        // Both routes answer any signed-in role; which booking may be touched is decided per row.
        Assert.Empty(RequiresRoles(ActionOf(actionName), Bookings));
        Assert.True(ClassRequiresAuthentication(Bookings));
    }

    [Fact]
    public void OnlyTheDriverRoleMayMakeABooking()
    {
        var create = ActionOf(nameof(ReservationsController.Create));

        Assert.Equal(new[] { "DRIVER" }, RequiresRoles(create, Bookings));

        // A provider booking a bay on their own property is a different route and a different member's work.
        Assert.DoesNotContain(RoutesOf(Bookings), route =>
            route.StartsWith("POST", StringComparison.OrdinalIgnoreCase) &&
            route.Contains("provider", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task EveryBookingRouteTurnsAwayAnAnonymousCaller()
    {
        var reservations = new ReservationsController(Mock.Of<IParkingService>())
        {
            ControllerContext = AnonymousContext()
        };

        var id = Guid.NewGuid();

        Assert.IsType<UnauthorizedResult>(await reservations.Create(new CreateReservationRequest(), default));
        Assert.IsType<UnauthorizedResult>(await reservations.GetMyReservations(null, null, null, default));
        Assert.IsType<UnauthorizedResult>(
            await reservations.GetProviderReservations(null, null, null, null, default));
        Assert.IsType<UnauthorizedResult>(await reservations.GetById(id, default));
        Assert.IsType<UnauthorizedResult>(await reservations.Cancel(id, null, default));
        Assert.IsType<UnauthorizedResult>(await reservations.Approve(id, default));
        Assert.IsType<UnauthorizedResult>(await reservations.Reject(id, null, default));
        Assert.IsType<UnauthorizedResult>(
            await reservations.SendMessage(id, new SendProviderMessageRequest(), default));
        Assert.IsType<UnauthorizedResult>(await reservations.CheckIn(id, default));
        Assert.IsType<UnauthorizedResult>(await reservations.CheckOut(id, default));
    }

    // ---- The cookie claim becomes the driver id ----

    [Fact]
    public async Task TheDriverWhoSignsIn_IsTheDriverTheServiceIsToldAbout()
    {
        var driverId = Guid.NewGuid();
        var service = new Mock<IParkingService>();
        service.Setup(s => s.GetDriverReservationsAsync(driverId, null, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<ReservationResponse>());

        var reservations = new ReservationsController(service.Object) { ControllerContext = SignedInAs(driverId) };

        Assert.IsType<OkObjectResult>(await reservations.GetMyReservations(null, null, null, default));

        service.Verify(s =>
            s.GetDriverReservationsAsync(driverId, null, null, null, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task AnAccountNamedSomethingThatIsNotAReference_IsTurnedAway()
    {
        var reservations = new ReservationsController(Mock.Of<IParkingService>())
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                    {
                        new Claim(ClaimTypes.NameIdentifier, "driver-42")
                    }, "test"))
                }
            }
        };

        Assert.IsType<UnauthorizedResult>(await reservations.GetMyReservations(null, null, null, default));
        Assert.IsType<UnauthorizedResult>(await reservations.GetById(Guid.NewGuid(), default));
    }

    [Fact]
    public async Task ABookingIsMadeInTheNameOfTheSignedInDriverNeverOfOneTheBodyNames()
    {
        var driverId = Guid.NewGuid();
        var request = new CreateReservationRequest { FacilityId = Guid.NewGuid(), VehicleTypeId = Guid.NewGuid() };
        var made = new ReservationResponse { ReservationId = Guid.NewGuid(), DriverId = driverId };

        var service = new Mock<IParkingService>();
        service.Setup(s => s.CreateReservationAsync(driverId, request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(made);

        var reservations = new ReservationsController(service.Object) { ControllerContext = SignedInAs(driverId) };

        var result = Assert.IsType<ObjectResult>(await reservations.Create(request, default));

        Assert.Equal(StatusCodes.Status201Created, result.StatusCode);
        Assert.Same(made, result.Value);
        service.Verify(s => s.CreateReservationAsync(driverId, request, It.IsAny<CancellationToken>()), Times.Once);
    }

    // ---- A status in the query string ----

    [Theory]
    [InlineData("settled")]
    [InlineData("IN_PROGRESS")]
    [InlineData("all")]
    public async Task AStatusTheBookingListDoesNotOffer_IsRefusedBeforeAnythingIsRead(string status)
    {
        var service = new Mock<IParkingService>();
        var reservations = new ReservationsController(service.Object)
        {
            ControllerContext = SignedInAs(Guid.NewGuid())
        };

        var result = Assert.IsType<BadRequestObjectResult>(
            await reservations.GetMyReservations(status, null, null, default));

        Assert.Equal(StatusCodes.Status400BadRequest, result.StatusCode);
        Assert.Equal(
            "status must be one of PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT, COMPLETED, CANCELLED, NOSHOW.",
            MessageOf(result.Value));

        service.Verify(s => s.GetDriverReservationsAsync(It.IsAny<Guid>(), It.IsAny<ReservationStatus?>(),
            It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task AStatusSpelledAnyWayStillMeansTheSameBookingList()
    {
        var driverId = Guid.NewGuid();
        var service = new Mock<IParkingService>();
        service.Setup(s => s.GetDriverReservationsAsync(
                driverId, ReservationStatus.CONFIRMED, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<ReservationResponse>());

        var reservations = new ReservationsController(service.Object) { ControllerContext = SignedInAs(driverId) };

        Assert.IsType<OkObjectResult>(await reservations.GetMyReservations("confirmed", null, null, default));

        service.Verify(s => s.GetDriverReservationsAsync(
            driverId, ReservationStatus.CONFIRMED, null, null, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task NoStatusAtAllMeansEveryBookingTheDriverHas()
    {
        var driverId = Guid.NewGuid();
        var service = new Mock<IParkingService>();
        service.Setup(s => s.GetDriverReservationsAsync(
                driverId, null, It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<ReservationResponse>());

        var reservations = new ReservationsController(service.Object) { ControllerContext = SignedInAs(driverId) };

        await reservations.GetMyReservations("   ", null, null, default);

        service.Verify(s =>
            s.GetDriverReservationsAsync(driverId, null, null, null, It.IsAny<CancellationToken>()), Times.Once);
    }

    // ---- What each refusal looks like to the driver ----

    [Fact]
    public async Task ABookingRefusedByTheRulesComesBackAsABadRequestThatSaysWhy()
    {
        var service = new Mock<IParkingService>();
        service.Setup(s => s.CreateReservationAsync(It.IsAny<Guid>(), It.IsAny<CreateReservationRequest>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("This property is not open for reservations."));

        var reservations = new ReservationsController(service.Object)
        {
            ControllerContext = SignedInAs(Guid.NewGuid())
        };

        var result = Assert.IsType<BadRequestObjectResult>(
            await reservations.Create(new CreateReservationRequest(), default));

        Assert.Equal(StatusCodes.Status400BadRequest, result.StatusCode);
        Assert.Equal("This property is not open for reservations.", MessageOf(result.Value));
    }

    [Fact]
    public async Task BookingAPropertyNobodyRegisteredIsAMissingResourceNotACrash()
    {
        var service = new Mock<IParkingService>();
        service.Setup(s => s.CreateReservationAsync(It.IsAny<Guid>(), It.IsAny<CreateReservationRequest>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new KeyNotFoundException("Parking property not found."));

        var reservations = new ReservationsController(service.Object)
        {
            ControllerContext = SignedInAs(Guid.NewGuid())
        };

        var result = Assert.IsType<NotFoundObjectResult>(
            await reservations.Create(new CreateReservationRequest(), default));

        Assert.Equal(StatusCodes.Status404NotFound, result.StatusCode);
        Assert.Equal("Parking property not found.", MessageOf(result.Value));
    }

    [Fact]
    public async Task ABookingThatOpensNothingSaysSoAsANotFound()
    {
        var service = new Mock<IParkingService>();
        service.Setup(s => s.GetReservationAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ReservationResponse?)null);

        var reservations = new ReservationsController(service.Object)
        {
            ControllerContext = SignedInAs(Guid.NewGuid())
        };

        var result = Assert.IsType<NotFoundObjectResult>(await reservations.GetById(Guid.NewGuid(), default));

        Assert.Equal(StatusCodes.Status404NotFound, result.StatusCode);
        Assert.Equal("Reservation not found.", MessageOf(result.Value));
    }

    [Fact]
    public async Task OpeningAnotherDriversBookingIsRefusedAsUnauthorisedNotAsForbidden()
    {
        var service = new Mock<IParkingService>();
        service.Setup(s => s.GetReservationAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new UnauthorizedAccessException("You can only view your own reservations."));

        var reservations = new ReservationsController(service.Object)
        {
            ControllerContext = SignedInAs(Guid.NewGuid())
        };

        var result = Assert.IsType<UnauthorizedObjectResult>(await reservations.GetById(Guid.NewGuid(), default));

        Assert.Equal(StatusCodes.Status401Unauthorized, result.StatusCode);
        Assert.Equal("You can only view your own reservations.", MessageOf(result.Value));
    }

    [Fact]
    public async Task CancellingIsRefusedInTheSameWordsTheRulesUse()
    {
        var service = new Mock<IParkingService>();
        service.Setup(s => s.CancelReservationAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException(
                "This reservation has already started and can no longer be cancelled."));

        var reservations = new ReservationsController(service.Object)
        {
            ControllerContext = SignedInAs(Guid.NewGuid())
        };

        var result = Assert.IsType<BadRequestObjectResult>(await reservations.Cancel(
            Guid.NewGuid(), new CancelReservationRequest { Reason = "Plans changed" }, default));

        Assert.Equal(
            "This reservation has already started and can no longer be cancelled.",
            MessageOf(result.Value));
    }

    [Fact]
    public async Task ACancellationCarriesTheDriversReasonAndNothingElse()
    {
        var driverId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();
        var cancelled = new ReservationResponse { ReservationId = bookingId, Status = "CANCELLED" };

        var service = new Mock<IParkingService>();
        service.Setup(s => s.CancelReservationAsync(driverId, bookingId, "Plans changed", It.IsAny<CancellationToken>()))
            .ReturnsAsync(cancelled);

        var reservations = new ReservationsController(service.Object) { ControllerContext = SignedInAs(driverId) };

        var result = Assert.IsType<OkObjectResult>(
            await reservations.Cancel(bookingId, new CancelReservationRequest { Reason = "Plans changed" }, default));

        Assert.Same(cancelled, result.Value);
        Assert.Equal(nameof(ReservationStatus.CANCELLED), ((ReservationResponse)result.Value!).Status);
    }

    [Fact]
    public async Task ACancellationWithNoBodyAtAllStillCancels()
    {
        var driverId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();

        var service = new Mock<IParkingService>();
        service.Setup(s => s.CancelReservationAsync(driverId, bookingId, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ReservationResponse { ReservationId = bookingId });

        var reservations = new ReservationsController(service.Object) { ControllerContext = SignedInAs(driverId) };

        Assert.IsType<OkObjectResult>(await reservations.Cancel(bookingId, null, default));
    }

    [Fact]
    public async Task AFailureInsideTheBookingRoute_NeverRepeatsItsOwnWordsToTheDriver()
    {
        var service = new Mock<IParkingService>();
        service.Setup(s => s.GetDriverReservationsAsync(It.IsAny<Guid>(), It.IsAny<ReservationStatus?>(),
                It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("pg_advisory_xact_lock failed: Password=hunter2"));

        var reservations = new ReservationsController(service.Object)
        {
            ControllerContext = SignedInAs(Guid.NewGuid())
        };

        var result = Assert.IsType<ObjectResult>(await reservations.GetMyReservations(null, null, null, default));

        Assert.Equal(StatusCodes.Status500InternalServerError, result.StatusCode);
        Assert.Equal("An unexpected error occurred.", MessageOf(result.Value));
    }

    // ---- Payload shape ----

    [Fact]
    public void ABookingRequestOffersThePropertyTheVehicleTypeAndTheWindowOnly()
    {
        Assert.Equal(
            new[] { "EndTime", "FacilityId", "SlotId", "StartTime", "VehicleTypeId" },
            typeof(CreateReservationRequest).GetProperties().Select(p => p.Name).OrderBy(n => n).ToArray());
    }

    [Fact]
    public void ABookingRequestCarriesNoMoneyNoPaymentAndNoApprovalState()
    {
        var properties = typeof(CreateReservationRequest).GetProperties();

        Assert.DoesNotContain(properties, p =>
            p.PropertyType == typeof(decimal) || p.PropertyType == typeof(decimal?) ||
            p.Name.Contains("Amount", StringComparison.OrdinalIgnoreCase) ||
            p.Name.Contains("Rate", StringComparison.OrdinalIgnoreCase) ||
            p.Name.Contains("Payment", StringComparison.OrdinalIgnoreCase));

        Assert.DoesNotContain(properties, p =>
            p.Name.Contains("Status", StringComparison.OrdinalIgnoreCase) ||
            p.Name.StartsWith("Driver", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void ACancellationRequestOffersOneReasonAndNothingElse()
    {
        Assert.Equal(
            new[] { "Reason" },
            typeof(CancelReservationRequest).GetProperties().Select(p => p.Name).ToArray());
    }

    // ---- Helpers ----

    private static string MessageOf(object? body) =>
        body?.GetType().GetProperty("message")?.GetValue(body) as string ?? string.Empty;

    private static MethodInfo ActionOf(string actionName) => Bookings.GetMethod(actionName)!;

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
