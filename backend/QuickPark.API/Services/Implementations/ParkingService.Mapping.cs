using QuickPark.API.DTOs.Parking;
using QuickPark.API.DTOs.Reservations;
using QuickPark.API.DTOs.Slots;
using QuickPark.API.Enums;
using QuickPark.API.Models;
using QuickPark.API.Resources;

namespace QuickPark.API.Services.Implementations;

// Entity to response mapping for a facility, its documents, sections, bays and reservations.
public partial class ParkingService
{
    private static ParkingResponse MapToPublicResponse(ParkingFacility facility)
    {
        var response = MapToResponse(facility);
        response.Sections = Array.Empty<FacilitySectionResponse>();
        response.Documents = Array.Empty<ParkingFacilityDocumentSummary>();
        response.DocumentRequirements = Array.Empty<DocumentRequirementResponse>();
        response.DocumentsComplete = false;
        response.RejectionReason = null;
        response.MissingRequirements = Array.Empty<string>();
        response.ReadyForSubmission = false;
        return response;
    }

    private static ReservationResponse MapToReservation(Reservation reservation)
    {
        var facility = reservation.Facility;

        return new ReservationResponse
        {
            ReservationId = reservation.Id,
            DriverId = reservation.DriverId,
            DriverName = reservation.Driver?.FullName ?? string.Empty,
            DriverPhone = reservation.Driver?.Phone ?? string.Empty,
            FacilityId = reservation.FacilityId,
            FacilityName = facility?.Name ?? string.Empty,
            City = facility?.City ?? string.Empty,
            Province = facility?.Province ?? string.Empty,
            District = facility?.District ?? string.Empty,
            ProviderId = reservation.ProviderId,
            SlotId = reservation.SlotId,
            SlotNumber = reservation.SlotNumber,
            VehicleTypeId = reservation.VehicleTypeId,
            VehicleTypeName = reservation.VehicleType?.Name ?? string.Empty,
            StartTime = reservation.StartTime,
            EndTime = reservation.EndTime,
            Hours = reservation.Hours,
            HourlyRate = reservation.HourlyRate,
            TotalAmount = reservation.TotalAmount,
            CommissionRate = reservation.CommissionRate,
            CommissionAmount = reservation.CommissionAmount,
            ProviderAmount = reservation.ProviderAmount,
            Status = reservation.Status.ToString(),
            CheckedInAt = reservation.CheckedInAt,
            CheckedOutAt = reservation.CheckedOutAt,
            CancelReason = reservation.CancelReason,
            CancelledBy = reservation.CancelledBy,
            CancelledAt = reservation.CancelledAt,
            CreatedAt = reservation.CreatedAt,
            UpdatedAt = reservation.UpdatedAt
        };
    }

    private static VehiclePricingAdminResponse MapToVehiclePricingResponse(
        VehiclePricingConfiguration configuration, string vehicleTypeName, string vehicleTypeCode) => new()
    {
        Id = configuration.Id,
        VehicleTypeId = configuration.VehicleTypeId,
        VehicleTypeName = vehicleTypeName,
        VehicleTypeCode = vehicleTypeCode,
        MinimumPrice = configuration.MinimumPrice,
        MaximumPrice = configuration.MaximumPrice,
        CommissionRate = configuration.CommissionRate,
        IsActive = configuration.IsActive,
        CreatedAt = configuration.CreatedAt,
        UpdatedAt = configuration.UpdatedAt
    };

    private static VehicleTypeAdminResponse MapToVehicleTypeResponse(VehicleType vehicleType) => new()
    {
        Id = vehicleType.Id,
        Name = vehicleType.Name,
        SlotCode = vehicleType.SlotCode,
        SortOrder = vehicleType.SortOrder,
        IsActive = vehicleType.IsActive,
        BayLengthMeters = vehicleType.BayLengthMeters,
        BayWidthMeters = vehicleType.BayWidthMeters,
        CreatedAt = vehicleType.CreatedAt,
        UpdatedAt = vehicleType.UpdatedAt
    };

    private static ParkingResponse MapToResponse(ParkingFacility facility)
    {
        var requirements = BuildDocumentRequirements(facility);
        var missing = MissingRequirementsFor(facility);
        var editable = facility.Status is ParkingStatus.DRAFT or ParkingStatus.REJECTED or ParkingStatus.APPROVED;
        var awaitingDecision = facility.Status is ParkingStatus.DRAFT or ParkingStatus.REJECTED;

        return new ParkingResponse
        {
            FacilityId = facility.Id,
            ProviderId = facility.ProviderId,
            Name = facility.Name,
            Address = facility.Address,
            City = facility.City,
            Province = facility.Province,
            District = facility.District,
            Latitude = facility.Latitude,
            Longitude = facility.Longitude,
            LandAreaPerches = facility.LandAreaPerches,
            OpeningTime = facility.OpeningTime,
            ClosingTime = facility.ClosingTime,
            HasEvCharging = facility.HasEvCharging,
            Status = facility.Status.ToString(),
            SlotCount = facility.Slots.Count(s => s.Status != SlotStatus.DISABLED),
            Documents = facility.Documents
                .GroupBy(d => d.Type)
                .Select(group => new ParkingFacilityDocumentSummary
                {
                    Type = group.Key.ToString(),
                    Count = group.Count(),
                    LatestUploadedAt = group.Max(d => (DateTime?)d.UploadedAt)
                })
                .ToList(),
            DocumentsComplete = requirements.All(r => r.Satisfied),
            DocumentRequirements = requirements,
            Sections = BuildSections(facility),
            Allocations = BuildAllocations(facility),
            SlotGroups = BuildSlotGroups(facility),
            MissingRequirements = missing,
            ReadyForSubmission = awaitingDecision && missing.Count == 0,
            IsEditable = editable,
            RejectionReason = facility.RejectionReason,
            SubmittedAt = facility.SubmittedAt,
            ReviewedAt = facility.ReviewedAt,
            CreatedAt = facility.CreatedAt,
            UpdatedAt = facility.UpdatedAt
        };
    }

    private static List<DocumentRequirementResponse> BuildDocumentRequirements(ParkingFacility facility) =>
        FacilityDocumentRules.Ordered.Select(rule =>
        {
            var count = facility.Documents.Count(d => d.Type == rule.Type);
            return new DocumentRequirementResponse
            {
                Type = rule.Type.ToString(),
                Label = rule.Label,
                Count = count,
                MinRequired = rule.MinRequired,
                MaxAllowed = rule.MaxAllowed,
                ReplacesExisting = rule.ReplacesExisting,
                Satisfied = count >= rule.MinRequired && (rule.MaxAllowed is null || count <= rule.MaxAllowed)
            };
        }).ToList();

    private static List<FacilityAllocationResponse> BuildAllocations(ParkingFacility facility) =>
        facility.VehicleAllocations
            .OrderBy(a => a.VehicleType?.Name)
            .Select(a => new FacilityAllocationResponse
            {
                VehicleTypeId = a.VehicleTypeId,
                VehicleTypeName = a.VehicleType?.Name ?? string.Empty,
                VehicleTypeCode = a.VehicleType?.SlotCode ?? string.Empty,
                BayLengthMeters = a.BayLengthMeters,
                BayWidthMeters = a.BayWidthMeters,
                NumberOfSlots = a.NumberOfSlots,
                HourlyRate = a.HourlyRate,
                CommissionRate = a.CommissionRate
            })
            .ToList();

    private static List<FacilitySlotGroup> BuildSlotGroups(ParkingFacility facility) =>
        facility.Slots
            .Where(s => s.Status != SlotStatus.DISABLED)
            .GroupBy(s => s.VehicleTypeId)
            .Select(group =>
            {
                var allocation = facility.VehicleAllocations.FirstOrDefault(a => a.VehicleTypeId == group.Key);
                var vehicleType = group.First().VehicleType;
                return new FacilitySlotGroup
                {
                    VehicleTypeId = group.Key,
                    VehicleTypeName = vehicleType?.Name ?? string.Empty,
                    VehicleTypeCode = vehicleType?.SlotCode ?? string.Empty,
                    BayLabel = BayLabel(allocation?.BayLengthMeters, allocation?.BayWidthMeters),
                    HourlyRate = allocation?.HourlyRate ?? 0m,
                    Total = group.Count(),
                    Available = group.Count(s => s.Status == SlotStatus.AVAILABLE)
                };
            })
            .OrderBy(g => g.VehicleTypeName)
            .ToList();

    private static List<FacilitySectionResponse> BuildSections(ParkingFacility facility) =>
        FacilitySectionRules.Ordered
            .Select(rule =>
            {
                var row = facility.SectionReviews.FirstOrDefault(r => r.Section == rule.Section);
                return new FacilitySectionResponse
                {
                    Section = rule.Section.ToString(),
                    Label = rule.Label,
                    Description = rule.Description,
                    Status = row?.Status.ToString() ?? "NOT_SUBMITTED",
                    Remarks = row?.Remarks,
                    ReviewedBy = row?.ReviewedBy,
                    ReviewedAt = row?.ReviewedAt,
                    MissingRequirements = MissingRequirementsFor(facility, rule.Section)
                };
            })
            .ToList();

    private static List<string> MissingRequirementsFor(ParkingFacility facility) =>
        FacilitySectionRules.Ordered
            .SelectMany(rule => MissingRequirementsFor(facility, rule.Section))
            .ToList();

    private static List<string> MissingRequirementsFor(ParkingFacility facility, FacilitySection section)
    {
        var missing = new List<string>();

        switch (section)
        {
            case FacilitySection.PROPERTY_LOCATION:
                if (facility.Latitude is null || facility.Longitude is null)
                {
                    missing.Add("enter the property latitude and longitude");
                }

                break;

            case FacilitySection.DOCUMENTS:
                foreach (var rule in FacilityDocumentRules.Ordered)
                {
                    if (rule.MinRequired <= 0) continue;

                    var count = facility.Documents.Count(d => d.Type == rule.Type);
                    if (count >= rule.MinRequired) continue;

                    missing.Add(rule.MinRequired == 1
                        ? $"upload the {rule.Label.ToLowerInvariant()}"
                        : $"upload {rule.MinRequired} {rule.Label.ToLowerInvariant()} ({count} uploaded)");
                }

                break;

            case FacilitySection.PRICING:
                if (facility.VehicleAllocations.Count == 0)
                {
                    missing.Add("allocate at least one vehicle type");
                }

                break;
        }

        return missing;
    }

    private static ParkingFacilityDocumentResponse MapToDocumentResponse(ParkingFacilityDocument document) => new()
    {
        DocumentId = document.Id,
        FacilityId = document.FacilityId,
        Type = document.Type.ToString(),
        Url = document.Url,
        FileName = document.FileName,
        ContentType = document.ContentType,
        SizeBytes = document.SizeBytes,
        UploadedAt = document.UploadedAt
    };
}
