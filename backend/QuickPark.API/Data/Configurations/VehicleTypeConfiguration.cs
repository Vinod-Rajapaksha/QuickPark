using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuickPark.API.Models;

namespace QuickPark.API.Data.Configurations;

public class VehicleTypeConfiguration : IEntityTypeConfiguration<VehicleType>
{
    public void Configure(EntityTypeBuilder<VehicleType> builder)
    {
        builder.ToTable("VehicleTypes");
        builder.HasKey(v => v.Id);

        builder.Property(v => v.Name).IsRequired().HasMaxLength(60);
        builder.Property(v => v.SlotCode).IsRequired().HasMaxLength(10);

        builder.HasIndex(v => v.Name).IsUnique();
        builder.HasIndex(v => v.SlotCode).IsUnique();
        builder.HasIndex(v => v.IsActive);

        builder.Property(v => v.BayLengthMeters).HasPrecision(5, 2);
        builder.Property(v => v.BayWidthMeters).HasPrecision(5, 2);
    }
}
