using Microsoft.Extensions.Configuration;
using QuickPark.API.DTOs.Parking;
using QuickPark.API.Enums;
using QuickPark.API.Models;
using QuickPark.API.Services.Implementations;
using QuickPark.Tests.Fixtures;
using QuickPark.Tests.Helpers;

namespace QuickPark.Tests.Unit.Services;

public partial class ParkingServiceTests
{
    private const decimal ColomboRate = 500m;
    private const decimal CheapRate = 200m;
    private const decimal PriceyRate = 900m;

    private static DateTime Window(int hour) => new(2026, 3, 1, hour, 0, 0, DateTimeKind.Utc);

    private static ParkingService Discovery(DatabaseFixture fixture) =>
        new(fixture.Context, new ConfigurationBuilder().Build());

    private sealed record Placed(ParkingFacility Facility, VehicleType VehicleType, ParkingProvider Provider);

    private static async Task<Placed> PlaceAsync(
        DatabaseFixture fixture,
        string name,
        ParkingStatus status = ParkingStatus.APPROVED,
        string city = "Colombo",
        string province = "Western",
        string district = "Colombo",
        bool ev = false,
        decimal hourlyRate = ColomboRate,
        int bayCount = 2,
        decimal? latitude = 6.9271m,
        decimal? longitude = 79.8612m)
    {
        var context = fixture.Context;
        var vehicleType = TestDataBuilder.CreateVehicleType();
        var owner = TestDataBuilder.CreateUser($"owner-{Guid.NewGuid():N}@example.com", UserRole.PARKING_OWNER);
        var provider = TestDataBuilder.CreateProvider(owner.Id);
        var facility = TestDataBuilder.CreateFacility(
            provider.Id, name, status, city, province, district, ev, latitude, longitude);

        context.Users.Add(owner);
        context.ParkingProviders.Add(provider);
        context.VehicleTypes.Add(vehicleType);
        context.ParkingFacilities.Add(facility);
        context.ParkingFacilityVehicleTypes.Add(
            TestDataBuilder.CreateAllocation(facility.Id, vehicleType.Id, bayCount, hourlyRate));

        for (var bay = 1; bay <= bayCount; bay++)
        {
            context.ParkingSlots.Add(TestDataBuilder.CreateSlot(facility.Id, vehicleType.Id, $"C-{bay:00}"));
        }

        await context.SaveChangesAsync();

        return new Placed(facility, vehicleType, provider);
    }

    [Fact]
    public async Task Search_FindsAPropertyByName()
    {
        using var fixture = new DatabaseFixture();
        await PlaceAsync(fixture, "Dutch Hospital Parking");

        var found = await Discovery(fixture).SearchApprovedAsync(
            new ParkingSearchRequest { Name = "Dutch Hospital" });

        Assert.Single(found);
        Assert.Equal("Dutch Hospital Parking", found[0].Name);
    }

    [Fact]
    public async Task Search_MatchesANameFragmentWhateverCaseTheDriverTypes()
    {
        using var fixture = new DatabaseFixture();
        await PlaceAsync(fixture, "Fort Parking Garage");

        var service = Discovery(fixture);

        foreach (var name in new[] { "fort", "FORT", "FoRt", "  fort  " })
        {
            var found = await service.SearchApprovedAsync(new ParkingSearchRequest { Name = name });
            Assert.Single(found);
        }
    }

    [Fact]
    public async Task Search_MatchesADestinationCityWhateverCaseTheDriverTypes()
    {
        using var fixture = new DatabaseFixture();
        await PlaceAsync(fixture, "Kandy City Car Park", city: "Kandy");

        var service = Discovery(fixture);

        foreach (var city in new[] { "kandy", "KANDY", "Kan", "KAND"})
        {
            var found = await service.SearchApprovedAsync(new ParkingSearchRequest { City = city });
            Assert.Single(found);
        }
    }

    [Fact]
    public async Task Search_WithNoCriteriaAtAllListsEveryOpenProperty()
    {
        using var fixture = new DatabaseFixture();
        await PlaceAsync(fixture, "Alpha Parking");
        await PlaceAsync(fixture, "Beta Parking", city: "Galle", province: "Southern", district: "Galle");

        var found = await Discovery(fixture).SearchApprovedAsync(new ParkingSearchRequest());

        Assert.Equal(2, found.Count);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("    ")]
    public async Task Search_TreatsBlankCriteriaAsNoFilterRatherThanAsNoResults(string? name)
    {
        using var fixture = new DatabaseFixture();
        await PlaceAsync(fixture, "Open Air Park");

        var found = await Discovery(fixture).SearchApprovedAsync(new ParkingSearchRequest { Name = name });

        Assert.Single(found);
    }

    [Fact]
    public async Task Search_ReturnsNothingWhenNoPropertyMatches()
    {
        using var fixture = new DatabaseFixture();
        await PlaceAsync(fixture, "Pettah Parking");

        var found = await Discovery(fixture).SearchApprovedAsync(
            new ParkingSearchRequest { Name = "nowhere on the map" });

        Assert.Empty(found);
    }

    [Fact]
    public async Task Search_ReturnsEveryPropertyThatMatches()
    {
        using var fixture = new DatabaseFixture();
        await PlaceAsync(fixture, "Tower Parking");
        await PlaceAsync(fixture, "Independent Parking");
        await PlaceAsync(fixture, "Airport Parking");

        var found = await Discovery(fixture).SearchApprovedAsync(new ParkingSearchRequest { Name = "Parking" });

        Assert.Equal(3, found.Count);
    }

    [Fact]
    public async Task Search_MatchesOnCityAndNameTogether()
    {
        using var fixture = new DatabaseFixture();
        await PlaceAsync(fixture, "Fort Parking", city: "Colombo");
        await PlaceAsync(fixture, "Fort Parking", city: "Galle", province: "Southern", district: "Galle");

        var found = await Discovery(fixture).SearchApprovedAsync(
            new ParkingSearchRequest { Name = "Fort", City = "colombo" });

        Assert.Single(found);
        Assert.Equal("Colombo", found[0].City);
    }

    [Theory]
    [InlineData(ParkingStatus.DRAFT)]
    [InlineData(ParkingStatus.PENDING_APPROVAL)]
    [InlineData(ParkingStatus.REJECTED)]
    [InlineData(ParkingStatus.SUSPENDED)]
    public async Task Search_NeverShowsAPropertyTheAdminHasNotPublished(ParkingStatus status)
    {
        using var fixture = new DatabaseFixture();
        await PlaceAsync(fixture, "Hidden Property", status: status);
        await PlaceAsync(fixture, "Listed Property");

        var found = await Discovery(fixture).SearchApprovedAsync(new ParkingSearchRequest { Name = "Property" });

        Assert.Single(found);
        Assert.Equal("Listed Property", found[0].Name);
    }

    [Theory]
    [InlineData(ParkingStatus.DRAFT)]
    [InlineData(ParkingStatus.PENDING_APPROVAL)]
    [InlineData(ParkingStatus.REJECTED)]
    [InlineData(ParkingStatus.SUSPENDED)]
    public async Task ADriverCannotOpenAnUnpublishedPropertyById(ParkingStatus status)
    {
        using var fixture = new DatabaseFixture();
        var placed = await PlaceAsync(fixture, "Not Yet Open", status: status);

        var facility = await Discovery(fixture).GetApprovedFacilityAsync(placed.Facility.Id);

        Assert.Null(facility);
    }

    [Fact]
    public async Task Search_StillFiltersWhenAnApprovedPropertyLaterWithdraws()
    {
        using var fixture = new DatabaseFixture();
        var placed = await PlaceAsync(fixture, "Suspended After Approval");
        var service = Discovery(fixture);

        Assert.Single(await service.SearchApprovedAsync(new ParkingSearchRequest { Name = "After" }));

        placed.Facility.Status = ParkingStatus.SUSPENDED;
        await fixture.Context.SaveChangesAsync();

        Assert.Empty(await service.SearchApprovedAsync(new ParkingSearchRequest { Name = "After" }));
    }

    [Fact]
    public async Task Search_WithTheElectricFilterOnlyReturnsBaysWithCharging()
    {
        using var fixture = new DatabaseFixture();
        await PlaceAsync(fixture, "Green Charge Park", ev: true);
        await PlaceAsync(fixture, "Petrol Only Park");

        var found = await Discovery(fixture).SearchApprovedAsync(
            new ParkingSearchRequest { Name = "Park", HasEvCharging = true });

        Assert.Single(found);
        Assert.True(found[0].HasEvCharging);
    }

    [Fact]
    public async Task Search_WithoutTheElectricFilterReturnsChargingAndPlainProperties()
    {
        using var fixture = new DatabaseFixture();
        await PlaceAsync(fixture, "Green Charge Park", ev: true);
        await PlaceAsync(fixture, "Petrol Only Park");

        var found = await Discovery(fixture).SearchApprovedAsync(
            new ParkingSearchRequest { Name = "Park" });

        Assert.Equal(2, found.Count);
    }

    [Theory]
    [InlineData(200, 2)]
    [InlineData(500, 1)]
    [InlineData(501, 0)]
    public async Task Search_KeepsPropertiesWhoseTariffReachesTheFloor(decimal floor, int expected)
    {
        using var fixture = new DatabaseFixture();
        await PlaceAsync(fixture, "Budget Park", hourlyRate: CheapRate);
        await PlaceAsync(fixture, "Standard Park", hourlyRate: ColomboRate);

        var found = await Discovery(fixture).SearchApprovedAsync(
            new ParkingSearchRequest { Name = "Park", MinHourlyRate = floor });

        Assert.Equal(expected, found.Count);
    }

    [Theory]
    [InlineData(900, 2)]
    [InlineData(500, 1)]
    [InlineData(499, 0)]
    public async Task Search_DropsPropertiesThatCostMoreThanTheCeiling(decimal ceiling, int expected)
    {
        using var fixture = new DatabaseFixture();
        await PlaceAsync(fixture, "Standard Park", hourlyRate: ColomboRate);
        await PlaceAsync(fixture, "Premium Park", hourlyRate: PriceyRate);

        var found = await Discovery(fixture).SearchApprovedAsync(
            new ParkingSearchRequest { Name = "Park", MaxHourlyRate = ceiling });

        Assert.Equal(expected, found.Count);
    }

    [Fact]
    public async Task Search_CombinesLocationNameElectricAndTariffFilters()
    {
        using var fixture = new DatabaseFixture();
        await PlaceAsync(fixture, "Fort EV Park", city: "Colombo", ev: true, hourlyRate: ColomboRate);
        await PlaceAsync(fixture, "Fort EV Park", city: "Kandy", province: "Central", district: "Kandy",
            ev: true, hourlyRate: PriceyRate);
        await PlaceAsync(fixture, "Fort Petrol Park", city: "Colombo", ev: false, hourlyRate: ColomboRate);

        var found = await Discovery(fixture).SearchApprovedAsync(new ParkingSearchRequest
        {
            Name = "Fort",
            City = "colombo",
            HasEvCharging = true,
            MinHourlyRate = 400m,
            MaxHourlyRate = 600m
        });

        Assert.Single(found);
        Assert.Equal("Colombo", found[0].City);
    }

    [Fact]
    public async Task Search_SpreadsThePriceBandBetweenTwoPropertiesAndListsNeither()
    {
        using var fixture = new DatabaseFixture();
        await PlaceAsync(fixture, "Budget Park", hourlyRate: CheapRate);
        await PlaceAsync(fixture, "Premium Park", hourlyRate: PriceyRate);

        var found = await Discovery(fixture).SearchApprovedAsync(
            new ParkingSearchRequest { Name = "Park", MinHourlyRate = 600m, MaxHourlyRate = 700m });

        Assert.Empty(found);
    }

    [Fact]
    public async Task Search_MatchesTheWholeProvinceAndDistrictNameOnly()
    {
        using var fixture = new DatabaseFixture();
        await PlaceAsync(fixture, "Hill Park", city: "Kandy", province: "Central", district: "Kandy");
        await PlaceAsync(fixture, "Sea Park", city: "Galle", province: "Southern", district: "Galle");

        var service = Discovery(fixture);

        Assert.Single(await service.SearchApprovedAsync(
            new ParkingSearchRequest { Province = "CENTRAL", District = "kandy" }));

        Assert.Empty(await service.SearchApprovedAsync(
            new ParkingSearchRequest { Province = "Centra" }));

        Assert.Empty(await service.SearchApprovedAsync(
            new ParkingSearchRequest { District = "Kan" }));
    }

    [Fact]
    public async Task Search_ListsMatchesInNameOrderForTheDriver()
    {
        using var fixture = new DatabaseFixture();
        await PlaceAsync(fixture, "Zebra Park");
        await PlaceAsync(fixture, "Apple Park");
        await PlaceAsync(fixture, "Mango Park");

        var found = await Discovery(fixture).SearchApprovedAsync(new ParkingSearchRequest { Name = "Park" });

        Assert.Equal(new[] { "Apple Park", "Mango Park", "Zebra Park" }, found.Select(f => f.Name));
    }

    [Fact]
    public async Task Search_NearestPropertyComesFirstAndReportsHowFar()
    {
        using var fixture = new DatabaseFixture();
        await PlaceAsync(fixture, "Far Hill Park", latitude: 7.2906m, longitude: 80.6337m);
        await PlaceAsync(fixture, "Near Fort Park", latitude: 6.9310m, longitude: 79.8600m);

        var found = await Discovery(fixture).SearchApprovedAsync(new ParkingSearchRequest
        {
            Latitude = 6.9271m,
            Longitude = 79.8612m
        });

        Assert.Equal(new[] { "Near Fort Park", "Far Hill Park" }, found.Select(f => f.Name));
        Assert.InRange(found[0].DistanceKm!.Value, 0d, 1d);
        Assert.InRange(found[1].DistanceKm!.Value, 80d, 100d);
    }

    [Fact]
    public async Task Search_RadiusKeepsOnlyPropertiesWithinTheDriversReach()
    {
        using var fixture = new DatabaseFixture();
        await PlaceAsync(fixture, "Near Fort Park", latitude: 6.9310m, longitude: 79.8600m);
        await PlaceAsync(fixture, "Far Hill Park", latitude: 7.2906m, longitude: 80.6337m);

        var found = await Discovery(fixture).SearchApprovedAsync(new ParkingSearchRequest
        {
            Latitude = 6.9271m,
            Longitude = 79.8612m,
            RadiusKm = 20
        });

        Assert.Single(found);
        Assert.Equal("Near Fort Park", found[0].Name);
    }

    [Fact]
    public async Task Search_WithoutAReferencePointLeavesTheDistanceUnreported()
    {
        using var fixture = new DatabaseFixture();
        await PlaceAsync(fixture, "Fort Park");

        var found = await Discovery(fixture).SearchApprovedAsync(new ParkingSearchRequest { Name = "Fort" });

        Assert.Null(found[0].DistanceKm);
    }

    [Theory]
    [InlineData(null, null, 10)]
    [InlineData(6.9, null, 10)]
    [InlineData(null, 79.8, 10)]
    public async Task Search_RefusesToMeasureFromHalfALocation(double? latitude, double? longitude, int radiusKm)
    {
        using var fixture = new DatabaseFixture();
        await PlaceAsync(fixture, "Fort Park");

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            Discovery(fixture).SearchApprovedAsync(new ParkingSearchRequest
            {
                Latitude = latitude is double lat ? (decimal)lat : null,
                Longitude = longitude is double lng ? (decimal)lng : null,
                RadiusKm = radiusKm
            }));

        Assert.Contains("latitude and longitude", ex.Message);
    }

    [Fact]
    public async Task Search_RefusesADistanceSearchWithoutCoordinates()
    {
        using var fixture = new DatabaseFixture();
        await PlaceAsync(fixture, "Fort Park");

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            Discovery(fixture).SearchApprovedAsync(new ParkingSearchRequest { RadiusKm = 5 }));

        Assert.Equal(
            "A radius needs a location to measure from. Send latitude and longitude too.", ex.Message);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    public async Task Search_RefusesAReachThatIsNotPositive(int radiusKm)
    {
        using var fixture = new DatabaseFixture();
        await PlaceAsync(fixture, "Fort Park");

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            Discovery(fixture).SearchApprovedAsync(new ParkingSearchRequest
            {
                Latitude = 6.9m,
                Longitude = 79.9m,
                RadiusKm = radiusKm
            }));

        Assert.Equal("radiusKm must be greater than 0.", ex.Message);
    }

    [Theory]
    [InlineData(91, 79.9)]
    [InlineData(6.9, 181)]
    [InlineData(-91, 79.9)]
    [InlineData(6.9, -181)]
    public async Task Search_RefusesACoordinateOffThePlanet(double latitude, double longitude)
    {
        using var fixture = new DatabaseFixture();
        await PlaceAsync(fixture, "Fort Park");

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            Discovery(fixture).SearchApprovedAsync(new ParkingSearchRequest
            {
                Latitude = (decimal)latitude,
                Longitude = (decimal)longitude
            }));

        Assert.Contains("between -90 and 90", ex.Message);
    }

    [Fact]
    public async Task Details_OpenPropertyOpensForAnyDriver()
    {
        using var fixture = new DatabaseFixture();
        var placed = await PlaceAsync(fixture, "Fort Park", bayCount: 3);

        var facility = await Discovery(fixture).GetApprovedFacilityAsync(placed.Facility.Id);

        Assert.NotNull(facility);
        Assert.Equal("Fort Park", facility!.Name);
        Assert.Equal(nameof(ParkingStatus.APPROVED), facility.Status);
        Assert.Equal(3, facility.SlotCount);
    }

    [Fact]
    public async Task Details_UnknownIdGivesTheDriverNothing()
    {
        using var fixture = new DatabaseFixture();

        Assert.Null(await Discovery(fixture).GetApprovedFacilityAsync(Guid.NewGuid()));
    }

    [Fact]
    public async Task Details_HideTheOwnersPaperworkAndWizardFromADriver()
    {
        using var fixture = new DatabaseFixture();
        var placed = await PlaceAsync(fixture, "Fort Park");

        var facility = await Discovery(fixture).GetApprovedFacilityAsync(placed.Facility.Id);

        Assert.NotNull(facility);
        Assert.Empty(facility!.Documents);
        Assert.Empty(facility.Sections);
        Assert.Empty(facility.DocumentRequirements);
        Assert.Empty(facility.MissingRequirements);
        Assert.False(facility.DocumentsComplete);
        Assert.False(facility.ReadyForSubmission);
        Assert.Null(facility.RejectionReason);
    }

    [Fact]
    public async Task Details_StillShowTheDriverTheTariffForEachVehicleType()
    {
        using var fixture = new DatabaseFixture();
        var placed = await PlaceAsync(fixture, "Fort Park", hourlyRate: PriceyRate);

        var facility = await Discovery(fixture).GetApprovedFacilityAsync(placed.Facility.Id);

        Assert.Equal(PriceyRate, Assert.Single(facility!.Allocations).HourlyRate);
        Assert.Equal(placed.VehicleType.Name, Assert.Single(facility.SlotGroups).VehicleTypeName);
    }

    [Fact]
    public async Task Bays_FreeBayReadsAvailableForTheWindowTheDriverAskedFor()
    {
        using var fixture = new DatabaseFixture();
        var placed = await PlaceAsync(fixture, "Fort Park", bayCount: 2);

        var bays = await Discovery(fixture).GetFacilitySlotsAsync(
            placed.Facility.Id, placed.VehicleType.Id, Window(10), Window(12));

        Assert.Equal(2, bays.Count);
        Assert.All(bays, bay =>
        {
            Assert.Equal(nameof(SlotStatus.AVAILABLE), bay.EffectiveStatus);
            Assert.True(bay.AvailableForPeriod);
            Assert.Null(bay.BusyFrom);
            Assert.Null(bay.BusyUntil);
        });
    }

    [Fact]
    public async Task Bays_ABookingOverlappingTheWindowIsNotBookableAndSaysWhenItEnds()
    {
        using var fixture = new DatabaseFixture();
        var placed = await PlaceAsync(fixture, "Fort Park", bayCount: 2);
        var bay = fixture.Context.ParkingSlots.Single(s => s.SlotNumber == "C-01");

        fixture.Context.Reservations.Add(TestDataBuilder.CreateReservation(
            Guid.NewGuid(), placed.Facility.Id, placed.Provider.Id, bay.Id, placed.VehicleType.Id,
            Window(11), Window(13), slotNumber: bay.SlotNumber));
        await fixture.Context.SaveChangesAsync();

        var bays = await Discovery(fixture).GetFacilitySlotsAsync(
            placed.Facility.Id, placed.VehicleType.Id, Window(10), Window(12));

        var busy = Assert.Single(bays, bay => bay.SlotNumber == "C-01");
        Assert.False(busy.AvailableForPeriod);
        Assert.Equal(Window(11), busy.BusyFrom);
        Assert.Equal(Window(13), busy.BusyUntil);

        Assert.Single(bays, bay => bay.SlotNumber == "C-02" && bay.AvailableForPeriod);
    }

    [Fact]
    public async Task Bays_AWindowTheDriverAsksForThatOnlyTouchesTheEdgesStaysFree()
    {
        using var fixture = new DatabaseFixture();
        var placed = await PlaceAsync(fixture, "Fort Park", bayCount: 1);
        var bay = fixture.Context.ParkingSlots.Single();

        fixture.Context.Reservations.Add(TestDataBuilder.CreateReservation(
            Guid.NewGuid(), placed.Facility.Id, placed.Provider.Id, bay.Id, placed.VehicleType.Id,
            Window(12), Window(14), slotNumber: bay.SlotNumber));
        await fixture.Context.SaveChangesAsync();

        var bays = await Discovery(fixture).GetFacilitySlotsAsync(
            placed.Facility.Id, placed.VehicleType.Id, Window(10), Window(12));

        Assert.True(Assert.Single(bays).AvailableForPeriod);
    }

    [Fact]
    public async Task Bays_ACancelledBookingFreesItsBayForTheNextDriver()
    {
        using var fixture = new DatabaseFixture();
        var placed = await PlaceAsync(fixture, "Fort Park", bayCount: 1);
        var bay = fixture.Context.ParkingSlots.Single();

        fixture.Context.Reservations.Add(TestDataBuilder.CreateReservation(
            Guid.NewGuid(), placed.Facility.Id, placed.Provider.Id, bay.Id, placed.VehicleType.Id,
            Window(10), Window(12), slotNumber: bay.SlotNumber, status: ReservationStatus.CANCELLED));
        await fixture.Context.SaveChangesAsync();

        var bays = await Discovery(fixture).GetFacilitySlotsAsync(
            placed.Facility.Id, placed.VehicleType.Id, Window(10), Window(12));

        Assert.True(Assert.Single(bays).AvailableForPeriod);
    }

    [Fact]
    public async Task Bays_AnUnpaidBookingHoldsItsBayAndReadsPendingNotReserved()
    {
        using var fixture = new DatabaseFixture();
        var placed = await PlaceAsync(fixture, "Fort Park", bayCount: 1);
        var bay = fixture.Context.ParkingSlots.Single();

        fixture.Context.Reservations.Add(TestDataBuilder.CreateReservation(
            Guid.NewGuid(), placed.Facility.Id, placed.Provider.Id, bay.Id, placed.VehicleType.Id,
            Window(10), Window(12), slotNumber: bay.SlotNumber, status: ReservationStatus.PENDING));
        await fixture.Context.SaveChangesAsync();

        var bays = await Discovery(fixture).GetFacilitySlotsAsync(
            placed.Facility.Id, placed.VehicleType.Id, Window(10), Window(12));

        Assert.Equal(nameof(ReservationStatus.PENDING), Assert.Single(bays).EffectiveStatus);
    }

    [Fact]
    public async Task Bays_AreFilteredToTheVehicleTypeTheDriverIsDriving()
    {
        using var fixture = new DatabaseFixture();
        var placed = await PlaceAsync(fixture, "Fort Park", bayCount: 2);

        var bike = TestDataBuilder.CreateVehicleType("Bike", "B", 2);
        fixture.Context.VehicleTypes.Add(bike);
        fixture.Context.ParkingSlots.Add(TestDataBuilder.CreateSlot(placed.Facility.Id, bike.Id, "B-01"));
        await fixture.Context.SaveChangesAsync();

        var service = Discovery(fixture);

        Assert.Equal(new[] { "C-01", "C-02" },
            (await service.GetFacilitySlotsAsync(placed.Facility.Id, placed.VehicleType.Id, Window(10), Window(12)))
            .Select(bay => bay.SlotNumber));

        Assert.Equal(new[] { "B-01" },
            (await service.GetFacilitySlotsAsync(placed.Facility.Id, bike.Id, Window(10), Window(12)))
            .Select(bay => bay.SlotNumber));

        Assert.Equal(3, (await service.GetFacilitySlotsAsync(placed.Facility.Id, null, Window(10), Window(12)))
            .Count);
    }

    [Fact]
    public async Task Bays_RetiredbaysNeverAppearOnADriversList()
    {
        using var fixture = new DatabaseFixture();
        var placed = await PlaceAsync(fixture, "Fort Park", bayCount: 3);

        var retired = fixture.Context.ParkingSlots.Single(s => s.SlotNumber == "C-03");
        retired.Status = SlotStatus.DISABLED;
        await fixture.Context.SaveChangesAsync();

        var bays = await Discovery(fixture).GetFacilitySlotsAsync(
            placed.Facility.Id, null, Window(10), Window(12));

        Assert.Equal(new[] { "C-01", "C-02" }, bays.Select(bay => bay.SlotNumber));
    }

    [Fact]
    public async Task Bays_ABayUnderMaintenanceShowsWhyItCannotBeTaken()
    {
        using var fixture = new DatabaseFixture();
        var placed = await PlaceAsync(fixture, "Fort Park", bayCount: 1);

        var bay = fixture.Context.ParkingSlots.Single();
        bay.Status = SlotStatus.MAINTENANCE;
        await fixture.Context.SaveChangesAsync();

        var shown = Assert.Single(await Discovery(fixture).GetFacilitySlotsAsync(
            placed.Facility.Id, null, Window(10), Window(12)));

        Assert.Equal(nameof(SlotStatus.MAINTENANCE), shown.EffectiveStatus);
        Assert.False(shown.AvailableForPeriod);
    }

    [Fact]
    public async Task Bays_ThePriceComesFromThePropertyNotFromTheDriver()
    {
        using var fixture = new DatabaseFixture();
        var placed = await PlaceAsync(fixture, "Fort Park", bayCount: 1, hourlyRate: PriceyRate);

        var shown = Assert.Single(await Discovery(fixture).GetFacilitySlotsAsync(
            placed.Facility.Id, null, Window(10), Window(12)));

        Assert.Equal(PriceyRate, shown.HourlyRate);
    }

    [Fact]
    public async Task Bays_APropertyWithNoBaysAnswersWithAnEmptyList()
    {
        using var fixture = new DatabaseFixture();
        var placed = await PlaceAsync(fixture, "Fort Park", bayCount: 0);

        var bays = await Discovery(fixture).GetFacilitySlotsAsync(
            placed.Facility.Id, null, Window(10), Window(12));

        Assert.Empty(bays);
    }

    [Fact]
    public async Task Bays_AskForAnUnknownPropertyAndTheDriverIsToldItIsGone()
    {
        using var fixture = new DatabaseFixture();

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            Discovery(fixture).GetFacilitySlotsAsync(Guid.NewGuid(), null, Window(10), Window(12)));
    }

    [Fact]
    public async Task Bays_APropertyThatIsNotPublishedRefusesToOpenItsBook()
    {
        using var fixture = new DatabaseFixture();
        var placed = await PlaceAsync(fixture, "Quiet Property", status: ParkingStatus.DRAFT);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            Discovery(fixture).GetFacilitySlotsAsync(placed.Facility.Id, null, Window(10), Window(12)));

        Assert.Equal("This property is not open for reservations.", ex.Message);
    }

    [Fact]
    public async Task Bays_AWindowCutShortAtOneEndIsRefusedBeforeItReachesTheBook()
    {
        using var fixture = new DatabaseFixture();
        var placed = await PlaceAsync(fixture, "Fort Park");

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            Discovery(fixture).GetFacilitySlotsAsync(placed.Facility.Id, null, Window(10), null));

        Assert.Equal("Provide both from and to to check a booking window.", ex.Message);
    }

    [Fact]
    public async Task Bays_AWindowThatEndsBeforeItBeginsIsRefused()
    {
        using var fixture = new DatabaseFixture();
        var placed = await PlaceAsync(fixture, "Fort Park");

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            Discovery(fixture).GetFacilitySlotsAsync(placed.Facility.Id, null, Window(14), Window(10)));

        Assert.Equal("The booking window must end after it starts.", ex.Message);
    }
}
