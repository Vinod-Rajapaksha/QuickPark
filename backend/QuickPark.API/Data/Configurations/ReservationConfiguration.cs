using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuickPark.API.Enums;
using QuickPark.API.Models;

namespace QuickPark.API.Data.Configurations;

public class ReservationConfiguration : IEntityTypeConfiguration<Reservation>
{
    public void Configure(EntityTypeBuilder<Reservation> builder)
    {
        builder.ToTable("Reservations");
        builder.HasKey(r => r.Id);

        builder.Property(r => r.Status).HasConversion<string>().IsRequired();

        builder.Property(r => r.SlotNumber).IsRequired().HasMaxLength(20);
        builder.Property(r => r.CancelReason).HasMaxLength(300);
        builder.Property(r => r.CancelledBy).HasMaxLength(100);

        builder.Property(r => r.HourlyRate).HasPrecision(10, 2);
        builder.Property(r => r.TotalAmount).HasPrecision(10, 2);
        builder.Property(r => r.CommissionRate).HasPrecision(5, 2);
        builder.Property(r => r.CommissionAmount).HasPrecision(10, 2);
        builder.Property(r => r.ProviderAmount).HasPrecision(10, 2);

        builder.HasIndex(r => r.DriverId);
        builder.HasIndex(r => r.FacilityId);
        builder.HasIndex(r => r.ProviderId);
        builder.HasIndex(r => r.SlotId);
        builder.HasIndex(r => r.StartTime);
        builder.HasIndex(r => new { r.Status, r.StartTime });

        builder.HasOne(r => r.Driver)
            .WithMany()
            .HasForeignKey(r => r.DriverId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.Facility)
            .WithMany()
            .HasForeignKey(r => r.FacilityId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.VehicleType)
            .WithMany()
            .HasForeignKey(r => r.VehicleTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<ParkingSlot>()
            .WithMany()
            .HasForeignKey(r => r.SlotId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<ParkingProvider>()
            .WithMany()
            .HasForeignKey(r => r.ProviderId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
