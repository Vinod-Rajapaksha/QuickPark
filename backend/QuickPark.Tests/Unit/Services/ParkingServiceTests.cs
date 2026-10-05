using System.Linq.Expressions;
using System.Reflection;
using Microsoft.EntityFrameworkCore;
using QuickPark.API.Data;
using QuickPark.API.DTOs.Slots;
using QuickPark.API.Enums;
using QuickPark.API.Models;
using QuickPark.API.Services.Implementations;

namespace QuickPark.Tests.Unit.Services;

public class ParkingServiceTests
{
    private static readonly Guid BookedSlotId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    private static Reservation Booking(
        ReservationStatus status, int from, int to, int? checkedInAt = null) =>
        new()
        {
            SlotId = BookedSlotId,
            Status = status,
            StartTime = At(from),
            EndTime = At(to),
            CheckedInAt = checkedInAt is int hour ? At(hour) : null
        };

    [Theory]
    [InlineData(ReservationStatus.PENDING)]
    [InlineData(ReservationStatus.CONFIRMED)]
    public void ABookedWindowHoldsItsBayForThatWindowOnly(ReservationStatus status)
    {
        var booking = Booking(status, 10, 11);
        var holds = Holds(At(8), At(12));

        Assert.True(holds(booking));
        Assert.False(Holds(At(11), At(12))(booking));
        Assert.False(Holds(At(8), At(10))(booking));
    }

    [Theory]
    [InlineData(ReservationStatus.PENDING)]
    [InlineData(ReservationStatus.CONFIRMED)]
    public void AnUnarrivedBookingNeverHoldsABeyondItsWindow(ReservationStatus status)
    {
        Assert.False(Holds(At(14), At(16))(Booking(status, 8, 10)));
    }

    [Theory]
    [InlineData(10, 12)]
    [InlineData(14, 16)]
    [InlineData(20, 22)]
    public void ACheckedInStayKeepsHoldingForEveryLaterPeriod(int from, int to)
    {
        Assert.True(Holds(At(from), At(to))(
            Booking(ReservationStatus.CHECKED_IN, 8, 10, checkedInAt: 8)));
    }

    [Fact]
    public void ABookedBayTheDriverHasNotReachedYetOnlyHoldsItsOwnWindow()
    {
        var notArrived = Booking(ReservationStatus.CHECKED_IN, 20, 22, checkedInAt: 20);

        Assert.False(Holds(At(8), At(10))(notArrived));
        Assert.True(Holds(At(21), At(23))(notArrived));
    }

    [Fact]
    public void AnEarlyCheckInHoldsTheBayFromTheMomentTheGateLetsTheCarIn()
    {
        Assert.True(Holds(At(9), At(10))(
            Booking(ReservationStatus.CHECKED_IN, 10, 12, checkedInAt: 9)));
    }

    [Theory]
    [InlineData(ReservationStatus.CHECKED_OUT)]
    [InlineData(ReservationStatus.COMPLETED)]
    [InlineData(ReservationStatus.CANCELLED)]
    [InlineData(ReservationStatus.NOSHOW)]
    public void ABookingThatHasEndedNeverHoldsTheBay(ReservationStatus status)
    {
        Assert.False(Holds(At(8), At(12))(Booking(status, 8, 10, checkedInAt: 8)));
    }

    [Fact]
    public void CheckoutIsWhatFreesAnOccupiedBay()
    {
        var hold = Holds(At(14), At(16));
        var stay = Booking(ReservationStatus.CHECKED_IN, 8, 10, checkedInAt: 8);

        Assert.True(hold(stay));

        stay.Status = ReservationStatus.CHECKED_OUT;
        Assert.False(hold(stay));
    }

    [Fact]
    public void TheQueryRuleAndTheBoardRuleAgreeOnEveryStatusAndWindow()
    {
        var statuses = Enum.GetValues<ReservationStatus>();

        foreach (var status in statuses)
        {
            foreach (var (from, to) in new[] { (8, 10), (9, 11), (10, 12), (14, 16), (23, 23) })
            {
                foreach (var checkedInAt in new int?[] { null, 8, 9 })
                {
                    var booking = Booking(status, 10, 12, checkedInAt);
                    var expected = Holds(At(from), At(to))(booking);

                    Assert.Equal(expected, HoldsInMemory(booking, At(from), At(to)));
                }
            }
        }
    }

    [Fact]
    public void TheHoldRuleTranslatesToSqlForTheProvider()
    {
        using var context = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=127.0.0.1;Port=1;Database=quickpark_never_connected;" +
                       "Username=none;Password=none")
            .Options);

        var sql = context.Set<Reservation>().Where(HoldRule(At(8), At(12))).ToQueryString();

        Assert.Contains("'PENDING'", sql);
        Assert.Contains("'CHECKED_IN'", sql);
        Assert.Contains("COALESCE", sql);
    }

    [Theory]
    [InlineData(SlotStatus.AVAILABLE, null, "AVAILABLE")]
    [InlineData(SlotStatus.AVAILABLE, ReservationStatus.PENDING, "PENDING")]
    [InlineData(SlotStatus.AVAILABLE, ReservationStatus.CONFIRMED, "RESERVED")]
    [InlineData(SlotStatus.AVAILABLE, ReservationStatus.CHECKED_IN, "OCCUPIED")]
    [InlineData(SlotStatus.MAINTENANCE, ReservationStatus.CHECKED_IN, "MAINTENANCE")]
    [InlineData(SlotStatus.MAINTENANCE, null, "MAINTENANCE")]
    [InlineData(SlotStatus.DISABLED, ReservationStatus.CONFIRMED, "DISABLED")]
    public void TheLabelNamesWhoeverOwnsTheBayRightNow(
        SlotStatus stored, ReservationStatus? hold, string expected)
    {
        Assert.Equal(expected, EffectiveStatus(stored, hold));
    }

    [Fact]
    public void OnlyASettledBookingReadsAsReserved()
    {
        Assert.Equal("PENDING", LabelOf(ReservationStatus.PENDING));
        Assert.Equal(nameof(SlotStatus.RESERVED), LabelOf(ReservationStatus.CONFIRMED));
        Assert.Equal(nameof(SlotStatus.OCCUPIED), LabelOf(ReservationStatus.CHECKED_IN));
    }

    [Theory]
    [InlineData(ReservationStatus.PENDING)]
    [InlineData(ReservationStatus.CONFIRMED)]
    [InlineData(ReservationStatus.CHECKED_IN)]
    public void EveryLabelTheBoardShowsCanBeFilteredOnIt(ReservationStatus hold)
    {
        var label = LabelOf(hold);

        Assert.Equal(label, BoardFilter(label.ToLowerInvariant()));
    }

    [Fact]
    public void AStateTheBoardNeverShowsStaysRefusedByTheFilter()
    {
        var ex = Assert.Throws<InvalidOperationException>(() => BoardFilter("SOLD"));
        Assert.Contains("status must be one of", ex.Message);
    }

    [Theory]
    [InlineData("RESERVED")]
    [InlineData("OCCUPIED")]
    [InlineData("available-but-not-really")]
    public void AnOwnerCanNeverSetTheLifecycleStatesThemselves(string status)
    {
        var ex = Assert.Throws<InvalidOperationException>(() => ParseOwnerStatus(status));
        Assert.Contains("states a bay can be set to", ex.Message);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("   ")]
    public void ABlankStateIsRefusedBeforeItReachesTheEnum(string? status)
    {
        var ex = Assert.Throws<InvalidOperationException>(() => ParseOwnerStatus(status));
        Assert.Equal("A bay status is required.", ex.Message);
    }

    [Theory]
    [InlineData("AVAILABLE")]
    [InlineData("MAINTENANCE")]
    [InlineData("DISABLED")]
    public void AnOwnerKeepsTheirThreePhysicalStates(string status)
    {
        Assert.Equal(status, ParseOwnerStatus(status).ToString());
    }

    // ---- What the owner's board adds on top of those rules ----

    [Fact]
    public void TheBoardTotalLeavesOutTheBaysTheOwnerHasRetired()
    {
        var rows = new List<ProviderSlotRowResponse>
        {
            Board(Bay("C-001")),
            Board(Bay("C-002")),
            Board(Bay("C-003", SlotStatus.DISABLED))
        };

        var counts = Counts(rows);

        Assert.Equal(2, counts.Total);
        Assert.Equal(1, counts.Disabled);
        Assert.Equal(2, counts.Available);
    }

    [Fact]
    public void ABayHeldByAnUnsettledBookingIsTalliedAsPendingAndNeverAsReserved()
    {
        var held = Booking(ReservationStatus.PENDING, 10, 12);
        var settled = Booking(ReservationStatus.CONFIRMED, 10, 12);

        var counts = Counts(new List<ProviderSlotRowResponse>
        {
            Board(Bay("C-001"), new List<Reservation> { held }),
            Board(Bay("C-002"), new List<Reservation> { settled })
        });

        Assert.Equal(1, counts.Pending);
        Assert.Equal(1, counts.Reserved);
        Assert.Equal(0, counts.Available);
    }

    [Fact]
    public void TheMaintenanceTallyFollowsWhatTheOwnerSetRatherThanWhatADriverDid()
    {
        var held = Board(Bay("C-001", SlotStatus.MAINTENANCE),
            new List<Reservation> { Booking(ReservationStatus.CONFIRMED, 10, 12) });

        var counts = Counts(new List<ProviderSlotRowResponse>
        {
            held,
            Board(Bay("C-002", SlotStatus.MAINTENANCE))
        });

        Assert.Equal(2, counts.Maintenance);

        // The bay is still out of service even though a booking is nominally holding it.
        Assert.Equal("MAINTENANCE", held.Status);
        Assert.Equal("MAINTENANCE", held.EffectiveStatus);
        Assert.Equal(0, counts.Reserved);
    }

    [Fact]
    public void ThePerTypeTallyIgnoresRetiredBaysAndReadsInTypeNameOrder()
    {
        var car = Guid.NewGuid();
        var van = Guid.NewGuid();

        var counts = Counts(new List<ProviderSlotRowResponse>
        {
            Board(Bay("C-001", vehicleTypeId: car, vehicleName: "Car")),
            Board(Bay("C-002", vehicleTypeId: car, vehicleName: "Car")),
            Board(Bay("V-001", vehicleTypeId: van, vehicleName: "Van")),
            Board(Bay("V-002", SlotStatus.DISABLED, vehicleTypeId: van, vehicleName: "Van"))
        });

        Assert.Equal(new[] { "Car", "Van" }, counts.ByVehicleType.Select(t => t.VehicleTypeName).ToArray());
        Assert.Equal(2, counts.ByVehicleType[0].Total);
        Assert.Equal(1, counts.ByVehicleType[1].Total);
        Assert.Equal(2, counts.ByVehicleType[0].Available);
        Assert.Equal(1, counts.ByVehicleType[1].Available);
    }

    [Fact]
    public void OnlyABayNothingHoldsIsOfferedAsBookable()
    {
        Assert.True(Board(Bay("C-001")).Bookable);
        Assert.False(Board(Bay("C-002"), new List<Reservation> { Booking(ReservationStatus.CONFIRMED, 10, 12) }).Bookable);
        Assert.False(Board(Bay("C-003", SlotStatus.MAINTENANCE)).Bookable);
        Assert.False(Board(Bay("C-004", SlotStatus.DISABLED)).Bookable);
    }

    [Fact]
    public void TheRowPointsAtTheBookingThatOwnsTheBayRightNow()
    {
        var holding = Booking(ReservationStatus.CONFIRMED, 9, 11);

        var row = Board(Bay("C-001"), new List<Reservation> { holding });

        Assert.Equal(At(9), row.BusyFrom);
        Assert.Equal(At(11), row.BusyUntil);
        Assert.NotNull(row.Current);
    }

    [Fact]
    public void ACarCheckedInPastItsBookedWindowStillShowsAsTheHolderOfTheBay()
    {
        // The stay overran its ticket; the bay is not free until check-out, so the board must keep
        // showing the vehicle rather than a gap the owner could double-book.
        var overstayed = Booking(ReservationStatus.CHECKED_IN, 6, 8, checkedInAt: 6);

        var row = Board(Bay("C-001"), new List<Reservation> { overstayed });

        Assert.Equal("OCCUPIED", row.EffectiveStatus);
        Assert.Equal(At(6), row.BusyFrom);
        Assert.False(row.Bookable);
    }

    [Fact]
    public void WhenNothingIsInsideTheBoardShowsTheNextBookingInsteadOfNothing()
    {
        var later = Booking(ReservationStatus.CONFIRMED, 14, 16);

        var row = Board(Bay("C-001"), new List<Reservation> { later }, to: 16);

        Assert.Equal(At(14), row.BusyFrom);
        Assert.Equal("RESERVED", row.EffectiveStatus);
    }

    [Fact]
    public void TheRateTheOwnerSeesIsTheOnesTheySetForTheirOwnProperty()
    {
        var type = Guid.NewGuid();
        var rates = new Dictionary<Guid, decimal> { [type] = 450m };

        Assert.Equal(450m, Board(Bay("C-001", vehicleTypeId: type), rates: rates).HourlyRate);

        // A bay whose type has no priced allocation cannot invent a rate for the board.
        Assert.Equal(0m, Board(Bay("C-002", vehicleTypeId: type)).HourlyRate);
    }

    [Fact]
    public void OnePropertyCanPriceTheSameVehicleTypeDifferentlyFromAnotherRow()
    {
        var car = Guid.NewGuid();
        var facility = new ParkingFacility
        {
            Id = Guid.NewGuid(),
            Name = "Town Car Park",
            VehicleAllocations =
            {
                new ParkingFacilityVehicleType { VehicleTypeId = car, HourlyRate = 300m }
            }
        };

        var rates = (Dictionary<Guid, decimal>)Rule("RateByVehicleType", new object?[] { facility })!;

        Assert.Equal(300m, rates[car]);
        Assert.Single(rates);
    }

    [Fact]
    public void ABayWithNoBookingsComesBackAsAnEmptyListNotAMissingKey()
    {
        var booked = Guid.NewGuid();
        var idle = Guid.NewGuid();
        var bookings = new Dictionary<Guid, List<Reservation>> { [booked] = new() { Booking(ReservationStatus.CONFIRMED, 9, 11) } };

        var found = (List<Reservation>)Rule("BookingsFor", new object?[] { bookings, booked })!;
        var missing = (List<Reservation>)Rule("BookingsFor", new object?[] { bookings, idle })!;

        Assert.Single(found);
        Assert.NotNull(missing);
        Assert.Empty(missing);
    }

    [Fact]
    public void TheBoardRowKeepsTheAdminsBaySizeAsTextTheOwnerCanRead()
    {
        var sized = Bay("C-001");
        sized.BayLengthMeters = 4.5m;
        sized.BayWidthMeters = 2.2m;

        Assert.Contains("4.5", Board(sized).BayLabel);
        Assert.Contains("2.2", Board(sized).BayLabel);
        Assert.Equal("no size set", Board(Bay("C-002")).BayLabel);
    }

    // ---- The booking window an owner's bays accept ----

    [Fact]
    public void ABookingMustEndAfterItStarts()
    {
        var ex = Assert.Throws<InvalidOperationException>(() => EnsureBookingWindow(At(10), At(10), At(9)));
        Assert.Equal("The reservation must end after it starts.", ex.Message);

        Assert.Throws<InvalidOperationException>(() => EnsureBookingWindow(At(10), At(9), At(8)));
    }

    [Fact]
    public void ABookingCannotBeTakenForAWindowThatHasAlreadyGoneBy()
    {
        var ex = Assert.Throws<InvalidOperationException>(() => EnsureBookingWindow(At(8), At(10), At(9)));
        Assert.Equal("The reservation start time is in the past.", ex.Message);

        // A driver who is a minute late for their own start is still inside the grace the gate allows.
        EnsureBookingWindow(At(8), At(10), At(8, 4));
    }

    [Fact]
    public void NoBookingMaySpanMoreThanAWeekOfTheOwnersBays()
    {
        var start = new DateTime(2026, 3, 1, 8, 0, 0, DateTimeKind.Utc);

        EnsureBookingWindow(start, start.AddDays(7), start);

        var ex = Assert.Throws<InvalidOperationException>(() => EnsureBookingWindow(start, start.AddDays(7).AddSeconds(1), start));
        Assert.Equal("A reservation can span at most 7 days.", ex.Message);
    }

    [Theory]
    [InlineData(10, 0, 1)]
    [InlineData(10, 30, 1)]
    [InlineData(11, 0, 1)]
    [InlineData(13, 0, 3)]
    [InlineData(13, 1, 4)]
    public void PartOfAnHourIsBilledAsAFullHourOnTheOwnersInvoice(int endHour, int endMinute, int expected)
    {
        var hours = (int)Rule("BookingHours", new object?[] { At(10), At(endHour, endMinute) })!;

        Assert.Equal(expected, hours);
    }

    [Fact]
    public void ThePriceAndTheCommissionAreFrozenOntoTheBookingFromThePropertysOwnAllocation()
    {
        var type = Guid.NewGuid();
        var facility = new ParkingFacility { Id = Guid.NewGuid(), Name = "Town Car Park", ProviderId = Guid.NewGuid() };
        var slot = Bay("C-009", vehicleTypeId: type);
        slot.FacilityId = facility.Id;

        var allocation = new ParkingFacilityVehicleType
        {
            FacilityId = facility.Id,
            VehicleTypeId = type,
            HourlyRate = 300m,
            CommissionRate = 10m
        };

        var booking = (Reservation)Rule("BuildReservation",
            new object?[] { Guid.NewGuid(), facility, slot, allocation, At(10), At(13) })!;

        Assert.Equal(3, booking.Hours);
        Assert.Equal(300m, booking.HourlyRate);
        Assert.Equal(900m, booking.TotalAmount);
        Assert.Equal(10m, booking.CommissionRate);
        Assert.Equal(90m, booking.CommissionAmount);
        Assert.Equal(810m, booking.ProviderAmount);

        // The bay number and the property are copied at booking time, so a later rename or a re-price
        // cannot rewrite what the driver already agreed to.
        Assert.Equal("C-009", booking.SlotNumber);
        Assert.Equal(facility.Id, booking.FacilityId);
        Assert.Equal(facility.ProviderId, booking.ProviderId);
        Assert.Equal(ReservationStatus.PENDING, booking.Status);
    }

    // ---- Helpers ----

    private static void EnsureBookingWindow(DateTime start, DateTime end, DateTime now) =>
        Rule("EnsureBookingWindow", new object?[] { start, end, now });

    private static ProviderSlotRowResponse Board(ParkingSlot slot, List<Reservation>? bookings = null,
        Dictionary<Guid, decimal>? rates = null, int from = 8, int to = 12) =>
        (ProviderSlotRowResponse)Rule("MapToSlotRow", new object?[]
        {
            slot, bookings ?? new List<Reservation>(), rates ?? new Dictionary<Guid, decimal>(), At(from), At(to), At(10)
        })!;

    private static ProviderSlotCountsResponse Counts(List<ProviderSlotRowResponse> rows) =>
        (ProviderSlotCountsResponse)Rule("BuildSlotCounts", new object?[] { rows })!;

    private static ParkingSlot Bay(string slotNumber, SlotStatus status = SlotStatus.AVAILABLE,
        Guid? vehicleTypeId = null, string vehicleName = "Car")
    {
        var type = vehicleTypeId ?? Guid.NewGuid();

        return new ParkingSlot
        {
            SlotNumber = slotNumber,
            Status = status,
            VehicleTypeId = type,
            VehicleType = new VehicleType { Id = type, Name = vehicleName }
        };
    }

    private static DateTime At(int hour, int minute = 0) => new(2026, 3, 1, hour, minute, 0, DateTimeKind.Utc);

    private static Expression<Func<Reservation, bool>> HoldRule(DateTime from, DateTime to) =>
        (Expression<Func<Reservation, bool>>)Rule("HoldsSlot", new object[] { from, to })!;

    private static Func<Reservation, bool> Holds(DateTime from, DateTime to) =>
        HoldRule(from, to).Compile();

    private static bool HoldsInMemory(Reservation booking, DateTime from, DateTime to) =>
        (bool)Rule("HoldsNow", new object[] { booking, from, to })!;

    private static string EffectiveStatus(SlotStatus stored, ReservationStatus? hold) =>
        (string)Rule("EffectiveSlotStatus", new object?[] { stored, hold })!;

    private static string LabelOf(ReservationStatus hold) => EffectiveStatus(SlotStatus.AVAILABLE, hold);

    private static string? BoardFilter(string status) =>
        (string?)Rule("ParseBoardStatusFilter", new object?[] { status });

    private static SlotStatus ParseOwnerStatus(string? status) =>
        (SlotStatus)Rule("ParseOwnerSlotStatus", new object?[] { status })!;

    private static object? Rule(string name, object?[] arguments)
    {
        var method = typeof(ParkingService)
            .GetMethod(name, BindingFlags.NonPublic | BindingFlags.Static);

        Assert.NotNull(method);

        try
        {
            return method!.Invoke(null, arguments);
        }
        catch (TargetInvocationException ex) when (ex.InnerException is not null)
        {
            throw ex.InnerException;
        }
    }
}
