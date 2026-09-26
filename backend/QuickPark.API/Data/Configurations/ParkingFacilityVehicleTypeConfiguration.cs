using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuickPark.API.Models;

namespace QuickPark.API.Data.Configurations;

public class ParkingFacilityVehicleTypeConfiguration : IEntityTypeConfiguration<ParkingFacilityVehicleType>
{
    public void Configure(EntityTypeBuilder<ParkingFacilityVehicleType> builder)
    {
        builder.ToTable("ParkingFacilityVehicleTypes");
        builder.HasKey(a => a.Id);

        builder.Property(a => a.HourlyRate).HasPrecision(10, 2);
        builder.Property(a => a.CommissionRate).HasPrecision(5, 2);

        builder.HasIndex(a => new { a.FacilityId, a.VehicleTypeId }).IsUnique();

        builder.HasOne(a => a.Facility)
            .WithMany(f => f.VehicleAllocations)
            .HasForeignKey(a => a.FacilityId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.VehicleType)
            .WithMany()
            .HasForeignKey(a => a.VehicleTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(a => a.BayLengthMeters).HasPrecision(5, 2);
        builder.Property(a => a.BayWidthMeters).HasPrecision(5, 2);
    }
}
