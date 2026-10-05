using System.Reflection;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using QuickPark.API.Controllers;
using QuickPark.API.DTOs.Reservations;
using QuickPark.API.Enums;
using QuickPark.Tests.Helpers;

namespace QuickPark.Tests.Integration.Controllers;

// "Monitor reservations" and the owner's answer to a booking. The owner's queue, the four actions they
// can take on it, and the verbs the driver owns are all attribute rules on ReservationsController, so
// they are read here rather than served over HTTP; a live host would need a database.
public class ReservationControllerTests
{
    private const string Owner = "PARKING_OWNER";
    private const string Driver = "DRIVER";
    private const string Admin = "PLATFORM_ADMIN";
    private const string Staff = "PARKING_STAFF";

    private static readonly Type Controller = typeof(ReservationsController);

    [Fact]
    public void TheReservationSurfaceIsExactlyTheDriversBookingAndTheOwnersDesk()
    {
        var expected = new[]
        {
            "POST api/Reservations",
            "GET api/Reservations/me",
            "GET api/Reservations/provider",
            "GET api/Reservations/{id:guid}",
            "POST api/Reservations/{id:guid}/cancel",
            "POST api/Reservations/{id:guid}/approve",
            "POST api/Reservations/{id:guid}/reject",
            "POST api/Reservations/{id:guid}/message",
            "POST api/Reservations/{id:guid}/check-in",
            "POST api/Reservations/{id:guid}/check-out"
        };

        var routes = RoutesOf(Controller).ToHashSet(StringComparer.OrdinalIgnoreCase);

        Assert.Equal(expected.Length, routes.Count);

        foreach (var route in expected) Assert.Contains(route, routes);
    }

    [Theory]
    [InlineData("Approve", "POST api/Reservations/{id:guid}/approve")]
    [InlineData("Reject", "POST api/Reservations/{id:guid}/reject")]
    [InlineData("SendMessage", "POST api/Reservations/{id:guid}/message")]
    public void EveryAnswerOnABookingBelongsToTheParkingOwnerAlone(string actionName, string route)
    {
        Assert.Contains(route, RoutesOf(Controller));
        Assert.Equal(new[] { Owner }, RequiresRoles(Action(actionName)));
    }

    [Theory]
    [InlineData("GetProviderReservations", "GET api/Reservations/provider")]
    [InlineData("CheckIn", "POST api/Reservations/{id:guid}/check-in")]
    [InlineData("CheckOut", "POST api/Reservations/{id:guid}/check-out")]
    public void TheQueueAndTheBayOperationsAreSharedWithTheOwnersFloorStaff(string actionName, string route)
    {
        // Staff work the bay physically, so they read the queue and record arrival and departure.
        // Accepting, refusing or answering a booking stays the owner's, pinned by the test above.
        Assert.Contains(route, RoutesOf(Controller));
        Assert.Equal(new[] { Owner, Staff }, RequiresRoles(Action(actionName)));
    }

    [Theory]
    [InlineData("Create", "POST api/Reservations")]
    [InlineData("GetMyReservations", "GET api/Reservations/me")]
    public void BookingAndTheDriversOwnHistoryBelongToTheDriver(string actionName, string route)
    {
        Assert.Contains(route, RoutesOf(Controller));
        Assert.Equal(new[] { Driver }, RequiresRoles(Action(actionName)));
    }

    [Fact]
    public void AnAdminHasNoWayIntoTheBookingDesk()
    {
        // Approving a driver's booking is the owner's business, not the platform's: no reservation
        // action is ever gated to PLATFORM_ADMIN, and none is left open to every signed-in role.
        var everyRole = EnumerateRoles();

        Assert.DoesNotContain(Admin, everyRole);
        Assert.Equal(new[] { Owner, Driver, Staff }.OrderBy(n => n, StringComparer.Ordinal),
            everyRole.OrderBy(n => n, StringComparer.Ordinal));
    }

    [Fact]
    public void OnlyTheDetailReadAndTheCancelAreSharedBecauseBothSidesNeedThem()
    {
        // A booking is read by whoever made it and by whoever owns the bay, and either side may end it.
        // Neither can be role-gated, so the service is the only thing standing between one account and
        // another person's booking — the route promises nothing on its own.
        var shared = Actions(Controller)
            .Where(action => RequiresRoles(action).Count == 0)
            .Select(action => action.Name)
            .OrderBy(n => n, StringComparer.Ordinal)
            .ToArray();

        Assert.Equal(new[] { "Cancel", "GetById" }, shared);

        Assert.True(ClassRequiresAuthentication(Controller));
    }

    [Fact]
    public void TheOwnerQueueCanBeNarrowedToAPropertyAStateAndADateWindow()
    {
        var monitor = Action(nameof(ReservationsController.GetProviderReservations));

        Assert.Equal(new[] { "facilityId", "status", "from", "to", "ct" },
            monitor.GetParameters().Select(p => p.Name).ToArray());

        // The owner is taken from the cookie, never from the query, so one owner cannot read
        // another's bookings by swapping a facility id into a different account's queue.
        Assert.DoesNotContain(monitor.GetParameters(), p =>
            p.Name is "providerUserId" or "ownerId" or "providerId" or "driverId");
    }

    [Theory]
    [InlineData("SOLD")]
    [InlineData("checked in")]
    [InlineData("PENDING AND CONFIRMED")]
    public void AStateTheQueueDoesNotHaveIsRefusedBeforeItReachesTheDatabase(string status)
    {
        foreach (var actionName in new[] { nameof(ReservationsController.GetProviderReservations), nameof(ReservationsController.GetMyReservations) })
        {
            var result = Invoke(status, actionName);

            var refusal = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal(StatusCodes.Status400BadRequest, refusal.StatusCode);
        }
    }

    [Fact]
    public async Task ACommaSeparatedPairOfStatesIsNotRefusedAndLosesTheFirstOne()
    {
        // COVERAGE NOTE: the guard is Enum.TryParse with an Enum.IsDefined check, and that parser still
        // splits on commas and ORs the numbers together even though ReservationStatus is not a [Flags]
        // enum. PENDING is zero, so "PENDING,CONFIRMED" collapses to CONFIRMED — a defined value, so the
        // IsDefined check passes it. An owner asking for open and approved bookings is shown only the
        // approved ones, with no error to tell them the first half was dropped. This pins what runs today.
        var fake = new FakeParkingService();
        var reservations = new ReservationsController(fake) { ControllerContext = OwnerContext() };

        await reservations.GetProviderReservations(null, "PENDING,CONFIRMED", null, null, default);

        var call = Assert.Single(fake.Calls);

        Assert.Equal("GetProviderReservationsAsync", call.Method);
        Assert.Equal(ReservationStatus.CONFIRMED, Assert.IsType<ReservationStatus>(call.Args[2]));
    }

    [Fact]
    public void TheRefusalNamesEveryStateTheQueueCanActuallyBeFilteredOn()
    {
        var refusal = Assert.IsType<BadRequestObjectResult>(
            Invoke("SOLD", nameof(ReservationsController.GetProviderReservations)));

        var message = Message(refusal);

        foreach (var name in Enum.GetNames<ReservationStatus>()) Assert.Contains(name, message);

        Assert.Equal(Enum.GetNames<ReservationStatus>().Length,
            Enum.GetNames<ReservationStatus>().Count(message.Contains));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void AnAbsentStateFilterMeansTheWholeQueueNotARefusal(string? status)
    {
        // Leaving the filter out is the owner's default view, so it must not be turned into a 400.
        // With no service behind the controller the empty filter falls through to a 500, which is the
        // only proof available offline that the gate let it pass.
        var result = Invoke(status, nameof(ReservationsController.GetProviderReservations));

        Assert.IsNotType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task RejectingABookingIsCancellingItNotADifferentOutcome()
    {
        // The owner's "reject" has no rejection path of its own: it lands on the same service call as
        // the driver's cancel, so a rejected booking is stored as CANCELLED and its bay is freed.
        var fake = new FakeParkingService();
        var reservations = new ReservationsController(fake) { ControllerContext = OwnerContext() };

        var before = fake.Calls.Count;
        await reservations.Reject(Reservation, new CancelReservationRequest { Reason = "No bay free that day." }, default);
        var reject = fake.Calls.Skip(before).Single();

        before = fake.Calls.Count;
        await reservations.Cancel(Reservation, new CancelReservationRequest { Reason = "Plans changed." }, default);
        var cancel = fake.Calls.Skip(before).Single();

        Assert.Equal("CancelReservationAsync", reject.Method);
        Assert.Equal(reject.Method, cancel.Method);

        Assert.Equal(Reservation, reject.Args[1]);
        Assert.Equal("No bay free that day.", reject.Args[2]);
    }

    [Fact]
    public async Task ApprovingAndTheGateBothTakeTheSignedInOwnerAndTheBookingAndNothingElse()
    {
        var fake = new FakeParkingService();
        var reservations = new ReservationsController(fake) { ControllerContext = OwnerContext() };

        var owner = UserId();

        await reservations.Approve(Reservation, default);
        await reservations.CheckIn(Reservation, default);
        await reservations.CheckOut(Reservation, default);

        Assert.Equal(new[] { "ApproveReservationAsync", "CheckInAsync", "CheckOutAsync" },
            fake.Calls.Select(c => c.Method));

        Assert.All(fake.Calls, call =>
        {
            Assert.Equal(owner, call.Args[0]);
            Assert.Equal(Reservation, call.Args[1]);
            Assert.Equal(3, call.Args.Length);
        });
    }

    [Fact]
    public async Task TheMessageToTheDriverCarriesItsTextAndNothingThatCouldRewriteTheBooking()
    {
        var fake = new FakeParkingService();
        var reservations = new ReservationsController(fake) { ControllerContext = OwnerContext() };

        var before = fake.Calls.Count;
        await reservations.SendMessage(
            Reservation, new SendProviderMessageRequest { Message = "Arrive after 6, we shift the van bay." }, default);

        var call = fake.Calls.Skip(before).Single();

        Assert.Equal("SendProviderMessageAsync", call.Method);
        Assert.Equal(UserId(), call.Args[0]);
        Assert.Equal(Reservation, call.Args[1]);
        Assert.Equal("Arrive after 6, we shift the van bay.", call.Args[2]);

        Assert.Equal(new[] { "Message" },
            typeof(SendProviderMessageRequest).GetProperties().Select(p => p.Name));
    }

    [Fact]
    public void NoOwnerActionCanSubstituteForTheBookingItIsActingOn()
    {
        // Approving, checking in and checking out are transitions the service decides. The owner gets
        // to name which booking and, for a refusal, why — nothing else, so no verb on this controller
        // can rewrite a price, a state or a bay number.
        Assert.All(OwnerWriteActions(), action => Assert.Equal(
            new[] { typeof(Guid), typeof(CancellationToken) },
            action.GetParameters().Select(p => p.ParameterType).Where(t => t != typeof(CancelReservationRequest) && t != typeof(SendProviderMessageRequest)).Distinct()));

        Assert.All(OwnerWriteActions(), action => Assert.DoesNotContain(action.Name, new[] { "Update", "Edit", "Set" }));

        Assert.DoesNotContain(RoutesOf(Controller), route =>
            route.StartsWith("PUT", StringComparison.OrdinalIgnoreCase) ||
            route.StartsWith("PATCH", StringComparison.OrdinalIgnoreCase) ||
            route.StartsWith("DELETE", StringComparison.OrdinalIgnoreCase));
    }

    [Theory]
    [InlineData("Approve")]
    [InlineData("Reject")]
    [InlineData("SendMessage")]
    [InlineData("CheckIn")]
    [InlineData("CheckOut")]
    [InlineData("GetProviderReservations")]
    public async Task AnOwnerDeskActionCalledWithNoAccountInTheCookieIsTurnedAway(string actionName)
    {
        var reservations = new ReservationsController(null!) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };

        var result = actionName switch
        {
            nameof(ReservationsController.GetProviderReservations) =>
                await reservations.GetProviderReservations(null, null, null, null, default),
            nameof(ReservationsController.SendMessage) =>
                await reservations.SendMessage(Guid.NewGuid(), new SendProviderMessageRequest(), default),
            nameof(ReservationsController.Reject) =>
                await reservations.Reject(Guid.NewGuid(), new CancelReservationRequest(), default),
            _ => await InvokeNoBody(actionName, reservations)
        };

        Assert.IsType<UnauthorizedResult>(result);
    }

    [Fact]
    public async Task ACancelledBookingThatDoesNotExistIsNotASilentSuccess()
    {
        // The detail read answers 404 with its own message rather than an empty 200, so a driver
        // polling a booking that was never made is told so.
        var reservations = new ReservationsController(new FakeParkingService())
        {
            ControllerContext = OwnerContext()
        };

        Assert.IsType<NotFoundObjectResult>(await reservations.GetById(Guid.NewGuid(), default));
    }

    [Fact]
    public void TheServiceRefusalBecomesTheStatusCodeTheOwnerSees()
    {
        // Every owner action wraps the service in the same four-arm mapping, so a rules refusal is a
        // 400 and never a 500 the owner reads as a fault in their own account.
        Assert.Equal(404, StatusOf(new KeyNotFoundException("no such booking")));
        Assert.Equal(401, StatusOf(new UnauthorizedAccessException("not your booking")));
        Assert.Equal(400, StatusOf(new InvalidOperationException("that booking has already ended")));
        Assert.Equal(500, StatusOf(new Exception("the database fell over")));
    }

    private static int StatusOf(Exception exception)
    {
        var reservations = new ReservationsController(new FakeParkingService(exception))
        {
            ControllerContext = OwnerContext()
        };

        // Every refusal the service raises arrives as an ObjectResult carrying its own status code,
        // including the three typed helpers, which all derive from it.
        return ((ObjectResult)reservations.Approve(Guid.NewGuid(), default).Result).StatusCode ?? 0;
    }

    private static Task<IActionResult> InvokeNoBody(string actionName, ReservationsController controller)
    {
        var method = Action(actionName);
        var arguments = method.GetParameters()
            .Select(p => p.ParameterType == typeof(Guid)
                ? (object?)Guid.NewGuid()
                : p.ParameterType == typeof(CancellationToken)
                    ? (object?)default(CancellationToken)
                    : null)
            .ToArray();

        return (Task<IActionResult>)method.Invoke(controller, arguments)!;
    }

    private static IActionResult Invoke(string? status, string actionName)
    {
        var reservations = new ReservationsController(null!) { ControllerContext = OwnerContext() };
        var method = Action(actionName);

        var arguments = method.GetParameters()
            .Select(p => (object?)(p.Name switch
            {
                "status" => status,
                "ct" => default(CancellationToken),
                _ => null
            }))
            .ToArray();

        return ((Task<IActionResult>)method.Invoke(reservations, arguments)!).Result;
    }

    private static IEnumerable<MethodInfo> OwnerActions() =>
        Actions(Controller).Where(action => RequiresRoles(action).Contains(Owner));

    private static IEnumerable<MethodInfo> OwnerWriteActions() =>
        OwnerActions().Where(action => action.Name != nameof(ReservationsController.GetProviderReservations));

    private static IEnumerable<string> EnumerateRoles() =>
        Actions(Controller).SelectMany(RequiresRoles).Distinct().ToArray();

    private static MethodInfo Action(string name) =>
        Controller.GetMethod(name, BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly)
        ?? throw new InvalidOperationException($"{Controller.Name} has no action '{name}'.");

    private static string Message(BadRequestObjectResult refusal) =>
        (string)refusal.Value!.GetType().GetProperty("message")!.GetValue(refusal.Value)!;

    private static Guid UserId() => Guid.Parse(User);

    private const string User = "99999999-9999-9999-9999-999999999999";
    private static readonly Guid Reservation = Guid.Parse("88888888-8888-8888-8888-888888888888");

    private static ControllerContext OwnerContext()
    {
        var identity = new ClaimsIdentity(authenticationType: Owner);
        identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, User));

        return new ControllerContext { HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) } };
    }

    private static readonly string[] VerbNames = { "Get", "Post", "Put", "Patch", "Delete" };

    private static IEnumerable<string> RoutesOf(Type controller) =>
        Actions(controller).Select(action => $"{VerbOf(action)} {Join(TemplateOf(controller), TemplateOf(action), controller)}")
            .OrderBy(t => t, StringComparer.Ordinal)
            .ToArray();

    private static string? VerbOf(string attributeTypeName) =>
        VerbNames.FirstOrDefault(v => attributeTypeName == $"Http{v}Attribute")?.ToUpperInvariant();

    private static string? VerbOf(MethodInfo action) =>
        action.GetCustomAttributes().Select(a => VerbOf(a.GetType().Name)).FirstOrDefault(v => v is not null);

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

    private static IEnumerable<MethodInfo> Actions(Type controller) =>
        controller.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly)
            .Where(m => VerbOf(m) is not null);

    private static IReadOnlyList<string> RequiresRoles(MethodInfo action) =>
        action.GetCustomAttributes<AuthorizeAttribute>(inherit: false)
            .Concat(Controller.GetCustomAttributes<AuthorizeAttribute>(inherit: false))
            .Where(a => !string.IsNullOrWhiteSpace(a.Roles))
            .SelectMany(a => a.Roles!.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            .Distinct()
            .ToArray();

    private static bool ClassRequiresAuthentication(Type controller) =>
        controller.GetCustomAttributes<AuthorizeAttribute>(inherit: false).Any();
}
