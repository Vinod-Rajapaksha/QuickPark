using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using QuickPark.API.Data;
using QuickPark.API.DTOs.Parking;
using QuickPark.API.DTOs.Reservations;
using QuickPark.API.DTOs.Slots;
using QuickPark.API.Enums;
using QuickPark.API.Helpers;
using QuickPark.API.Integrations.Storage;
using QuickPark.API.Models;
using QuickPark.API.Resources;
using QuickPark.API.Services.Interfaces;

namespace QuickPark.API.Services.Implementations;

public partial class ParkingService : IParkingService
{
    private readonly AppDbContext _context;

    private readonly CloudinaryStorageClient _storage;

    public ParkingService(AppDbContext context, IConfiguration configuration)
    {
        _context = context;

        // Property documents share the NIC Cloudinary account
        var cloudName = Resolve(configuration["Cloudinary:CloudName"], "CLOUDINARY_CLOUD_NAME");
        var apiKey = Resolve(configuration["Cloudinary:ApiKey"], "CLOUDINARY_API_KEY");
        var apiSecret = Resolve(configuration["Cloudinary:ApiSecret"], "CLOUDINARY_API_SECRET");
        var folder = Resolve(configuration["Cloudinary:FacilityFolder"], "CLOUDINARY_FACILITY_FOLDER", "quickpark/facility");

        _storage = new CloudinaryStorageClient(cloudName, apiKey, apiSecret, folder);
    }

    private static string Resolve(string? configValue, string envVar, string fallback = "")
    {
        if (!string.IsNullOrWhiteSpace(configValue)) return configValue!;
        var fromEnv = Environment.GetEnvironmentVariable(envVar);
        return string.IsNullOrWhiteSpace(fromEnv) ? fallback : fromEnv!;
    }

    public async Task<ParkingResponse> CreateFacilityAsync(
        Guid providerUserId, CreateParkingRequest request, CancellationToken ct = default)
    {
        var provider = await GetVerifiedProviderAsync(providerUserId, ct);
        var stamp = await LoadProviderStampAsync(providerUserId, ct);

        var details = ValidateDetails(
            request.Name, request.Address, request.City,
            request.Province, request.District,
            request.Latitude, request.Longitude, request.LandAreaPerches);

        var facility = new ParkingFacility
        {
            ProviderId = provider.Id,
            ProviderName = stamp.Name,
            ProviderEmail = stamp.Email,
            ProviderBusinessName = stamp.BusinessName,
            Name = details.Name,
            Address = details.Address,
            City = details.City,
            Province = details.Province,
            District = details.District,
            Latitude = details.Latitude,
            Longitude = details.Longitude,
            LandAreaPerches = details.LandAreaPerches,
            OpeningTime = request.OpeningTime,
            ClosingTime = request.ClosingTime,
            HasEvCharging = request.HasEvCharging,
            Status = ParkingStatus.DRAFT
        };

        _context.Set<ParkingFacility>().Add(facility);
        await _context.SaveChangesAsync(ct);

        return MapToResponse(facility);
    }

    public async Task<ParkingResponse> UpdateFacilityAsync(
        Guid providerUserId, Guid facilityId, UpdateParkingRequest request, CancellationToken ct = default)
    {
        await GetVerifiedProviderAsync(providerUserId, ct);

        var facility = await GetOwnedFacilityAsync(providerUserId, facilityId, ct);

        EnsureOwnerMayEdit(facility);

        var details = ValidateDetails(
            request.Name, request.Address, request.City,
            request.Province, request.District,
            request.Latitude, request.Longitude, request.LandAreaPerches);

        var detailsChanged = facility.Name != details.Name ||
                             facility.Address != details.Address ||
                             facility.City != details.City ||
                             facility.Province != details.Province ||
                             facility.District != details.District ||
                             facility.LandAreaPerches != details.LandAreaPerches ||
                             facility.HasEvCharging != request.HasEvCharging;
        var locationChanged = facility.Latitude != details.Latitude || facility.Longitude != details.Longitude;

        facility.Name = details.Name;
        facility.Address = details.Address;
        facility.City = details.City;
        facility.Province = details.Province;
        facility.District = details.District;
        facility.Latitude = details.Latitude;
        facility.Longitude = details.Longitude;
        facility.LandAreaPerches = details.LandAreaPerches;
        facility.OpeningTime = request.OpeningTime;
        facility.ClosingTime = request.ClosingTime;
        facility.HasEvCharging = request.HasEvCharging;

        // Changing part of an approved property sends that part back for re-approval
        var now = DateTime.UtcNow;
        if (detailsChanged) ReopenSection(facility, FacilitySection.BASIC_INFORMATION, now);
        if (locationChanged) ReopenSection(facility, FacilitySection.PROPERTY_LOCATION, now);

        facility.UpdatedAt = now;

        await _context.SaveChangesAsync(ct);

        return MapToResponse(facility);
    }

    public async Task<IReadOnlyList<ParkingResponse>> GetProviderFacilitiesAsync(
        Guid providerUserId, CancellationToken ct = default)
    {
        var provider = await _context.ParkingProviders
            .FirstOrDefaultAsync(p => p.UserId == providerUserId, ct);

        if (provider == null) return Array.Empty<ParkingResponse>();

        var facilities = await FacilitiesForResponse()
            .Where(f => f.ProviderId == provider.Id)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync(ct);

        return facilities.Select(MapToResponse).ToList();
    }

    public async Task<IReadOnlyList<ParkingResponse>> SearchApprovedAsync(
        ParkingSearchRequest request, CancellationToken ct = default)
    {
        var province = request.Province.TrimToNull();
        var district = request.District.TrimToNull();
        var city = request.City.TrimToNull();

        var reference = ValidateReferencePoint(request.Latitude, request.Longitude, request.RadiusKm);

        var query = FacilitiesForResponse()
            .Where(f => f.Status == ParkingStatus.APPROVED);

        if (province != null) query = query.Where(f => f.Province.ToLower() == province.ToLower());
        if (district != null) query = query.Where(f => f.District.ToLower() == district.ToLower());
        if (city != null) query = query.Where(f => f.City.ToLower() == city.ToLower());

        var facilities = await query
            .OrderBy(f => f.Name)
            .ToListAsync(ct);

        if (reference is not (double lat, double lng))
        {
            return facilities.Select(MapToPublicResponse).ToList();
        }

        var measured = facilities
            .Select(f => (Facility: f, Km: f.Latitude is decimal facilityLat && f.Longitude is decimal facilityLng
                ? HaversineKm(lat, lng, (double)facilityLat, (double)facilityLng)
                : (double?)null))
            .Where(x => request.RadiusKm is not int radius || (x.Km is double km && km <= radius))
            .OrderBy(x => x.Km ?? double.MaxValue)
            .ThenBy(x => x.Facility.Name)
            .ToList();

        return measured.Select(x =>
        {
            var response = MapToPublicResponse(x.Facility);
            response.DistanceKm = x.Km is double kilometres ? Math.Round(kilometres, 2) : null;
            return response;
        }).ToList();
    }

    public async Task<ParkingResponse?> GetApprovedFacilityAsync(Guid facilityId, CancellationToken ct = default)
    {
        var facility = await FacilitiesForResponse()
            .FirstOrDefaultAsync(f => f.Id == facilityId && f.Status == ParkingStatus.APPROVED, ct);

        return facility == null ? null : MapToPublicResponse(facility);
    }

    private const int MaxCancelReasonLength = 300;

    public async Task<IReadOnlyList<ParkingFacilityDocumentResponse>> GetFacilityDocumentsAsync(
        Guid providerUserId, Guid facilityId, CancellationToken ct = default)
    {
        var facility = await _context.Set<ParkingFacility>()
            .Include(f => f.Documents)
            .FirstOrDefaultAsync(f => f.Id == facilityId, ct)
            ?? throw new KeyNotFoundException("Parking property not found.");

        await EnsureOwnershipAsync(providerUserId, facility, ct);

        return facility.Documents
            .OrderByDescending(d => d.UploadedAt)
            .Select(MapToDocumentResponse)
            .ToList();
    }

    public async Task<ParkingFacilityDocumentResponse> UploadDocumentAsync(
        Guid providerUserId, Guid facilityId, FacilityDocumentType type, IFormFile? file, CancellationToken ct = default)
    {
        var facility = await _context.Set<ParkingFacility>()
            .Include(f => f.Documents)
            .Include(f => f.SectionReviews)
            .FirstOrDefaultAsync(f => f.Id == facilityId, ct)
            ?? throw new KeyNotFoundException("Parking property not found.");

        await EnsureOwnershipAsync(providerUserId, facility, ct);
        EnsureOwnerMayEdit(facility);

        var rule = FacilityDocumentRules.For(type);
        var label = rule.Label;
        var existing = facility.Documents.Where(d => d.Type == type).OrderBy(d => d.UploadedAt).ToList();

        if (!rule.ReplacesExisting && rule.MaxAllowed is int max && existing.Count >= max)
        {
            throw new InvalidOperationException(
                $"{label} allows at most {max} image{(max == 1 ? "" : "s")}. Delete one first.");
        }

        var validated = await DocumentFileValidator.ValidateAndReadAsync(file, label, ct);
        var bytes = validated.Bytes;

        var contentType = validated.ContentType;
        var fileName = $"{type.ToString().ToLowerInvariant()}_{facilityId:N}_{DateTime.UtcNow:yyyyMMddHHmmss}" +
                       $".{DocumentFileValidator.ExtensionFor(contentType)}";

        var upload = await _storage.UploadImageAsync(bytes, fileName, contentType, ct);

        var replaced = rule.ReplacesExisting ? existing : new List<ParkingFacilityDocument>();
        if (replaced.Count > 0)
        {
            _context.Set<ParkingFacilityDocument>().RemoveRange(replaced);
        }

        var document = new ParkingFacilityDocument
        {
            FacilityId = facility.Id,
            Type = type,
            Url = upload.SecureUrl,
            PublicId = upload.PublicId,
            FileName = validated.FileName,
            ContentType = contentType,
            SizeBytes = bytes.Length,
            ProviderName = facility.ProviderName,
            ProviderEmail = facility.ProviderEmail,
            ProviderBusinessName = facility.ProviderBusinessName,
            UploadedAt = DateTime.UtcNow
        };

        _context.Set<ParkingFacilityDocument>().Add(document);
        ReopenSection(facility, FacilitySection.DOCUMENTS, DateTime.UtcNow);
        facility.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        foreach (var old in replaced)
        {
            await DestroyAssetAsync(old.PublicId, ct);
        }

        return MapToDocumentResponse(document);
    }

    public async Task DeleteDocumentAsync(Guid providerUserId, Guid documentId, CancellationToken ct = default)
    {
        var document = await _context.Set<ParkingFacilityDocument>()
            .Include(d => d.Facility)
            .ThenInclude(f => f!.SectionReviews)
            .FirstOrDefaultAsync(d => d.Id == documentId, ct)
            ?? throw new KeyNotFoundException("Document not found.");

        if (document.Facility == null)
        {
            throw new KeyNotFoundException("Parking property not found.");
        }

        await EnsureOwnershipAsync(providerUserId, document.Facility, ct);
        EnsureOwnerMayEdit(document.Facility);

        _context.Set<ParkingFacilityDocument>().Remove(document);
        ReopenSection(document.Facility, FacilitySection.DOCUMENTS, DateTime.UtcNow);
        await _context.SaveChangesAsync(ct);

        await DestroyAssetAsync(document.PublicId, ct);
    }

    private async Task DestroyAssetAsync(string? publicId, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(publicId)) return;

        try { await _storage.DestroyAsync(publicId, ct); }
        catch { /* non-fatal: orphaned asset can be cleaned up later */ }
    }

    public async Task<RegistrationOptionsResponse> GetRegistrationOptionsAsync(CancellationToken ct = default)
    {
        var vehicleTypes = await _context.Set<VehicleType>()
            .Where(v => v.IsActive)
            .OrderBy(v => v.SortOrder)
            .ThenBy(v => v.Name)
            .Select(v => new
            {
                v.Id,
                v.Name,
                v.SlotCode,
                v.SortOrder,
                v.BayLengthMeters,
                v.BayWidthMeters
            })
            .ToListAsync(ct);

        var pricing = await _context.Set<VehiclePricingConfiguration>()
            .Where(p => p.IsActive)
            .ToDictionaryAsync(p => p.VehicleTypeId, ct);

        return new RegistrationOptionsResponse
        {
            VehicleTypes = vehicleTypes
                .Select(v =>
                {
                    pricing.TryGetValue(v.Id, out var configuration);

                    return new VehicleTypeOptionResponse
                    {
                        Id = v.Id,
                        Name = v.Name,
                        Code = v.SlotCode,
                        SortOrder = v.SortOrder,
                        BayLengthMeters = v.BayLengthMeters,
                        BayWidthMeters = v.BayWidthMeters,
                        MinPrice = configuration?.MinimumPrice,
                        MaxPrice = configuration?.MaximumPrice,
                        CommissionRate = configuration?.CommissionRate
                    };
                })
                .ToList()
        };
    }

    public async Task<ParkingResponse> SaveAllocationsAsync(
        Guid providerUserId, Guid facilityId, SaveAllocationsRequest request, CancellationToken ct = default)
    {
        await GetVerifiedProviderAsync(providerUserId, ct);
        var facility = await GetOwnedFacilityAsync(providerUserId, facilityId, ct);

        EnsureOwnerMayEdit(facility);

        var allocations = ValidateAllocations(request.Allocations);

        var vehicleTypes = await _context.Set<VehicleType>()
            .Where(v => allocations.Select(a => a.VehicleTypeId).Contains(v.Id))
            .ToDictionaryAsync(v => v.Id, ct);

        // Only a layout change touches slot rows, so a fully booked property can still be repriced.
        var layoutChanged = LayoutDiffers(facility, allocations);

        // Bay size comes from the vehicle type, never the provider, so bays stay interchangeable across properties.
        var allocatedVehicleTypeIds = allocations.Select(a => a.VehicleTypeId).ToList();
        var pricing = await _context.Set<VehiclePricingConfiguration>()
            .Where(p => p.IsActive && allocatedVehicleTypeIds.Contains(p.VehicleTypeId))
            .ToDictionaryAsync(p => p.VehicleTypeId, ct);

        foreach (var allocation in allocations)
        {
            if (!vehicleTypes.TryGetValue(allocation.VehicleTypeId, out var vehicleType) || !vehicleType.IsActive)
            {
                throw new InvalidOperationException("Choose an active vehicle type for every allocation.");
            }

            EnsureStandardBay(vehicleType);

            if (!pricing.TryGetValue(allocation.VehicleTypeId, out var configuration))
            {
                throw new InvalidOperationException(
                    $"The platform admin has not set pricing for {vehicleType.Name} yet, so it cannot be allocated. Contact the admin.");
            }

            EnsurePriceWithinWindow(allocation.HourlyRate, configuration, vehicleType.Name);
        }

        var now = DateTime.UtcNow;

        var heldSlotIds = layoutChanged
            ? (await _context.Set<Reservation>()
                .Where(r => r.FacilityId == facility.Id &&
                            (r.Status == ReservationStatus.PENDING || r.Status == ReservationStatus.CONFIRMED) &&
                            r.EndTime > now)
                .Select(r => r.SlotId)
                .ToListAsync(ct)).ToHashSet()
            : new HashSet<Guid>();

        await using var transaction = await _context.Database.BeginTransactionAsync(ct);

        if (layoutChanged)
        {
            ReconcileSlots(facility, allocations, vehicleTypes, heldSlotIds, now);
        }

        SyncAllocationRows(facility, allocations, vehicleTypes, pricing, now);

        if (layoutChanged) ReopenSection(facility, FacilitySection.PRICING, now);

        facility.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);

        return MapToResponse(facility);
    }

    public async Task<ParkingResponse> SubmitForReviewAsync(
        Guid providerUserId, Guid facilityId, CancellationToken ct = default)
    {
        await GetVerifiedProviderAsync(providerUserId, ct);
        var facility = await GetOwnedFacilityAsync(providerUserId, facilityId, ct);

        if (facility.Status == ParkingStatus.PENDING_APPROVAL)
        {
            throw new InvalidOperationException("This property is already waiting for admin review.");
        }

        if (facility.Status is not (ParkingStatus.DRAFT or ParkingStatus.REJECTED))
        {
            throw new InvalidOperationException("This property is already approved.");
        }

        var missing = MissingRequirementsFor(facility);
        if (missing.Count > 0)
        {
            throw new InvalidOperationException($"Cannot submit for review yet: {string.Join(" ", missing)}");
        }

        await EnsureStoredConfigurationCurrentAsync(facility, ct);

        var now = DateTime.UtcNow;
        OpenSectionsForSubmission(facility, now);
        facility.SubmittedAt = now;
        facility.UpdatedAt = now;
        await _context.SaveChangesAsync(ct);

        return MapToResponse(facility);
    }

    public async Task<IReadOnlyList<SlotResponse>> GetFacilitySlotsAsync(
        Guid facilityId, Guid? vehicleTypeId, DateTime? from, DateTime? to, CancellationToken ct = default)
    {
        if ((from is null) != (to is null))
        {
            throw new InvalidOperationException("Provide both from and to to check a booking window.");
        }

        var facility = await _context.Set<ParkingFacility>()
            .Include(f => f.VehicleAllocations)
            .FirstOrDefaultAsync(f => f.Id == facilityId, ct)
            ?? throw new KeyNotFoundException("Parking property not found.");

        if (facility.Status != ParkingStatus.APPROVED)
        {
            throw new InvalidOperationException("This property is not open for reservations.");
        }

        var now = DateTime.UtcNow;
        var windowStart = from ?? now;
        var windowEnd = to ?? windowStart;

        if (windowEnd < windowStart)
        {
            throw new InvalidOperationException("The booking window must end after it starts.");
        }

        var slotQuery = _context.Set<ParkingSlot>()
            .Include(s => s.VehicleType)
            .Where(s => s.FacilityId == facilityId && s.Status != SlotStatus.DISABLED);

        if (vehicleTypeId is Guid type) slotQuery = slotQuery.Where(s => s.VehicleTypeId == type);

        var slots = await slotQuery.OrderBy(s => s.SlotNumber).ToListAsync(ct);
        if (slots.Count == 0) return Array.Empty<SlotResponse>();

        var busy = await GetBusySlotsAsync(
            slots.Select(s => s.Id).ToList(), windowStart, windowEnd, ct);

        var rates = facility.VehicleAllocations
            .GroupBy(a => a.VehicleTypeId)
            .ToDictionary(g => g.Key, g => g.First().HourlyRate);

        return slots.Select(s =>
        {
            var isBusy = busy.TryGetValue(s.Id, out var window);

            return new SlotResponse
            {
                SlotId = s.Id,
                FacilityId = s.FacilityId,
                SlotNumber = s.SlotNumber,
                VehicleTypeId = s.VehicleTypeId,
                VehicleTypeName = s.VehicleType?.Name ?? string.Empty,
                BayLabel = BayLabel(s.BayLengthMeters, s.BayWidthMeters),
                Status = s.Status.ToString(),
                HourlyRate = rates.TryGetValue(s.VehicleTypeId, out var rate) ? rate : 0m,
                AvailableForPeriod = s.Status == SlotStatus.AVAILABLE && !isBusy,
                BusyFrom = isBusy ? window.Start : null,
                BusyUntil = isBusy ? window.End : null
            };
        }).ToList();
    }

    public async Task<ReservationResponse> CreateReservationAsync(
        Guid driverUserId, CreateReservationRequest request, CancellationToken ct = default)
    {
        var start = request.StartTime.AsUtc();
        var end = request.EndTime.AsUtc();
        var now = DateTime.UtcNow;

        if (request.FacilityId == Guid.Empty || request.VehicleTypeId == Guid.Empty)
        {
            throw new InvalidOperationException("Choose a parking property and a vehicle type.");
        }

        EnsureBookingWindow(start, end, now);

        var facility = await _context.Set<ParkingFacility>()
            .Include(f => f.VehicleAllocations)
            .FirstOrDefaultAsync(f => f.Id == request.FacilityId, ct)
            ?? throw new KeyNotFoundException("Parking property not found.");

        if (facility.Status != ParkingStatus.APPROVED)
        {
            throw new InvalidOperationException("This property is not open for reservations.");
        }

        var allocation = facility.VehicleAllocations.FirstOrDefault(a => a.VehicleTypeId == request.VehicleTypeId)
            ?? throw new InvalidOperationException("This property has no slots for that vehicle type.");

        await using var transaction = await _context.Database.BeginTransactionAsync(ct);

        var slot = request.SlotId is Guid chosen
            ? await GetBookableSlotAsync(facility, chosen, allocation.VehicleTypeId, start, end, ct)
            : await AssignFreeSlotAsync(facility, allocation.VehicleTypeId, start, end, ct);

        var reservation = BuildReservation(driverUserId, facility, slot, allocation, start, end);

        _context.Set<Reservation>().Add(reservation);
        await _context.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);

        return await LoadReservationAsync(reservation.Id, ct)
            ?? throw new KeyNotFoundException("Reservation not found.");
    }

    public async Task<ReservationResponse?> GetReservationAsync(
        Guid userId, Guid reservationId, CancellationToken ct = default)
    {
        var reservation = await ReservationsForResponse()
            .FirstOrDefaultAsync(r => r.Id == reservationId, ct);

        if (reservation == null) return null;

        await EnsureReservationAccessAsync(userId, reservation, ct);
        return MapToReservation(reservation);
    }

    public async Task<IReadOnlyList<ReservationResponse>> GetDriverReservationsAsync(
        Guid driverUserId, ReservationStatus? status, DateTime? from, DateTime? to,
        CancellationToken ct = default)
    {
        var query = ReservationsForResponse().Where(r => r.DriverUserId == driverUserId);
        var filtered = ApplyReservationFilters(query, status, from, to);

        var reservations = await filtered
            .OrderByDescending(r => r.StartTime)
            .ToListAsync(ct);

        return reservations.Select(MapToReservation).ToList();
    }

    public async Task<IReadOnlyList<ReservationResponse>> GetProviderReservationsAsync(
        Guid providerUserId, Guid? facilityId, ReservationStatus? status, DateTime? from, DateTime? to,
        CancellationToken ct = default)
    {
        var provider = await _context.ParkingProviders.FirstOrDefaultAsync(p => p.UserId == providerUserId, ct)
            ?? throw new UnauthorizedAccessException("You can only manage your own parking properties.");

        var query = ReservationsForResponse().Where(r => r.ProviderId == provider.Id);

        if (facilityId is Guid id)
        {
            await EnsureFacilityBelongsToProviderAsync(provider, id, ct);
            query = query.Where(r => r.FacilityId == id);
        }

        var reservations = await ApplyReservationFilters(query, status, from, to)
            .OrderBy(r => r.StartTime)
            .ToListAsync(ct);

        return reservations.Select(MapToReservation).ToList();
    }

    public async Task<ReservationResponse> CancelReservationAsync(
        Guid userId, Guid reservationId, string? reason, CancellationToken ct = default)
    {
        var reservation = await _context.Set<Reservation>()
            .FirstOrDefaultAsync(r => r.Id == reservationId, ct)
            ?? throw new KeyNotFoundException("Reservation not found.");

        await EnsureReservationAccessAsync(userId, reservation, ct);

        var now = DateTime.UtcNow;
        var isDriver = reservation.DriverUserId == userId;

        if (reservation.Status is ReservationStatus.CANCELLED or ReservationStatus.COMPLETED
            or ReservationStatus.NOSHOW)
        {
            throw new InvalidOperationException($"This reservation is already {reservation.Status.ToString().ToLowerInvariant()}.");
        }

        if (isDriver && reservation.StartTime <= now)
        {
            throw new InvalidOperationException("This reservation has already started and can no longer be cancelled.");
        }

        var trimmed = reason.TrimToNull();
        if (trimmed is { Length: > MaxCancelReasonLength })
        {
            throw new InvalidOperationException($"Cancellation reason must be {MaxCancelReasonLength} characters or fewer.");
        }

        var actor = await _context.Users
            .Where(u => u.Id == userId)
            .Select(u => u.FullName)
            .FirstOrDefaultAsync(ct);

        reservation.Status = ReservationStatus.CANCELLED;
        reservation.CancelReason = trimmed;
        reservation.CancelledBy = $"{actor ?? "An account"} ({(isDriver ? "driver" : "property owner")})".ClampedTo(100);
        reservation.CancelledAt = now;
        reservation.UpdatedAt = now;

        await _context.SaveChangesAsync(ct);

        return await LoadReservationAsync(reservation.Id, ct)
            ?? throw new KeyNotFoundException("Reservation not found.");
    }

    public async Task<IReadOnlyList<FacilityQueueRowResponse>> GetFacilitiesForReviewAsync(
        ParkingStatus? status, string? provider, CancellationToken ct = default)
    {
        IQueryable<ParkingFacility> query = FacilitiesForResponse().Include(f => f.Provider!);
        if (status is ParkingStatus wanted) query = query.Where(f => f.Status == wanted);

        var owner = provider.TrimToNull();
        if (owner is not null)
        {
            var pattern = $"%{owner.Replace("%", "\\%").Replace("_", "\\_")}%";

            query = query.Where(f =>
                EF.Functions.ILike(f.ProviderName, pattern) ||
                EF.Functions.ILike(f.ProviderEmail, pattern) ||
                EF.Functions.ILike(f.ProviderBusinessName!, pattern));
        }

        var facilities = await query
            .OrderByDescending(f => f.SubmittedAt ?? f.CreatedAt)
            .ToListAsync(ct);

        return facilities.Select(f => new FacilityQueueRowResponse
        {
            Facility = MapToResponse(f),
            ProviderId = f.ProviderId,
            ProviderName = f.ProviderName,
            ProviderEmail = f.ProviderEmail,
            ProviderBusinessName = f.ProviderBusinessName,
            ProviderVerificationStatus = f.Provider?.VerificationStatus.ToString() ?? string.Empty
        }).ToList();
    }

    public async Task<ProviderIdentitySyncResponse> SyncProviderIdentityAsync(
        Guid providerUserId, CancellationToken ct = default)
    {
        var provider = await _context.ParkingProviders
            .FirstOrDefaultAsync(p => p.UserId == providerUserId, ct)
            ?? throw new KeyNotFoundException("Parking owner account not found.");

        var stamp = await LoadProviderStampAsync(providerUserId, ct);

        var facilityIds = await _context.Set<ParkingFacility>()
            .Where(f => f.ProviderId == provider.Id)
            .Select(f => f.Id)
            .ToListAsync(ct);

        var facilities = await _context.Set<ParkingFacility>()
            .Where(f => f.ProviderId == provider.Id)
            .ExecuteUpdateAsync(s => s
                .SetProperty(f => f.ProviderName, stamp.Name)
                .SetProperty(f => f.ProviderEmail, stamp.Email)
                .SetProperty(f => f.ProviderBusinessName, stamp.BusinessName), ct);

        var slots = await _context.Set<ParkingSlot>()
            .Where(s => facilityIds.Contains(s.FacilityId))
            .ExecuteUpdateAsync(u => u
                .SetProperty(s => s.ProviderName, stamp.Name)
                .SetProperty(s => s.ProviderEmail, stamp.Email)
                .SetProperty(s => s.ProviderBusinessName, stamp.BusinessName), ct);

        var pricingRows = await _context.Set<ParkingFacilityVehicleType>()
            .Where(a => facilityIds.Contains(a.FacilityId))
            .ExecuteUpdateAsync(s => s
                .SetProperty(a => a.ProviderName, stamp.Name)
                .SetProperty(a => a.ProviderEmail, stamp.Email)
                .SetProperty(a => a.ProviderBusinessName, stamp.BusinessName), ct);

        var documents = await _context.Set<ParkingFacilityDocument>()
            .Where(d => facilityIds.Contains(d.FacilityId))
            .ExecuteUpdateAsync(s => s
                .SetProperty(d => d.ProviderName, stamp.Name)
                .SetProperty(d => d.ProviderEmail, stamp.Email)
                .SetProperty(d => d.ProviderBusinessName, stamp.BusinessName), ct);

        var reservations = await _context.Set<Reservation>()
            .Where(r => r.ProviderId == provider.Id)
            .ExecuteUpdateAsync(s => s
                .SetProperty(r => r.ProviderName, stamp.Name)
                .SetProperty(r => r.ProviderEmail, stamp.Email)
                .SetProperty(r => r.ProviderBusinessName, stamp.BusinessName), ct);

        return new ProviderIdentitySyncResponse
        {
            ProviderUserId = providerUserId,
            ProviderName = stamp.Name,
            ProviderEmail = stamp.Email,
            ProviderBusinessName = stamp.BusinessName,
            FacilitiesUpdated = facilities,
            BaysUpdated = slots,
            PricingRowsUpdated = pricingRows,
            DocumentsUpdated = documents,
            ReservationsUpdated = reservations
        };
    }

    public async Task<FacilityReviewResponse?> GetFacilityReviewAsync(Guid facilityId, CancellationToken ct = default)
    {
        var facility = await FacilitiesForResponse()
            .Include(f => f.Provider!).ThenInclude(p => p!.User)
            .FirstOrDefaultAsync(f => f.Id == facilityId, ct);

        if (facility == null) return null;

        return new FacilityReviewResponse
        {
            Facility = MapToResponse(facility),
            ProviderUserId = facility.Provider?.UserId ?? Guid.Empty,
            ProviderName = facility.Provider?.User?.FullName ?? string.Empty,
            ProviderEmail = facility.Provider?.User?.Email ?? string.Empty,
            ProviderPhone = facility.Provider?.User?.Phone ?? string.Empty,
            BusinessName = facility.Provider?.BusinessName,
            ProviderVerificationStatus = facility.Provider?.VerificationStatus.ToString() ?? string.Empty,
            ReviewedBy = facility.ReviewedBy,
            Documents = facility.Documents
                .OrderBy(d => d.Type)
                .ThenByDescending(d => d.UploadedAt)
                .Select(MapToDocumentResponse)
                .ToList()
        };
    }

    public async Task<ParkingResponse> ReviewFacilityAsync(
        Guid adminUserId, Guid facilityId, ParkingStatus decision, string? rejectionReason,
        CancellationToken ct = default)
    {
        if (decision is not (ParkingStatus.APPROVED or ParkingStatus.REJECTED))
        {
            throw new InvalidOperationException("Decision must be either APPROVED or REJECTED.");
        }

        var facility = await FacilitiesForResponse()
            .FirstOrDefaultAsync(f => f.Id == facilityId, ct)
            ?? throw new KeyNotFoundException("Parking property not found.");

        if (facility.Status != ParkingStatus.PENDING_APPROVAL)
        {
            throw new InvalidOperationException(
                "Only properties waiting for review can be decided. This one is " +
                $"{facility.Status.ToString().ToLowerInvariant()}.");
        }

        var now = DateTime.UtcNow;
        string? reason = null;

        if (decision == ParkingStatus.APPROVED)
        {
            var missing = MissingRequirementsFor(facility);
            if (missing.Count > 0)
            {
                throw new InvalidOperationException($"Cannot approve this property yet: {string.Join(", ", missing)}.");
            }

            if (facility.Slots.Count == 0)
            {
                throw new InvalidOperationException(
                    "Cannot approve this property yet: the owner has not generated any parking slots.");
            }

            facility.RejectionReason = null;
        }

        else
        {
            reason = Require(rejectionReason, "A rejection reason is required so the owner knows what to fix.");
            if (reason.Length > MaxRejectionReasonLength)
            {
                throw new InvalidOperationException(
                    $"Rejection reason must be {MaxRejectionReasonLength} characters or fewer.");
            }

            facility.RejectionReason = reason;
        }

        foreach (var row in facility.SectionReviews)
        {
            row.Status = decision == ParkingStatus.APPROVED
                ? SectionReviewStatus.APPROVED
                : SectionReviewStatus.REJECTED;
            row.Remarks = reason;
            row.ReviewedBy = adminUserId;
            row.ReviewedAt = now;
            row.UpdatedAt = now;
        }

        facility.Status = decision;
        facility.ReviewedAt = now;
        facility.ReviewedBy = adminUserId;
        facility.UpdatedAt = now;

        await NotifyOwnerAsync(
            facility,
            $"{facility.Name} was {(decision == ParkingStatus.APPROVED ? "approved" : "sent back")}",
            decision == ParkingStatus.APPROVED
                ? "The platform admin approved every section of your property registration, so it is " +
                  "now live for drivers. You can keep adjusting its rates and layout."
                : $"The platform admin sent your property registration back: {reason}",
            ct);

        await _context.SaveChangesAsync(ct);

        return MapToResponse(facility);
    }

    public async Task<ParkingResponse> ReviewFacilitySectionAsync(
        Guid adminUserId, Guid facilityId, FacilitySection section, ParkingStatus decision,
        string? remarks, CancellationToken ct = default)
    {
        if (decision is not (ParkingStatus.APPROVED or ParkingStatus.REJECTED))
        {
            throw new InvalidOperationException("Decision must be either APPROVED or REJECTED.");
        }

        var facility = await FacilitiesForResponse()
            .FirstOrDefaultAsync(f => f.Id == facilityId, ct)
            ?? throw new KeyNotFoundException("Parking property not found.");

        if (facility.Status == ParkingStatus.SUSPENDED)
        {
            throw new InvalidOperationException("This property is suspended. Restore it before reviewing it.");
        }

        var label = FacilitySectionRules.For(section).Label;
        var row = facility.SectionReviews.FirstOrDefault(r => r.Section == section)
            ?? throw new InvalidOperationException(
                $"{label} cannot be reviewed yet: the owner has not submitted this property.");

        var now = DateTime.UtcNow;
        var approve = decision == ParkingStatus.APPROVED;
        string? note;

        if (approve)
        {
            await EnsureSectionApprovableAsync(facility, section, ct);
            note = string.IsNullOrWhiteSpace(remarks)
                ? null
                : remarks.Trim().ClampedTo(MaxRejectionReasonLength);
        }

        else
        {
            note = Require(remarks, $"Say what the owner must fix in {label.ToLowerInvariant()}.");
            if (note.Length > MaxRejectionReasonLength)
            {
                throw new InvalidOperationException(
                    $"Remarks must be {MaxRejectionReasonLength} characters or fewer.");
            }
        }

        row.Status = approve ? SectionReviewStatus.APPROVED : SectionReviewStatus.REJECTED;
        row.Remarks = note;
        row.ReviewedBy = adminUserId;
        row.ReviewedAt = now;
        row.UpdatedAt = now;

        RefreshStatusFromSections(facility, now);

        var openSections = facility.SectionReviews
            .Where(r => r.Status != SectionReviewStatus.APPROVED)
            .Select(r => FacilitySectionRules.For(r.Section).Label)
            .ToList();

        await NotifyOwnerAsync(
            facility,
            $"{facility.Name}: {label} {(approve ? "approved" : "sent back")}",
            approve
                ? openSections.Count == 0
                    ? $"{label} was approved, so every section of your registration is now accepted and " +
                      "the property is live for drivers."
                    : $"{label} was approved. Still waiting on the admin: {string.Join(", ", openSections)}."
                : $"{label} was sent back: {note} The property goes live once all four sections are approved.",
            ct);

        await _context.SaveChangesAsync(ct);

        return MapToResponse(facility);
    }

    public async Task<IReadOnlyList<VehicleTypeAdminResponse>> GetVehicleTypesAsync(CancellationToken ct = default)
    {
        var vehicleTypes = await _context.Set<VehicleType>()
            .OrderBy(v => v.SortOrder)
            .ThenBy(v => v.Name)
            .ToListAsync(ct);

        return vehicleTypes.Select(v => MapToVehicleTypeResponse(v)).ToList();
    }

    public async Task<VehicleTypeAdminResponse> CreateVehicleTypeAsync(
        SaveVehicleTypeRequest request, CancellationToken ct = default)
    {
        var name = Require(request.Name, "Vehicle type name is required.");
        var code = NormalizeCode(request.SlotCode, "Slot code");
        ValidateSortOrder(request.SortOrder);
        ValidateBayDimensions(request.BayLengthMeters, request.BayWidthMeters);

        await EnsureVehicleTypeIsFree(name, code, null, ct);

        var vehicleType = new VehicleType
        {
            Name = name,
            SlotCode = code,
            SortOrder = request.SortOrder,
            IsActive = request.IsActive,
            BayLengthMeters = request.BayLengthMeters,
            BayWidthMeters = request.BayWidthMeters
        };

        _context.Set<VehicleType>().Add(vehicleType);
        await _context.SaveChangesAsync(ct);

        return MapToVehicleTypeResponse(vehicleType);
    }

    public async Task<VehicleTypeAdminResponse> UpdateVehicleTypeAsync(
        Guid vehicleTypeId, SaveVehicleTypeRequest request, CancellationToken ct = default)
    {
        var vehicleType = await _context.Set<VehicleType>()
            .FirstOrDefaultAsync(v => v.Id == vehicleTypeId, ct)
            ?? throw new KeyNotFoundException("Vehicle type not found.");

        var name = Require(request.Name, "Vehicle type name is required.");
        var code = NormalizeCode(request.SlotCode, "Slot code");
        ValidateSortOrder(request.SortOrder);
        ValidateBayDimensions(request.BayLengthMeters, request.BayWidthMeters);

        await EnsureVehicleTypeIsFree(name, code, vehicleType.Id, ct);

        vehicleType.Name = name;
        vehicleType.SlotCode = code;
        vehicleType.SortOrder = request.SortOrder;
        vehicleType.IsActive = request.IsActive;
        vehicleType.BayLengthMeters = request.BayLengthMeters;
        vehicleType.BayWidthMeters = request.BayWidthMeters;
        vehicleType.UpdatedAt = DateTime.UtcNow;

        var inForcePricing = await _context.Set<VehiclePricingConfiguration>()
            .FirstOrDefaultAsync(p => p.VehicleTypeId == vehicleType.Id && p.IsActive, ct);
        await ReapplyVehicleTypeConfigurationAsync(vehicleType, inForcePricing, ct);

        await _context.SaveChangesAsync(ct);

        return MapToVehicleTypeResponse(vehicleType);
    }

    public async Task<IReadOnlyList<VehiclePricingAdminResponse>> GetVehiclePricingAsync(CancellationToken ct = default)
    {
        var configurations = await _context.Set<VehiclePricingConfiguration>()
            .Include(p => p.VehicleType)
            .OrderBy(p => p.VehicleType.SortOrder)
            .ThenBy(p => p.VehicleType.Name)
            .ToListAsync(ct);

        return configurations
            .Select(p => MapToVehiclePricingResponse(p, p.VehicleType.Name, p.VehicleType.SlotCode))
            .ToList();
    }

    public async Task<VehiclePricingAdminResponse> SaveVehiclePricingAsync(
        Guid vehicleTypeId, SaveVehiclePricingRequest request, CancellationToken ct = default)
    {
        var vehicleType = await GetConfiguredVehicleTypeAsync(vehicleTypeId, ct);

        ValidateBounds(request.MinimumPrice, request.MaximumPrice, MaxPriceAmount, "Hourly rate");

        if (request.CommissionRate < 0m || request.CommissionRate > 100m)
        {
            throw new InvalidOperationException("Commission must be between 0 and 100 percent.");
        }

        var configuration = await _context.Set<VehiclePricingConfiguration>()
            .FirstOrDefaultAsync(p => p.VehicleTypeId == vehicleTypeId, ct);

        if (configuration is null)
        {
            configuration = new VehiclePricingConfiguration { VehicleTypeId = vehicleTypeId };
            _context.Set<VehiclePricingConfiguration>().Add(configuration);
        }

        configuration.MinimumPrice = request.MinimumPrice;
        configuration.MaximumPrice = request.MaximumPrice;
        configuration.CommissionRate = request.CommissionRate;
        configuration.IsActive = request.IsActive;
        configuration.UpdatedAt = DateTime.UtcNow;

        await ReapplyVehicleTypeConfigurationAsync(
            vehicleType, request.IsActive ? configuration : null, ct);

        await _context.SaveChangesAsync(ct);

        return MapToVehiclePricingResponse(configuration, vehicleType.Name, vehicleType.SlotCode);
    }

    public async Task DeleteVehiclePricingAsync(Guid vehicleTypeId, CancellationToken ct = default)
    {
        var configuration = await _context.Set<VehiclePricingConfiguration>()
            .FirstOrDefaultAsync(p => p.VehicleTypeId == vehicleTypeId, ct)
            ?? throw new KeyNotFoundException("This vehicle type has no pricing configured.");

        var vehicleType = await GetConfiguredVehicleTypeAsync(vehicleTypeId, ct);

        _context.Set<VehiclePricingConfiguration>().Remove(configuration);

        await ReapplyVehicleTypeConfigurationAsync(vehicleType, null, ct);

        await _context.SaveChangesAsync(ct);
    }

    private const int MaxRejectionReasonLength = 500;
    private const decimal MaxPriceAmount = 100000m;
}
