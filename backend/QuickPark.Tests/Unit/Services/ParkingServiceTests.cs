using System.Linq.Expressions;
using System.Reflection;
using Microsoft.EntityFrameworkCore;
using QuickPark.API.Data;
using QuickPark.API.Enums;
using QuickPark.API.Models;
using QuickPark.API.Services.Implementations;

namespace QuickPark.Tests.Unit.Services;

public class ParkingServiceTests
{
    private static readonly Guid Bay = Guid.Parse("11111111-1111-1111-1111-111111111111");

    private static DateTime At(int hour) => new(2026, 3, 1, hour, 0, 0, DateTimeKind.Utc);

    private static Reservation Booking(
        ReservationStatus status, int from, int to, int? checkedInAt = null) =>
        new()
        {
            SlotId = Bay,
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
