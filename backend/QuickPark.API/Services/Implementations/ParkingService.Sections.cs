using Microsoft.EntityFrameworkCore;
using QuickPark.API.Data;
using QuickPark.API.Enums;
using QuickPark.API.Helpers;
using QuickPark.API.Models;
using QuickPark.API.Resources;

namespace QuickPark.API.Services.Implementations;

// The four-section review state machine: opening, reopening and rolling sections up into the facility status.
public partial class ParkingService
{
    private async Task EnsureSectionApprovableAsync(
        ParkingFacility facility, FacilitySection section, CancellationToken ct)
    {
        var label = FacilitySectionRules.For(section).Label;

        var missing = MissingRequirementsFor(facility, section);
        if (missing.Count > 0)
        {
            throw new InvalidOperationException($"Cannot approve {label} yet: {string.Join(", ", missing)}.");
        }

        if (section != FacilitySection.PRICING) return;

        if (facility.Slots.Count == 0)
        {
            throw new InvalidOperationException(
                $"Cannot approve {label} yet: the owner has not generated any parking slots.");
        }

        await EnsureStoredConfigurationCurrentAsync(facility, ct);
    }

    private void OpenSectionsForSubmission(ParkingFacility facility, DateTime now)
    {
        foreach (var rule in FacilitySectionRules.Ordered)
        {
            if (facility.SectionReviews.Any(r => r.Section == rule.Section)) continue;

            var row = new ParkingFacilitySectionReview
            {
                FacilityId = facility.Id,
                Section = rule.Section,
                Status = SectionReviewStatus.PENDING,
                CreatedAt = now,
                UpdatedAt = now
            };

            _context.Set<ParkingFacilitySectionReview>().Add(row);
            facility.SectionReviews.Add(row);
        }

        // A verdict taken before the current configuration was submitted approved a layout that no longer exists.
        var submittedAt = facility.SubmittedAt;

        foreach (var row in facility.SectionReviews
                     .Where(r => r.Status == SectionReviewStatus.REJECTED ||
                                 (r.Status == SectionReviewStatus.APPROVED && r.ReviewedAt < submittedAt)))
        {
            row.Status = SectionReviewStatus.PENDING;
            row.Remarks = null;
            row.ReviewedBy = null;
            row.ReviewedAt = null;
            row.UpdatedAt = now;
        }

        RefreshStatusFromSections(facility, now);
    }

    private static void ReopenSection(ParkingFacility facility, FacilitySection section, DateTime now)
    {
        var row = facility.SectionReviews.FirstOrDefault(r => r.Section == section);
        if (row == null || row.Status != SectionReviewStatus.APPROVED)
        {
            return;
        }

        row.Status = SectionReviewStatus.PENDING;
        row.Remarks = null;
        row.ReviewedBy = null;
        row.ReviewedAt = null;
        row.UpdatedAt = now;
        facility.SubmittedAt = now;

        RefreshStatusFromSections(facility, now);
    }

    private static void RefreshStatusFromSections(ParkingFacility facility, DateTime now)
    {
        if (facility.Status == ParkingStatus.SUSPENDED || facility.SectionReviews.Count == 0) return;

        var decided = facility.SectionReviews.Where(r => r.ReviewedAt != null).ToList();
        var newest = decided.OrderByDescending(r => r.ReviewedAt).FirstOrDefault();

        facility.RejectionReason = null;
        if (facility.SectionReviews.Any(r => r.Status == SectionReviewStatus.REJECTED))
        {
            facility.Status = ParkingStatus.REJECTED;
            var rejected = facility.SectionReviews
                .Where(r => r.Status == SectionReviewStatus.REJECTED)
                .Select(r => $"{FacilitySectionRules.For(r.Section).Label}: {r.Remarks ?? "needs corrections"}");

            facility.RejectionReason = string.Join("; ", rejected).ClampedTo(MaxRejectionReasonLength);
        }

        else if (facility.SectionReviews.All(r => r.Status == SectionReviewStatus.APPROVED))
        {
            facility.Status = ParkingStatus.APPROVED;
        }

        else
        {
            facility.Status = ParkingStatus.PENDING_APPROVAL;
        }

        facility.ReviewedAt = newest?.ReviewedAt;
        facility.ReviewedBy = newest?.ReviewedBy;
        facility.UpdatedAt = now;
    }

    private async Task NotifyOwnerAsync(
        ParkingFacility facility, string title, string body, CancellationToken ct)
    {
        var ownerId = await _context.ParkingProviders
            .Where(p => p.Id == facility.ProviderId)
            .Select(p => p.UserId)
            .FirstOrDefaultAsync(ct);

        if (ownerId == Guid.Empty) return;

        _context.Set<Notification>().Add(new Notification
        {
            UserId = ownerId,
            FacilityId = facility.Id,
            Title = title.ClampedTo(120),
            Body = body.ClampedTo(1000),
        });
    }
}
