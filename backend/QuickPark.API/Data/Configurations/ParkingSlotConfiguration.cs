using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuickPark.API.Models;

namespace QuickPark.API.Data.Configurations;

public class ParkingSlotConfiguration : IEntityTypeConfiguration<ParkingSlot>
{
    public void Configure(EntityTypeBuilder<ParkingSlot> builder)
    {
        builder.HasKey(s => s.Id);

        builder.Property(s => s.SlotNumber).IsRequired().HasMaxLength(20);
        builder.Property(s => s.Status).HasConversion<string>().IsRequired();

        // Copied from the property for owner filtering; no index of its own, bays are read under a facility.
        builder.Property(s => s.ProviderName).IsRequired().HasMaxLength(150);
        builder.Property(s => s.ProviderEmail).IsRequired().HasMaxLength(256);
        builder.Property(s => s.ProviderBusinessName).HasMaxLength(150);

        builder.HasIndex(s => new { s.FacilityId, s.SlotNumber }).IsUnique();
        builder.HasIndex(s => new { s.FacilityId, s.VehicleTypeId, s.Status });

        builder.HasOne(s => s.VehicleType)
            .WithMany()
            .HasForeignKey(s => s.VehicleTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(s => s.BayLengthMeters).HasPrecision(5, 2);
        builder.Property(s => s.BayWidthMeters).HasPrecision(5, 2);
    }
}
