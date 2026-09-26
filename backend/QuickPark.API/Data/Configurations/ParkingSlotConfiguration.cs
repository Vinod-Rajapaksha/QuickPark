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
