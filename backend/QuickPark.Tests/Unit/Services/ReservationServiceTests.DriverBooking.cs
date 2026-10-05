using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using QuickPark.API.DTOs.Reservations;
using QuickPark.API.Enums;
using QuickPark.API.Models;
using QuickPark.API.Services.Implementations;
using QuickPark.Tests.Fixtures;
using QuickPark.Tests.Helpers;

namespace QuickPark.Tests.Unit.Services;

public partial class ReservationServiceTests
{
    private static ParkingService Bookings(DatabaseFixture fixture) =>
        new(fixture.Context, new ConfigurationBuilder().Build());

    private static DateTime On(int day, int hour, int minute = 0) =>
        new(2026, 3, day, hour, minute, 0, DateTimeKind.Utc);

    private static Guid NewDriver() => Guid.NewGuid();

    private sealed record Yard(
        ParkingFacility Facility,
        ParkingSlot Bay,
        VehicleType VehicleType,
        ParkingProvider Provider,
        ParkingFacilityVehicleType Allocation);
    private static async Task<Yard> PrepareAsync(
        DatabaseFixture fixture,
        ParkingStatus status = ParkingStatus.APPROVED,
        decimal hourlyRate = 500m)
    {
        var context = fixture.Context;
        var vehicleType = TestDataBuilder.CreateVehicleType();
        var ownerAccount = TestDataBuilder.CreateUser($"owner-{Guid.NewGuid():N}@example.com", UserRole.PARKING_OWNER);
        var provider = TestDataBuilder.CreateProvider(ownerAccount.Id);
        var facility = TestDataBuilder.CreateFacility(provider.Id, "Fort Park", status);
        var allocation = TestDataBuilder.CreateAllocation(facility.Id, vehicleType.Id, 2, hourlyRate);
        var bay = TestDataBuilder.CreateSlot(facility.Id, vehicleType.Id, "C-01");

        context.Users.Add(ownerAccount);
        context.ParkingProviders.Add(provider);
        context.VehicleTypes.Add(vehicleType);
        context.ParkingFacilities.Add(facility);
        context.ParkingFacilityVehicleTypes.Add(allocation);
        context.ParkingSlots.Add(bay);
        context.ParkingSlots.Add(TestDataBuilder.CreateSlot(facility.Id, vehicleType.Id, "C-02"));

        await context.SaveChangesAsync();

        return new Yard(facility, bay, vehicleType, provider, allocation);
    }

    private static async Task<Reservation> MineAsync(
        DatabaseFixture fixture, Yard yard, Guid driverId,
        DateTime start, DateTime end, ReservationStatus status = ReservationStatus.PENDING)
    {
        // Bookings are read back through Include(Driver), so the driver account has to exist.
        if (!await fixture.Context.Users.AnyAsync(u => u.Id == driverId))
        {
            var account = TestDataBuilder.CreateDriverAccount();
            account.Id = driverId;
            fixture.Context.Users.Add(account);
        }

        var reservation = TestDataBuilder.CreateReservation(
            driverId, yard.Facility.Id, yard.Provider.Id, yard.Bay.Id, yard.VehicleType.Id, start, end,
            slotNumber: yard.Bay.SlotNumber, status: status);

        fixture.Context.Reservations.Add(reservation);
        await fixture.Context.SaveChangesAsync();
        return reservation;
    }

    [Theory]
    [InlineData(10, 10)]
    [InlineData(10, 9)]
    public void ABookingThatDoesNotRunForwardIsRefused(int startHour, int endHour)
    {
        var ex = Assert.Throws<InvalidOperationException>(() =>
            BookingWindow(On(8, startHour), On(8, endHour), On(7, 6)));

        Assert.Equal("The reservation must end after it starts.", ex.Message);
    }

    [Theory]
    [InlineData(4, 30, true)]
    [InlineData(5, 0, true)]
    [InlineData(5, 30, false)]
    public void AStartInTheRecentPastIsAllowedRightUpToFiveMinutes(int minutesAgo, int extraSeconds, bool allowed)
    {
        var now = On(8, 0);
        var start = now.AddMinutes(-minutesAgo).AddSeconds(-extraSeconds);

        if (allowed)
        {
            BookingWindow(start, start.AddHours(1), now);
            return;
        }

        var ex = Assert.Throws<InvalidOperationException>(() => BookingWindow(start, start.AddHours(1), now));
        Assert.Equal("The reservation start time is in the past.", ex.Message);
    }

    [Theory]
    [InlineData(7, 0, true)]
    [InlineData(7, 1, false)]
    [InlineData(8, 0, false)]
    public void ABookingMaySpanSevenDaysButNotOneMinuteMore(int days, int extraMinutes, bool allowed)
    {
        var now = On(8, 0);
        var end = now.AddDays(days).AddMinutes(extraMinutes);

        if (allowed)
        {
            BookingWindow(now, end, now);
            return;
        }

        var ex = Assert.Throws<InvalidOperationException>(() => BookingWindow(now, end, now));
        Assert.Equal("A reservation can span at most 7 days.", ex.Message);
    }

    [Fact]
    public void BookingMonthsAheadIsNeverRefusedByTheWindowRule()
    {
        var now = On(8, 0);

        BookingWindow(now.AddDays(120), now.AddDays(121), now);
    }

    [Theory]
    [InlineData(true, false)]
    [InlineData(false, true)]
    [InlineData(true, true)]
    public async Task ABookingNeedsBothAPropertyAndAVehicleType(bool noFacility, bool noVehicleType)
    {
        using var fixture = new DatabaseFixture();
        var yard = await PrepareAsync(fixture);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            Bookings(fixture).CreateReservationAsync(NewDriver(), new CreateReservationRequest
            {
                FacilityId = noFacility ? Guid.Empty : yard.Facility.Id,
                VehicleTypeId = noVehicleType ? Guid.Empty : yard.VehicleType.Id,
                StartTime = DateTime.UtcNow.AddMinutes(10),
                EndTime = DateTime.UtcNow.AddHours(2)
            }));

        Assert.Equal("Choose a parking property and a vehicle type.", ex.Message);
    }

    [Fact]
    public async Task ABookingForAPropertyNobodyRegisteredIsMissing()
    {
        using var fixture = new DatabaseFixture();
        await PrepareAsync(fixture);

        var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            Bookings(fixture).CreateReservationAsync(NewDriver(), new CreateReservationRequest
            {
                FacilityId = Guid.NewGuid(),
                VehicleTypeId = Guid.NewGuid(),
                StartTime = DateTime.UtcNow.AddMinutes(10),
                EndTime = DateTime.UtcNow.AddHours(2)
            }));

        Assert.Equal("Parking property not found.", ex.Message);
    }

    [Theory]
    [InlineData(ParkingStatus.DRAFT)]
    [InlineData(ParkingStatus.PENDING_APPROVAL)]
    [InlineData(ParkingStatus.REJECTED)]
    [InlineData(ParkingStatus.SUSPENDED)]
    public async Task ABookingCannotBeTakenAtAPropertyThatIsNotPublished(ParkingStatus status)
    {
        using var fixture = new DatabaseFixture();
        var yard = await PrepareAsync(fixture, status);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            Bookings(fixture).CreateReservationAsync(NewDriver(), new CreateReservationRequest
            {
                FacilityId = yard.Facility.Id,
                VehicleTypeId = yard.VehicleType.Id,
                StartTime = DateTime.UtcNow.AddMinutes(10),
                EndTime = DateTime.UtcNow.AddHours(2)
            }));

        Assert.Equal("This property is not open for reservations.", ex.Message);
    }

    [Fact]
    public async Task ABookingForAVehicleTypeThePropertyNeverAllocatedIsRefused()
    {
        using var fixture = new DatabaseFixture();
        var yard = await PrepareAsync(fixture);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            Bookings(fixture).CreateReservationAsync(NewDriver(), new CreateReservationRequest
            {
                FacilityId = yard.Facility.Id,
                VehicleTypeId = Guid.NewGuid(),
                StartTime = DateTime.UtcNow.AddMinutes(10),
                EndTime = DateTime.UtcNow.AddHours(2)
            }));

        Assert.Equal("This property has no slots for that vehicle type.", ex.Message);
    }

    // ---- What the booking looks like the moment it is built ----

    [Fact]
    public void TheDriverWhoAskedOwnsTheBookingThatIsBuilt()
    {
        var yard = LooseYard();
        var driverId = NewDriver();

        Assert.Equal(driverId, Build(yard, driverId, On(9, 10), On(9, 12)).DriverId);
    }

    [Fact]
    public void TheBookingCarriesThePropertyTheOwnerTheBayAndTheVehicleType()
    {
        var yard = LooseYard();

        var reservation = Build(yard, NewDriver(), On(9, 10), On(9, 12));

        Assert.Equal(yard.Facility.Id, reservation.FacilityId);
        Assert.Equal(yard.Provider.Id, reservation.ProviderId);
        Assert.Equal(yard.Bay.Id, reservation.SlotId);
        Assert.Equal("C-01", reservation.SlotNumber);
        Assert.Equal(yard.VehicleType.Id, reservation.VehicleTypeId);
    }

    [Fact]
    public void TheTimesTheDriverPickedAreStoredExactlyAsGiven()
    {
        var yard = LooseYard();
        var start = On(9, 9, 30);
        var end = On(9, 11, 15);

        var reservation = Build(yard, NewDriver(), start, end);

        Assert.Equal(start, reservation.StartTime);
        Assert.Equal(end, reservation.EndTime);
    }

    [Theory]
    [InlineData(9, 0, 9, 0, 1)]
    [InlineData(9, 0, 10, 0, 1)]
    [InlineData(9, 0, 10, 30, 2)]
    [InlineData(9, 0, 11, 59, 3)]
    [InlineData(9, 0, 12, 0, 3)]
    public void TheBookedLengthRoundsUpToWholeHoursButNeverBelowOne(
        int startHour, int startMinute, int endHour, int endMinute, int expectedHours)
    {
        var yard = LooseYard();

        var reservation = Build(
            yard, NewDriver(), On(9, startHour, startMinute), On(9, endHour, endMinute));

        Assert.Equal(expectedHours, reservation.Hours);
    }

    [Fact]
    public void ANewBookingStartsPendingAndUnapproved()
    {
        var yard = LooseYard();

        var reservation = Build(yard, NewDriver(), On(9, 10), On(9, 12));

        Assert.Equal(ReservationStatus.PENDING, reservation.Status);
        Assert.False(reservation.IsApprovedByProvider);
        Assert.False(reservation.IsAgentBooking);
        Assert.Null(reservation.CheckedInAt);
        Assert.Null(reservation.CheckedOutAt);
        Assert.Null(reservation.CancelledAt);
    }

    [Fact]
    public void EveryBookingGetsItsOwnReference()
    {
        var yard = LooseYard();

        var first = Build(yard, NewDriver(), On(9, 10), On(9, 12));
        var second = Build(yard, NewDriver(), On(9, 10), On(9, 12));

        Assert.NotEqual(Guid.Empty, first.Id);
        Assert.NotEqual(first.Id, second.Id);
    }

    [Fact]
    public void ADriverCanSendNoAmountOfTheirOwn()
    {
        var moneyFields = typeof(CreateReservationRequest).GetProperties()
            .Where(p => p.PropertyType == typeof(decimal) || p.PropertyType == typeof(decimal?))
            .Select(p => p.Name)
            .ToArray();

        Assert.True(moneyFields.Length == 0,
            $"CreateReservationRequest lets a driver post {string.Join(", ", moneyFields)}.");
    }

    [Fact]
    public async Task ADriverOpensTheirOwnBooking()
    {
        using var fixture = new DatabaseFixture();
        var yard = await PrepareAsync(fixture);
        var driverId = NewDriver();
        var reservation = await MineAsync(fixture, yard, driverId, On(9, 10), On(9, 12));

        var shown = await Bookings(fixture).GetReservationAsync(driverId, reservation.Id);

        Assert.NotNull(shown);
        Assert.Equal(reservation.Id, shown!.ReservationId);
        Assert.Equal(driverId, shown.DriverId);
        Assert.Equal(yard.Facility.Id, shown.FacilityId);
        Assert.Equal("Fort Park", shown.FacilityName);
        Assert.Equal("C-01", shown.SlotNumber);
        Assert.Equal(On(9, 10), shown.StartTime);
        Assert.Equal(On(9, 12), shown.EndTime);
        Assert.Equal(nameof(ReservationStatus.PENDING), shown.Status);
    }

    [Fact]
    public async Task ADriverCannotOpenAnotherDriversBooking()
    {
        using var fixture = new DatabaseFixture();
        var yard = await PrepareAsync(fixture);
        var reservation = await MineAsync(fixture, yard, NewDriver(), On(9, 10), On(9, 12));

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            Bookings(fixture).GetReservationAsync(NewDriver(), reservation.Id));

        Assert.Equal("You can only view your own reservations.", ex.Message);
    }

    [Fact]
    public async Task TheOwnerOfThePropertyMayOpenABookingMadeInTheirCarPark()
    {
        using var fixture = new DatabaseFixture();
        var yard = await PrepareAsync(fixture);
        var reservation = await MineAsync(fixture, yard, NewDriver(), On(9, 10), On(9, 12));

        var shown = await Bookings(fixture).GetReservationAsync(yard.Provider.UserId, reservation.Id);

        Assert.NotNull(shown);
        Assert.Equal(reservation.Id, shown!.ReservationId);
    }

    [Fact]
    public async Task AnUnknownBookingReferenceOpensNothing()
    {
        using var fixture = new DatabaseFixture();
        await PrepareAsync(fixture);

        Assert.Null(await Bookings(fixture).GetReservationAsync(NewDriver(), Guid.NewGuid()));
    }

    [Fact]
    public async Task MyBookingsShowOnlyThatDriversRows()
    {
        using var fixture = new DatabaseFixture();
        var yard = await PrepareAsync(fixture);
        var me = NewDriver();
        await MineAsync(fixture, yard, me, On(9, 8), On(9, 9));
        await MineAsync(fixture, yard, me, On(9, 10), On(9, 11));
        await MineAsync(fixture, yard, NewDriver(), On(9, 12), On(9, 13));

        var mine = await Bookings(fixture).GetDriverReservationsAsync(me, null, null, null);

        Assert.Equal(new[] { On(9, 10), On(9, 8) }, mine.Select(booking => booking.StartTime));
        Assert.All(mine, booking => Assert.Equal(me, booking.DriverId));
    }

    [Fact]
    public async Task MyBookingsComeBackNewestStartFirst()
    {
        using var fixture = new DatabaseFixture();
        var yard = await PrepareAsync(fixture);
        var me = NewDriver();
        await MineAsync(fixture, yard, me, On(9, 8), On(9, 9));
        await MineAsync(fixture, yard, me, On(9, 20), On(9, 21));
        await MineAsync(fixture, yard, me, On(9, 14), On(9, 15));

        var mine = await Bookings(fixture).GetDriverReservationsAsync(me, null, null, null);

        Assert.Equal(new[] { 20, 14, 8 }, mine.Select(booking => booking.StartTime.Hour));
    }

    [Fact]
    public async Task MyBookingsCanBeFilteredToTheOnesStillPending()
    {
        using var fixture = new DatabaseFixture();
        var yard = await PrepareAsync(fixture);
        var me = NewDriver();
        await MineAsync(fixture, yard, me, On(9, 8), On(9, 9));
        await MineAsync(fixture, yard, me, On(9, 10), On(9, 11), ReservationStatus.CANCELLED);
        await MineAsync(fixture, yard, me, On(9, 12), On(9, 13), ReservationStatus.CONFIRMED);

        var pending = await Bookings(fixture).GetDriverReservationsAsync(
            me, ReservationStatus.PENDING, null, null);

        var booking = Assert.Single(pending);
        Assert.Equal(nameof(ReservationStatus.PENDING), booking.Status);
    }

    [Fact]
    public async Task MyBookingsCanBeFilteredToADateRange()
    {
        using var fixture = new DatabaseFixture();
        var yard = await PrepareAsync(fixture);
        var me = NewDriver();
        await MineAsync(fixture, yard, me, On(1, 8), On(1, 9));
        await MineAsync(fixture, yard, me, On(5, 8), On(5, 9));
        await MineAsync(fixture, yard, me, On(9, 8), On(9, 9));

        var service = Bookings(fixture);

        // "from" keeps bookings whose end has not passed yet; "to" keeps those already started.
        Assert.Equal(new[] { 9, 5 }, (await service.GetDriverReservationsAsync(me, null, On(5, 0), null))
            .Select(booking => booking.StartTime.Day));

        Assert.Equal(new[] { 1 }, (await service.GetDriverReservationsAsync(me, null, null, On(5, 0)))
            .Select(booking => booking.StartTime.Day));

        Assert.Equal(new[] { 5 }, (await service.GetDriverReservationsAsync(me, null, On(2, 0), On(6, 0)))
            .Select(booking => booking.StartTime.Day));
    }

    [Fact]
    public async Task ADriverWithNothingBookedGetsAnEmptyList()
    {
        using var fixture = new DatabaseFixture();
        await PrepareAsync(fixture);

        Assert.Empty(await Bookings(fixture).GetDriverReservationsAsync(NewDriver(), null, null, null));
    }

    [Fact]
    public async Task ADriverCancelsTheirOwnUpcomingBooking()
    {
        using var fixture = new DatabaseFixture();
        var yard = await PrepareAsync(fixture);
        var me = NewDriver();
        var reservation = await MineAsync(fixture, yard, me,
            DateTime.UtcNow.AddDays(1), DateTime.UtcNow.AddDays(1).AddHours(2));

        var cancelled = await Bookings(fixture).CancelReservationAsync(
            me, reservation.Id, "Plans changed", default);

        Assert.Equal(nameof(ReservationStatus.CANCELLED), cancelled.Status);
        Assert.Equal("Plans changed", cancelled.CancelReason);
        Assert.NotNull(cancelled.CancelledAt);
        Assert.Equal(reservation.Id, cancelled.ReservationId);
    }

    [Fact]
    public async Task ACancellationIsStoredNotJustEchoedBack()
    {
        using var fixture = new DatabaseFixture();
        var yard = await PrepareAsync(fixture);
        var me = NewDriver();
        var reservation = await MineAsync(fixture, yard, me,
            DateTime.UtcNow.AddDays(1), DateTime.UtcNow.AddDays(1).AddHours(2));

        await Bookings(fixture).CancelReservationAsync(me, reservation.Id, null, default);

        var stored = await fixture.Context.Reservations.AsNoTracking()
            .SingleAsync(r => r.Id == reservation.Id);

        Assert.Equal(ReservationStatus.CANCELLED, stored.Status);
    }

    [Fact]
    public async Task ACancellationFreesTheBayForTheNextDriver()
    {
        using var fixture = new DatabaseFixture();
        var yard = await PrepareAsync(fixture);
        var me = NewDriver();
        var start = DateTime.UtcNow.AddDays(1);
        var end = start.AddHours(2);
        var reservation = await MineAsync(fixture, yard, me, start, end);

        var service = Bookings(fixture);
        var whileHeld = await service.GetFacilitySlotsAsync(
            yard.Facility.Id, yard.VehicleType.Id, start, end);
        Assert.False(Assert.Single(whileHeld, row => row.SlotNumber == "C-01").AvailableForPeriod);

        await service.CancelReservationAsync(me, reservation.Id, null, default);

        var afterCancel = await service.GetFacilitySlotsAsync(
            yard.Facility.Id, yard.VehicleType.Id, start, end);
        Assert.True(Assert.Single(afterCancel, row => row.SlotNumber == "C-01").AvailableForPeriod);
    }

    [Fact]
    public async Task ABookingWithACarAlreadyInsideCannotBeCancelledByAnyone()
    {
        using var fixture = new DatabaseFixture();
        var yard = await PrepareAsync(fixture);
        var me = NewDriver();
        var reservation = await MineAsync(fixture, yard, me, On(9, 8), On(9, 12), ReservationStatus.CHECKED_IN);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            Bookings(fixture).CancelReservationAsync(me, reservation.Id, null, default));

        Assert.Equal(
            "A vehicle is in the bay, so this booking can only be ended by checking the driver out.",
            ex.Message);
    }

    [Fact]
    public async Task OnceABookingHasStartedTheDriverHasLostTheRightToCancelIt()
    {
        using var fixture = new DatabaseFixture();
        var yard = await PrepareAsync(fixture);
        var me = NewDriver();
        var reservation = await MineAsync(fixture, yard, me,
            DateTime.UtcNow.AddMinutes(-30), DateTime.UtcNow.AddHours(1));

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            Bookings(fixture).CancelReservationAsync(me, reservation.Id, null, default));

        Assert.Equal("This reservation has already started and can no longer be cancelled.", ex.Message);
    }

    [Fact]
    public async Task TheOwnerMayStillCancelADriversStartedBooking()
    {
        using var fixture = new DatabaseFixture();
        var yard = await PrepareAsync(fixture);
        var reservation = await MineAsync(fixture, yard, NewDriver(),
            DateTime.UtcNow.AddMinutes(-30), DateTime.UtcNow.AddHours(1));

        var cancelled = await Bookings(fixture).CancelReservationAsync(
            yard.Provider.UserId, reservation.Id, "Car park closing", default);

        Assert.Equal(nameof(ReservationStatus.CANCELLED), cancelled.Status);
        Assert.Contains("(property owner)", cancelled.CancelledBy);
    }

    [Fact]
    public async Task TheDriverWhoCancelsIsNamedOnTheBooking()
    {
        using var fixture = new DatabaseFixture();
        var yard = await PrepareAsync(fixture);
        var driver = TestDataBuilder.CreateDriverAccount("Nimal Perera");
        fixture.Context.Users.Add(driver);
        await fixture.Context.SaveChangesAsync();

        var reservation = await MineAsync(fixture, yard, driver.Id,
            DateTime.UtcNow.AddDays(1), DateTime.UtcNow.AddDays(1).AddHours(2));

        var cancelled = await Bookings(fixture).CancelReservationAsync(driver.Id, reservation.Id, null, default);

        Assert.Equal("Nimal Perera (driver)", cancelled.CancelledBy);
        Assert.Null(cancelled.CancelReason);
    }

    [Fact]
    public async Task AStrangerCannotCancelSomebodysBooking()
    {
        using var fixture = new DatabaseFixture();
        var yard = await PrepareAsync(fixture);
        var reservation = await MineAsync(fixture, yard, NewDriver(),
            DateTime.UtcNow.AddDays(1), DateTime.UtcNow.AddDays(1).AddHours(2));

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            Bookings(fixture).CancelReservationAsync(NewDriver(), reservation.Id, null, default));

        Assert.Equal("You can only view your own reservations.", ex.Message);
    }

    [Fact]
    public async Task CancellingABookingThatDoesNotExistSaysSo()
    {
        using var fixture = new DatabaseFixture();
        await PrepareAsync(fixture);

        var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            Bookings(fixture).CancelReservationAsync(NewDriver(), Guid.NewGuid(), null, default));

        Assert.Equal("Reservation not found.", ex.Message);
    }

    [Theory]
    [InlineData(ReservationStatus.CANCELLED, "cancelled")]
    [InlineData(ReservationStatus.COMPLETED, "completed")]
    [InlineData(ReservationStatus.NOSHOW, "noshow")]
    public async Task ABookingThatHasAlreadyEndedCannotBeCancelledAgain(ReservationStatus status, string label)
    {
        using var fixture = new DatabaseFixture();
        var yard = await PrepareAsync(fixture);
        var me = NewDriver();
        var reservation = await MineAsync(fixture, yard, me,
            DateTime.UtcNow.AddDays(1), DateTime.UtcNow.AddDays(1).AddHours(2), status);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            Bookings(fixture).CancelReservationAsync(me, reservation.Id, null, default));

        Assert.Equal($"This reservation is already {label}.", ex.Message);
    }

    [Fact]
    public async Task ACancellationReasonMustFitInTheSpaceAllowed()
    {
        using var fixture = new DatabaseFixture();
        var yard = await PrepareAsync(fixture);
        var me = NewDriver();
        var reservation = await MineAsync(fixture, yard, me,
            DateTime.UtcNow.AddDays(1), DateTime.UtcNow.AddDays(1).AddHours(2));

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            Bookings(fixture).CancelReservationAsync(me, reservation.Id, new string('x', 301), default));

        Assert.Equal("Cancellation reason must be 300 characters or fewer.", ex.Message);
    }

    [Fact]
    public async Task ABlankCancellationReasonIsStoredAsNoReasonAtAll()
    {
        using var fixture = new DatabaseFixture();
        var yard = await PrepareAsync(fixture);
        var me = NewDriver();
        var reservation = await MineAsync(fixture, yard, me,
            DateTime.UtcNow.AddDays(1), DateTime.UtcNow.AddDays(1).AddHours(2));

        var cancelled = await Bookings(fixture).CancelReservationAsync(me, reservation.Id, "   ", default);

        Assert.Null(cancelled.CancelReason);
    }

    private static Yard LooseYard()
    {
        var vehicleType = TestDataBuilder.CreateVehicleType();
        var provider = TestDataBuilder.CreateProvider(Guid.NewGuid());
        var facility = TestDataBuilder.CreateFacility(provider.Id, "Fort Park");
        var allocation = TestDataBuilder.CreateAllocation(facility.Id, vehicleType.Id, 1, 500m);
        var bay = TestDataBuilder.CreateSlot(facility.Id, vehicleType.Id, "C-01");

        return new Yard(facility, bay, vehicleType, provider, allocation);
    }

    private static void BookingWindow(DateTime start, DateTime end, DateTime now)
    {
        var ensure = typeof(ParkingService)
            .GetMethod("EnsureBookingWindow", BindingFlags.NonPublic | BindingFlags.Static)!;

        try
        {
            ensure.Invoke(null, new object[] { start, end, now });
        }
        catch (TargetInvocationException ex) when (ex.InnerException is not null)
        {
            throw ex.InnerException;
        }
    }

    private static Reservation Build(Yard yard, Guid driverId, DateTime start, DateTime end)
    {
        var build = typeof(ParkingService)
            .GetMethod("BuildReservation", BindingFlags.NonPublic | BindingFlags.Static)!;

        return (Reservation)build.Invoke(null,
            new object?[] { driverId, yard.Facility, yard.Bay, yard.Allocation, start, end })!;
    }
}
