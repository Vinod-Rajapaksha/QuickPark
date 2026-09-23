using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuickPark.API.Models;

namespace QuickPark.API.Data.Configurations;

public class FeedbackKeywordConfiguration
    : IEntityTypeConfiguration<FeedbackKeyword>
{
    public void Configure(EntityTypeBuilder<FeedbackKeyword> builder)
    {

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Keyword)
            .HasConversion<string>()
            .IsRequired();

        builder.HasOne(x => x.Feedback)
            .WithMany(x => x.Keywords)
            .HasForeignKey(x => x.FeedbackId)
            .OnDelete(DeleteBehavior.Cascade);

    }

}