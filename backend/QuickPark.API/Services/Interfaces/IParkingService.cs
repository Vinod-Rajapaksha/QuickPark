using Microsoft.AspNetCore.Http;
using QuickPark.API.DTOs.Parking;
using QuickPark.API.DTOs.Reservations;
using QuickPark.API.DTOs.Slots;
using QuickPark.API.Enums;

namespace QuickPark.API.Services.Interfaces;

public interface IParkingService
{
    Task<ParkingResponse> CreateFacilityAsync(Guid providerUserId, CreateParkingRequest request, CancellationToken ct = default);
    Task<ParkingResponse> UpdateFacilityAsync(Guid providerUserId, Guid facilityId, UpdateParkingRequest request, CancellationToken ct = default);
    Task DeleteFacilityAsync(Guid providerUserId, Guid facilityId, CancellationToken ct = default);
    Task<IReadOnlyList<ParkingResponse>> GetProviderFacilitiesAsync(Guid providerUserId, CancellationToken ct = default);
    Task<ParkingResponse> GetProviderFacilityAsync(Guid providerUserId, Guid facilityId, CancellationToken ct = default);
    Task<IReadOnlyList<ParkingResponse>> SearchApprovedAsync(ParkingSearchRequest request, CancellationToken ct = default);
    Task<ParkingResponse?> GetApprovedFacilityAsync(Guid facilityId, CancellationToken ct = default);

    Task<ReservationResponse> CreateReservationAsync(
        Guid driverUserId, CreateReservationRequest request, CancellationToken ct = default);
    Task<ReservationResponse?> GetReservationAsync(
        Guid userId, Guid reservationId, CancellationToken ct = default);
    Task<IReadOnlyList<ReservationResponse>> GetDriverReservationsAsync(
        Guid driverUserId, ReservationStatus? status, DateTime? from, DateTime? to,
        CancellationToken ct = default);
    Task<IReadOnlyList<ReservationResponse>> GetProviderReservationsAsync(
        Guid providerUserId, Guid? facilityId, ReservationStatus? status, DateTime? from, DateTime? to,
        CancellationToken ct = default);
    Task<ReservationResponse> CancelReservationAsync(
        Guid userId, Guid reservationId, string? reason, CancellationToken ct = default);

    Task<IReadOnlyList<ParkingFacilityDocumentResponse>> GetFacilityDocumentsAsync(
        Guid providerUserId, Guid facilityId, CancellationToken ct = default);
    Task<ParkingFacilityDocumentResponse> UploadDocumentAsync(
        Guid providerUserId, Guid facilityId, FacilityDocumentType type, IFormFile? file, CancellationToken ct = default);
    Task DeleteDocumentAsync(Guid providerUserId, Guid documentId, CancellationToken ct = default);

    Task<RegistrationOptionsResponse> GetRegistrationOptionsAsync(CancellationToken ct = default);
    Task<ParkingResponse> SaveAllocationsAsync(
        Guid providerUserId, Guid facilityId, SaveAllocationsRequest request, CancellationToken ct = default);
    Task<ParkingResponse> SubmitForReviewAsync(
        Guid providerUserId, Guid facilityId, CancellationToken ct = default);

    Task<IReadOnlyList<SlotResponse>> GetFacilitySlotsAsync(
        Guid facilityId, Guid? vehicleTypeId, DateTime? from, DateTime? to, CancellationToken ct = default);

    Task<ProviderSlotBoardResponse> GetProviderSlotBoardAsync(
        Guid providerUserId, Guid facilityId, Guid? vehicleTypeId, string? status,
        DateTime? from, DateTime? to, CancellationToken ct = default);
    Task<ProviderSlotDetailsResponse> GetProviderSlotAsync(
        Guid providerUserId, Guid slotId, CancellationToken ct = default);
    Task<ProviderSlotRowResponse> UpdateSlotStatusAsync(
        Guid providerUserId, Guid slotId, UpdateSlotRequest request, CancellationToken ct = default);

    // `provider` narrows by name/email/company; each row carries its owner.
    Task<IReadOnlyList<FacilityQueueRowResponse>> GetFacilitiesForReviewAsync(
        ParkingStatus? status, string? provider, CancellationToken ct = default);
    Task<FacilityReviewResponse?> GetFacilityReviewAsync(Guid facilityId, CancellationToken ct = default);

    // One click over the whole property: the same answer for every section.
    Task<ParkingResponse> ReviewFacilityAsync(
        Guid adminUserId, Guid facilityId, ParkingStatus decision, string? rejectionReason,
        CancellationToken ct = default);

    // Decides one section; the property is live only when all four are approved.
    Task<ParkingResponse> ReviewFacilitySectionAsync(
        Guid adminUserId, Guid facilityId, FacilitySection section, ParkingStatus decision,
        string? remarks, CancellationToken ct = default);

    // Re-stamps an owner's identity copies after a profile change.
    Task<ProviderIdentitySyncResponse> SyncProviderIdentityAsync(
        Guid providerUserId, CancellationToken ct = default);

    Task<IReadOnlyList<VehicleTypeAdminResponse>> GetVehicleTypesAsync(CancellationToken ct = default);
    Task<VehicleTypeAdminResponse> CreateVehicleTypeAsync(
        SaveVehicleTypeRequest request, CancellationToken ct = default);
    Task<VehicleTypeAdminResponse> UpdateVehicleTypeAsync(
        Guid vehicleTypeId, SaveVehicleTypeRequest request, CancellationToken ct = default);

    Task<IReadOnlyList<VehiclePricingAdminResponse>> GetVehiclePricingAsync(CancellationToken ct = default);
    Task<VehiclePricingAdminResponse> SaveVehiclePricingAsync(
        Guid vehicleTypeId, SaveVehiclePricingRequest request, CancellationToken ct = default);
    Task DeleteVehiclePricingAsync(Guid vehicleTypeId, CancellationToken ct = default);
}
