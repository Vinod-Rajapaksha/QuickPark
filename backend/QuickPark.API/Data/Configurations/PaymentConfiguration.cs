using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuickPark.API.Models;

namespace QuickPark.API.Data.Configurations;

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.ToTable("Payments");
        builder.HasKey(p => p.Id);

        builder.Property(p => p.PaymentMethod).HasConversion<string>().IsRequired();
        builder.Property(p => p.Status).HasConversion<string>().IsRequired();

        builder.Property(p => p.Amount).HasPrecision(10, 2);

        builder.Property(p => p.GatewayProvider).IsRequired().HasMaxLength(40);
        builder.Property(p => p.GatewayTransactionId).HasMaxLength(120);
        builder.Property(p => p.GatewayReference).HasMaxLength(400);
        builder.Property(p => p.FailureReason).HasMaxLength(300);
        builder.Property(p => p.CashConfirmedByName).HasMaxLength(150);
        builder.Property(p => p.RefundReason).HasMaxLength(300);

        builder.HasIndex(p => p.ReservationId);
        builder.HasIndex(p => p.Status);
        builder.HasIndex(p => p.PaymentMethod);
        builder.HasIndex(p => new { p.ProviderId, p.Status });
        builder.HasIndex(p => new { p.DriverId, p.CreatedAt });

        builder.HasIndex(p => p.GatewayTransactionId).IsUnique();
        builder.HasIndex(p => new { p.ReservationId, p.AttemptNumber }).IsUnique();

        // Taking a driver's card means finding the payment their checkout reference belongs to.
        builder.HasIndex(p => p.GatewayReference);

        builder.HasOne(p => p.Commission)
            .WithOne(c => c.Payment)
            .HasForeignKey<Commission>(c => c.PaymentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.Reservation)
            .WithMany()
            .HasForeignKey(p => p.ReservationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<ParkingProvider>()
            .WithMany()
            .HasForeignKey(p => p.ProviderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(p => p.DriverId)
            .OnDelete(DeleteBehavior.Restrict);

        // Confirmed by an account
        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(p => p.CashConfirmedBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(p => p.RefundedBy)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
