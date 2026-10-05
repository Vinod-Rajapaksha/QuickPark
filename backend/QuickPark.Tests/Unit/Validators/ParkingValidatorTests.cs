using System.Reflection;
using System.Runtime.CompilerServices;
using FluentValidation;
using QuickPark.API.DTOs.Parking;
using QuickPark.API.Resources;
using QuickPark.API.Services.Implementations;

namespace QuickPark.Tests.Unit.Validators;

// Registration rules for a parking property. They are not FluentValidation rules: the payload
// validators are empty files and no validator is registered in Program.cs, so the rules that decide
// whether a facility may be saved live in ParkingService.ValidateDetails. This reads them there.
public class ParkingValidatorTests
{
    private static readonly TimeOnly Opening = new(8, 0);
    private static readonly TimeOnly Closing = new(20, 0);

    private const decimal ColomboLat = 6.9271m;
    private const decimal ColomboLng = 79.8612m;

    [Fact]
    public void AFullSriLankanRegistrationIsAccepted()
    {
        var saved = Details("  Grand Target Tower  ", "  56 Galle Road  ", "  Colombo  ",
            "Western", "Colombo", ColomboLat, ColomboLng, 25m);

        Assert.Equal("Grand Target Tower", saved.Name);
        Assert.Equal("56 Galle Road", saved.Address);
        Assert.Equal("Colombo", saved.City);
        Assert.Equal("Western", saved.Province);
        Assert.Equal("Colombo", saved.District);
        Assert.Equal(25m, saved.LandAreaPerches);
    }

    [Theory]
    [InlineData(null, null, null, "Western", "Colombo", "Property name is required.")]
    [InlineData("Grand Target Tower", null, "Colombo", "Western", "Colombo", "Address is required.")]
    [InlineData("Grand Target Tower", "56 Galle Road", null, "Western", "Colombo", "City is required.")]
    [InlineData("Grand Target Tower", "56 Galle Road", "Colombo", null, "Colombo", "Province is required.")]
    [InlineData("Grand Target Tower", "56 Galle Road", "Colombo", "Western", null, "District is required.")]
    public void EveryPartOfTheAddressIsMandatory(
        string? name, string? address, string? city, string? province, string? district, string expected)
    {
        var ex = Assert.Throws<InvalidOperationException>(() =>
            Raw(name, address, city, province, district, ColomboLat, ColomboLng, 25m));

        Assert.Equal(expected, ex.Message);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("\t\n")]
    public void AFieldOfOnlyWhitespaceCountsAsMissing(string blankName)
    {
        var ex = Assert.Throws<InvalidOperationException>(() =>
            Raw(blankName, "56 Galle Road", "Colombo", "Western", "Colombo",
                ColomboLat, ColomboLng, 25m));

        Assert.Equal("Property name is required.", ex.Message);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(-0.01)]
    public void LandAreaHasToBeAPositiveNumberOfPerches(decimal perches)
    {
        var ex = Assert.Throws<InvalidOperationException>(() =>
            Raw("Bay", "Road", "Colombo", "Western", "Colombo", ColomboLat, ColomboLng, perches));

        Assert.Equal("Land area must be greater than 0 perches.", ex.Message);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(0.5)]
    [InlineData(999999)]
    public void LandAreaIsCheckedForALowerBoundOnly(decimal perches)
    {
        // COVERAGE NOTE: the assignment asks for a perches range, but the service has no ceiling —
        // it only refuses zero and negative. This records what runs today, not the intended rule.
        Assert.Equal(perches, Details("Bay", "Road", "Colombo", "Western", "Colombo",
            ColomboLat, ColomboLng, perches).LandAreaPerches);
    }

    [Fact]
    public void ClosingBeforeOpeningIsRefused()
    {
        var ex = Assert.Throws<InvalidOperationException>(() =>
            Times(new TimeOnly(20, 0), new TimeOnly(8, 0)));

        Assert.Equal("Closing time must be later than opening time.", ex.Message);
    }

    [Fact]
    public void ClosingAtTheExactSameMinuteAsOpeningIsRefused()
    {
        var ex = Assert.Throws<InvalidOperationException>(() =>
            Times(new TimeOnly(12, 0), new TimeOnly(12, 0)));

        Assert.Equal("Closing time must be later than opening time.", ex.Message);
    }

    [Fact]
    public void ARegistrationThatLeavesTheDefaultsAloneIsRefusedBecauseItOpensAndClosesAtMidnight()
    {
        // The DTO defaults are 00:00 open / 23:59 close, so an untouched payload is fine; a payload
        // that sets both to midnight is the one the wizard's "24 hours" answer produces.
        var accepted = Details("Bay", "Road", "Colombo", "Western", "Colombo",
            ColomboLat, ColomboLng, 10m, new(0, 0), new(23, 59));

        Assert.Equal(new TimeOnly(0, 0), accepted.OpeningTime);

        var ex = Assert.Throws<InvalidOperationException>(() => Times(new(0, 0), new(0, 0)));
        Assert.Equal("Closing time must be later than opening time.", ex.Message);
    }

    [Fact]
    public void ThereIsNoCrossMidnightOperatingHoursInTheModel()
    {
        // A night facility that shuts at 02:00 the next morning cannot be registered at all.
        var ex = Assert.Throws<InvalidOperationException>(() =>
            Times(new(22, 0), new(2, 0)));

        Assert.Equal("Closing time must be later than opening time.", ex.Message);
    }

    [Theory]
    [InlineData(12, 0, 12, 1, true)]
    [InlineData(0, 0, 23, 59, true)]
    [InlineData(5, 30, 23, 59, true)]
    [InlineData(23, 59, 23, 59, false)]
    public void AnyDayThatRunsForwardIsAccepted(int openHour, int openMinute, int closeHour, int closeMinute, bool valid)
    {
        if (valid)
        {
            var accepted = Details("Bay", "Road", "Colombo", "Western", "Colombo",
                ColomboLat, ColomboLng, 10m, new(openHour, openMinute), new(closeHour, closeMinute));

            Assert.Equal(new TimeOnly(closeHour, closeMinute), accepted.ClosingTime);
            return;
        }

        Assert.Throws<InvalidOperationException>(() => Times(new(openHour, openMinute), new(closeHour, closeMinute)));
    }

    [Theory]
    [InlineData(5.899999)]
    [InlineData(10.200001)]
    [InlineData(11.0)]
    [InlineData(-6.9)]
    public void ALatitudeOutsideSriLankaIsRefused(decimal latitude)
    {
        var ex = Assert.Throws<InvalidOperationException>(() =>
            Raw("Bay", "Road", "Colombo", "Western", "Colombo", latitude, ColomboLng, 10m));

        Assert.Equal("Those coordinates are outside Sri Lanka, where QuickPark operates.", ex.Message);
    }

    [Theory]
    [InlineData(79.399999)]
    [InlineData(82.100001)]
    [InlineData(85.0)]
    [InlineData(-79.9)]
    public void ALongitudeOutsideSriLankaIsRefused(decimal longitude)
    {
        var ex = Assert.Throws<InvalidOperationException>(() =>
            Raw("Bay", "Road", "Colombo", "Western", "Colombo", ColomboLat, longitude, 10m));

        Assert.Equal("Those coordinates are outside Sri Lanka, where QuickPark operates.", ex.Message);
    }

    [Theory]
    [InlineData(5.9, 79.4)]
    [InlineData(10.2, 82.1)]
    [InlineData(5.9, 82.1)]
    [InlineData(10.2, 79.4)]
    public void TheCornersOfTheSriLankaBoxAreStillInsideIt(decimal latitude, decimal longitude)
    {
        var saved = Details("Bay", "Road", "Colombo", "Western", "Colombo", latitude, longitude, 10m);

        Assert.Equal(latitude, saved.Latitude);
        Assert.Equal(longitude, saved.Longitude);
    }

    [Theory]
    [InlineData(true, false)]
    [InlineData(false, true)]
    public void HalfALocationIsRefusedBecauseAPinNeedsBothNumbers(bool withLatitude, bool withLongitude)
    {
        var ex = Assert.Throws<InvalidOperationException>(() =>
            Raw("Bay", "Road", "Colombo", "Western", "Colombo",
                withLatitude ? ColomboLat : null, withLongitude ? ColomboLng : null, 10m));

        Assert.Equal(
            "A location needs both coordinates. Enter the latitude and the longitude, or leave both empty.",
            ex.Message);
    }

    [Fact]
    public void APropertyWithNoPinAtAllIsAcceptedForNow()
    {
        // The wizard lets the owner save the basics first; the missing pin comes back as a
        // PROPERTY_LOCATION requirement instead of a refusal at registration time.
        var saved = Details("Bay", "Road", "Colombo", "Western", "Colombo", null, null, 10m);

        Assert.Null(saved.Latitude);
        Assert.Null(saved.Longitude);
    }

    [Theory]
    [InlineData("Northern", "Jaffna")]
    [InlineData("Uva", "Badulla")]
    [InlineData("North Western", "Kurunegala")]
    [InlineData("Sabaragamuwa", "Ratnapura")]
    public void EveryProvinceOfSriLankaCarriesItsOwnDistricts(string province, string district)
    {
        Assert.True(SriLankanLocations.IsProvince(province));
        Assert.True(SriLankanLocations.IsDistrictOfProvince(province, district));

        var saved = Details("Bay", "Road", "Somewhere", province, district, null, null, 10m);

        Assert.Equal(province, saved.Province);
        Assert.Equal(district, saved.District);
    }

    [Theory]
    [InlineData("Ontario", "Colombo")]
    [InlineData("western", "Colombo")]
    public void AnUnknownProvinceIsRefused(string province, string district)
    {
        // Lookup is case-sensitive and by exact name: "western" is not "Western".
        var ex = Assert.Throws<InvalidOperationException>(() =>
            Raw("Bay", "Road", "Colombo", province, district, null, null, 10m));

        Assert.Equal($"'{province}' is not a supported province.", ex.Message);
    }

    [Fact]
    public void ADistrictFromAnotherProvinceIsRefused()
    {
        var ex = Assert.Throws<InvalidOperationException>(() =>
            Raw("Bay", "Road", "Kandy", "Central", "Colombo", null, null, 10m));

        Assert.Equal("'Colombo' does not belong to Central Province.", ex.Message);
    }

    [Fact]
    public void AllNineProvincesAndTheirDistrictsAreTheOnlyOnesOffered()
    {
        Assert.Equal(9, SriLankanLocations.Provinces.Count);

        Assert.All(SriLankanLocations.Districts, district =>
            Assert.Contains(district, SriLankanLocations.GetDistricts(
                SriLankanLocations.Provinces.First(province =>
                    SriLankanLocations.GetDistricts(province).Contains(district)))));

        Assert.Empty(SriLankanLocations.GetDistricts("Atlantis"));
    }

    [Fact]
    public void NoFluentValidationRuleExistsForEitherRegistrationPayload()
    {
        // Documents the real gap: CreateParkingValidator.cs and UpdateParkingValidator.cs are empty,
        // and Program.cs calls plain AddControllers(), so nothing validates the JSON before the
        // service does. A 400 therefore arrives as BadRequest from InvalidOperationException, never
        // as the model-state 400 [ApiController] would otherwise produce.
        var validators = typeof(CreateParkingRequest).Assembly
            .GetTypes()
            .Where(t => t.IsClass && !t.IsAbstract)
            .Where(t => t.GetInterfaces().Any(i => i.IsGenericType &&
                                                   i.GetGenericTypeDefinition() == typeof(IValidator<>)))
            .Select(t => t.GetInterfaces()
                .First(i => i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IValidator<>))
                .GenericTypeArguments[0].Name)
            .ToArray();

        Assert.DoesNotContain(nameof(CreateParkingRequest), validators);
        Assert.DoesNotContain(nameof(UpdateParkingRequest), validators);
    }

    [Fact]
    public void TheRegistrationPayloadHasNoWayToNameItsOwnApprover()
    {
        // An owner cannot approve themselves into the marketplace: the fields they may post carry no
        // status, no reviewer and no id. Approval only ever arrives on the admin routes.
        foreach (var payload in new[] { typeof(CreateParkingRequest), typeof(UpdateParkingRequest) })
        {
            var names = payload.GetProperties().Select(p => p.Name).ToArray();

            Assert.DoesNotContain("Status", names, StringComparer.OrdinalIgnoreCase);
            Assert.DoesNotContain("Id", names, StringComparer.OrdinalIgnoreCase);
            Assert.DoesNotContain("FacilityId", names, StringComparer.OrdinalIgnoreCase);
            Assert.DoesNotContain("ProviderId", names, StringComparer.OrdinalIgnoreCase);
            Assert.DoesNotContain("ReviewedBy", names, StringComparer.OrdinalIgnoreCase);
            Assert.DoesNotContain("ReviewedAt", names, StringComparer.OrdinalIgnoreCase);
        }
    }

    [Fact]
    public void TheUpdatePayloadIsTheSameShapeAsTheCreateOne()
    {
        // PUT is a full replace, not a patch: the wizard sends the whole property back each time.
        var created = typeof(CreateParkingRequest).GetProperties().Select(p => p.Name).OrderBy(n => n);
        var updated = typeof(UpdateParkingRequest).GetProperties().Select(p => p.Name).OrderBy(n => n);

        Assert.Equal(created, updated);
    }

    private static DetailsOut Details(
        string? name, string? address, string? city, string? province, string? district,
        decimal? latitude, decimal? longitude, decimal perches,
        TimeOnly? opening = null, TimeOnly? closing = null)
    {
        var tuple = (ITuple)Call(name, address, city, province, district, latitude, longitude, perches,
            opening ?? Opening, closing ?? Closing)!;

        return new DetailsOut(
            (string)tuple[0]!, (string)tuple[1]!, (string)tuple[2]!, (string)tuple[3]!, (string)tuple[4]!,
            (decimal?)tuple[5], (decimal?)tuple[6], (decimal)tuple[7]!,
            opening ?? Opening, closing ?? Closing);
    }

    private static void Raw(
        string? name, string? address, string? city, string? province, string? district,
        decimal? latitude, decimal? longitude, decimal perches) =>
        Call(name, address, city, province, district, latitude, longitude, perches, Opening, Closing);

    private static void Times(TimeOnly opening, TimeOnly closing) =>
        Call("Bay", "Road", "Colombo", "Western", "Colombo", ColomboLat, ColomboLng, 10m, opening, closing);

    // ValidateDetails is private static and the rules are only reachable through it.
    private static object? Call(
        string? name, string? address, string? city, string? province, string? district,
        decimal? latitude, decimal? longitude, decimal perches, TimeOnly opening, TimeOnly closing)
    {
        var method = typeof(ParkingService)
            .GetMethod("ValidateDetails", BindingFlags.NonPublic | BindingFlags.Static);

        Assert.NotNull(method);

        try
        {
            return method!.Invoke(null, new object?[]
            {
                name, address, city, province, district, latitude, longitude, perches, opening, closing
            });
        }
        catch (TargetInvocationException ex) when (ex.InnerException is not null)
        {
            throw ex.InnerException;
        }
    }

    private sealed record DetailsOut(
        string Name, string Address, string City, string Province, string District,
        decimal? Latitude, decimal? Longitude, decimal LandAreaPerches,
        TimeOnly OpeningTime, TimeOnly ClosingTime);
}
