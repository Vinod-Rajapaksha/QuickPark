using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuickPark.API.Models;


namespace QuickPark.API.Data.Configurations;


public class ParkingStaffConfiguration
    : IEntityTypeConfiguration<ParkingStaff>
{

    public void Configure(EntityTypeBuilder<ParkingStaff> builder)
    {

        builder.ToTable("ParkingStaff");


        builder.HasKey(x => x.Id);



        builder.Property(x => x.Type)
            .HasConversion<string>()
            .IsRequired();



        builder.Property(x => x.Position)
            .HasMaxLength(100)
            .IsRequired();



        builder.HasIndex(x => x.UserId)
            .IsUnique();



        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);



        builder.HasOne(x => x.Provider)
            .WithMany()
            .HasForeignKey(x => x.ProviderId)
            .OnDelete(DeleteBehavior.Restrict);



        builder.HasOne(x => x.Facility)
            .WithMany()
            .HasForeignKey(x => x.FacilityId)
            .OnDelete(DeleteBehavior.Restrict);

    }
}