using System.Reflection;
using QuickPark.API.Enums;
using QuickPark.API.Services.Implementations;

namespace QuickPark.Tests.Unit.Services;

public class ReservationServiceTests
{
    [Theory]
    [InlineData(ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN)]
    [InlineData(ReservationStatus.CHECKED_IN, ReservationStatus.CHECKED_OUT)]
    public void EnsureCanMove_AllowsTheTwoGateSteps(ReservationStatus from, ReservationStatus to)
    {
        Move(from, to);
    }

    [Theory]
    // A booking that has not been paid and confirmed yet has no car at the gate.
    [InlineData(ReservationStatus.PENDING, ReservationStatus.CHECKED_IN)]
    [InlineData(ReservationStatus.CHECKED_IN, ReservationStatus.CHECKED_IN)]
    [InlineData(ReservationStatus.CHECKED_OUT, ReservationStatus.CHECKED_OUT)]
    // Skipping a step would let a car out that never came in.
    [InlineData(ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_OUT)]
    [InlineData(ReservationStatus.PENDING, ReservationStatus.CHECKED_OUT)]
    // The gate cannot resurrect a booking that already ended elsewhere.
    [InlineData(ReservationStatus.CANCELLED, ReservationStatus.CHECKED_IN)]
    [InlineData(ReservationStatus.NOSHOW, ReservationStatus.CHECKED_IN)]
    [InlineData(ReservationStatus.COMPLETED, ReservationStatus.CHECKED_IN)]
    [InlineData(ReservationStatus.CHECKED_OUT, ReservationStatus.CHECKED_IN)]
    public void EnsureCanMove_RefusesEveryOtherArrow(ReservationStatus from, ReservationStatus to)
    {
        var ex = Assert.Throws<InvalidOperationException>(() => Move(from, to));
        Assert.Contains("cannot become", ex.Message);
    }

    [Theory]
    [InlineData(ReservationStatus.PENDING, "a booking that is pending cannot become checked_in.")]
    [InlineData(ReservationStatus.CANCELLED, "a booking that is cancelled cannot become checked_in.")]
    public void EnsureCanMove_NamesBothStatusesInTheMessage(
        ReservationStatus from, string expected)
    {
        var ex = Assert.Throws<InvalidOperationException>(() => Move(from, ReservationStatus.CHECKED_IN));
        Assert.Equal(expected, ex.Message.ToLowerInvariant());
    }

    // EnsureCanMove is deliberately not public.
    private static void Move(ReservationStatus from, ReservationStatus to)
    {
        var ensure = typeof(ParkingService)
            .GetMethod("EnsureCanMove", BindingFlags.NonPublic | BindingFlags.Static)!;

        try
        {
            ensure.Invoke(null, new object[] { from, to });
        }
        catch (TargetInvocationException ex) when (ex.InnerException is not null)
        {
            throw ex.InnerException;
        }
    }
}
