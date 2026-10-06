using QuickPark.API.DTOs.Auth;
using QuickPark.API.Enums;
using QuickPark.API.Models;

namespace QuickPark.Tests.Helpers;

public static class TestDataBuilder
{
    public static User CreateUser(string email = "test@example.com", UserRole role = UserRole.DRIVER)
    {
        return new User
        {
            Id = Guid.NewGuid(),
            FullName = "Test User",
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123"),
            Role = role,
            Phone = "0712345678",
            NIC = "123456789V",
            IsActive = true
        };
    }

    public static RegisterRequest CreateRegisterRequest(string email = "test@example.com")
    {
        var num = Random.Shared.Next(100000, 999999);
        return new RegisterRequest
        {
            FullName = "Test User",
            Email = email,
            Password = "Password123",
            Phone = $"071{num}",
            NIC = $"{num}123V",
            Role = UserRole.DRIVER
        };
    }

    public static User CreateDriverAccount(string fullName = "Test Driver")
    {
        return new User
        {
            Id = Guid.NewGuid(),
            FullName = fullName,
            Email = $"driver-{Guid.NewGuid():N}@example.com",
            PasswordHash = "not-a-real-hash",
            Role = UserRole.DRIVER,
            Phone = "0712345678",
            NIC = "123456789V",
            IsActive = true
        };
    }
    
    public static LoginRequest CreateLoginRequest(string email = "test@example.com")
    {
        return new LoginRequest
        {
            Email = email,
            Password = "Password123"
        };
    }

    public static VehicleType CreateVehicleType(
        string name = "Car", string slotCode = "C", int sortOrder = 1)
    {
        return new VehicleType
        {
            Id = Guid.NewGuid(),
            Name = name,
            SlotCode = slotCode,
            SortOrder = sortOrder,
            IsActive = true,
            BayLengthMeters = 4.5m,
            BayWidthMeters = 2.4m
        };
    }

    public static ParkingProvider CreateProvider(
        Guid userId, ProviderStatus verificationStatus = ProviderStatus.APPROVED, string? businessName = null)
    {
        return new ParkingProvider
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            BusinessName = businessName,
            Address = "1 Galle Road, Colombo",
            VerificationStatus = verificationStatus,
            VerifiedAt = verificationStatus == ProviderStatus.APPROVED ? DateTime.UtcNow : null
        };
    }

    public static ParkingFacility CreateFacility(
        Guid providerId,
        string name,
        ParkingStatus status = ParkingStatus.APPROVED,
        string city = "Colombo",
        string province = "Western",
        string district = "Colombo",
        bool hasEvCharging = false,
        decimal? latitude = 6.9271m,
        decimal? longitude = 79.8612m)
    {
        return new ParkingFacility
        {
            Id = Guid.NewGuid(),
            ProviderId = providerId,
            Name = name,
            Address = $"22 {name} Street",
            City = city,
            Province = province,
            District = district,
            Latitude = latitude,
            Longitude = longitude,
            LandAreaPerches = 12m,
            OpeningTime = new TimeOnly(0, 0),
            ClosingTime = new TimeOnly(23, 59),
            HasEvCharging = hasEvCharging,
            Status = status
        };
    }

    public static ParkingFacilityVehicleType CreateAllocation(
        Guid facilityId,
        Guid vehicleTypeId,
        int numberOfSlots = 1,
        decimal hourlyRate = 500m,
        decimal commissionRate = 10m)
    {
        return new ParkingFacilityVehicleType
        {
            Id = Guid.NewGuid(),
            FacilityId = facilityId,
            VehicleTypeId = vehicleTypeId,
            NumberOfSlots = numberOfSlots,
            HourlyRate = hourlyRate,
            CommissionRate = commissionRate,
            BayLengthMeters = 4.5m,
            BayWidthMeters = 2.4m
        };
    }

    public static ParkingSlot CreateSlot(
        Guid facilityId,
        Guid vehicleTypeId,
        string slotNumber,
        SlotStatus status = SlotStatus.AVAILABLE)
    {
        return new ParkingSlot
        {
            Id = Guid.NewGuid(),
            FacilityId = facilityId,
            VehicleTypeId = vehicleTypeId,
            SlotNumber = slotNumber,
            Status = status,
            BayLengthMeters = 4.5m,
            BayWidthMeters = 2.4m
        };
    }

    public static Reservation CreateReservation(
        Guid driverId,
        Guid facilityId,
        Guid providerId,
        Guid slotId,
        Guid vehicleTypeId,
        DateTime startTime,
        DateTime endTime,
        string slotNumber = "C-01",
        ReservationStatus status = ReservationStatus.PENDING,
        decimal hourlyRate = 500m)
    {
        var hours = Math.Max(1, (int)Math.Ceiling((endTime - startTime).TotalMinutes / 60d));

        return new Reservation
        {
            Id = Guid.NewGuid(),
            DriverId = driverId,
            FacilityId = facilityId,
            ProviderId = providerId,
            SlotId = slotId,
            SlotNumber = slotNumber,
            VehicleTypeId = vehicleTypeId,
            StartTime = startTime,
            EndTime = endTime,
            Hours = hours,
            HourlyRate = hourlyRate,
            TotalAmount = hourlyRate * hours,
            Status = status,
            CreatedAt = startTime.AddHours(-2),
            UpdatedAt = startTime.AddHours(-2)
        };
    }
}
