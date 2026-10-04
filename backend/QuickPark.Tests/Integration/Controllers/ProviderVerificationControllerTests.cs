using System.Reflection;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using QuickPark.API.Controllers;
using QuickPark.API.DTOs.Providers;
using QuickPark.API.Models;
using QuickPark.API.Services.Interfaces;

namespace QuickPark.Tests.Integration.Controllers;

// "Verify profile (upload NIC)". An owner's identity proof is the one upload that decides whether they
// may trade at all, so the split between what the owner may send and what only an admin may rule on is
// checked on the routes themselves.
public class ProviderVerificationControllerTests
{
    private const string Owner = "PARKING_OWNER";
    private const string Admin = "PLATFORM_ADMIN";

    private static readonly Type Controller = typeof(ProviderVerificationController);

    private static readonly Guid OwnerId = Guid.Parse("77777777-7777-7777-7777-777777777777");
    private const string SignedIn = "99999999-9999-9999-9999-999999999999";

    [Fact]
    public void TheVerificationSurfaceIsFiveRoutesOnItsOwnPrefix()
    {
        var expected = new[]
        {
            "POST api/providers/me/nic",
            "GET api/providers/me/nic-document",
            "GET api/providers/pending",
            "GET api/providers/{userId:guid}/nic-document",
            "PUT api/providers/{userId:guid}/verification-status"
        };

        var routes = RoutesOf(Controller).ToHashSet(StringComparer.OrdinalIgnoreCase);

        Assert.Equal(expected.Length, routes.Count);

        foreach (var route in expected) Assert.Contains(route, routes);
    }

    [Theory]
    [InlineData("UploadMyNic", "POST api/providers/me/nic")]
    [InlineData("GetMyNicDocument", "GET api/providers/me/nic-document")]
    public void OnlyTheOwnerEverHandlesTheirOwnIdentityProof(string actionName, string route)
    {
        Assert.Contains(route, RoutesOf(Controller));
        Assert.Equal(new[] { Owner }, RequiresRoles(Action(actionName)));

        // The owner's half of the surface is addressed through "me" alone, so one owner can never ask
        // for another's document by editing an id into the path.
        Assert.Contains("/me/", route, StringComparison.OrdinalIgnoreCase);
    }

    [Theory]
    [InlineData("GetPendingVerifications", "GET api/providers/pending")]
    [InlineData("GetProviderNicDocument", "GET api/providers/{userId:guid}/nic-document")]
    [InlineData("UpdateVerificationStatus", "PUT api/providers/{userId:guid}/verification-status")]
    public void TheQueueTheProofAndTheVerdictAreTheAdminsAlone(string actionName, string route)
    {
        Assert.Contains(route, RoutesOf(Controller));
        Assert.Equal(new[] { Admin }, RequiresRoles(Action(actionName)));
        Assert.DoesNotContain(Owner, RequiresRoles(Action(actionName)));
    }

    [Fact]
    public void AnOwnerHasNoRouteThatCouldClearTheirOwnVerification()
    {
        // The verdict route is the only write to the verification state and it is admin-gated; nothing
        // an owner can call takes a status at all.
        var ownerRoutes = Actions(Controller)
            .Where(action => RequiresRoles(action).Contains(Owner))
            .Select(action => VerbOf(action) + " " + Join(TemplateOf(Controller), TemplateOf(action), Controller))
            .ToArray();

        Assert.DoesNotContain(ownerRoutes, route => route.Contains("verification-status", StringComparison.OrdinalIgnoreCase));

        Assert.All(Actions(Controller).Where(a => RequiresRoles(a).Contains(Owner)), action =>
            Assert.DoesNotContain(action.GetParameters(), p =>
                p.Name is "status" or "verificationStatus" || p.ParameterType == typeof(ProviderStatus)));
    }

    [Fact]
    public void TheWholeControllerIsSignedInOnlyAndNeverAnonymous()
    {
        Assert.True(Controller.GetCustomAttributes<AuthorizeAttribute>(inherit: false).Any());
        Assert.Empty(Controller.GetCustomAttributes(inherit: false).OfType<AllowAnonymousAttribute>());
        Assert.DoesNotContain(Actions(Controller), action =>
            action.GetCustomAttributes(inherit: false).OfType<AllowAnonymousAttribute>().Any());
    }

    [Fact]
    public void TheNICIsUploadedAsAMultipartFormNotAsJson()
    {
        var upload = Action(nameof(ProviderVerificationController.UploadMyNic));

        var file = Assert.Single(upload.GetParameters().Where(p => p.ParameterType == typeof(IFormFile)));
        Assert.Equal("file", file.Name);
        Assert.True(file.GetCustomAttributes().Any(a => a.GetType().Name == "FromFormAttribute"),
            "The NIC arrives as a form part, which is what the owner's file picker can send.");

        // Nothing else is taken from the caller: the identity belongs to the cookie.
        Assert.Equal(new[] { "file", "ct" }, upload.GetParameters().Select(p => p.Name));
    }

    [Fact]
    public void ANicUploadIsCappedOnTheRouteAtSixMegabytes()
    {
        var upload = Action(nameof(ProviderVerificationController.UploadMyNic));

        var limit = Assert.Single(upload.GetCustomAttributes()
            .Where(a => a.GetType().Name == "RequestSizeLimitAttribute"));

        var rendered = string.Join("|", limit.GetType()
            .GetProperties(BindingFlags.Public | BindingFlags.Instance | BindingFlags.NonPublic)
            .Select(p => { try { return p.GetValue(limit)?.ToString() ?? string.Empty; } catch { return string.Empty; } }));

        Assert.Contains((6 * 1024 * 1024L).ToString(), rendered, StringComparison.Ordinal);
    }

    [Fact]
    public void AnOwnerWithNothingOnFileIsToldSoRatherThanShownAnEmptyAnswer()
    {
        var controller = new ProviderVerificationController(new FakeVerification())
        {
            ControllerContext = Context(Owner)
        };

        var missing = Assert.IsType<NotFoundObjectResult>(controller.GetMyNicDocument(default).Result);

        Assert.Equal("No NIC document has been uploaded.", Message(missing));
    }

    [Fact]
    public void AnOwnerWithProofOnFileGetsTheAddressBack()
    {
        var controller = new ProviderVerificationController(new FakeVerification { NicUrl = "https://proof.invalid/nic/1" })
        {
            ControllerContext = Context(Owner)
        };

        var ok = Assert.IsType<OkObjectResult>(controller.GetMyNicDocument(default).Result);

        // The answer is a one-field envelope rather than the profile, so a leaked response cannot hand
        // out anything besides the address of the document the owner already uploaded.
        Assert.Equal("https://proof.invalid/nic/1", Read(ok.Value!, "url"));
        Assert.Equal(new[] { "url" }, ok.Value!.GetType().GetProperties().Select(p => p.Name));
    }

    [Fact]
    public void AnAdminReviewingAPersonIsGivenTheSameAnswerOrTheSameRefusal()
    {
        var empty = new ProviderVerificationController(new FakeVerification()) { ControllerContext = Context(Admin) };
        Assert.IsType<NotFoundObjectResult>(empty.GetProviderNicDocument(OwnerId, default).Result);

        var present = new ProviderVerificationController(new FakeVerification { NicUrl = "https://proof.invalid/nic/2" })
        {
            ControllerContext = Context(Admin)
        };
        Assert.IsType<OkObjectResult>(present.GetProviderNicDocument(OwnerId, default).Result);
    }

    [Theory]
    [InlineData("SOLD")]
    [InlineData("approve")]
    [InlineData("")]
    [InlineData("   ")]
    public void AnOwnerIsClearedOrBlockedOnlyByANameTheAdminCanGive(string status)
    {
        // "approve" is refused because the guard matches the stored enum name, not a friendly label: a
        // reviewer has to send the exact word the state machine uses.
        var controller = new ProviderVerificationController(new FakeVerification()) { ControllerContext = Context(Admin) };

        var refusal = Assert.IsType<BadRequestObjectResult>(
            controller.UpdateVerificationStatus(OwnerId, new UpdateVerificationStatusRequest { Status = status }, default).Result);

        Assert.Equal("Status must be either APPROVED or REJECTED.", Message(refusal));
    }

    [Theory]
    [InlineData("APPROVED")]
    [InlineData("REJECTED")]
    [InlineData("PENDING")]
    public void TwoWordsAreTheVerdictAndAThirdIsSilentlyAdmitted(string status)
    {
        // COVERAGE NOTE: the guard is Enum.TryParse without an IsDefined check, so "PENDING" — the state
        // the upload itself sets and the message never offers — passes the gate and reaches the service.
        // An admin can therefore park an owner back in the queue instead of deciding. This records what
        // runs today rather than the intended two-word rule.
        var fake = new FakeVerification();
        var controller = new ProviderVerificationController(fake) { ControllerContext = Context(Admin) };

        var result = controller.UpdateVerificationStatus(OwnerId, new UpdateVerificationStatusRequest { Status = status }, default).Result;

        Assert.IsNotType<BadRequestObjectResult>(result);
        Assert.Equal("UpdateVerificationStatusAsync", Assert.Single(fake.Calls).Method);
    }

    [Fact]
    public void TheVerdictIsAboutTheOwnerNamedInTheRouteAndByTheAdminInTheCookie()
    {
        // The two ids never come from the same place: the subject is addressed, the decider is proved.
        var fake = new FakeVerification();
        var controller = new ProviderVerificationController(fake) { ControllerContext = Context(Admin) };

        controller.UpdateVerificationStatus(
            OwnerId, new UpdateVerificationStatusRequest { Status = "REJECTED", Remarks = "The NIC is unreadable." }, default).Wait();

        var call = Assert.Single(fake.Calls);

        Assert.Equal("UpdateVerificationStatusAsync", call.Method);
        Assert.Equal(OwnerId, call.Args[0]);
        Assert.Equal(ProviderStatus.REJECTED, call.Args[1]);
        Assert.Equal("The NIC is unreadable.", call.Args[2]);
        Assert.Equal(Guid.Parse(SignedIn), call.Args[3]);
    }

    [Fact]
    public void TheAdminPayloadCarriesAChoiceAndANoteAndNothingElse()
    {
        Assert.Equal(new[] { "Remarks", "Status" },
            typeof(UpdateVerificationStatusRequest).GetProperties().Select(p => p.Name).OrderBy(n => n).ToArray());
    }

    [Fact]
    public void AnEmptyQueueIsAnAnswerNotAnError()
    {
        var controller = new ProviderVerificationController(new FakeVerification()) { ControllerContext = Context(Admin) };

        Assert.IsType<OkObjectResult>(controller.GetPendingVerifications(default).Result);
    }

    [Theory]
    [InlineData("UploadMyNic")]
    [InlineData("GetMyNicDocument")]
    [InlineData("UpdateVerificationStatus")]
    public void AVerificationRouteCalledWithNoAccountInTheCookieIsTurnedAway(string actionName)
    {
        var controller = new ProviderVerificationController(null!)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        var method = Action(actionName);
        var arguments = method.GetParameters()
            .Select(p => p.ParameterType switch
            {
                _ when p.ParameterType == typeof(Guid) => (object?)OwnerId,
                _ when p.ParameterType == typeof(IFormFile) => null,
                _ when p.ParameterType == typeof(CancellationToken) => default(CancellationToken),
                _ when p.ParameterType == typeof(UpdateVerificationStatusRequest) => new UpdateVerificationStatusRequest { Status = "APPROVED" },
                _ => null
            })
            .ToArray();

        Assert.IsType<UnauthorizedResult>(((Task<IActionResult>)method.Invoke(controller, arguments)!).Result);
    }

    [Fact]
    public void UploadingTheProofIsWhatPutsTheOwnerInTheQueue()
    {
        // The owner's own upload does not choose a state: it takes no status from the caller, so the
        // PENDING verdict is the service's to set and the queue is the admin's to read.
        var fake = new FakeVerification();
        var controller = new ProviderVerificationController(fake) { ControllerContext = Context(Owner) };

        controller.UploadMyNic(null!, default).Wait();

        var call = Assert.Single(fake.Calls);
        Assert.Equal("UploadNicDocumentAsync", call.Method);
        Assert.Equal(Guid.Parse(SignedIn), call.Args[0]);
    }

    private static string? Read(object payload, string name) =>
        (string?)payload.GetType().GetProperty(name)?.GetValue(payload);

    private static string Message(ObjectResult result) =>
        (string)result.Value!.GetType().GetProperty("message")!.GetValue(result.Value)!;

    private static ControllerContext Context(string role)
    {
        var identity = new ClaimsIdentity(authenticationType: role);
        identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, SignedIn));

        return new ControllerContext { HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) } };
    }

    private static MethodInfo Action(string name) =>
        Controller.GetMethod(name, BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly)
        ?? throw new InvalidOperationException($"{Controller.Name} has no action '{name}'.");

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

    // Records the admin's decisions and answers the two reads from a fixed string.
    private sealed class FakeVerification : IProviderVerificationService
    {
        public List<(string Method, object?[] Args)> Calls { get; } = new();

        public string? NicUrl { get; init; }

        public Task<ProviderProfileResponse> UploadNicDocumentAsync(Guid userId, IFormFile file, CancellationToken ct = default)
        {
            Calls.Add((nameof(UploadNicDocumentAsync), new object?[] { userId, file, ct }));
            return Task.FromResult<ProviderProfileResponse>(null!);
        }

        public Task<ProviderProfileResponse> UpdateVerificationStatusAsync(
            Guid userId, ProviderStatus status, string? remarks, Guid adminUserId, CancellationToken ct = default)
        {
            Calls.Add((nameof(UpdateVerificationStatusAsync), new object?[] { userId, status, remarks, adminUserId, ct }));
            return Task.FromResult<ProviderProfileResponse>(null!);
        }

        public Task<IReadOnlyList<ProviderProfileResponse>> GetPendingVerificationsAsync(CancellationToken ct = default)
        {
            Calls.Add((nameof(GetPendingVerificationsAsync), new object?[] { ct }));
            return Task.FromResult<IReadOnlyList<ProviderProfileResponse>>(Array.Empty<ProviderProfileResponse>());
        }

        public Task<string?> GetNicDocumentUrlAsync(Guid userId, CancellationToken ct = default)
        {
            Calls.Add((nameof(GetNicDocumentUrlAsync), new object?[] { userId, ct }));
            return Task.FromResult(NicUrl);
        }
    }
}
