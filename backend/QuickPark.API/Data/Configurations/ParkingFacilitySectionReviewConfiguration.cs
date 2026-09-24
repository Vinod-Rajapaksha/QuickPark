using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuickPark.API.Models;

namespace QuickPark.API.Data.Configurations;

public class ParkingFacilitySectionReviewConfiguration : IEntityTypeConfiguration<ParkingFacilitySectionReview>
{
    public void Configure(EntityTypeBuilder<ParkingFacilitySectionReview> builder)
    {
        builder.ToTable("ParkingFacilitySectionReviews");
        builder.HasKey(r => r.Id);

        builder.Property(r => r.Section).HasConversion<string>().IsRequired();
        builder.Property(r => r.Status).HasConversion<string>().IsRequired();
        builder.Property(r => r.Remarks).HasMaxLength(500);

        // One decision per section per property.
        builder.HasIndex(r => new { r.FacilityId, r.Section }).IsUnique();

        builder.HasOne(r => r.Facility)
            .WithMany(f => f.SectionReviews)
            .HasForeignKey(r => r.FacilityId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
