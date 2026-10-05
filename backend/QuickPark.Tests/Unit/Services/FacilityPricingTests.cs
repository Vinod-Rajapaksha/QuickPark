using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using QuickPark.API.Controllers;
using QuickPark.API.Data;
using QuickPark.API.DTOs.Parking;
using QuickPark.API.Models;
using QuickPark.API.Services.Implementations;

namespace QuickPark.Tests.Unit.Services;

/// <summary>
/// What an owner may price, and what only the platform admin may price. The hourly rate belongs to the
/// (property, vehicle type) row the owner saves; the bay size, the commission and the allowed window all
/// come from the admin's own tables, so these tests pin where each number is allowed to originate.
/// </summary>
public class FacilityPricingTests
{
    private static readonly Guid Car = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid Bike = Guid.Parse("22222222-2222-2222-2222-222222222222");

    // ---- What the owner's pricing payload is allowed to contain ----

    [Fact]
    public void TheOwnerPricesExactlyOneHourlyRatePerVehicleTypeAndNothingElse()
    {
        Assert.Equal(
            new[] { nameof(VehicleAllocationInput.HourlyRate), nameof(VehicleAllocationInput.NumberOfSlots), nameof(VehicleAllocationInput.VehicleTypeId) },
            typeof(VehicleAllocationInput).GetProperties().Select(p => p.Name).OrderBy(n => n, StringComparer.Ordinal).ToArray());
    }

    [Fact]
    public void TheOwnerCannotSendACommissionABaySizeOrSomeoneElsesProperty()
    {
        foreach (var forbidden in new[] { "CommissionRate", "BayLengthMeters", "BayWidthMeters", "FacilityId", "ProviderId", "MinimumPrice", "MaximumPrice" })
        {
            Assert.False(typeof(VehicleAllocationInput).GetProperty(forbidden) is not null,
                $"{forbidden} must not be owner-settable.");
        }

        // The property being priced comes from the route, so a saved layout cannot be aimed at another owner.
        Assert.Equal(new[] { nameof(SaveAllocationsRequest.Allocations) },
            typeof(SaveAllocationsRequest).GetProperties().Select(p => p.Name).ToArray());
    }

    [Fact]
    public void TheHourlyRateLivesOnThePropertyAndTypeTogetherNotOnEitherAlone()
    {
        Assert.NotNull(typeof(ParkingFacilityVehicleType).GetProperty(nameof(ParkingFacilityVehicleType.HourlyRate)));

        // Neither the admin's category nor the property header can hold a rate, so two properties of the
        // same owner may price the same vehicle type differently.
        Assert.Null(typeof(VehicleType).GetProperty("HourlyRate"));
        Assert.Null(typeof(ParkingFacility).GetProperty("HourlyRate"));

        Assert.NotNull(typeof(ParkingFacilityVehicleType).GetProperty(nameof(ParkingFacilityVehicleType.FacilityId)));
        Assert.NotNull(typeof(ParkingFacilityVehicleType).GetProperty(nameof(ParkingFacilityVehicleType.VehicleTypeId)));
    }

    [Fact]
    public void EveryAllocatedVehicleTypeRowCarriesItsOwnBayCountAndStampedCommission()
    {
        var names = typeof(ParkingFacilityVehicleType).GetProperties().Select(p => p.Name).ToHashSet();

        Assert.Contains(nameof(ParkingFacilityVehicleType.NumberOfSlots), names);
        Assert.Contains(nameof(ParkingFacilityVehicleType.CommissionRate), names);
        Assert.Contains(nameof(ParkingFacilityVehicleType.BayLengthMeters), names);
    }

    [Fact]
    public void AVehicleTypeWithoutAnAdminWindowIsOfferedWithNoPricesAtAll()
    {
        // The option row can only carry a null range when pricing is missing, which is what keeps the type
        // un-allocatable until the admin sets one.
        foreach (var property in new[]
                 {
                     nameof(VehicleTypeOptionResponse.MinPrice),
                     nameof(VehicleTypeOptionResponse.MaxPrice),
                     nameof(VehicleTypeOptionResponse.CommissionRate)
                 })
        {
            var type = typeof(VehicleTypeOptionResponse).GetProperty(property)!.PropertyType;
            Assert.True(Nullable.GetUnderlyingType(type) is not null, $"{property} must be able to say 'not configured'.");
        }
    }

    // ---- The owner's own pricing rules ----

    [Fact]
    public void APropertyMustPriceAtLeastOneVehicleTypeBeforeItIsBookable()
    {
        Assert.Equal("Select at least one vehicle type.",
            Assert.Throws<InvalidOperationException>(() => ValidateAllocations(new List<VehicleAllocationInput>())).Message);

        Assert.Equal("Select at least one vehicle type.",
            Assert.Throws<InvalidOperationException>(() => ValidateAllocations(null)).Message);
    }

    [Fact]
    public void OneVehicleTypeCannotBePricedTwiceInTheSameLayout()
    {
        var ex = Assert.Throws<InvalidOperationException>(() => ValidateAllocations(new List<VehicleAllocationInput>
        {
            Allocation(Car, 4, 300m),
            Allocation(Car, 6, 500m)
        }));

        Assert.Equal("Each vehicle type can only be configured once.", ex.Message);
    }

    [Fact]
    public void AnAllocationThatNamesNoVehicleTypeIsRefused()
    {
        var ex = Assert.Throws<InvalidOperationException>(() => ValidateAllocations(new List<VehicleAllocationInput>
        {
            Allocation(Guid.Empty, 4, 300m)
        }));

        Assert.Equal("Every allocation needs a vehicle type.", ex.Message);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-3)]
    public void ATypeWithNoBaysIsNotAnAllocation(int bays)
    {
        var ex = Assert.Throws<InvalidOperationException>(() => ValidateAllocations(new List<VehicleAllocationInput>
        {
            Allocation(Car, bays, 300m)
        }));

        Assert.Equal("Slot count must be greater than 0.", ex.Message);
    }

    [Theory]
    [InlineData("0")]
    [InlineData("-0.01")]
    public void ParkingForFreeIsNotAPrice(string rate)
    {
        var ex = Assert.Throws<InvalidOperationException>(() => ValidateAllocations(new List<VehicleAllocationInput>
        {
            Allocation(Car, 4, decimal.Parse(rate, System.Globalization.CultureInfo.InvariantCulture))
        }));

        Assert.Equal("Hourly rate must be greater than 0.", ex.Message);
    }

    [Fact]
    public void ATinyPriceStillCountsAsAPrice()
    {
        var saved = ValidateAllocations(new List<VehicleAllocationInput> { Allocation(Car, 1, 0.01m) });

        Assert.Single(saved);
        Assert.Equal(0.01m, saved[0].HourlyRate);
    }

    [Fact]
    public void APropertyIsCappedAtFiveHundredBaysAcrossAllItsTypesTogether()
    {
        // The cap is on the sum, so splitting a huge layout over three types cannot slip past it.
        var atCap = new List<VehicleAllocationInput>
        {
            Allocation(Car, 200, 300m),
            Allocation(Bike, 200, 200m),
            Allocation(Guid.NewGuid(), 100, 400m)
        };

        Assert.Equal(500, atCap.Sum(a => a.NumberOfSlots));
        Assert.Equal(3, ValidateAllocations(atCap).Count);

        atCap[0].NumberOfSlots = 201;

        var ex = Assert.Throws<InvalidOperationException>(() => ValidateAllocations(atCap));
        Assert.Equal("A property can have at most 500 slots.", ex.Message);
    }

    [Fact]
    public void SavingAPriceListReturnsTheSameRowsItWasGiven()
    {
        var given = new List<VehicleAllocationInput> { Allocation(Car, 4, 300m), Allocation(Bike, 8, 200m) };

        var saved = ValidateAllocations(given);

        Assert.Same(given, saved);
    }

    // ---- The admin's window the owner must price inside ----

    [Theory]
    [InlineData(199.99, "below")]
    [InlineData(200, "ok")]
    [InlineData(1000, "ok")]
    [InlineData(1000.01, "above")]
    [InlineData(600, "ok")]
    public void TheOwnerMayPriceAnywhereInTheWindowTheAdminSetAndNowhereElse(decimal rate, string verdict)
    {
        var window = Pricing(Car, 200m, 1000m, 15m);

        if (verdict == "ok")
        {
            EnsurePriceWithinWindow(rate, window, "Car");
            return;
        }

        var ex = Assert.Throws<InvalidOperationException>(() => EnsurePriceWithinWindow(rate, window, "Car"));
        Assert.Equal("Car price must be between 200 LKR and 1000 LKR.", ex.Message);
    }

    [Fact]
    public void AWindowOfOneFixedPriceIsStillAWindow()
    {
        var window = Pricing(Car, 500m, 500m, 10m);

        EnsurePriceWithinWindow(500m, window, "Van");
        Assert.Throws<InvalidOperationException>(() => EnsurePriceWithinWindow(500.01m, window, "Van"));
    }

    [Theory]
    [InlineData(-1, 500)]
    [InlineData(0, -5)]
    [InlineData(50, 100001)]
    [InlineData(100001, 200000)]
    public void TheAdminCannotWriteAnImpossibleWindow(decimal minimum, decimal maximum)
    {
        var ex = Assert.Throws<InvalidOperationException>(() => ValidateBounds(minimum, maximum, 100000m, "Hourly rate"));

        Assert.Equal("Hourly rate must be between 0 and 100000.", ex.Message);
    }

    [Fact]
    public void TheAdminIsWarnedSeparatelyForReversingAWindow()
    {
        var ex = Assert.Throws<InvalidOperationException>(() => ValidateBounds(800m, 200m, 100000m, "Hourly rate"));

        Assert.Equal("Hourly rate maximum cannot be lower than the minimum.", ex.Message);
    }

    [Fact]
    public void ThePlatformWideRateCeilingIsOneHundredThousand()
    {
        var ceiling = typeof(ParkingService).GetField("MaxPriceAmount", BindingFlags.NonPublic | BindingFlags.Static)!;

        Assert.Equal(100000m, Convert.ChangeType(ceiling.GetValue(null)!, typeof(decimal)));
    }

    [Theory]
    [InlineData(50, 100, 10)]
    [InlineData(0, 0, 0)]
    [InlineData(100000, 100000, 100)]
    public void AWindowInsideTheCeilingIsAccepted(decimal minimum, decimal maximum, decimal commission)
    {
        ValidateBounds(minimum, maximum, 100000m, "Hourly rate");

        Assert.Equal(minimum, Pricing(Car, minimum, maximum, commission).MinimumPrice);
    }

    [Theory]
    [InlineData(100, 200, 1000, 200)]
    [InlineData(500, 200, 1000, 500)]
    [InlineData(1500, 200, 1000, 1000)]
    [InlineData(1000, 200, 1000, 1000)]
    public void AnAdminWindowChangeMovesAnExistingPriceOnlyToTheNearestAllowedEdge(decimal stored, decimal minimum, decimal maximum, decimal expected)
    {
        Assert.Equal(expected, ClampToWindow(stored, minimum, maximum));
    }

    // ---- Bay size is the admin's, never the owner's ----

    [Theory]
    [InlineData(null, null)]
    [InlineData("0", "2.2")]
    [InlineData("4.5", "0")]
    [InlineData("-1", "2.2")]
    [InlineData("4.5", "-0.5")]
    public void ATypeWhoseBayTheAdminNeverSizedCannotBeAllocated(string? length, string? width)
    {
        var type = VehicleType(Car, "Car", "C", Parse(length), Parse(width));

        var ex = Assert.Throws<InvalidOperationException>(() => EnsureStandardBay(type));
        Assert.Equal("Car has no bay size set. Ask the platform admin to type one before allocating it.", ex.Message);
    }

    [Fact]
    public void ATypeWithASizeIsEnoughToOwnABayWithoutTheOwnerNamingOne()
    {
        var type = VehicleType(Car, "Car", "C", 4.5m, 2.2m);

        EnsureStandardBay(type);

        // The bay numbers come from the admin's code, which is why a car bay reads the same everywhere.
        Assert.Equal("C-007", SlotNumberFor("C", 7));
        Assert.Equal(7, NextSlotSequence(new List<ParkingSlot> { Slot("C-007"), Slot("C-002") }, "C"));
    }

    [Fact]
    public void BayNumbersOfOtherTypesAndOddSpellingsAreIgnoredWhenChoosingTheNextOne()
    {
        var rows = new List<ParkingSlot> { Slot("B-012"), Slot("C-003"), Slot("C-abc") };

        Assert.Equal(3, NextSlotSequence(rows, "C"));
        Assert.Equal(0, NextSlotSequence(rows, "V"));
        Assert.Equal("C-004", SlotNumberFor("C", 4));
    }

    // ---- Repricing must not disturb the bays ----

    [Fact]
    public void ChangingOnlyAPriceIsNotALayoutChange()
    {
        var facility = Facility(Allocation(Car, 4, 300m));

        Assert.False(LayoutDiffers(facility, new List<VehicleAllocationInput> { Allocation(Car, 4, 900m) }));
    }

    [Fact]
    public void ChangingABayCountOrAddingATypeIsALayoutChange()
    {
        var facility = Facility(Allocation(Car, 4, 300m));

        Assert.True(LayoutDiffers(facility, new List<VehicleAllocationInput> { Allocation(Car, 5, 300m) }));
        Assert.True(LayoutDiffers(facility, new List<VehicleAllocationInput> { Allocation(Car, 4, 300m), Allocation(Bike, 2, 200m) }));
        Assert.True(LayoutDiffers(facility, new List<VehicleAllocationInput>()));
    }

    [Fact]
    public void ReSavingTheSameLayoutKeepsOnePricedRowPerTypeInsteadOfGrowingASecond()
    {
        var facility = Facility(Allocation(Car, 4, 300m));
        var existing = facility.VehicleAllocations.Single();
        existing.CommissionRate = 30m;
        existing.BayLengthMeters = 1m;

        SyncAllocationRows(facility,
            new List<VehicleAllocationInput> { Allocation(Car, 6, 750m) },
            new Dictionary<Guid, VehicleType> { [Car] = VehicleType(Car, "Car", "C", 4.5m, 2.2m) },
            new Dictionary<Guid, VehiclePricingConfiguration> { [Car] = Pricing(Car, 200m, 1000m, 12.5m) },
            new DateTime(2026, 5, 4, 9, 0, 0));

        Assert.Single(facility.VehicleAllocations);
        Assert.Same(existing, facility.VehicleAllocations.Single());
        Assert.Equal(6, existing.NumberOfSlots);
        Assert.Equal(750m, existing.HourlyRate);
    }

    [Fact]
    public void TheCommissionAndTheBaySizeAreStampedFromTheAdminNotFromTheOwner()
    {
        var facility = Facility();

        SyncAllocationRows(facility,
            new List<VehicleAllocationInput> { Allocation(Car, 3, 400m) },
            new Dictionary<Guid, VehicleType> { [Car] = VehicleType(Car, "Car", "C", 4.5m, 2.2m) },
            new Dictionary<Guid, VehiclePricingConfiguration> { [Car] = Pricing(Car, 200m, 1000m, 12.5m) },
            new DateTime(2026, 5, 4, 9, 0, 0));

        var row = facility.VehicleAllocations.Single();
        Assert.Equal(12.5m, row.CommissionRate);
        Assert.Equal(4.5m, row.BayLengthMeters);
        Assert.Equal(2.2m, row.BayWidthMeters);
        Assert.Equal(400m, row.HourlyRate);
    }

    [Fact]
    public void DroppingATypeFromTheLayoutDropsItsPricedRowToo()
    {
        var facility = Facility(Allocation(Car, 4, 300m), Allocation(Bike, 2, 200m));

        SyncAllocationRows(facility,
            new List<VehicleAllocationInput> { Allocation(Bike, 2, 250m) },
            new Dictionary<Guid, VehicleType> { [Bike] = VehicleType(Bike, "Bike", "B", 2.5m, 1.4m) },
            new Dictionary<Guid, VehiclePricingConfiguration> { [Bike] = Pricing(Bike, 100m, 500m, 10m) },
            new DateTime(2026, 5, 4, 9, 0, 0));

        Assert.Equal(new[] { Bike }, facility.VehicleAllocations.Select(a => a.VehicleTypeId).ToArray());
        Assert.Equal(250m, facility.VehicleAllocations.Single().HourlyRate);
    }

    // ---- Who may change the rules ----

    [Fact]
    public void OnlyThePlatformAdminMaySetTheWindowTheOwnersPriceInside()
    {
        var controller = Type.GetType("QuickPark.API.Controllers.ParkingConfigurationController, QuickPark.API")!;

        var gates = controller.GetCustomAttributes(false)
            .Where(a => a.GetType().Name == "AuthorizeAttribute")
            .Select(a => a.GetType().GetProperty("Roles")!.GetValue(a) as string)
            .ToArray();

        Assert.NotEmpty(gates);
        Assert.All(gates, roles => Assert.Equal("PLATFORM_ADMIN", roles));

        // Every write action on that controller is covered by the class gate, so no provider route exists there.
        foreach (var action in controller.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly)
                     .Where(m => m.Name is not ("GetVehicleTypes" or "GetVehiclePricing")))
        {
            Assert.True(action.GetCustomAttributes(false).Any(a => a.GetType().Name.StartsWith("Http", StringComparison.Ordinal)),
                $"{action.Name} is not reachable as an endpoint.");
        }
    }

    [Fact]
    public void TheOwnerPricesTheirOwnPropertyThroughTheProviderRouteNotTheAdminOne()
    {
        var controller = Type.GetType("QuickPark.API.Controllers.ParkingFacilitiesController, QuickPark.API")!;
        var action = controller.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly)
            .Single(m => m.Name == "SaveAllocations");

        var roles = action.GetCustomAttributes(false)
            .Where(a => a.GetType().Name == "AuthorizeAttribute")
            .Select(a => a.GetType().GetProperty("Roles")!.GetValue(a) as string)
            .ToArray();

        Assert.Contains("PARKING_OWNER", roles);
        Assert.DoesNotContain("PLATFORM_ADMIN", roles);

        // The facility comes from the route, never the body, so an owner cannot reprice somebody else's property.
        Assert.Equal(new[] { "id", "request", "ct" }, action.GetParameters().Select(p => p.Name).ToArray());
    }

    // ---- Reflection helpers ----

    private static List<VehicleAllocationInput> ValidateAllocations(List<VehicleAllocationInput>? items) =>
        (List<VehicleAllocationInput>)CallStatic("ValidateAllocations", items)!;

    private static void EnsurePriceWithinWindow(decimal rate, VehiclePricingConfiguration window, string name) =>
        CallStatic("EnsurePriceWithinWindow", rate, window, name);

    private static void ValidateBounds(decimal min, decimal max, decimal ceiling, string label) =>
        CallStatic("ValidateBounds", min, max, ceiling, label);

    private static decimal ClampToWindow(decimal rate, decimal minimum, decimal maximum) =>
        (decimal)CallStatic("ClampToWindow", rate, minimum, maximum)!;

    private static void EnsureStandardBay(VehicleType vehicleType) =>
        CallStatic("EnsureStandardBay", vehicleType);

    private static string SlotNumberFor(string code, int sequence) =>
        (string)CallStatic("SlotNumberFor", code, sequence)!;

    private static int NextSlotSequence(List<ParkingSlot> rows, string code) =>
        (int)CallStatic("NextSlotSequence", rows, code)!;

    private static bool LayoutDiffers(ParkingFacility facility, List<VehicleAllocationInput> allocations) =>
        (bool)CallStatic("LayoutDiffers", facility, allocations)!;

    private static readonly AppDbContext Context = new(
        new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=127.0.0.1;Port=1;Database=quickpark_never_connected;Username=none;Password=none")
            .Options);

    private static void SyncAllocationRows(ParkingFacility facility, List<VehicleAllocationInput> allocations,
        Dictionary<Guid, VehicleType> vehicleTypes, Dictionary<Guid, VehiclePricingConfiguration> pricing, DateTime now)
    {
        var method = typeof(ParkingService).GetMethods(BindingFlags.NonPublic | BindingFlags.Instance)
            .Single(m => m.Name == "SyncAllocationRows");

        // Never opened, so building rows stays offline; the service only touches DbSet.Add/Remove here.
        var service = (ParkingService)Activator.CreateInstance(typeof(ParkingService), Context, new ConfigurationBuilder().Build())!;

        try
        {
            method.Invoke(service, new object?[] { facility, allocations, vehicleTypes, pricing, now });
        }
        catch (TargetInvocationException ex) when (ex.InnerException is not null)
        {
            throw ex.InnerException;
        }
    }

    private static object? CallStatic(string name, params object?[] args)
    {
        var method = typeof(ParkingService).GetMethods(BindingFlags.NonPublic | BindingFlags.Static)
            .Single(m => m.Name == name && m.GetParameters().Length == args.Length);

        try
        {
            return method.Invoke(null, args);
        }
        catch (TargetInvocationException ex) when (ex.InnerException is not null)
        {
            throw ex.InnerException;
        }
    }

    private static VehicleAllocationInput Allocation(Guid vehicleTypeId, int bays, decimal rate) =>
        new() { VehicleTypeId = vehicleTypeId, NumberOfSlots = bays, HourlyRate = rate };

    private static VehiclePricingConfiguration Pricing(Guid vehicleTypeId, decimal min, decimal max, decimal commission) =>
        new()
        {
            VehicleTypeId = vehicleTypeId,
            MinimumPrice = min,
            MaximumPrice = max,
            CommissionRate = commission,
            IsActive = true
        };

    private static VehicleType VehicleType(Guid id, string name, string code, decimal? length, decimal? width) =>
        new()
        {
            Id = id,
            Name = name,
            SlotCode = code,
            BayLengthMeters = length,
            BayWidthMeters = width,
            IsActive = true
        };

    private static ParkingSlot Slot(string slotNumber) => new() { SlotNumber = slotNumber };

    private static ParkingFacility Facility(params VehicleAllocationInput[] allocations)
    {
        var facility = new ParkingFacility { Id = Guid.NewGuid(), Name = "Test Car Park", ProviderId = Guid.NewGuid() };

        foreach (var allocation in allocations)
        {
            facility.VehicleAllocations.Add(new ParkingFacilityVehicleType
            {
                FacilityId = facility.Id,
                VehicleTypeId = allocation.VehicleTypeId,
                NumberOfSlots = allocation.NumberOfSlots,
                HourlyRate = allocation.HourlyRate
            });
        }

        return facility;
    }

    // InlineData cannot carry a decimal?, so the bay sizes travel as text.
    private static decimal? Parse(string? value) =>
        value is null ? null : decimal.Parse(value, System.Globalization.CultureInfo.InvariantCulture);
}
