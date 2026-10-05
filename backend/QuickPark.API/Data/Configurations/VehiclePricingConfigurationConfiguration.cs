using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuickPark.API.Models;

namespace QuickPark.API.Data.Configurations;

public class VehiclePricingConfigurationConfiguration : IEntityTypeConfiguration<VehiclePricingConfiguration>
{
    public void Configure(EntityTypeBuilder<VehiclePricingConfiguration> builder)
    {
        builder.ToTable("VehiclePricingConfigurations");
        builder.HasKey(p => p.Id);

        builder.Property(p => p.MinimumPrice).HasPrecision(10, 2);
        builder.Property(p => p.MaximumPrice).HasPrecision(10, 2);
        builder.Property(p => p.CommissionRate).HasPrecision(5, 2);

        // One pricing row per vehicle type, so exactly one configuration is in force.
        builder.HasIndex(p => p.VehicleTypeId).IsUnique();
        builder.HasIndex(p => p.IsActive);

        builder.HasOne(p => p.VehicleType)
            .WithMany()
            .HasForeignKey(p => p.VehicleTypeId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
