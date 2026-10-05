using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuickPark.API.Models;

namespace QuickPark.API.Data.Configurations;

public class CommissionConfiguration : IEntityTypeConfiguration<Commission>
{
    public void Configure(EntityTypeBuilder<Commission> builder)
    {
        builder.ToTable("Commissions");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Status).HasConversion<string>().IsRequired();

        builder.Property(c => c.GrossAmount).HasPrecision(10, 2);
        builder.Property(c => c.CommissionRate).HasPrecision(5, 2);
        builder.Property(c => c.CommissionAmount).HasPrecision(10, 2);
        builder.Property(c => c.ProviderAmount).HasPrecision(10, 2);
        builder.Property(c => c.Note).HasMaxLength(300);

        builder.HasIndex(c => c.PaymentId).IsUnique();
        builder.HasIndex(c => c.ProviderId);
        builder.HasIndex(c => c.ReservationId);
        builder.HasIndex(c => new { c.ProviderId, c.Status });

        builder.HasOne<ParkingProvider>()
            .WithMany()
            .HasForeignKey(c => c.ProviderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(c => c.SettledBy)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
