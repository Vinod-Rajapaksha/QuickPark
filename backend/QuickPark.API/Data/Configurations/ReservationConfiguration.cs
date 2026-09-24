using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
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
        builder.Property(r => r.HourlyRate).HasPrecision(10, 2);
        builder.Property(r => r.TotalAmount).HasPrecision(10, 2);
        builder.Property(r => r.CancelReason).HasMaxLength(300);
        builder.Property(r => r.CancelledBy).HasMaxLength(100);

        // Copied from the property so a booking can be filtered by whoever runs it,
        // without joining back through the facility.
        builder.Property(r => r.ProviderName).IsRequired().HasMaxLength(150);
        builder.Property(r => r.ProviderEmail).IsRequired().HasMaxLength(256);
        builder.Property(r => r.ProviderBusinessName).HasMaxLength(150);

        // The admin booking screen filters by owner, same as the facility list.
        builder.HasIndex(r => r.ProviderEmail);
        builder.HasIndex(r => r.ProviderName);

        // The availability query asks "does this slot overlap that window" for every slot
        // of a vehicle type, so the slot + time pair is the index it needs.
        builder.HasIndex(r => new { r.SlotId, r.StartTime, r.EndTime });
        builder.HasIndex(r => new { r.DriverUserId, r.StartTime });
        builder.HasIndex(r => new { r.FacilityId, r.Status, r.StartTime });

        builder.HasOne(r => r.Driver)
            .WithMany()
            .HasForeignKey(r => r.DriverUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.Facility)
            .WithMany()
            .HasForeignKey(r => r.FacilityId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.Provider)
            .WithMany()
            .HasForeignKey(r => r.ProviderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.Slot)
            .WithMany()
            .HasForeignKey(r => r.SlotId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.VehicleType)
            .WithMany()
            .HasForeignKey(r => r.VehicleTypeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
