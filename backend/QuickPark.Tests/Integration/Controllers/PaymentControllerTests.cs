using System.Reflection;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using QuickPark.API.Controllers;
using QuickPark.API.Data;
using QuickPark.API.DTOs.Payments;

namespace QuickPark.Tests.Integration.Controllers;

// The security shape of the money API, checked where it is decided: on the routes themselves.
public class PaymentControllerTests
{

    [Fact]
    public void PaymentsController_ExposesExactlyTheAgreedRoutes()
    {
        var expected = new[]
        {
            "GET api/payments/admin",
            "POST api/payments/card/checkout",
            "POST api/payments/card/confirm",
            "POST api/payments/create",
            "GET api/payments/me",
            "GET api/payments/provider",
            "GET api/payments/reservation/{reservationId:guid}",
            "GET api/payments/{paymentId:guid}",
            "POST api/payments/{paymentId:guid}/cash/confirm",
            "POST api/payments/{paymentId:guid}/refund",
            "POST api/payments/webhook"
        };

        // Routing ignores case, so [controller] publishing "Payments" is the same route the frontend calls as "payments".
        var routes = RoutesOf(typeof(PaymentsController)).ToHashSet(StringComparer.OrdinalIgnoreCase);

        Assert.Equal(expected.Length, routes.Count);

        foreach (var route in expected) Assert.Contains(route, routes);
    }

    [Fact]
    public void MoneyReadRoutes_AreNotDuplicatedAcrossControllers()
    {
        // One way to ask each question: if a second controller grows an earnings route, this is where it gets caught.
        var all = RoutesOf(typeof(ProviderEarningsController))
            .Concat(RoutesOf(typeof(CommissionController)))
            .Concat(RoutesOf(typeof(ReportsController)))
            .ToArray();

        var routes = all.ToHashSet(StringComparer.OrdinalIgnoreCase);

        Assert.Equal(all.Length, routes.Count);

        foreach (var route in new[]
        {
            "GET api/provider/earnings",
            "GET api/provider/transactions",
            "GET api/provider/commissions",
            "GET api/provider/cash-commission",
            "GET api/commission",
            "POST api/commission/{paymentId:guid}/cash-commission/settle",
            "GET api/reports/provider",
            "GET api/reports/platform"
        })
        {
            Assert.Contains(route, routes);
        }
    }

    [Theory]
    [InlineData(typeof(PaymentsController))]
    [InlineData(typeof(ProviderEarningsController))]
    [InlineData(typeof(CommissionController))]
    [InlineData(typeof(ReportsController))]
    public void EveryMoneyRouteRequiresAnAccount(Type controller)
    {
        foreach (var action in MoneyActions(controller))
        {
            var openToTheWorld = action.GetCustomAttribute<AllowAnonymousAttribute>() is not null;

            if (openToTheWorld)
            {
                // The gateway webhook carries its own credential, which is why it is the only exception.
                Assert.Equal(nameof(PaymentsController.Webhook), action.Name);
                continue;
            }

            Assert.True(
                RequiresRoles(action, controller).Count > 0 || ClassRequiresAuthentication(controller),
                $"{controller.Name}.{action.Name} can be reached without being signed in.");
        }
    }

    [Theory]
    [InlineData("Create", "DRIVER")]
    [InlineData("CheckoutCard", "DRIVER")]
    [InlineData("ConfirmCard", "DRIVER")]
    [InlineData("GetMyPayments", "DRIVER")]
    [InlineData("ConfirmCash", "PARKING_OWNER")]
    [InlineData("GetProviderPayments", "PARKING_OWNER")]
    [InlineData("Refund", "PLATFORM_ADMIN")]
    [InlineData("GetAdminPayments", "PLATFORM_ADMIN")]
    [InlineData("Webhook", "")]
    public void PaymentRoutes_CarryTheRoleThatIsAllowedToUseThem(string actionName, string expectedRole)
    {
        var action = typeof(PaymentsController).GetMethod(actionName)!;

        var roles = RequiresRoles(action, typeof(PaymentsController));

        Assert.Equal(
            expectedRole.Length == 0 ? Array.Empty<string>() : new[] { expectedRole },
            roles);
        Assert.Equal(expectedRole.Length == 0, action.GetCustomAttribute<AllowAnonymousAttribute>() is not null);
    }

    [Fact]
    public void TheThreeWritesBelongToThreeDifferentPrincipals()
    {
        // The owner says cash arrived, the driver says the card went through, and only the admin can clear a commission. Nobody holds all three.
        Assert.Equal("PARKING_OWNER", Assert.Single(
            RequiresRoles(typeof(PaymentsController).GetMethod(nameof(PaymentsController.ConfirmCash))!,
                typeof(PaymentsController))));

        Assert.Equal("DRIVER", Assert.Single(
            RequiresRoles(typeof(PaymentsController).GetMethod(nameof(PaymentsController.ConfirmCard))!,
                typeof(PaymentsController))));

        Assert.Equal("PLATFORM_ADMIN", Assert.Single(
            RequiresRoles(typeof(CommissionController).GetMethod(nameof(CommissionController.SettleCashCommission))!,
                typeof(CommissionController))));
    }

    [Theory]
    [InlineData(typeof(CreatePaymentRequest))]
    [InlineData(typeof(CardCheckoutRequest))]
    [InlineData(typeof(ConfirmCardPaymentRequest))]
    [InlineData(typeof(CashConfirmationRequest))]
    [InlineData(typeof(RefundPaymentRequest))]
    [InlineData(typeof(SettleCommissionRequest))]
    public void RequestPayloads_CannotCarryAnAmountOrARate(Type payload)
    {
        var moneyFields = payload.GetProperties()
            .Where(p => p.PropertyType == typeof(decimal) || p.PropertyType == typeof(decimal?))
            .Select(p => p.Name)
            .ToArray();

        Assert.True(moneyFields.Length == 0,
            $"{payload.Name} lets a client post {string.Join(", ", moneyFields)}. The amount and the rate come from the server.");
    }

    [Fact]
    public void CreatingAPaymentAsksForNothingButTheBookingAndTheMethod()
    {
        Assert.Equal(
            new[] { "PaymentMethod", "ReservationId" },
            typeof(CreatePaymentRequest).GetProperties().Select(p => p.Name).OrderBy(n => n).ToArray());
    }

    [Fact]
    public async Task ARequestWithNoAccountInTheCookieIsTurnedAway()
    {
        var payments = new PaymentsController(Context(), Config()) { ControllerContext = AnonymousContext() };
        var earnings = new ProviderEarningsController(Context()) { ControllerContext = AnonymousContext() };
        var reports = new ReportsController(Context()) { ControllerContext = AnonymousContext() };

        Assert.IsType<UnauthorizedResult>(await payments.Create(new CreatePaymentRequest(), default));
        Assert.IsType<UnauthorizedResult>(await payments.ConfirmCard(new ConfirmCardPaymentRequest(), default));
        Assert.IsType<UnauthorizedResult>(await payments.ConfirmCash(Guid.NewGuid(), null, default));
        Assert.IsType<UnauthorizedResult>(await payments.Refund(Guid.NewGuid(), null, default));
        Assert.IsType<UnauthorizedResult>(await payments.GetById(Guid.NewGuid(), default));
        Assert.IsType<UnauthorizedResult>(await payments.GetForReservation(Guid.NewGuid(), default));
        Assert.IsType<UnauthorizedResult>(await payments.GetMyPayments(null, default));
        Assert.IsType<UnauthorizedResult>(await earnings.GetEarnings(default));
        Assert.IsType<UnauthorizedResult>(await earnings.GetTransactions(null, default));
        Assert.IsType<UnauthorizedResult>(await earnings.GetCashCommission(default));
        Assert.IsType<UnauthorizedResult>(await reports.GetProviderRevenue(null, null, false, default));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("v1.cGF5bWU.000000000000")]
    public async Task TheGatewayRouteRefusesAConfirmationItCannotVerify(string? token)
    {
        // The webhook has no identity behind it, so the only thing that can pay a booking is a token this backend's own key signed.
        var payments = new PaymentsController(Context(), Config()) { ControllerContext = AnonymousContext() };

        var result = Assert.IsType<BadRequestObjectResult>(
            await payments.Webhook(new ConfirmCardPaymentRequest { CallbackToken = token }, default));

        Assert.Equal(StatusCodes.Status400BadRequest, result.StatusCode);
        Assert.False(result.Value is null, "The refusal says why, so an operator can read it.");
    }

    private static AppDbContext Context() =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=127.0.0.1;Port=1;Database=quickpark_never_connected;Username=none;Password=none")
            .Options);

    private static IConfiguration Config() => new ConfigurationBuilder().Build();

    private static ControllerContext AnonymousContext() => new() { HttpContext = new DefaultHttpContext() };

    private static IEnumerable<string> RoutesOf(Type controller) =>
        MoneyActions(controller).Select(action =>
        {
            var verb = action.GetCustomAttributes()
                .Select(a => VerbOf(a.GetType().Name))
                .First(v => v is not null)!;

            // [controller] expands to "Payments"; routing ignores case, so the assertions compare case-insensitively.
            return $"{verb} {Join(TemplateOf(controller), TemplateOf(action), controller)}";
        }).OrderBy(t => t).ToArray();

    // The verb attributes are read by name and their Template by lookup: this project references the API but not ASP.NET Core's own abstract attribute types.
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

    // [controller] is filled in by MVC from the controller name; the same rule, applied to the raw template.
    private static string Expand(string? template, Type controller)
    {
        if (string.IsNullOrEmpty(template)) return string.Empty;

        var token = controller.Name.EndsWith("Controller", StringComparison.Ordinal)
            ? controller.Name[..^"Controller".Length]
            : controller.Name;

        return template.Replace("[controller]", token);
    }

    private static IEnumerable<MethodInfo> MoneyActions(Type controller) =>
        controller.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly)
            .Where(m => m.GetCustomAttributes().Any(a => VerbOf(a.GetType().Name) is not null));

    // A route may name its roles on the action or on the controller; both count.
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
