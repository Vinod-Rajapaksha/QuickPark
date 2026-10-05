using System.Reflection;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using QuickPark.API.Controllers;
using QuickPark.API.DTOs.Parking;
using QuickPark.API.DTOs.Slots;
using QuickPark.API.Enums;

namespace QuickPark.Tests.Integration.Controllers;

// The Parking Owner's facility surface, checked where the contract is decided: on the routes
// themselves. A real host would need a live database, and every rule below is an attribute rule, so
// they are read by reflection rather than served over HTTP.
public class ParkingControllerTests
{
    private const string Owner = "PARKING_OWNER";
    private const string Admin = "PLATFORM_ADMIN";
    private const string Staff = "PARKING_STAFF";

    private static readonly Type Facilities = typeof(ParkingFacilitiesController);
    private static readonly Type Slots = typeof(ParkingSlotsController);

    [Fact]
    public void FacilitiesController_ExposesExactlyTheAgreedRoutes()
    {
        var expected = new[]
        {
            "GET api/ParkingFacilities",
            "GET api/ParkingFacilities/{id:guid}",
            "GET api/ParkingFacilities/{id:guid}/slots",
            "GET api/ParkingFacilities/me",
            "GET api/ParkingFacilities/me/{id:guid}",
            "POST api/ParkingFacilities",
            "PUT api/ParkingFacilities/{id:guid}",
            "DELETE api/ParkingFacilities/{id:guid}",
            "GET api/ParkingFacilities/{id:guid}/documents",
            "POST api/ParkingFacilities/{id:guid}/documents",
            "DELETE api/ParkingFacilities/documents/{documentId:guid}",
            "GET api/ParkingFacilities/registration-options",
            "PUT api/ParkingFacilities/{id:guid}/allocations",
            "POST api/ParkingFacilities/{id:guid}/submit",
            "GET api/ParkingFacilities/admin/pending",
            "GET api/ParkingFacilities/admin",
            "POST api/ParkingFacilities/admin/owner-identity/sync",
            "GET api/ParkingFacilities/admin/{id:guid}",
            "PUT api/ParkingFacilities/admin/{id:guid}",
            "PUT api/ParkingFacilities/admin/{id:guid}/sections/{section}"
        };

        // Routing ignores case, so [controller] publishing "ParkingFacilities" is the same route the
        // frontend calls in lower case.
        var routes = RoutesOf(Facilities).ToHashSet(StringComparer.OrdinalIgnoreCase);

        Assert.Equal(expected.Length, routes.Count);

        foreach (var route in expected) Assert.Contains(route, routes);
    }

    [Theory]
    [InlineData("Create", "POST api/ParkingFacilities", Owner)]
    [InlineData("Update", "PUT api/ParkingFacilities/{id:guid}", Owner)]
    [InlineData("Delete", "DELETE api/ParkingFacilities/{id:guid}", Owner)]
    [InlineData("GetMyFacilities", "GET api/ParkingFacilities/me", Owner)]
    [InlineData("GetMyFacility", "GET api/ParkingFacilities/me/{id:guid}", Owner)]
    [InlineData("GetDocuments", "GET api/ParkingFacilities/{id:guid}/documents", Owner)]
    [InlineData("UploadDocument", "POST api/ParkingFacilities/{id:guid}/documents", Owner)]
    [InlineData("DeleteDocument", "DELETE api/ParkingFacilities/documents/{documentId:guid}", Owner)]
    [InlineData("GetRegistrationOptions", "GET api/ParkingFacilities/registration-options", Owner)]
    [InlineData("SaveAllocations", "PUT api/ParkingFacilities/{id:guid}/allocations", Owner)]
    [InlineData("SubmitForReview", "POST api/ParkingFacilities/{id:guid}/submit", Owner)]
    public void TheProviderRegisterUpdateDeleteAndSubmitRoutesBelongToTheParkingOwner(
        string actionName, string route, string expectedRole)
    {
        Assert.Contains(route, RoutesOf(Facilities));

        Assert.Equal(new[] { expectedRole }, RequiresRoles(Facilities.GetMethod(actionName)!, Facilities));
    }

    [Theory]
    [InlineData("GetPendingFacilities")]
    [InlineData("GetFacilitiesForReview")]
    [InlineData("SyncOwnerIdentity")]
    [InlineData("GetFacilityForReview")]
    [InlineData("ReviewFacility")]
    [InlineData("ReviewFacilitySection")]
    public void TheApprovalSurfaceIsGatedToThePlatformAdminAlone(string actionName)
    {
        var roles = RequiresRoles(Facilities.GetMethod(actionName)!, Facilities);

        Assert.Equal(new[] { Admin }, roles);

        // The owner who brought the property forward cannot be the one who passes it.
        Assert.DoesNotContain(Owner, roles);
    }

    [Fact]
    public void NoProviderRouteSitsUnderTheAdminPrefix()
    {
        // Two route families under one controller: nothing an owner calls can be mistaken for a
        // review call, and nothing a reviewer calls is reachable as a plain property id.
        var adminTemplates = Actions(Facilities).Where(IsAdminAction).Select(TemplateOf).ToArray();
        var providerTemplates = Actions(Facilities).Where(a => !IsAdminAction(a)).Select(TemplateOf).ToArray();

        Assert.All(adminTemplates, template =>
            Assert.StartsWith("admin", template!, StringComparison.OrdinalIgnoreCase));

        Assert.DoesNotContain(adminTemplates,
            template => providerTemplates.Contains(template, StringComparer.OrdinalIgnoreCase));

        // {id:guid} never matches the literal "admin", so the two families cannot collide.
        Assert.All(providerTemplates, template =>
            Assert.False((template ?? "none").Contains("admin", StringComparison.OrdinalIgnoreCase),
                $"Provider route '{template}' collides with the review queue."));
    }

    [Fact]
    public void TheWholeFacilityControllerIsSignedInOnlyAndNeverAnonymous()
    {
        Assert.True(ClassRequiresAuthentication(Facilities),
            "Facility registration must not be readable by an anonymous caller.");

        Assert.Empty(Facilities.GetCustomAttributes(inherit: false).OfType<AllowAnonymousAttribute>());

        Assert.DoesNotContain(Actions(Facilities), action =>
            action.GetCustomAttributes(inherit: false).OfType<AllowAnonymousAttribute>().Any());
    }

    [Fact]
    public void ThePublicPartOfTheFacilityControllerIsTheDriverFacingCatalogueOnly()
    {
        // Only three reads are open to any signed-in account, and they are the marketplace ones.
        var unGated = Actions(Facilities)
            .Where(action => RequiresRoles(action, Facilities).Count == 0)
            .Select(action => action.Name)
            .OrderBy(n => n, StringComparer.Ordinal)
            .ToArray();

        Assert.Equal(new[] { "GetById", "GetSlots", "Search" }, unGated);
    }

    [Fact]
    public void TheOwnerIsTakenFromTheCookieAndNeverFromThePayload()
    {
        // Every facility action resolves the owner from the signed-in id and takes no owner id from
        // the body, so an owner cannot register a property into somebody else's account.
        var namesTheCallerCouldSupply = new[] { "providerUserId", "ownerId", "providerId" };

        var offenders = Actions(Facilities)
            .Where(action => action.Name != nameof(ParkingFacilitiesController.SyncOwnerIdentity))
            .SelectMany(action => action.GetParameters()
                .Where(p => p.ParameterType == typeof(Guid) &&
                            namesTheCallerCouldSupply.Contains(p.Name, StringComparer.OrdinalIgnoreCase))
                .Select(p => $"{action.Name}.{p.Name}"))
            .ToArray();

        Assert.Empty(offenders);
    }

    [Fact]
    public async Task AProviderRouteWithNoAccountInTheCookieIsTurnedAway()
    {
        var facilities = new ParkingFacilitiesController(null!) { ControllerContext = AnonymousContext() };

        Assert.IsType<UnauthorizedResult>(await facilities.Create(new CreateParkingRequest(), default));
        Assert.IsType<UnauthorizedResult>(
            await facilities.Update(Guid.NewGuid(), new UpdateParkingRequest(), default));
        Assert.IsType<UnauthorizedResult>(await facilities.Delete(Guid.NewGuid(), default));
        Assert.IsType<UnauthorizedResult>(await facilities.GetMyFacilities(default));
        Assert.IsType<UnauthorizedResult>(await facilities.GetMyFacility(Guid.NewGuid(), default));
        Assert.IsType<UnauthorizedResult>(await facilities.GetDocuments(Guid.NewGuid(), default));
        Assert.IsType<UnauthorizedResult>(await facilities.DeleteDocument(Guid.NewGuid(), default));
        Assert.IsType<UnauthorizedResult>(
            await facilities.SaveAllocations(Guid.NewGuid(), new SaveAllocationsRequest(), default));
        Assert.IsType<UnauthorizedResult>(await facilities.SubmitForReview(Guid.NewGuid(), default));
        Assert.IsType<UnauthorizedResult>(
            await facilities.ReviewFacility(Guid.NewGuid(), new ReviewFacilityRequest(), default));
    }

    [Fact]
    public void ProofIsUploadedAsAMultipartFormNotAsJson()
    {
        var upload = Facilities.GetMethod(nameof(ParkingFacilitiesController.UploadDocument))!;

        // The file arrives as a form part; only the proof type is named as an explicit [FromForm].
        var file = Assert.Single(upload.GetParameters().Where(p => p.ParameterType == typeof(IFormFile)));
        Assert.Equal("file", file.Name);

        var documentType = Assert.Single(upload.GetParameters().Where(p => p.Name == "documentType"));
        Assert.Equal(typeof(string), documentType.ParameterType);
        Assert.True(documentType.GetCustomAttributes().Any(a => a.GetType().Name == "FromFormAttribute"),
            "documentType is posted beside the file, not read out of a JSON body.");
    }

    [Fact]
    public void OneProofUploadIsCappedOnTheRouteAtSixMegabytes()
    {
        var upload = Facilities.GetMethod(nameof(ParkingFacilitiesController.UploadDocument))!;

        var limit = Assert.Single(upload.GetCustomAttributes()
            .Where(a => a.GetType().Name == "RequestSizeLimitAttribute"));

        // The attribute keeps its number in a claim value rather than a public property, so the whole
        // object is rendered and the byte count looked for in it.
        var rendered = string.Join("|", limit.GetType()
            .GetMembers(BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic)
            .Select(member => Render(member, limit)));

        Assert.True(rendered.Contains((6 * 1024 * 1024L).ToString(), StringComparison.Ordinal),
            $"The route cap is not the six megabytes the upload guard assumes. Found: {rendered}");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("PASSPORT")]
    [InlineData("PROPERTY_PHOTOS")]
    [InlineData("land-document")]
    [InlineData("land owner nic")]
    public async Task OnlyTheNamedProofTypesAreAccepted(string? documentType)
    {
        // The upload refuses a type it cannot name before it looks at the file at all.
        var facilities = new ParkingFacilitiesController(null!) { ControllerContext = OwnerContext() };

        var refusal = Assert.IsType<BadRequestObjectResult>(
            await facilities.UploadDocument(Guid.NewGuid(), documentType, null!, default));

        Assert.Equal(StatusCodes.Status400BadRequest, refusal.StatusCode);
    }

    // COVERAGE NOTE: the guard is Enum.TryParse, which is case-insensitive, ignores surrounding
    // whitespace and reads the raw number of the value. A client posting any of these is not refused,
    // even though the message the owner is shown only ever names the five types in upper case.
    [Theory]
    [InlineData("3")]
    [InlineData(" 3 ")]
    [InlineData("property_photo")]
    [InlineData("PROPERTY_PHOTO")]
    [InlineData("Property_Photo")]
    public async Task TheProofTypeGateIsLenientAboutHowATypeIsSpelled(string documentType)
    {
        var facilities = new ParkingFacilitiesController(null!) { ControllerContext = OwnerContext() };

        var result = await facilities.UploadDocument(Guid.NewGuid(), documentType, null!, default);

        Assert.IsNotType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task TheRefusalOnAnUnknownProofTypeNamesEveryTypeTheOwnerCanSend()
    {
        var facilities = new ParkingFacilitiesController(null!) { ControllerContext = OwnerContext() };

        var refusal = Assert.IsType<BadRequestObjectResult>(
            await facilities.UploadDocument(Guid.NewGuid(), "Aadhaar", null!, default));

        var message = ReadProperty(refusal.Value!, "message") as string;

        Assert.NotNull(message);

        foreach (var name in Enum.GetNames<FacilityDocumentType>()) Assert.Contains(name, message);

        // Five named types and no more: the list the owner is handed is the whole enum.
        Assert.Equal(5, Enum.GetNames<FacilityDocumentType>().Count(name => message.Contains(name)));
    }

    [Fact]
    public async Task TheReviewQueueRefusesAStatusThatIsNotAFacilityState()
    {
        var facilities = new ParkingFacilitiesController(null!) { ControllerContext = OwnerContext() };

        var refusal = Assert.IsType<BadRequestObjectResult>(
            await facilities.GetFacilitiesForReview("SOLD", null, default));

        var message = ReadProperty(refusal.Value!, "message") as string;

        foreach (var name in Enum.GetNames<ParkingStatus>()) Assert.Contains(name, message!);
    }

    [Theory]
    [InlineData("OWNERSHIP")]
    [InlineData("basic information")]
    [InlineData("")]
    public async Task ASectionDecisionIsRefusedUnlessItNamesOneOfTheFourReviewSections(string section)
    {
        var facilities = new ParkingFacilitiesController(null!) { ControllerContext = OwnerContext() };

        Assert.IsType<BadRequestObjectResult>(await facilities.ReviewFacilitySection(
            Guid.NewGuid(), section, new ReviewFacilitySectionRequest { Decision = "APPROVED" }, default));
    }

    [Fact]
    public async Task TheFourSectionsTheAdminCanRuleOnAreTheFourTheOwnerSubmits()
    {
        var facilities = new ParkingFacilitiesController(null!) { ControllerContext = OwnerContext() };

        var refusal = Assert.IsType<BadRequestObjectResult>(
            await facilities.ReviewFacilitySection(
                Guid.NewGuid(), "TAX", new ReviewFacilitySectionRequest { Decision = "APPROVED" }, default));

        var message = (ReadProperty(refusal.Value!, "message") as string)!;

        Assert.Equal(Enum.GetNames<FacilitySection>(),
            message[(message.IndexOf("one of", StringComparison.Ordinal) + "one of".Length)..]
                .TrimEnd('.')
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
    }

    [Fact]
    public void TheWholePropertyDecisionPayloadCarriesOnlyAChoiceAndAReason()
    {
        Assert.Equal(new[] { "Decision", "RejectionReason" },
            typeof(ReviewFacilityRequest).GetProperties().Select(p => p.Name).OrderBy(n => n).ToArray());

        Assert.Equal(new[] { "Decision", "Remarks" },
            typeof(ReviewFacilitySectionRequest).GetProperties().Select(p => p.Name).OrderBy(n => n).ToArray());
    }

    [Fact]
    public void TheOwnerListsWithoutNamingAProviderIdInTheRoute()
    {
        // "me" is the only way to ask for your own properties, so the queue cannot be walked by id.
        var routes = RoutesOf(Facilities);

        Assert.Contains("GET api/ParkingFacilities/me", routes, StringComparer.OrdinalIgnoreCase);
        Assert.DoesNotContain(routes, route => route.Contains("provider", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void SlotsController_ExposesExactlyTheOwnersBayBoard()
    {
        var expected = new[]
        {
            "GET api/ParkingSlots/provider/facilities/{facilityId:guid}",
            "GET api/ParkingSlots/provider/slots/{slotId:guid}",
            "PATCH api/ParkingSlots/provider/slots/{slotId:guid}/status"
        };

        var routes = RoutesOf(Slots).ToHashSet(StringComparer.OrdinalIgnoreCase);

        Assert.Equal(expected.Length, routes.Count);

        foreach (var route in expected) Assert.Contains(route, routes);
    }

    [Fact]
    public void TheBayBoardIsOpenedToTheOwnersFloorCrewAndNobodyElse()
    {
        Assert.True(ClassRequiresAuthentication(Slots));

        Assert.Equal(new[] { Owner, Staff }, ClassRoles(Slots));

        Assert.DoesNotContain(Actions(Slots), action =>
            action.GetCustomAttributes(inherit: false).OfType<AllowAnonymousAttribute>().Any());

        // No action widens the class gate: an action-level [Authorize] names the crew roles too.
        Assert.All(Actions(Slots).Where(a => a.GetCustomAttributes<AuthorizeAttribute>(inherit: false).Any()),
            action => Assert.Equal(new[] { Owner, Staff }, RequiresRoles(action, Slots)));
    }

    [Fact]
    public void ADriverOrAdminTokenCannotReachTheBayBoardBecauseNoRouteOpensItUp()
    {
        // DRIVER and PLATFORM_ADMIN appear nowhere on this controller, so the policy has nothing to
        // match them against; only the owner and the staff working their bays are ever admitted.
        var everyRole = Actions(Slots).SelectMany(a => RequiresRoles(a, Slots))
            .Concat(ClassRoles(Slots))
            .Distinct()
            .ToArray();

        Assert.Equal(new[] { Owner, Staff }, everyRole);
    }

    [Fact]
    public void AManualBayChangeIsAPatchAndCarriesOnlyAStateAndAReason()
    {
        // PATCH, not PUT: the owner flips one field of one bay and rewrites no booking.
        Assert.Contains("PATCH api/ParkingSlots/provider/slots/{slotId:guid}/status", RoutesOf(Slots));

        Assert.Equal(new[] { "Reason", "Status" },
            typeof(UpdateSlotRequest).GetProperties().Select(p => p.Name).OrderBy(n => n).ToArray());
    }

    [Fact]
    public async Task TheBayBoardRefusesACallerWithNoAccount()
    {
        var slots = new ParkingSlotsController(null!) { ControllerContext = AnonymousContext() };

        Assert.IsType<UnauthorizedResult>(await slots.GetBoard(Guid.NewGuid(), null, null, null, null, default));
        Assert.IsType<UnauthorizedResult>(await slots.GetSlot(Guid.NewGuid(), default));
        Assert.IsType<UnauthorizedResult>(
            await slots.UpdateSlotStatus(Guid.NewGuid(), new UpdateSlotRequest(), default));
    }

    [Fact]
    public void TheBayBoardTakesAFilterAndAPairOfDatesButCarriesNoStateOfItsOwn()
    {
        var board = Slots.GetMethod(nameof(ParkingSlotsController.GetBoard))!;

        Assert.Equal(new[] { "facilityId", "vehicleTypeId", "status", "from", "to", "ct" },
            board.GetParameters().Select(p => p.Name).ToArray());

        // Reading the board is a GET: the only write an owner has on a bay is the status PATCH.
        Assert.DoesNotContain(RoutesOf(Slots), route =>
            route.StartsWith("POST", StringComparison.OrdinalIgnoreCase) ||
            route.StartsWith("PUT", StringComparison.OrdinalIgnoreCase) ||
            route.StartsWith("DELETE", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void TheOwnerCannotPublishOrWithdrawTheirOwnProperty()
    {
        // Approving is not one of the owner's verbs: no owner-gated route can set a facility status,
        // and the submit route only hands the property to the admin queue.
        var ownerRoutes = Actions(Facilities)
            .Where(action => RequiresRoles(action, Facilities).Contains(Owner))
            .Select(action => VerbOf(action) + " " + Join(TemplateOf(Facilities), TemplateOf(action), Facilities))
            .ToArray();

        Assert.DoesNotContain(ownerRoutes, route => route.Contains("admin", StringComparison.OrdinalIgnoreCase));

        Assert.DoesNotContain(typeof(CreateParkingRequest).GetProperties(), p =>
            p.Name.Equals("Status", StringComparison.OrdinalIgnoreCase) ||
            p.Name.Equals("DocumentsComplete", StringComparison.OrdinalIgnoreCase) ||
            p.Name.Equals("ReadyForSubmission", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void TheOwnerSeesDocumentCountsAndNeverADocumentUrl()
    {
        // The list and detail responses summarise proof; the upload response alone echoes the stored
        // URL, so a leaked facility list cannot hand out the deed image.
        var summaryNames = typeof(ParkingFacilityDocumentSummary).GetProperties().Select(p => p.Name).ToArray();

        Assert.DoesNotContain("Url", summaryNames);
        Assert.DoesNotContain("PublicId", summaryNames);
        Assert.DoesNotContain("FileName", summaryNames);

        Assert.Contains("Url", typeof(ParkingFacilityDocumentResponse).GetProperties().Select(p => p.Name));
    }

    private static string Render(MemberInfo member, object target)
    {
        try
        {
            return member switch
            {
                PropertyInfo property => property.GetValue(target)?.ToString() ?? string.Empty,
                FieldInfo field => field.GetValue(target)?.ToString() ?? string.Empty,
                _ => string.Empty
            };
        }
        catch (Exception)
        {
            return string.Empty;
        }
    }

    private static object? ReadProperty(object target, string name) =>
        target.GetType().GetProperty(name)?.GetValue(target);

    private static ControllerContext OwnerContext()
    {
        var identity = new ClaimsIdentity(authenticationType: Owner);
        identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()));

        return new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };
    }

    private static ControllerContext AnonymousContext() => new() { HttpContext = new DefaultHttpContext() };

    private static IEnumerable<string> RoutesOf(Type controller) =>
        Actions(controller).Select(action =>
            $"{VerbOf(action)} {Join(TemplateOf(controller), TemplateOf(action), controller)}")
            .OrderBy(t => t, StringComparer.Ordinal)
            .ToArray();

    private static readonly string[] VerbNames = { "Get", "Post", "Put", "Patch", "Delete" };

    // The verb attributes are read by name and their Template by lookup: this project references the
    // API but not ASP.NET Core's own abstract attribute types.
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

    // [controller] is filled in by MVC from the controller name; the same rule, applied to the raw template.
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

    private static bool IsAdminAction(MethodInfo action) =>
        RequiresRoles(action, Facilities).Contains(Admin) ||
        (TemplateOf(action) ?? string.Empty).StartsWith("admin", StringComparison.OrdinalIgnoreCase);

    private static IReadOnlyList<string> RequiresRoles(MethodInfo action, Type controller) =>
        action.GetCustomAttributes<AuthorizeAttribute>(inherit: false)
            .Concat(controller.GetCustomAttributes<AuthorizeAttribute>(inherit: false))
            .Where(a => !string.IsNullOrWhiteSpace(a.Roles))
            .SelectMany(a => a.Roles!.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            .Distinct()
            .ToArray();

    private static IReadOnlyList<string> ClassRoles(Type controller) =>
        controller.GetCustomAttributes<AuthorizeAttribute>(inherit: false)
            .Where(a => !string.IsNullOrWhiteSpace(a.Roles))
            .SelectMany(a => a.Roles!.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            .Distinct()
            .ToArray();

    private static bool ClassRequiresAuthentication(Type controller) =>
        controller.GetCustomAttributes<AuthorizeAttribute>(inherit: false).Any();
}
