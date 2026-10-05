using Microsoft.EntityFrameworkCore;
using QuickPark.API.Data;
using QuickPark.API.DTOs.Staff;
using QuickPark.API.Models;
using QuickPark.API.Services.Interfaces;
using QuickPark.API.Enums;

namespace QuickPark.API.Services.Implementations;

public class StaffService : IStaffService
{
    private readonly AppDbContext _context;

    public StaffService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<StaffResponse> CreateStaffAsync(
        Guid providerUserId,
        CreateStaffRequest request)
    {
        var provider = await _context.ParkingProviders
            .FirstOrDefaultAsync(x => x.UserId == providerUserId)
            ?? throw new Exception("Provider account not found.");

        var facility = await _context.ParkingFacilities
            .FirstOrDefaultAsync(x =>
                x.Id == request.FacilityId &&
                x.ProviderId == provider.Id)
            ?? throw new Exception("Invalid branch assignment.");

        if (await _context.Users.AnyAsync(x => x.Email == request.Email))
        {
            throw new Exception("Email already exists.");
        }

        var user = new User
        {
            FullName = request.FullName,
            Email = request.Email,
            Phone = request.Phone,
            NIC = request.NIC,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = UserRole.PARKING_STAFF
        };

        _context.Users.Add(user);

        await _context.SaveChangesAsync();

        var staff = new ParkingStaff
        {
            UserId = user.Id,

            ProviderId = provider.Id,

            FacilityId = facility.Id,

            Type = request.Type,

            Position = request.Position,

            CanManageReservations =
                request.Type == StaffType.ADMINISTRATIVE,

            CanCheckInVehicle = true,

            CanCheckOutVehicle = true,

            CanViewReports =
                request.Type == StaffType.ADMINISTRATIVE,

            CanManageStaff =
                request.Type == StaffType.ADMINISTRATIVE,
        };

        _context.ParkingStaff.Add(staff);

        await _context.SaveChangesAsync();

        return Map(staff, user, facility);

    }

    public async Task<IReadOnlyList<StaffResponse>> GetProviderStaffAsync(
        Guid providerUserId)
    {

        var provider = await _context.ParkingProviders
            .FirstAsync(x => x.UserId == providerUserId);

        var staff = await _context.ParkingStaff
            .Include(x => x.User)
            .Include(x => x.Facility)
            .Where(x => x.ProviderId == provider.Id)
            .ToListAsync();

        return staff
            .Select(x => Map(x, x.User, x.Facility))
            .ToList();

    }

    public async Task<StaffResponse?> GetMyProfileAsync(Guid userId)
    {

        var staff = await _context.ParkingStaff
            .Include(x => x.User)
            .Include(x => x.Facility)
            .FirstOrDefaultAsync(x => x.UserId == userId);

        return staff == null
            ? null
            : Map(staff, staff.User, staff.Facility);

    }

    public async Task<StaffResponse> UpdateStaffAsync(
        Guid providerUserId,
        Guid staffId,
        UpdateStaffRequest request)
    {
        var staff = await GetProviderStaffEntity(providerUserId, staffId);
        
        var user = await _context.Users.FindAsync(staff.UserId) 
            ?? throw new Exception("User not found.");

        user.FullName = request.FullName;
        user.Phone = request.Phone;
        user.NIC = request.NIC;
        
        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        }
        
        staff.Type = request.Type;
        staff.Position = request.Position;
        staff.CanManageReservations = request.Type == StaffType.ADMINISTRATIVE;
        staff.CanViewReports = request.Type == StaffType.ADMINISTRATIVE;
        staff.CanManageStaff = request.Type == StaffType.ADMINISTRATIVE;

        await _context.SaveChangesAsync();

        var facility = await _context.ParkingFacilities.FindAsync(staff.FacilityId);
        
        return Map(staff, user, facility!);
    }

    public async Task UpdateStatusAsync(
        Guid providerUserId,
        Guid staffId,
        bool status)
    {

        var staff = await GetProviderStaffEntity(
            providerUserId,
            staffId);

        staff.IsActive = status;

        await _context.SaveChangesAsync();

    }

    public async Task UpdateAssignmentAsync(
        Guid providerUserId,
        Guid staffId,
        Guid facilityId)
    {

        var staff = await GetProviderStaffEntity(
            providerUserId,
            staffId);

        var facility = await _context.ParkingFacilities
            .FirstOrDefaultAsync(x =>
                x.Id == facilityId &&
                x.ProviderId == staff.ProviderId)
            ?? throw new Exception("Invalid branch.");

        staff.FacilityId = facility.Id;

        await _context.SaveChangesAsync();

    }

    public async Task<IReadOnlyList<StaffResponse>> GetFacilityStaffAsync(
        Guid userId,
        Guid facilityId)
    {

        var result = await _context.ParkingStaff
            .Include(x => x.User)
            .Include(x => x.Facility)
            .Where(x =>
                x.UserId == userId &&
                x.FacilityId == facilityId)
            .ToListAsync();

        return result
            .Select(x => Map(x, x.User, x.Facility))
            .ToList();

    }

    private async Task<ParkingStaff> GetProviderStaffEntity(
        Guid providerUserId,
        Guid staffId)
    {

        var provider = await _context.ParkingProviders
            .FirstAsync(x => x.UserId == providerUserId);

        return await _context.ParkingStaff
            .FirstOrDefaultAsync(x =>
                x.Id == staffId &&
                x.ProviderId == provider.Id)
            ??
            throw new Exception("Staff not found.");

    }

    private StaffResponse Map(
        ParkingStaff staff,
        User user,
        ParkingFacility facility)
    {

        return new StaffResponse
        {
            Id = staff.Id,

            UserId = user.Id,

            FullName = user.FullName,

            Email = user.Email,

            Phone = user.Phone,

            NIC = user.NIC,

            FacilityId = facility.Id,

            FacilityName = facility.Name,

            Type = staff.Type,

            Position = staff.Position,

            CanManageReservations =
                staff.CanManageReservations,

            CanCheckInVehicle =
                staff.CanCheckInVehicle,

            CanCheckOutVehicle =
                staff.CanCheckOutVehicle,

            CanViewReports =
                staff.CanViewReports,

            CanManageStaff =
                staff.CanManageStaff,

            IsActive = staff.IsActive,

            CreatedAt = staff.CreatedAt
        };

    }

    public async Task<StaffDashboardResponse> GetDashboardAsync(
    Guid userId,
    CancellationToken ct = default)
    {

        var staff =
            await _context.ParkingStaff
            .Include(x => x.User)
            .Include(x => x.Provider)
            .Include(x => x.Facility)
            .FirstOrDefaultAsync(
                x => x.UserId == userId,
                ct);

        if (staff == null)
        {
            throw new KeyNotFoundException(
                "Staff not found.");
        }

        var reservations =
            await _context.Reservations
            .CountAsync(
                x =>
                x.FacilityId == staff.FacilityId &&
                x.StartTime.Date == DateTime.UtcNow.Date,
                ct);

        var slots =
            await _context.ParkingSlots
            .Where(
                x => x.FacilityId == staff.FacilityId)
            .ToListAsync(ct);

        return new StaffDashboardResponse
        {
            StaffName = staff.User.FullName,

            ProviderName =
                staff.Provider.BusinessName ?? "",

            FacilityName =
                staff.Facility.Name,

            StaffType =
                staff.Type.ToString(),

            CanManageReservations =
                staff.CanManageReservations,

            CanCheckInVehicle =
                staff.CanCheckInVehicle,

            CanCheckOutVehicle =
                staff.CanCheckOutVehicle,

            TodayReservationCount =
                reservations,

            TotalSlots =
                slots.Count,

            AvailableSlots =
                slots.Count(
                    x => x.Status == SlotStatus.AVAILABLE),

            OccupiedSlots =
                slots.Count(
                    x => x.Status == SlotStatus.OCCUPIED)
        };
    }

}