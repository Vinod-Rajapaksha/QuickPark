using System.Reflection;
using QuickPark.API.DTOs.Parking;
using QuickPark.API.Enums;
using QuickPark.API.Models;
using QuickPark.API.Resources;
using QuickPark.API.Services.Implementations;

namespace QuickPark.Tests.Unit.Mapping;

// What the owner is told about their own property is decided in this mapping: whether the wizard may
// still be edited, what the property still owes, and whether it may be handed to an admin at all.
// The rules sit in private static methods on ParkingService, so they are driven by reflection over
// in-memory entity graphs. No database and no HTTP are involved.
public class MappingTests
{
    private static readonly Guid Car = Guid.Parse("44444444-4444-4444-4444-444444444444");
    private static readonly Guid Van = Guid.Parse("55555555-5555-5555-5555-555555555555");

    [Theory]
    [InlineData(ParkingStatus.DRAFT, true)]
    [InlineData(ParkingStatus.REJECTED, true)]
    [InlineData(ParkingStatus.APPROVED, true)]
    [InlineData(ParkingStatus.PENDING_APPROVAL, false)]
    [InlineData(ParkingStatus.SUSPENDED, false)]
    public void OnlyAPropertyNoAdminIsReadingCanBeEdited(ParkingStatus status, bool editable)
    {
        Assert.Equal(editable, Editable(status));
    }

    [Fact]
    public void ACompleteDraftIsTheOnlyThingThatCanBeHandedToAnAdmin()
    {
        // Rejected gets a second life: the owner fixes what was named and submits again.
        Assert.True(Ready(ParkingStatus.DRAFT));
        Assert.True(Ready(ParkingStatus.REJECTED));

        // Approved already has a verdict, so there is nothing left to submit.
        Assert.False(Ready(ParkingStatus.APPROVED));

        // Under review it cannot be re-submitted, and suspended is not the owner's to fix.
        Assert.False(Ready(ParkingStatus.PENDING_APPROVAL));
        Assert.False(Ready(ParkingStatus.SUSPENDED));
    }

    [Theory]
    [InlineData(ParkingStatus.DRAFT)]
    [InlineData(ParkingStatus.REJECTED)]
    [InlineData(ParkingStatus.APPROVED)]
    [InlineData(ParkingStatus.PENDING_APPROVAL)]
    [InlineData(ParkingStatus.SUSPENDED)]
    public void NothingCanBeSubmittedWhileThePropertyStillOwesSomething(ParkingStatus status)
    {
        var incomplete = Mapping.ToResponse(Property(status));

        Assert.NotEmpty(incomplete.MissingRequirements);
        Assert.False(incomplete.ReadyForSubmission);
    }

    [Fact]
    public void TheChecklistNamesEveryPieceOfProofTheOwnerHasNotUploadedYet()
    {
        Assert.Equal(
            new[]
            {
                "enter the property latitude and longitude",
                "upload the verified deed",
                "upload the land owner nic",
                "upload 4 property photos (0 uploaded)",
                "upload the parking slot sketch",
                "allocate at least one vehicle type"
            },
            Mapping.Missing(Property(ParkingStatus.DRAFT)));
    }

    [Fact]
    public void AShortPhotoSetIsCountedBackToTheOwnerRatherThanRefused()
    {
        var facility = Complete(ParkingStatus.DRAFT);
        facility.Documents = facility.Documents
            .Where(d => d.Type != FacilityDocumentType.PROPERTY_PHOTO)
            .Append(Document(FacilityDocumentType.PROPERTY_PHOTO))
            .Append(Document(FacilityDocumentType.PROPERTY_PHOTO))
            .ToList();

        Assert.Contains("upload 4 property photos (2 uploaded)", Mapping.Missing(facility));
        Assert.False(Mapping.ToResponse(facility).DocumentsComplete);
    }

    [Fact]
    public void TheFourPhotosAreAnExactCountNotAMinimum()
    {
        // The photo tab carries a ceiling as well as a floor: a fifth shot fails the rule the same way
        // a third does, because the marketplace page shows exactly four.
        var facility = Complete(ParkingStatus.DRAFT);
        facility.Documents.Add(Document(FacilityDocumentType.PROPERTY_PHOTO));

        var actual = Requirement(facility, FacilityDocumentType.PROPERTY_PHOTO);

        Assert.False(actual.Satisfied);
        Assert.Equal(4, actual.MaxAllowed);
        Assert.Equal(5, actual.Count);
    }

    [Theory]
    [InlineData(FacilityDocumentType.VERIFIED_DEED)]
    [InlineData(FacilityDocumentType.LAND_OWNER_NIC)]
    [InlineData(FacilityDocumentType.SLOT_SKETCH)]
    public void ASinglePieceOfProofReplacesTheOneItFollows(FacilityDocumentType type)
    {
        // These three are one-per-property and ReplacesExisting, so a second deed is a mistake rather
        // than a bonus and the checklist says so.
        var facility = Complete(ParkingStatus.DRAFT);
        facility.Documents.Add(Document(type));

        var actual = Requirement(facility, type);

        Assert.True(FacilityDocumentRules.For(type).ReplacesExisting);
        Assert.False(actual.Satisfied);
        Assert.Equal(2, actual.Count);
    }

    [Fact]
    public void ExtraLandDocumentsAreWelcomeBecauseThatTabHasNoQuota()
    {
        var facility = Complete(ParkingStatus.DRAFT);
        facility.Documents.Add(Document(FacilityDocumentType.LAND_DOCUMENT));
        facility.Documents.Add(Document(FacilityDocumentType.LAND_DOCUMENT));

        var rule = FacilityDocumentRules.For(FacilityDocumentType.LAND_DOCUMENT);

        Assert.Equal(0, rule.MinRequired);
        Assert.Null(rule.MaxAllowed);
        Assert.True(Requirement(facility, FacilityDocumentType.LAND_DOCUMENT).Satisfied);
        Assert.True(Mapping.ToResponse(facility).DocumentsComplete);
    }

    [Fact]
    public void TheOwnerIsShownOneRowPerProofTypeAlwaysInTabOrder()
    {
        var requirements = Mapping.ToResponse(Complete(ParkingStatus.DRAFT)).DocumentRequirements;

        Assert.Equal(
            new[] { "VERIFIED_DEED", "LAND_OWNER_NIC", "PROPERTY_PHOTO", "SLOT_SKETCH", "LAND_DOCUMENT" },
            requirements.Select(r => r.Type));

        Assert.Equal(
            FacilityDocumentRules.Ordered.Select(rule => rule.Label),
            requirements.Select(r => r.Label));

        Assert.All(requirements, r => Assert.True(r.Satisfied));
    }

    [Fact]
    public void TheWizardGetsItsFourSectionsInSubmissionOrderWithAVerdictForEach()
    {
        var sections = Mapping.ToResponse(Complete(ParkingStatus.DRAFT)).Sections;

        Assert.Equal(
            new[] { "BASIC_INFORMATION", "PROPERTY_LOCATION", "DOCUMENTS", "PRICING" },
            sections.Select(s => s.Section));

        // Nothing has been submitted yet, so every section reports the absence rather than a blank.
        Assert.All(sections, section => Assert.Equal("NOT_SUBMITTED", section.Status));
    }

    [Fact]
    public void EachSectionCarriesItsOwnAdminVerdictAndRemark()
    {
        var facility = Complete(ParkingStatus.DRAFT);
        facility.SectionReviews = new List<ParkingFacilitySectionReview>
        {
            Review(FacilitySection.BASIC_INFORMATION, SectionReviewStatus.APPROVED, null),
            Review(FacilitySection.PROPERTY_LOCATION, SectionReviewStatus.REJECTED, "The pin is in the sea.")
        };

        var sections = Mapping.ToResponse(facility).Sections;

        Assert.Equal("APPROVED", sections.Single(s => s.Section == "BASIC_INFORMATION").Status);

        var location = sections.Single(s => s.Section == "PROPERTY_LOCATION");
        Assert.Equal("REJECTED", location.Status);
        Assert.Equal("The pin is in the sea.", location.Remarks);

        // Untouched sections keep NOT_SUBMITTED rather than inheriting a neighbour's verdict.
        Assert.Equal("NOT_SUBMITTED", sections.Single(s => s.Section == "DOCUMENTS").Status);
        Assert.Equal("NOT_SUBMITTED", sections.Single(s => s.Section == "PRICING").Status);
    }

    [Fact]
    public void TheBasicInformationSectionOwesNothingBecauseItsFieldsAreCheckedOnSave()
    {
        // Name, address and area are refused by the service before a property is ever written, so a
        // property that exists has already passed them and the section adds no second checklist.
        Assert.Empty(Mapping.Missing(new ParkingFacility(), FacilitySection.BASIC_INFORMATION));
    }

    [Fact]
    public void APinIsOnlyMissingWhenEitherNumberIsAbsent()
    {
        var half = Complete(ParkingStatus.DRAFT);
        half.Longitude = null;

        Assert.Contains("enter the property latitude and longitude",
            Mapping.Missing(half, FacilitySection.PROPERTY_LOCATION));

        Assert.Empty(Mapping.Missing(Complete(ParkingStatus.DRAFT), FacilitySection.PROPERTY_LOCATION));
    }

    [Fact]
    public void APropertyWithNoPricedVehicleTypeStillOwesThePricingSection()
    {
        var facility = Complete(ParkingStatus.APPROVED);
        facility.VehicleAllocations.Clear();

        Assert.Contains("allocate at least one vehicle type", Mapping.Missing(facility, FacilitySection.PRICING));
    }

    [Theory]
    [InlineData(SlotStatus.AVAILABLE)]
    [InlineData(SlotStatus.RESERVED)]
    [InlineData(SlotStatus.OCCUPIED)]
    [InlineData(SlotStatus.MAINTENANCE)]
    public void EveryStateButDisabledCountsAsABayThePropertyHas(SlotStatus status)
    {
        var facility = Complete(ParkingStatus.DRAFT);
        facility.Slots = Bays(status, 4);

        Assert.Equal(4, Mapping.ToResponse(facility).SlotCount);
    }

    [Fact]
    public void ADisabledBayStopsCountingTowardsTheProperty()
    {
        var facility = Complete(ParkingStatus.DRAFT);
        facility.Slots = Bays(SlotStatus.DISABLED, 4);

        Assert.Equal(0, Mapping.ToResponse(facility).SlotCount);
        Assert.Empty(Mapping.ToResponse(facility).SlotGroups);
    }

    [Fact]
    public void TheBayBoardGroupsByVehicleTypeAndCountsOnlyFreeBays()
    {
        var facility = Complete(ParkingStatus.DRAFT);
        facility.VehicleAllocations = new List<ParkingFacilityVehicleType>
        {
            Allocation(Car, "Car", "C", 4, 150m),
            Allocation(Van, "Van", "V", 2, 300m)
        };
        facility.Slots = new List<ParkingSlot>
        {
            Bay(Car, "Car", "C", SlotStatus.AVAILABLE),
            Bay(Car, "Car", "C", SlotStatus.AVAILABLE),
            Bay(Car, "Car", "C", SlotStatus.OCCUPIED),
            Bay(Car, "Car", "C", SlotStatus.DISABLED),
            Bay(Van, "Van", "V", SlotStatus.MAINTENANCE),
            Bay(Van, "Van", "V", SlotStatus.AVAILABLE)
        };

        var groups = Mapping.ToResponse(facility).SlotGroups;

        Assert.Equal(new[] { "Car", "Van" }, groups.Select(g => g.VehicleTypeName));

        var car = groups.Single(g => g.VehicleTypeName == "Car");
        Assert.Equal(3, car.Total);
        Assert.Equal(2, car.Available);
        Assert.Equal(150m, car.HourlyRate);
        Assert.Equal("C", car.VehicleTypeCode);

        var van = groups.Single(g => g.VehicleTypeName == "Van");
        Assert.Equal(2, van.Total);
        Assert.Equal(1, van.Available);
        Assert.Equal(300m, van.HourlyRate);

        // A bay under maintenance is still a bay the owner owns; it is simply not free.
        Assert.Equal(1, van.Total - van.Available);
    }

    [Fact]
    public void AGroupWithoutAnAllocationStillReportsItsBaysButPricesThemAtZero()
    {
        var facility = Complete(ParkingStatus.DRAFT);
        facility.VehicleAllocations = new List<ParkingFacilityVehicleType> { Allocation(Car, "Car", "C", 4, 150m) };
        facility.Slots = new List<ParkingSlot>
        {
            Bay(Car, "Car", "C", SlotStatus.AVAILABLE),
            Bay(Van, "Van", "V", SlotStatus.AVAILABLE)
        };

        var van = Mapping.ToResponse(facility).SlotGroups.Single(g => g.VehicleTypeName == "Van");

        Assert.Equal(1, van.Total);
        Assert.Equal(0m, van.HourlyRate);
    }

    [Fact]
    public void TheOwnerSeesHowManyOfEachProofTheyHaveButNeverWhereItLives()
    {
        var facility = Complete(ParkingStatus.DRAFT);
        facility.Documents.Add(Document(FacilityDocumentType.LAND_DOCUMENT));

        var summary = Mapping.ToResponse(facility).Documents;

        Assert.Equal(5, summary.Count);
        Assert.Equal(4, summary.Single(d => d.Type == "PROPERTY_PHOTO").Count);
        Assert.Equal(1, summary.Single(d => d.Type == "VERIFIED_DEED").Count);

        // The optional tab only ever appears once something has actually been uploaded for it.
        Assert.Equal(1, summary.Single(d => d.Type == "LAND_DOCUMENT").Count);
    }

    [Fact]
    public void TheDriverGetsThePropertyButNotTheOwnersPaperwork()
    {
        // A driver reading the marketplace must not be handed the owner's proof queue, their section
        // verdicts, the admin's rejection note, or a hint that the property is still submittable.
        var facility = Complete(ParkingStatus.REJECTED);
        facility.RejectionReason = "The sketch does not number the bays.";

        var ownerView = Mapping.ToResponse(facility);
        var publicView = Mapping.ToPublic(facility);

        Assert.NotEmpty(ownerView.Sections);
        Assert.NotEmpty(ownerView.Documents);
        Assert.NotNull(ownerView.RejectionReason);
        Assert.True(ownerView.ReadyForSubmission);

        Assert.Empty(publicView.Sections);
        Assert.Empty(publicView.Documents);
        Assert.Empty(publicView.DocumentRequirements);
        Assert.Empty(publicView.MissingRequirements);
        Assert.Null(publicView.RejectionReason);
        Assert.False(publicView.DocumentsComplete);
        Assert.False(publicView.ReadyForSubmission);

        // What the driver does keep: the property itself, its bays and its rates.
        Assert.Equal(ownerView.Name, publicView.Name);
        Assert.Equal(ownerView.SlotCount, publicView.SlotCount);
        Assert.Equal(
            ownerView.Allocations.Select(a => a.HourlyRate),
            publicView.Allocations.Select(a => a.HourlyRate));
    }

    [Fact]
    public void AnEmptyPropertyIsStillADraftTheOwnerCanEdit()
    {
        var fresh = Mapping.ToResponse(new ParkingFacility());

        Assert.Equal(nameof(ParkingStatus.DRAFT), fresh.Status);
        Assert.True(fresh.IsEditable);
        Assert.Equal(0, fresh.SlotCount);
        Assert.False(fresh.DocumentsComplete);
    }

    [Fact]
    public void EveryFieldTheOwnerEditsSurvivesTheRoundTrip()
    {
        var facility = Complete(ParkingStatus.DRAFT);
        facility.OpeningTime = new TimeOnly(6, 30);
        facility.ClosingTime = new TimeOnly(23, 15);
        facility.HasEvCharging = true;
        facility.LandAreaPerches = 42.75m;

        var response = Mapping.ToResponse(facility);

        Assert.Equal("Galle Road Parking", response.Name);
        Assert.Equal("No 123, Galle Road", response.Address);
        Assert.Equal("Western", response.Province);
        Assert.Equal("Colombo", response.District);
        Assert.Equal(new TimeOnly(6, 30), response.OpeningTime);
        Assert.Equal(new TimeOnly(23, 15), response.ClosingTime);
        Assert.True(response.HasEvCharging);
        Assert.Equal(42.75m, response.LandAreaPerches);
        Assert.Equal(6.9271m, response.Latitude);
        Assert.Equal(79.8612m, response.Longitude);
    }

    private static bool Ready(ParkingStatus status) => Mapping.ToResponse(Complete(status)).ReadyForSubmission;

    private static bool Editable(ParkingStatus status) => Mapping.ToResponse(Property(status)).IsEditable;

    private static DocumentRequirementResponse Requirement(ParkingFacility facility, FacilityDocumentType type) =>
        Mapping.ToResponse(facility).DocumentRequirements.Single(r => r.Type == type.ToString());

    /// <summary>A property that satisfies every rule: pinned, fully proved, and priced.</summary>
    private static ParkingFacility Complete(ParkingStatus status)
    {
        var facility = Property(status);

        facility.Latitude = 6.9271m;
        facility.Longitude = 79.8612m;
        facility.Documents = new List<ParkingFacilityDocument>
        {
            Document(FacilityDocumentType.VERIFIED_DEED),
            Document(FacilityDocumentType.LAND_OWNER_NIC),
            Document(FacilityDocumentType.PROPERTY_PHOTO),
            Document(FacilityDocumentType.PROPERTY_PHOTO),
            Document(FacilityDocumentType.PROPERTY_PHOTO),
            Document(FacilityDocumentType.PROPERTY_PHOTO),
            Document(FacilityDocumentType.SLOT_SKETCH)
        };
        facility.VehicleAllocations = new List<ParkingFacilityVehicleType> { Allocation(Car, "Car", "C", 4, 150m) };
        facility.Slots = Bays(SlotStatus.AVAILABLE, 2);

        return facility;
    }

    private static ParkingFacility Property(ParkingStatus status) => new()
    {
        Name = "Galle Road Parking",
        Address = "No 123, Galle Road",
        City = "Colombo",
        Province = "Western",
        District = "Colombo",
        LandAreaPerches = 15.5m,
        OpeningTime = new TimeOnly(8, 0),
        ClosingTime = new TimeOnly(20, 0),
        Status = status
    };

    private static ParkingFacilityDocument Document(FacilityDocumentType type) => new()
    {
        Type = type,
        Url = "https://proof.invalid/" + Guid.NewGuid(),
        UploadedAt = new DateTime(2026, 3, 1, 9, 0, 0, DateTimeKind.Utc)
    };

    private static ParkingFacilityVehicleType Allocation(Guid vehicleTypeId, string name, string code, int slots, decimal rate) => new()
    {
        VehicleTypeId = vehicleTypeId,
        VehicleType = new VehicleType { Name = name, SlotCode = code },
        NumberOfSlots = slots,
        HourlyRate = rate,
        BayLengthMeters = 5m,
        BayWidthMeters = 2.5m
    };

    private static List<ParkingSlot> Bays(SlotStatus status, int count) =>
        Enumerable.Range(1, count).Select(_ => Bay(Car, "Car", "C", status)).ToList();

    private static ParkingSlot Bay(Guid vehicleTypeId, string name, string code, SlotStatus status) => new()
    {
        VehicleTypeId = vehicleTypeId,
        VehicleType = new VehicleType { Name = name, SlotCode = code },
        SlotNumber = code + "-01",
        Status = status
    };

    private static ParkingFacilitySectionReview Review(
        FacilitySection section, SectionReviewStatus status, string? remarks) => new()
    {
        Section = section,
        Status = status,
        Remarks = remarks
    };
}

// The mapping lives in private static methods on the service, so it is reached by reflection and the
// service's own exceptions are surfaced unwrapped.
internal static class Mapping
{
    internal static ParkingResponse ToResponse(ParkingFacility facility) =>
        (ParkingResponse)Call("MapToResponse", facility)!;

    internal static ParkingResponse ToPublic(ParkingFacility facility) =>
        (ParkingResponse)Call("MapToPublicResponse", facility)!;

    internal static IReadOnlyList<string> Missing(ParkingFacility facility) =>
        (List<string>)Call("MissingRequirementsFor", facility)!;

    internal static IReadOnlyList<string> Missing(ParkingFacility facility, FacilitySection section) =>
        (List<string>)Call("MissingRequirementsFor", facility, section)!;

    private static object? Call(string name, params object?[] arguments)
    {
        var method = typeof(ParkingService)
            .GetMethods(BindingFlags.NonPublic | BindingFlags.Static)
            .Single(m => m.Name == name && m.GetParameters().Length == arguments.Length);

        try
        {
            return method.Invoke(null, arguments);
        }
        catch (TargetInvocationException ex) when (ex.InnerException is not null)
        {
            throw ex.InnerException;
        }
    }
}
