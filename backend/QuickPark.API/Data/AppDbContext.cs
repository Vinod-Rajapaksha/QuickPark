using Microsoft.EntityFrameworkCore;
using QuickPark.API.Models;
using QuickPark.API.Data.Configurations; 

namespace QuickPark.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<ParkingProvider> ParkingProviders { get; set; }

    public DbSet<Feedback> Feedbacks { get; set; }
    public DbSet<FeedbackKeyword> FeedbackKeywords { get; set; }
    public DbSet<FeedbackReport> FeedbackReports {get;set;} = null!;
    public DbSet<FeedbackReply> FeedbackReplies {get;set;} = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Role).HasConversion<string>();
        });

        // Feedback Module configurations
        modelBuilder.ApplyConfiguration(
            new FeedbackConfiguration()
        );

        modelBuilder.ApplyConfiguration(
            new FeedbackKeywordConfiguration()
        );

        modelBuilder.ApplyConfiguration(
           new FeedbackReportConfiguration()
        );
        
        modelBuilder.ApplyConfiguration(
            new FeedbackReplyConfiguration()
        );

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
