using Microsoft.AspNetCore.Http;
using QuickPark.API.DTOs.Parking;
using QuickPark.API.DTOs.Reservations;
using QuickPark.API.DTOs.Slots;
using QuickPark.API.Enums;
using QuickPark.API.Services.Interfaces;

namespace QuickPark.Tests.Helpers;

// A stand-in for the whole parking service. It answers nothing and remembers everything: the point is
// to see which call a controller makes and with what, so no database is ever opened. Bodies come back
// null because a controller only wraps them in a status code, and the tests read the code and the call.
public sealed class FakeParkingService : IParkingService
{
    private readonly Exception? _failure;

    public FakeParkingService(Exception? failure = null) => _failure = failure;

    public List<Recorded> Calls { get; } = new();

    private Task<T> Record<T>(string method, params object?[] arguments)
    {
        Calls.Add(new Recorded(method, arguments));

        return _failure is null ? Task.FromResult<T>(default!) : Task.FromException<T>(_failure);
    }

    private Task Record(string method, params object?[] arguments)
    {
        Calls.Add(new Recorded(method, arguments));

        return _failure is null ? Task.CompletedTask : Task.FromException(_failure);
    }

    public Task<ParkingResponse> CreateFacilityAsync(Guid providerUserId, CreateParkingRequest request, CancellationToken ct = default) =>
        Record<ParkingResponse>(nameof(CreateFacilityAsync), providerUserId, request, ct);

    public Task<ParkingResponse> UpdateFacilityAsync(Guid providerUserId, Guid facilityId, UpdateParkingRequest request, CancellationToken ct = default) =>
        Record<ParkingResponse>(nameof(UpdateFacilityAsync), providerUserId, facilityId, request, ct);

    public Task DeleteFacilityAsync(Guid providerUserId, Guid facilityId, CancellationToken ct = default) =>
        Record(nameof(DeleteFacilityAsync), providerUserId, facilityId, ct);

    public Task<IReadOnlyList<ParkingResponse>> GetProviderFacilitiesAsync(Guid providerUserId, CancellationToken ct = default) =>
        Record<IReadOnlyList<ParkingResponse>>(nameof(GetProviderFacilitiesAsync), providerUserId, ct);

    public Task<ParkingResponse> GetProviderFacilityAsync(Guid providerUserId, Guid facilityId, CancellationToken ct = default) =>
        Record<ParkingResponse>(nameof(GetProviderFacilityAsync), providerUserId, facilityId, ct);

    public Task<IReadOnlyList<ParkingResponse>> SearchApprovedAsync(ParkingSearchRequest request, CancellationToken ct = default) =>
        Record<IReadOnlyList<ParkingResponse>>(nameof(SearchApprovedAsync), request, ct);

    public Task<ParkingResponse?> GetApprovedFacilityAsync(Guid facilityId, CancellationToken ct = default) =>
        Record<ParkingResponse?>(nameof(GetApprovedFacilityAsync), facilityId, ct);

    public Task<ReservationResponse> CreateReservationAsync(Guid driverId, CreateReservationRequest request, CancellationToken ct = default) =>
        Record<ReservationResponse>(nameof(CreateReservationAsync), driverId, request, ct);

    public Task<ReservationResponse?> GetReservationAsync(Guid userId, Guid reservationId, CancellationToken ct = default) =>
        Record<ReservationResponse?>(nameof(GetReservationAsync), userId, reservationId, ct);

    public Task<IReadOnlyList<ReservationResponse>> GetDriverReservationsAsync(Guid driverId, ReservationStatus? status, DateTime? from, DateTime? to, CancellationToken ct = default) =>
        Record<IReadOnlyList<ReservationResponse>>(nameof(GetDriverReservationsAsync), driverId, status, from, to, ct);

    public Task<IReadOnlyList<ReservationResponse>> GetProviderReservationsAsync(Guid providerUserId, Guid? facilityId, ReservationStatus? status, DateTime? from, DateTime? to, CancellationToken ct = default) =>
        Record<IReadOnlyList<ReservationResponse>>(nameof(GetProviderReservationsAsync), providerUserId, facilityId, status, from, to, ct);

    public Task<ReservationResponse> CancelReservationAsync(Guid userId, Guid reservationId, string? reason, CancellationToken ct = default) =>
        Record<ReservationResponse>(nameof(CancelReservationAsync), userId, reservationId, reason, ct);

    public Task<ReservationResponse> ApproveReservationAsync(Guid providerUserId, Guid reservationId, CancellationToken ct = default) =>
        Record<ReservationResponse>(nameof(ApproveReservationAsync), providerUserId, reservationId, ct);

    public Task SendProviderMessageAsync(Guid providerUserId, Guid reservationId, string message, CancellationToken ct = default) =>
        Record(nameof(SendProviderMessageAsync), providerUserId, reservationId, message, ct);

    public Task<ReservationResponse> CheckInAsync(Guid providerUserId, Guid reservationId, CancellationToken ct = default) =>
        Record<ReservationResponse>(nameof(CheckInAsync), providerUserId, reservationId, ct);

    public Task<ReservationResponse> CheckOutAsync(Guid providerUserId, Guid reservationId, CancellationToken ct = default) =>
        Record<ReservationResponse>(nameof(CheckOutAsync), providerUserId, reservationId, ct);

    public Task<IReadOnlyList<ParkingFacilityDocumentResponse>> GetFacilityDocumentsAsync(Guid providerUserId, Guid facilityId, CancellationToken ct = default) =>
        Record<IReadOnlyList<ParkingFacilityDocumentResponse>>(nameof(GetFacilityDocumentsAsync), providerUserId, facilityId, ct);

    public Task<ParkingFacilityDocumentResponse> UploadDocumentAsync(Guid providerUserId, Guid facilityId, FacilityDocumentType type, IFormFile? file, CancellationToken ct = default) =>
        Record<ParkingFacilityDocumentResponse>(nameof(UploadDocumentAsync), providerUserId, facilityId, type, file, ct);

    public Task DeleteDocumentAsync(Guid providerUserId, Guid documentId, CancellationToken ct = default) =>
        Record(nameof(DeleteDocumentAsync), providerUserId, documentId, ct);

    public Task<RegistrationOptionsResponse> GetRegistrationOptionsAsync(CancellationToken ct = default) =>
        Record<RegistrationOptionsResponse>(nameof(GetRegistrationOptionsAsync), ct);

    public Task<ParkingResponse> SaveAllocationsAsync(Guid providerUserId, Guid facilityId, SaveAllocationsRequest request, CancellationToken ct = default) =>
        Record<ParkingResponse>(nameof(SaveAllocationsAsync), providerUserId, facilityId, request, ct);

    public Task<ParkingResponse> SubmitForReviewAsync(Guid providerUserId, Guid facilityId, CancellationToken ct = default) =>
        Record<ParkingResponse>(nameof(SubmitForReviewAsync), providerUserId, facilityId, ct);

    public Task<IReadOnlyList<SlotResponse>> GetFacilitySlotsAsync(Guid facilityId, Guid? vehicleTypeId, DateTime? from, DateTime? to, CancellationToken ct = default) =>
        Record<IReadOnlyList<SlotResponse>>(nameof(GetFacilitySlotsAsync), facilityId, vehicleTypeId, from, to, ct);

    public Task<ProviderSlotBoardResponse> GetProviderSlotBoardAsync(Guid providerUserId, Guid facilityId, Guid? vehicleTypeId, string? status, DateTime? from, DateTime? to, CancellationToken ct = default) =>
        Record<ProviderSlotBoardResponse>(nameof(GetProviderSlotBoardAsync), providerUserId, facilityId, vehicleTypeId, status, from, to, ct);

    public Task<ProviderSlotDetailsResponse> GetProviderSlotAsync(Guid providerUserId, Guid slotId, CancellationToken ct = default) =>
        Record<ProviderSlotDetailsResponse>(nameof(GetProviderSlotAsync), providerUserId, slotId, ct);

    public Task<ProviderSlotRowResponse> UpdateSlotStatusAsync(Guid providerUserId, Guid slotId, UpdateSlotRequest request, CancellationToken ct = default) =>
        Record<ProviderSlotRowResponse>(nameof(UpdateSlotStatusAsync), providerUserId, slotId, request, ct);

    public Task<IReadOnlyList<FacilityQueueRowResponse>> GetFacilitiesForReviewAsync(ParkingStatus? status, string? provider, CancellationToken ct = default) =>
        Record<IReadOnlyList<FacilityQueueRowResponse>>(nameof(GetFacilitiesForReviewAsync), status, provider, ct);

    public Task<FacilityReviewResponse?> GetFacilityReviewAsync(Guid facilityId, CancellationToken ct = default) =>
        Record<FacilityReviewResponse?>(nameof(GetFacilityReviewAsync), facilityId, ct);

    public Task<ParkingResponse> ReviewFacilityAsync(Guid adminUserId, Guid facilityId, ParkingStatus decision, string? rejectionReason, CancellationToken ct = default) =>
        Record<ParkingResponse>(nameof(ReviewFacilityAsync), adminUserId, facilityId, decision, rejectionReason, ct);

    public Task<ParkingResponse> ReviewFacilitySectionAsync(Guid adminUserId, Guid facilityId, FacilitySection section, ParkingStatus decision, string? remarks, CancellationToken ct = default) =>
        Record<ParkingResponse>(nameof(ReviewFacilitySectionAsync), adminUserId, facilityId, section, decision, remarks, ct);

    public Task<ProviderIdentitySyncResponse> SyncProviderIdentityAsync(Guid providerUserId, CancellationToken ct = default) =>
        Record<ProviderIdentitySyncResponse>(nameof(SyncProviderIdentityAsync), providerUserId, ct);

    public Task<IReadOnlyList<VehicleTypeAdminResponse>> GetVehicleTypesAsync(CancellationToken ct = default) =>
        Record<IReadOnlyList<VehicleTypeAdminResponse>>(nameof(GetVehicleTypesAsync), ct);

    public Task<VehicleTypeAdminResponse> CreateVehicleTypeAsync(SaveVehicleTypeRequest request, CancellationToken ct = default) =>
        Record<VehicleTypeAdminResponse>(nameof(CreateVehicleTypeAsync), request, ct);

    public Task<VehicleTypeAdminResponse> UpdateVehicleTypeAsync(Guid vehicleTypeId, SaveVehicleTypeRequest request, CancellationToken ct = default) =>
        Record<VehicleTypeAdminResponse>(nameof(UpdateVehicleTypeAsync), vehicleTypeId, request, ct);

    public Task<IReadOnlyList<VehiclePricingAdminResponse>> GetVehiclePricingAsync(CancellationToken ct = default) =>
        Record<IReadOnlyList<VehiclePricingAdminResponse>>(nameof(GetVehiclePricingAsync), ct);

    public Task<VehiclePricingAdminResponse> SaveVehiclePricingAsync(Guid vehicleTypeId, SaveVehiclePricingRequest request, CancellationToken ct = default) =>
        Record<VehiclePricingAdminResponse>(nameof(SaveVehiclePricingAsync), vehicleTypeId, request, ct);

    public Task DeleteVehiclePricingAsync(Guid vehicleTypeId, CancellationToken ct = default) =>
        Record(nameof(DeleteVehiclePricingAsync), vehicleTypeId, ct);

    // The call as the controller made it: which service method, and the arguments in declaration order.
    public sealed record Recorded(string Method, object?[] Args);
}
