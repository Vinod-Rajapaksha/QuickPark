using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuickPark.API.Models;

namespace QuickPark.API.Data.Configurations;

public class ParkingProviderConfiguration : IEntityTypeConfiguration<ParkingProvider>
{
    public void Configure(EntityTypeBuilder<ParkingProvider> builder)
    {
        builder.ToTable("ParkingProviders");

        builder.HasKey(p => p.Id);

        builder.HasIndex(p => p.UserId).IsUnique();

        builder.Property(p => p.BusinessName).HasMaxLength(150);
        builder.Property(p => p.Address).HasMaxLength(300);

        builder.Property(p => p.NicDocumentUrl).HasMaxLength(1000);
        builder.Property(p => p.NicDocumentPublicId).HasMaxLength(300);
        builder.Property(p => p.NicDocumentContentType).HasMaxLength(100);
        builder.Property(p => p.VerificationRemarks).HasMaxLength(500);

        builder.Property(p => p.VerificationStatus)
               .HasConversion<string>()
               .HasMaxLength(20);

        builder.HasOne(p => p.User)
               .WithOne()
               .HasForeignKey<ParkingProvider>(p => p.UserId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}
