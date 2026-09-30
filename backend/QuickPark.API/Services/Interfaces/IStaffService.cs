using QuickPark.API.DTOs.Staff;

namespace QuickPark.API.Services.Interfaces;

public interface IStaffService
{
    Task<StaffResponse> CreateStaffAsync(
        Guid providerUserId,
        CreateStaffRequest request);

    Task<IReadOnlyList<StaffResponse>> GetProviderStaffAsync(
        Guid providerUserId);

    Task<StaffResponse?> GetMyProfileAsync(
        Guid userId);

    Task UpdateStatusAsync(
        Guid providerUserId,
        Guid staffId,
        bool status);

    Task UpdateAssignmentAsync(
        Guid providerUserId,
        Guid staffId,
        Guid facilityId);

    Task<IReadOnlyList<StaffResponse>> GetFacilityStaffAsync(
        Guid userId,
        Guid facilityId);

    Task<StaffDashboardResponse> GetDashboardAsync(
    Guid userId,
    CancellationToken ct = default);

}