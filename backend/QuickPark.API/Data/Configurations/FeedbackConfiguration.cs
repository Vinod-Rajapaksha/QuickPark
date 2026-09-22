using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuickPark.API.Models;


namespace QuickPark.API.Data.Configurations;


public class FeedbackConfiguration
    : IEntityTypeConfiguration<Feedback>
{

    public void Configure(
        EntityTypeBuilder<Feedback> builder)
    {

        builder.HasKey(x=>x.Id);



        builder.Property(x=>x.Type)
            .HasConversion<string>()
            .IsRequired();



        builder.Property(x=>x.Status)
            .HasConversion<string>()
            .IsRequired();



        builder.Property(x=>x.Rating)
            .IsRequired();



        builder.Property(x=>x.Comment)
            .HasMaxLength(1000);



        builder.HasIndex(x=>x.Type);


        builder.HasIndex(x=>x.Status);


        builder.HasIndex(x=>x.ParkingId);



        builder.HasOne(x=>x.User)
            .WithMany()
            .HasForeignKey(x=>x.UserId)
            .OnDelete(DeleteBehavior.Restrict);



        builder.HasMany(x=>x.Keywords)
            .WithOne(x=>x.Feedback)
            .HasForeignKey(x=>x.FeedbackId)
            .OnDelete(DeleteBehavior.Cascade);



        builder.HasMany(x=>x.Replies)
            .WithOne(x=>x.Feedback)
            .HasForeignKey(x=>x.FeedbackId)
            .OnDelete(DeleteBehavior.Cascade);



        builder.HasMany(x=>x.Reports)
            .WithOne(x=>x.Feedback)
            .HasForeignKey(x=>x.FeedbackId)
            .OnDelete(DeleteBehavior.Cascade);

    }

}