using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuickPark.API.Models;

namespace QuickPark.API.Data.Configurations;

public class ParkingFacilityConfiguration : IEntityTypeConfiguration<ParkingFacility>
{
    public void Configure(EntityTypeBuilder<ParkingFacility> builder)
    {
        builder.ToTable("ParkingFacilities");
        builder.HasKey(f => f.Id);

        builder.Property(f => f.Name).IsRequired().HasMaxLength(150);
        builder.Property(f => f.Address).IsRequired().HasMaxLength(300);
        builder.Property(f => f.City).IsRequired().HasMaxLength(100);
        builder.Property(f => f.Province).IsRequired().HasMaxLength(40);
        builder.Property(f => f.District).IsRequired().HasMaxLength(40);
        builder.Property(f => f.LandAreaPerches).HasPrecision(10, 2);
        // (9,6) is about 11 cm at the equator — enough for a bay entrance.
        builder.Property(f => f.Latitude).HasPrecision(9, 6);
        builder.Property(f => f.Longitude).HasPrecision(9, 6);
        builder.Property(f => f.Status).HasConversion<string>().IsRequired();
        builder.Property(f => f.RejectionReason).HasMaxLength(500);

        // Filter copies of the owner's account details; the sync sweep keeps them current.
        builder.Property(f => f.ProviderName).IsRequired().HasMaxLength(150);
        builder.Property(f => f.ProviderEmail).IsRequired().HasMaxLength(256);
        builder.Property(f => f.ProviderBusinessName).HasMaxLength(150);

        builder.HasIndex(f => f.City);
        builder.HasIndex(f => f.Status);
        builder.HasIndex(f => f.Province);
        builder.HasIndex(f => f.District);
        builder.HasIndex(f => new { f.Province, f.District });
        builder.HasIndex(f => f.ProviderEmail);
        builder.HasIndex(f => f.ProviderName);

        builder.HasOne(f => f.Provider)
            .WithMany()
            .HasForeignKey(f => f.ProviderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(f => f.Slots)
            .WithOne(s => s.Facility)
            .HasForeignKey(s => s.FacilityId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(f => f.Documents)
            .WithOne(d => d.Facility)
            .HasForeignKey(d => d.FacilityId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
