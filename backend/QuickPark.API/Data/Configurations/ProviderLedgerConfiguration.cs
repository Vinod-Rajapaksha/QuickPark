using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuickPark.API.Models;

namespace QuickPark.API.Data.Configurations;

public class ProviderLedgerConfiguration : IEntityTypeConfiguration<ProviderLedger>
{
    public void Configure(EntityTypeBuilder<ProviderLedger> builder)
    {
        builder.ToTable("ProviderLedger");
        builder.HasKey(l => l.Id);

        builder.Property(l => l.TransactionType).HasConversion<string>().IsRequired();
        builder.Property(l => l.Amount).HasPrecision(10, 2);
        builder.Property(l => l.Reference).IsRequired().HasMaxLength(300);

        builder.HasIndex(l => new { l.ProviderId, l.CreatedAt });
        builder.HasIndex(l => new { l.ProviderId, l.TransactionType });
        builder.HasIndex(l => l.ReservationId);
        builder.HasIndex(l => l.PaymentId);

        builder.HasOne<ParkingProvider>()
            .WithMany()
            .HasForeignKey(l => l.ProviderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Reservation>()
            .WithMany()
            .HasForeignKey(l => l.ReservationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(l => l.Payment)
            .WithMany()
            .HasForeignKey(l => l.PaymentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Commission>()
            .WithMany()
            .HasForeignKey(l => l.CommissionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(l => l.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
