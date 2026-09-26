using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuickPark.API.Models;

namespace QuickPark.API.Data.Configurations;

public class ParkingFacilityDocumentConfiguration : IEntityTypeConfiguration<ParkingFacilityDocument>
{
    public void Configure(EntityTypeBuilder<ParkingFacilityDocument> builder)
    {
        builder.ToTable("ParkingFacilityDocuments");
        builder.HasKey(d => d.Id);

        builder.Property(d => d.Type).HasConversion<string>().IsRequired();
        builder.Property(d => d.Url).IsRequired().HasMaxLength(500);
        builder.Property(d => d.PublicId).HasMaxLength(200);
        builder.Property(d => d.FileName).HasMaxLength(200);
        builder.Property(d => d.ContentType).HasMaxLength(60);

        builder.HasIndex(d => new { d.FacilityId, d.Type });

        builder.HasOne(d => d.Facility)
            .WithMany(f => f.Documents)
            .HasForeignKey(d => d.FacilityId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
