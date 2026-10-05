using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using QuickPark.API.Data;
using QuickPark.API.Enums;
using QuickPark.API.Models;
using QuickPark.API.Resources;
using QuickPark.API.Services.Implementations;

namespace QuickPark.Tests.Unit.Mapping;

// MappingTests covers what the owner is told. This covers the machine behind it: how the four section
// verdicts roll up into the facility status, and what a submission does to verdicts already taken.
// RefreshStatusFromSections and ReopenSection are private static and need no session; OpenSectionsFor-
// Submission is an instance method, so it runs against a service whose context is given an unreachable
// connection string and only ever used as a change tracker. No database is opened and no row is read.
public class FacilityApprovalStateMachineTests : IDisposable
{
    private static readonly Guid Car = Guid.Parse("66666666-6666-6666-6666-666666666666");
    private static readonly DateTime First = new(2026, 3, 1, 9, 0, 0, DateTimeKind.Utc);

    private readonly AppDbContext _context = new(new DbContextOptionsBuilder<AppDbContext>()
        .UseNpgsql("Host=127.0.0.1;Port=1;Database=quickpark_never_connected;Username=none;Password=none")
        .Options);

    public void Dispose() => _context.Dispose();

    // ---- roll-up: four sections decide one property ----

    [Fact]
    public void ThePropertyIsApprovedOnlyWhenAllFourSectionsAreApproved()
    {
        var facility = Submitted(ParkingStatus.PENDING_APPROVAL);
        Rows(facility, SectionReviewStatus.APPROVED, First, Admin);

        Assert.Equal(4, facility.SectionReviews.Count);

        Refresh(facility, First);

        Assert.Equal(ParkingStatus.APPROVED, facility.Status);
        Assert.Null(facility.RejectionReason);
    }

    [Theory]
    [InlineData(FacilitySection.BASIC_INFORMATION)]
    [InlineData(FacilitySection.PROPERTY_LOCATION)]
    [InlineData(FacilitySection.DOCUMENTS)]
    [InlineData(FacilitySection.PRICING)]
    public void AnyOneSectionStillPendingKeepsThePropertyInTheAdminQueue(FacilitySection open)
    {
        var facility = Submitted(ParkingStatus.PENDING_APPROVAL);
        Rows(facility, SectionReviewStatus.APPROVED, First, Admin);
        Row(facility, open).Status = SectionReviewStatus.PENDING;

        Refresh(facility, First);

        Assert.Equal(ParkingStatus.PENDING_APPROVAL, facility.Status);
    }

    [Theory]
    [InlineData(FacilitySection.BASIC_INFORMATION)]
    [InlineData(FacilitySection.PROPERTY_LOCATION)]
    [InlineData(FacilitySection.DOCUMENTS)]
    [InlineData(FacilitySection.PRICING)]
    public void AnyOneSectionSentBackPutsTheWholePropertyBackWithTheOwner(FacilitySection rejected)
    {
        var facility = Submitted(ParkingStatus.PENDING_APPROVAL);
        Rows(facility, SectionReviewStatus.APPROVED, First, Admin);

        var row = Row(facility, rejected);
        row.Status = SectionReviewStatus.REJECTED;
        row.Remarks = "The numbers do not match the sketch.";

        Refresh(facility, First);

        Assert.Equal(ParkingStatus.REJECTED, facility.Status);

        // The owner is told which tab failed and what to do about it, in one line.
        Assert.Contains(FacilitySectionRules.For(rejected).Label, facility.RejectionReason);
        Assert.Contains("The numbers do not match the sketch.", facility.RejectionReason);
    }

    [Fact]
    public void ARejectionWithoutARemarkStillNamesTheTabItNeedsCorrecting()
    {
        var facility = Submitted(ParkingStatus.PENDING_APPROVAL);
        Rows(facility, SectionReviewStatus.APPROVED, First, Admin);

        var row = Row(facility, FacilitySection.DOCUMENTS);
        row.Status = SectionReviewStatus.REJECTED;
        row.Remarks = null;

        Refresh(facility, First);

        Assert.Equal(ParkingStatus.REJECTED, facility.Status);
        Assert.Contains("needs corrections", facility.RejectionReason);
    }

    [Fact]
    public void EveryFailingTabIsListedAtOnceRatherThanOnePerRound()
    {
        var facility = Submitted(ParkingStatus.PENDING_APPROVAL);
        Rows(facility, SectionReviewStatus.APPROVED, First, Admin);

        foreach (var section in new[] { FacilitySection.DOCUMENTS, FacilitySection.PRICING })
        {
            var row = Row(facility, section);
            row.Status = SectionReviewStatus.REJECTED;
            row.Remarks = $"{section} is wrong.";
        }

        Refresh(facility, First);

        Assert.Contains("Documents and photos", facility.RejectionReason);
        Assert.Contains("Vehicle types and pricing", facility.RejectionReason);
        Assert.Contains(";", facility.RejectionReason);
    }

    [Fact]
    public void TheClearReasonFromTheLastRoundIsDroppedAsSoonAsTheOwnerAnswers()
    {
        var facility = Submitted(ParkingStatus.REJECTED);
        facility.RejectionReason = "The sketch does not number the bays.";
        Rows(facility, SectionReviewStatus.APPROVED, First, Admin);

        Refresh(facility, First);

        Assert.Equal(ParkingStatus.APPROVED, facility.Status);
        Assert.Null(facility.RejectionReason);
    }

    [Fact]
    public void ASuspendedPropertyIsNotLiftedBackByItsOwnSectionVerdicts()
    {
        // Suspension is the admin's to undo; approving the tabs cannot quietly re-open a pulled property.
        var facility = Submitted(ParkingStatus.SUSPENDED);
        Rows(facility, SectionReviewStatus.APPROVED, First, Admin);

        Refresh(facility, First);

        Assert.Equal(ParkingStatus.SUSPENDED, facility.Status);
    }

    [Fact]
    public void APropertyWithNoSectionsYetKeepsWhateverStatusItWasGiven()
    {
        var facility = Property(ParkingStatus.DRAFT);

        Refresh(facility, First);

        Assert.Equal(ParkingStatus.DRAFT, facility.Status);
        Assert.Null(facility.ReviewedAt);
    }

    [Fact]
    public void ThePropertyCarriesTheNewestRulingRatherThanTheFirstOne()
    {
        var facility = Submitted(ParkingStatus.PENDING_APPROVAL);
        Rows(facility, SectionReviewStatus.APPROVED, First, Admin);

        var secondAdmin = Guid.NewGuid();
        var later = First.AddDays(2);

        var pricing = Row(facility, FacilitySection.PRICING);
        pricing.ReviewedAt = later;
        pricing.ReviewedBy = secondAdmin;

        Refresh(facility, First);

        Assert.Equal(later, facility.ReviewedAt);
        Assert.Equal(secondAdmin, facility.ReviewedBy);
    }

    // ---- the owner cannot touch a property the admin is holding ----

    [Theory]
    [InlineData(ParkingStatus.PENDING_APPROVAL, "waiting for admin review")]
    [InlineData(ParkingStatus.SUSPENDED, "suspended")]
    public void AnUnderReviewOrPulledPropertyRefusesEveryOwnerEdit(ParkingStatus status, string reason)
    {
        var ex = Assert.Throws<InvalidOperationException>(() => EnsureOwnerMayEdit(Property(status)));

        Assert.Contains(reason, ex.Message);
    }

    [Theory]
    [InlineData(ParkingStatus.DRAFT)]
    [InlineData(ParkingStatus.REJECTED)]
    [InlineData(ParkingStatus.APPROVED)]
    public void TheOwnerKeepsTheirOwnPropertyEditable(ParkingStatus status)
    {
        EnsureOwnerMayEdit(Property(status));
    }

    // ---- a change withdraws the verdict taken on what no longer exists ----

    [Fact]
    public void ReopeningAnApprovedSectionWipesTheVerdictAndItsReviewerAndItsDate()
    {
        var facility = Submitted(ParkingStatus.APPROVED);
        Rows(facility, SectionReviewStatus.APPROVED, First, Admin);

        var reopened = First.AddDays(1);
        ReopenSection(facility, FacilitySection.DOCUMENTS, reopened);

        var row = Row(facility, FacilitySection.DOCUMENTS);

        Assert.Equal(SectionReviewStatus.PENDING, row.Status);
        Assert.Null(row.Remarks);
        Assert.Null(row.ReviewedBy);
        Assert.Null(row.ReviewedAt);

        // The property goes back to the queue on the strength of that one tab, and the submission
        // stamp moves to the moment of the change so the other verdicts age against it too.
        Assert.Equal(ParkingStatus.PENDING_APPROVAL, facility.Status);
        Assert.Equal(reopened, facility.SubmittedAt);
    }

    [Fact]
    public void ReopeningASectionThatWasNeverApprovedChangesNothing()
    {
        var facility = Property(ParkingStatus.DRAFT);
        Rows(facility, SectionReviewStatus.PENDING, reviewedAt: null);

        ReopenSection(facility, FacilitySection.DOCUMENTS, First);

        Assert.Null(facility.SubmittedAt);
        Assert.Equal(ParkingStatus.DRAFT, facility.Status);
        Assert.All(facility.SectionReviews, row => Assert.Equal(SectionReviewStatus.PENDING, row.Status));
    }

    [Fact]
    public void ReopeningOneSectionOfAnApprovedPropertyIsWhatMakesItUnbookableAgain()
    {
        // APPROVED is the only state the booking reads use, so a single reopened tab takes the property
        // out of the marketplace without the admin doing anything at all.
        var facility = Submitted(ParkingStatus.APPROVED);
        Rows(facility, SectionReviewStatus.APPROVED, First, Admin);

        Assert.True(FacilityMapping.ToResponse(facility).IsEditable);

        ReopenSection(facility, FacilitySection.PRICING, First.AddDays(1));

        Assert.Equal(ParkingStatus.PENDING_APPROVAL, facility.Status);
        Assert.False(FacilityMapping.ToResponse(facility).IsEditable);
    }

    // ---- submitting opens, and re-opens, the four tabs ----

    [Fact]
    public void SubmittingOpensOnePendingRowPerSection()
    {
        var facility = Complete(ParkingStatus.DRAFT);

        OpenSectionsForSubmission(facility, First);

        Assert.Equal(4, facility.SectionReviews.Count);
        Assert.Equal(Enum.GetValues<FacilitySection>(),
            facility.SectionReviews.Select(r => r.Section).ToArray());
        Assert.All(facility.SectionReviews, row =>
        {
            Assert.Equal(SectionReviewStatus.PENDING, row.Status);
            Assert.Equal(First, row.CreatedAt);
            Assert.Null(row.ReviewedBy);
            Assert.Null(row.ReviewedAt);
        });

        Assert.Equal(ParkingStatus.PENDING_APPROVAL, facility.Status);
    }

    [Fact]
    public void SubmittingDoesNotStackASecondRowOnASectionThatAlreadyHasOne()
    {
        var facility = Complete(ParkingStatus.DRAFT);
        Rows(facility, SectionReviewStatus.PENDING, reviewedAt: null);

        OpenSectionsForSubmission(facility, First);

        Assert.Equal(4, facility.SectionReviews.Count);
    }

    [Fact]
    public void SubmittingClearsTheRejectionsTheOwnerHasJustAnswered()
    {
        var facility = Complete(ParkingStatus.REJECTED);
        Rows(facility, SectionReviewStatus.REJECTED, First, remarks: "Fix the sketch.");

        OpenSectionsForSubmission(facility, First.AddHours(1));

        Assert.All(facility.SectionReviews, row =>
        {
            Assert.Equal(SectionReviewStatus.PENDING, row.Status);
            Assert.Null(row.Remarks);
            Assert.Null(row.ReviewedBy);
            Assert.Null(row.ReviewedAt);
        });
    }

    [Fact]
    public void SubmittingWithdrawsAnApprovalTakenBeforeTheCurrentSubmission()
    {
        // The layout the admin passed no longer exists, so their verdict cannot carry over onto the
        // one being handed to them now.
        var facility = Complete(ParkingStatus.DRAFT);
        facility.SubmittedAt = First;
        Rows(facility, SectionReviewStatus.APPROVED, First.AddMinutes(-30), Admin);

        OpenSectionsForSubmission(facility, First.AddHours(1));

        Assert.All(facility.SectionReviews, row => Assert.Equal(SectionReviewStatus.PENDING, row.Status));
        Assert.Equal(ParkingStatus.PENDING_APPROVAL, facility.Status);
    }

    [Fact]
    public void SubmittingKeepsAnApprovalTakenOnTheLayoutBeingSubmitted()
    {
        var facility = Complete(ParkingStatus.DRAFT);
        facility.SubmittedAt = First;
        Rows(facility, SectionReviewStatus.APPROVED, First.AddMinutes(30), Admin);

        OpenSectionsForSubmission(facility, First.AddHours(1));

        Assert.All(facility.SectionReviews, row => Assert.Equal(SectionReviewStatus.APPROVED, row.Status));
    }

    [Fact]
    public void SubmittingWithAnythingStillMissingIsRefusedBeforeAnySectionOpens()
    {
        // This is SubmitForReviewAsync's first gate: a property that still owes proof or a pin or a
        // vehicle type never reaches OpenSectionsForSubmission, so it can never be queued half-built.
        var facility = Property(ParkingStatus.DRAFT);

        var gaps = FacilityMapping.Missing(facility);

        Assert.NotEmpty(gaps);
        Assert.False(FacilityMapping.ToResponse(facility).ReadyForSubmission);
        Assert.Empty(facility.SectionReviews);
    }

    // ---- builders ----

    private static readonly Guid Admin = Guid.Parse("77777777-7777-7777-7777-777777777777");

    private static ParkingFacility Property(ParkingStatus status) => new()
    {
        ProviderId = Guid.NewGuid(),
        Name = "Grand Target Tower",
        Address = "56 Galle Road",
        City = "Colombo",
        Province = "Western",
        District = "Colombo",
        LandAreaPerches = 25m,
        Status = status
    };

    private static ParkingFacility Submitted(ParkingStatus status)
    {
        var facility = Complete(status);
        facility.SubmittedAt = First;
        return facility;
    }

    // A property whose every requirement is satisfied, which is the only thing that may be submitted.
    private static ParkingFacility Complete(ParkingStatus status)
    {
        var facility = Property(status);

        facility.Latitude = 6.9271m;
        facility.Longitude = 79.8612m;

        foreach (var rule in FacilityDocumentRules.Ordered.Where(rule => rule.MinRequired > 0))
        {
            for (var i = 0; i < rule.MinRequired; i++)
            {
                facility.Documents.Add(new ParkingFacilityDocument
                {
                    Type = rule.Type,
                    Url = "https://example.invalid/proof",
                    UploadedAt = First
                });
            }
        }

        facility.VehicleAllocations.Add(new ParkingFacilityVehicleType
        {
            VehicleTypeId = Car,
            VehicleType = new VehicleType { Id = Car, Name = "Car", SlotCode = "C" },
            NumberOfSlots = 2,
            HourlyRate = 450m,
            CommissionRate = 10m,
            BayLengthMeters = 4.5m,
            BayWidthMeters = 2m
        });

        facility.Slots.Add(new ParkingSlot { VehicleTypeId = Car, SlotNumber = "C-001" });
        facility.Slots.Add(new ParkingSlot { VehicleTypeId = Car, SlotNumber = "C-002" });

        return facility;
    }

    private static void Rows(
        ParkingFacility facility, SectionReviewStatus status, DateTime? reviewedAt,
        Guid? reviewedBy = null, string? remarks = null)
    {
        foreach (var section in Enum.GetValues<FacilitySection>())
        {
            facility.SectionReviews.Add(new ParkingFacilitySectionReview
            {
                FacilityId = facility.Id,
                Section = section,
                Status = status,
                ReviewedAt = reviewedAt,
                ReviewedBy = reviewedBy,
                Remarks = remarks
            });
        }
    }

    private static ParkingFacilitySectionReview Row(ParkingFacility facility, FacilitySection section) =>
        facility.SectionReviews.Single(row => row.Section == section);

    private static void Refresh(ParkingFacility facility, DateTime now) =>
        Call(Overload("RefreshStatusFromSections", 2), null, facility, now);

    private static void ReopenSection(ParkingFacility facility, FacilitySection section, DateTime now) =>
        Call(Overload("ReopenSection", 3), null, facility, section, now);

    private static void EnsureOwnerMayEdit(ParkingFacility facility) =>
        Call(Overload("EnsureOwnerMayEdit", 1), null, facility);

    private void OpenSectionsForSubmission(ParkingFacility facility, DateTime now)
    {
        var service = (ParkingService)Activator.CreateInstance(
            typeof(ParkingService), _context, new ConfigurationBuilder().Build())!;

        var method = typeof(ParkingService)
            .GetMethods(BindingFlags.NonPublic | BindingFlags.Instance)
            .Single(m => m.Name == "OpenSectionsForSubmission" && m.GetParameters().Length == 2);

        Call(method, service, facility, now);
    }

    private static MethodInfo Overload(string name, int parameterCount) =>
        typeof(ParkingService)
            .GetMethods(BindingFlags.NonPublic | BindingFlags.Static)
            .Single(m => m.Name == name && m.GetParameters().Length == parameterCount);

    private static object? Call(MethodInfo method, object? target, params object?[] arguments)
    {
        try
        {
            return method.Invoke(target, arguments);
        }
        catch (TargetInvocationException ex) when (ex.InnerException is not null)
        {
            throw ex.InnerException;
        }
    }
}
