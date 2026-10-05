using System.Collections;
using System.Reflection;
using QuickPark.API.Services.Implementations;

namespace QuickPark.Tests.Unit.Services;

public class ReportServiceTests
{
    private static readonly Type RowType =
        typeof(ReportService).GetNestedType("MoneyRow", BindingFlags.NonPublic)!;

    [Fact]
    public void Window_KeepsTheMoneyThatFallsOnBothEnds()
    {
        var first = new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc);
        var last = new DateTime(2026, 9, 30, 23, 59, 59, 999, DateTimeKind.Utc);

        var kept = Window(
            new[] { At(first), At(new DateTime(2026, 9, 15, 12, 0, 0, DateTimeKind.Utc)), At(last) },
            first,
            last);

        Assert.Equal(3, kept.Count);
    }

    [Fact]
    public void Window_DropsTheInstantAfterTheEnd()
    {
        var first = new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc);
        var last = new DateTime(2026, 9, 30, 23, 59, 59, 999, DateTimeKind.Utc);
        var oneMsLater = last.AddMilliseconds(1);

        var kept = Window(new[] { At(first), At(last), At(oneMsLater) }, first, last);

        Assert.Equal(2, kept.Count);
    }

    [Fact]
    public void Window_NoEndReadsEverythingFromTheStartOn()
    {
        var first = new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc);

        var kept = Window(
            new[] { At(first), At(new DateTime(2099, 1, 1, 0, 0, 0, DateTimeKind.Utc)) },
            first,
            null);

        Assert.Equal(2, kept.Count);
    }

    [Fact]
    public void Window_TreatsAnInstantWithoutAZoneAsUtc()
    {
        // The endpoint binds a query string without an offset as an unspecified DateTime, so it must
        // not be shifted by the machine's zone on the way in.
        var at = new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Unspecified);

        var kept = Window(new[] { At(new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc)) }, at, at);

        Assert.Single(kept);
    }

    [Theory]
    [InlineData(10, "yyyy-MM-dd")]
    // The turn is measured against a moving clock, so the case just inside the ceiling is used.
    [InlineData(91, "yyyy-MM-dd")]
    [InlineData(93, "yyyy-MM")]
    [InlineData(400, "yyyy-MM")]
    public void Bucket_SwitchesToMonthsOnceThePeriodGetsLong(int daysBack, string expectedShape)
    {
        var moneyDate = new DateTime(2026, 9, 15, 8, 30, 0, DateTimeKind.Utc);
        var windowFrom = DateTime.UtcNow.AddDays(-daysBack);

        var period = Bucket(moneyDate, windowFrom);

        Assert.Equal(moneyDate.ToString(expectedShape), period);
    }

    [Fact]
    public void Bucket_WithoutAStartHasNothingToMeasureAgainst()
    {
        var moneyDate = new DateTime(2026, 9, 15, 8, 30, 0, DateTimeKind.Utc);

        Assert.Equal(moneyDate.ToString("yyyy-MM"), Bucket(moneyDate, null));
    }

    private static object At(DateTime moneyDate)
    {
        var row = Activator.CreateInstance(RowType)!;
        RowType.GetProperty("PaidAt")!.SetValue(row, (DateTime?)moneyDate);
        RowType.GetProperty("CreatedAt")!.SetValue(row, moneyDate);
        return row;
    }

    private static IList Window(IEnumerable<object> rows, DateTime? from, DateTime? to)
    {
        var list = (IList)Activator.CreateInstance(typeof(List<>).MakeGenericType(RowType))!;
        foreach (var row in rows) list.Add(row);

        var window = typeof(ReportService)
            .GetMethod("Window", BindingFlags.NonPublic | BindingFlags.Static)!;

        return (IList)window.Invoke(null, new object?[] { list, from, to })!;
    }

    private static string Bucket(DateTime moneyDate, DateTime? windowFrom) =>
        (string)typeof(ReportService)
            .GetMethod("Bucket", BindingFlags.NonPublic | BindingFlags.Static)!
            .Invoke(null, new object?[] { moneyDate, windowFrom })!;

    [Fact]
    public void Two_settled_payments_are_still_one_paid_booking()
    {
        var booking = Guid.NewGuid();

        Assert.Equal(1, Bookings(Row(booking, 5), Row(booking, 5)));
        Assert.Equal(2, Bookings(Row(booking, 5), Row(Guid.NewGuid(), 5)));
    }

    [Fact]
    public void A_bay_is_held_for_its_window_once_however_many_rows_paid_for_it()
    {
        var longStay = Guid.NewGuid();
        var shortStay = Guid.NewGuid();

        Assert.Equal(8, HeldHours(Row(longStay, 5), Row(longStay, 5), Row(shortStay, 3)));
    }

    private static object Row(Guid reservationId, int hours)
    {
        var row = Activator.CreateInstance(RowType)!;
        RowType.GetProperty("ReservationId")!.SetValue(row, reservationId);
        RowType.GetProperty("Hours")!.SetValue(row, hours);
        return row;
    }

    private static int Bookings(params object[] rows) => Count(rows, "Bookings");

    private static int HeldHours(params object[] rows) => Count(rows, "HeldHours");

    private static int Count(object[] rows, string rule)
    {
        var list = (IList)Activator.CreateInstance(typeof(List<>).MakeGenericType(RowType))!;
        foreach (var row in rows) list.Add(row);

        return (int)typeof(ReportService)
            .GetMethod(rule, BindingFlags.NonPublic | BindingFlags.Static)!
            .Invoke(null, new object[] { list })!;
    }
}
