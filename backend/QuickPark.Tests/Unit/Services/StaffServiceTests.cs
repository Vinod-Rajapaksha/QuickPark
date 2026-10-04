using Microsoft.EntityFrameworkCore;
using QuickPark.API.Data;
using QuickPark.API.DTOs.Staff;
using QuickPark.API.Enums;
using QuickPark.API.Models;
using QuickPark.API.Services.Implementations;

namespace QuickPark.Tests.Unit.Services;

public class StaffServiceTests
{
    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static ParkingProvider CreateProvider(Guid userId)
    {
        return new ParkingProvider
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            BusinessName = "QuickPark Test Provider"
        };
    }

    private static ParkingFacility CreateFacility(Guid providerId)
    {
        return new ParkingFacility
        {
            Id = Guid.NewGuid(),
            ProviderId = providerId,
            Name = "Colombo Test Parking",
            Address = "Test Address",
            City = "Colombo",
            Province = "Western",
            District = "Colombo",
            LandAreaPerches = 20
        };
    }

    private static User CreateStaffUser(string email)
    {
        return new User
        {
            Id = Guid.NewGuid(),
            FullName = "Test Staff",
            Email = email,
            Phone = "0771234567",
            NIC = "200012345678",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123"),
            Role = UserRole.PARKING_STAFF
        };
    }

    [Fact]
    public async Task CreateStaffAsync_WhenProviderDoesNotExist_ThrowsException()
    {
        await using var context = CreateContext();

        var service = new StaffService(context);

        var request = new CreateStaffRequest
        {
            FacilityId = Guid.NewGuid(),
            FullName = "Test Staff",
            Email = "staff@example.com",
            Password = "Password123",
            Phone = "0771234567",
            NIC = "200012345678",
            Type = StaffType.ADMINISTRATIVE,
            Position = "Manager"
        };

        Func<Task> act = async () =>
            await service.CreateStaffAsync(
                Guid.NewGuid(),
                request);

        await act.Should()
            .ThrowAsync<Exception>()
            .WithMessage("Provider account not found.");
    }

    [Fact]
    public async Task CreateStaffAsync_WithInvalidFacility_ThrowsException()
    {
        await using var context = CreateContext();

        var providerUserId = Guid.NewGuid();

        var provider = CreateProvider(providerUserId);

        context.ParkingProviders.Add(provider);
        await context.SaveChangesAsync();

        var service = new StaffService(context);

        var request = new CreateStaffRequest
        {
            FacilityId = Guid.NewGuid(),
            FullName = "Test Staff",
            Email = "staff@example.com",
            Password = "Password123",
            Phone = "0771234567",
            NIC = "200012345678",
            Type = StaffType.ADMINISTRATIVE,
            Position = "Manager"
        };

        Func<Task> act = async () =>
            await service.CreateStaffAsync(
                providerUserId,
                request);

        await act.Should()
            .ThrowAsync<Exception>()
            .WithMessage("Invalid branch assignment.");
    }

    [Fact]
    public async Task CreateStaffAsync_WithExistingEmail_ThrowsException()
    {
        await using var context = CreateContext();

        var providerUserId = Guid.NewGuid();

        var provider = CreateProvider(providerUserId);

        var facility = CreateFacility(provider.Id);

        var existingUser = new User
        {
            FullName = "Existing User",
            Email = "existing@example.com",
            Phone = "0771111111",
            NIC = "199912345678",
            PasswordHash = "hash",
            Role = UserRole.DRIVER
        };

        context.ParkingProviders.Add(provider);
        context.ParkingFacilities.Add(facility);
        context.Users.Add(existingUser);

        await context.SaveChangesAsync();

        var service = new StaffService(context);

        var request = new CreateStaffRequest
        {
            FacilityId = facility.Id,
            FullName = "New Staff",
            Email = "existing@example.com",
            Password = "Password123",
            Phone = "0772222222",
            NIC = "200012345678",
            Type = StaffType.ADMINISTRATIVE,
            Position = "Manager"
        };

        Func<Task> act = async () =>
            await service.CreateStaffAsync(
                providerUserId,
                request);

        await act.Should()
            .ThrowAsync<Exception>()
            .WithMessage("Email already exists.");
    }

    [Fact]
    public async Task CreateStaffAsync_WithValidAdministrativeStaff_CreatesStaff()
    {
        await using var context = CreateContext();

        var providerUserId = Guid.NewGuid();

        var provider = CreateProvider(providerUserId);

        var facility = CreateFacility(provider.Id);

        context.ParkingProviders.Add(provider);
        context.ParkingFacilities.Add(facility);

        await context.SaveChangesAsync();

        var service = new StaffService(context);

        var request = new CreateStaffRequest
        {
            FacilityId = facility.Id,
            FullName = "Administrative Staff",
            Email = "adminstaff@example.com",
            Password = "Password123",
            Phone = "0771234567",
            NIC = "200012345678",
            Type = StaffType.ADMINISTRATIVE,
            Position = "Branch Manager"
        };

        var result = await service.CreateStaffAsync(
            providerUserId,
            request);

        result.Should().NotBeNull();
        result.FullName.Should().Be(request.FullName);
        result.Email.Should().Be(request.Email);
        result.FacilityId.Should().Be(facility.Id);
        result.Type.Should().Be(StaffType.ADMINISTRATIVE);

        result.CanManageReservations.Should().BeTrue();
        result.CanCheckInVehicle.Should().BeTrue();
        result.CanCheckOutVehicle.Should().BeTrue();
        result.CanViewReports.Should().BeTrue();
        result.CanManageStaff.Should().BeTrue();

        var createdUser = await context.Users
            .FirstOrDefaultAsync(x =>
                x.Email == request.Email);

        createdUser.Should().NotBeNull();

        createdUser!.Role.Should()
            .Be(UserRole.PARKING_STAFF);

        BCrypt.Net.BCrypt.Verify(
            request.Password,
            createdUser.PasswordHash)
            .Should()
            .BeTrue();

        var createdStaff = await context.ParkingStaff
            .FirstOrDefaultAsync(x =>
                x.UserId == createdUser.Id);

        createdStaff.Should().NotBeNull();
        createdStaff!.ProviderId.Should().Be(provider.Id);
        createdStaff.FacilityId.Should().Be(facility.Id);
    }

    [Fact]
    public async Task GetProviderStaffAsync_ReturnsOnlyProvidersStaff()
    {
        await using var context = CreateContext();

        var providerUserId = Guid.NewGuid();
        var otherProviderUserId = Guid.NewGuid();

        var provider = CreateProvider(providerUserId);
        var otherProvider = CreateProvider(otherProviderUserId);

        var facility = CreateFacility(provider.Id);
        var otherFacility = CreateFacility(otherProvider.Id);

        var user = CreateStaffUser("providerstaff@example.com");
        var otherUser = CreateStaffUser("otherstaff@example.com");

        var staff = new ParkingStaff
        {
            UserId = user.Id,
            ProviderId = provider.Id,
            FacilityId = facility.Id,
            Type = StaffType.ADMINISTRATIVE,
            Position = "Manager"
        };

        var otherStaff = new ParkingStaff
        {
            UserId = otherUser.Id,
            ProviderId = otherProvider.Id,
            FacilityId = otherFacility.Id,
            Type = StaffType.ADMINISTRATIVE,
            Position = "Manager"
        };

        context.ParkingProviders.AddRange(
            provider,
            otherProvider);

        context.ParkingFacilities.AddRange(
            facility,
            otherFacility);

        context.Users.AddRange(
            user,
            otherUser);

        context.ParkingStaff.AddRange(
            staff,
            otherStaff);

        await context.SaveChangesAsync();

        var service = new StaffService(context);

        var result =
            await service.GetProviderStaffAsync(
                providerUserId);

        result.Should().HaveCount(1);

        result.Single().UserId
            .Should()
            .Be(user.Id);
    }

    [Fact]
    public async Task GetMyProfileAsync_WhenStaffDoesNotExist_ReturnsNull()
    {
        await using var context = CreateContext();

        var service = new StaffService(context);

        var result =
            await service.GetMyProfileAsync(
                Guid.NewGuid());

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetMyProfileAsync_WhenStaffExists_ReturnsProfile()
    {
        await using var context = CreateContext();

        var providerUserId = Guid.NewGuid();

        var provider = CreateProvider(providerUserId);

        var facility = CreateFacility(provider.Id);

        var user =
            CreateStaffUser("profile@example.com");

        var staff = new ParkingStaff
        {
            UserId = user.Id,
            ProviderId = provider.Id,
            FacilityId = facility.Id,
            Type = StaffType.ADMINISTRATIVE,
            Position = "Supervisor"
        };

        context.ParkingProviders.Add(provider);
        context.ParkingFacilities.Add(facility);
        context.Users.Add(user);
        context.ParkingStaff.Add(staff);

        await context.SaveChangesAsync();

        var service = new StaffService(context);

        var result =
            await service.GetMyProfileAsync(user.Id);

        result.Should().NotBeNull();

        result!.UserId.Should().Be(user.Id);
        result.Email.Should().Be(user.Email);
        result.FacilityId.Should().Be(facility.Id);
    }

    [Fact]
    public async Task UpdateStaffAsync_WhenStaffDoesNotExist_ThrowsException()
    {
        await using var context = CreateContext();

        var providerUserId = Guid.NewGuid();

        var provider = CreateProvider(providerUserId);

        context.ParkingProviders.Add(provider);
        await context.SaveChangesAsync();

        var service = new StaffService(context);

        var request = new UpdateStaffRequest
        {
            FullName = "Updated Staff",
            Phone = "0773333333",
            NIC = "200112345678",
            Type = StaffType.ADMINISTRATIVE,
            Position = "Updated Manager"
        };

        Func<Task> act = async () =>
            await service.UpdateStaffAsync(
                providerUserId,
                Guid.NewGuid(),
                request);

        await act.Should()
            .ThrowAsync<Exception>()
            .WithMessage("Staff not found.");
    }

    [Fact]
    public async Task UpdateStaffAsync_WithValidData_UpdatesStaffAndUser()
    {
        await using var context = CreateContext();

        var providerUserId = Guid.NewGuid();

        var provider = CreateProvider(providerUserId);
        var facility = CreateFacility(provider.Id);

        var user =
            CreateStaffUser("update@example.com");

        var staff = new ParkingStaff
        {
            UserId = user.Id,
            ProviderId = provider.Id,
            FacilityId = facility.Id,
            Type = StaffType.ADMINISTRATIVE,
            Position = "Old Position"
        };

        context.ParkingProviders.Add(provider);
        context.ParkingFacilities.Add(facility);
        context.Users.Add(user);
        context.ParkingStaff.Add(staff);

        await context.SaveChangesAsync();

        var service = new StaffService(context);

        var request = new UpdateStaffRequest
        {
            FullName = "Updated Staff Name",
            Phone = "0712345678",
            NIC = "200122233344",
            Password = "NewPassword123",
            Type = StaffType.ADMINISTRATIVE,
            Position = "Updated Position"
        };

        var result =
            await service.UpdateStaffAsync(
                providerUserId,
                staff.Id,
                request);

        result.FullName.Should()
            .Be("Updated Staff Name");

        result.Phone.Should()
            .Be("0712345678");

        result.Position.Should()
            .Be("Updated Position");

        result.CanManageReservations.Should().BeTrue();
        result.CanViewReports.Should().BeTrue();
        result.CanManageStaff.Should().BeTrue();

        var updatedUser =
            await context.Users.FindAsync(user.Id);

        updatedUser.Should().NotBeNull();

        BCrypt.Net.BCrypt.Verify(
            "NewPassword123",
            updatedUser!.PasswordHash)
            .Should()
            .BeTrue();
    }

    [Fact]
    public async Task UpdateStatusAsync_WhenStaffExists_UpdatesActiveStatus()
    {
        await using var context = CreateContext();

        var providerUserId = Guid.NewGuid();

        var provider = CreateProvider(providerUserId);
        var facility = CreateFacility(provider.Id);
        var user =
            CreateStaffUser("status@example.com");

        var staff = new ParkingStaff
        {
            UserId = user.Id,
            ProviderId = provider.Id,
            FacilityId = facility.Id,
            Type = StaffType.ADMINISTRATIVE,
            Position = "Manager",
            IsActive = true
        };

        context.ParkingProviders.Add(provider);
        context.ParkingFacilities.Add(facility);
        context.Users.Add(user);
        context.ParkingStaff.Add(staff);

        await context.SaveChangesAsync();

        var service = new StaffService(context);

        await service.UpdateStatusAsync(
            providerUserId,
            staff.Id,
            false);

        var updatedStaff =
            await context.ParkingStaff.FindAsync(
                staff.Id);

        updatedStaff.Should().NotBeNull();
        updatedStaff!.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task UpdateStatusAsync_WhenStaffDoesNotExist_ThrowsException()
    {
        await using var context = CreateContext();

        var providerUserId = Guid.NewGuid();

        var provider =
            CreateProvider(providerUserId);

        context.ParkingProviders.Add(provider);
        await context.SaveChangesAsync();

        var service = new StaffService(context);

        Func<Task> act = async () =>
            await service.UpdateStatusAsync(
                providerUserId,
                Guid.NewGuid(),
                false);

        await act.Should()
            .ThrowAsync<Exception>()
            .WithMessage("Staff not found.");
    }

    [Fact]
    public async Task UpdateAssignmentAsync_WithValidFacility_UpdatesFacility()
    {
        await using var context = CreateContext();

        var providerUserId = Guid.NewGuid();

        var provider = CreateProvider(providerUserId);

        var originalFacility =
            CreateFacility(provider.Id);

        originalFacility.Name = "Original Branch";

        var newFacility =
            CreateFacility(provider.Id);

        newFacility.Name = "New Branch";

        var user =
            CreateStaffUser("assignment@example.com");

        var staff = new ParkingStaff
        {
            UserId = user.Id,
            ProviderId = provider.Id,
            FacilityId = originalFacility.Id,
            Type = StaffType.ADMINISTRATIVE,
            Position = "Manager"
        };

        context.ParkingProviders.Add(provider);

        context.ParkingFacilities.AddRange(
            originalFacility,
            newFacility);

        context.Users.Add(user);
        context.ParkingStaff.Add(staff);

        await context.SaveChangesAsync();

        var service = new StaffService(context);

        await service.UpdateAssignmentAsync(
            providerUserId,
            staff.Id,
            newFacility.Id);

        var updatedStaff =
            await context.ParkingStaff.FindAsync(
                staff.Id);

        updatedStaff.Should().NotBeNull();

        updatedStaff!.FacilityId
            .Should()
            .Be(newFacility.Id);
    }

    [Fact]
    public async Task UpdateAssignmentAsync_WithFacilityFromAnotherProvider_ThrowsException()
    {
        await using var context = CreateContext();

        var providerUserId = Guid.NewGuid();

        var provider =
            CreateProvider(providerUserId);

        var otherProvider =
            CreateProvider(Guid.NewGuid());

        var facility =
            CreateFacility(provider.Id);

        var otherFacility =
            CreateFacility(otherProvider.Id);

        var user =
            CreateStaffUser("invalidbranch@example.com");

        var staff = new ParkingStaff
        {
            UserId = user.Id,
            ProviderId = provider.Id,
            FacilityId = facility.Id,
            Type = StaffType.ADMINISTRATIVE,
            Position = "Manager"
        };

        context.ParkingProviders.AddRange(
            provider,
            otherProvider);

        context.ParkingFacilities.AddRange(
            facility,
            otherFacility);

        context.Users.Add(user);
        context.ParkingStaff.Add(staff);

        await context.SaveChangesAsync();

        var service = new StaffService(context);

        Func<Task> act = async () =>
            await service.UpdateAssignmentAsync(
                providerUserId,
                staff.Id,
                otherFacility.Id);

        await act.Should()
            .ThrowAsync<Exception>()
            .WithMessage("Invalid branch.");
    }

    [Fact]
    public async Task GetFacilityStaffAsync_WhenMatchingStaffExists_ReturnsStaff()
    {
        await using var context = CreateContext();

        var provider =
            CreateProvider(Guid.NewGuid());

        var facility =
            CreateFacility(provider.Id);

        var user =
            CreateStaffUser("facilitystaff@example.com");

        var staff = new ParkingStaff
        {
            UserId = user.Id,
            ProviderId = provider.Id,
            FacilityId = facility.Id,
            Type = StaffType.ADMINISTRATIVE,
            Position = "Supervisor"
        };

        context.ParkingProviders.Add(provider);
        context.ParkingFacilities.Add(facility);
        context.Users.Add(user);
        context.ParkingStaff.Add(staff);

        await context.SaveChangesAsync();

        var service = new StaffService(context);

        var result =
            await service.GetFacilityStaffAsync(
                user.Id,
                facility.Id);

        result.Should().HaveCount(1);

        result.Single().UserId
            .Should()
            .Be(user.Id);
    }

    [Fact]
    public async Task GetDashboardAsync_WhenStaffDoesNotExist_ThrowsKeyNotFoundException()
    {
        await using var context = CreateContext();

        var service = new StaffService(context);

        Func<Task> act = async () =>
            await service.GetDashboardAsync(
                Guid.NewGuid());

        await act.Should()
            .ThrowAsync<KeyNotFoundException>()
            .WithMessage("Staff not found.");
    }
}