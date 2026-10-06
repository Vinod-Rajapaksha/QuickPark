using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using QuickPark.API.Data;
using QuickPark.API.Models;
using QuickPark.Tests.Integration.Infrastructure;

namespace QuickPark.Tests.Integration.Database;

[Collection("Database Collection")]
public class DatabaseIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public DatabaseIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task A_Migrations_CanBeAppliedSuccessfully_AndDatabaseIsReady()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // Act & Assert
        context.Should().NotBeNull();
        
        bool canConnect = await context.Database.CanConnectAsync();
        canConnect.Should().BeTrue();
    }

    [Fact]
    public async Task B_UniqueConstraint_ThrowsException_OnDuplicateEmail()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var email = $"test_{Guid.NewGuid()}@example.com";
        var user1 = new User { Email = email, PasswordHash = "hash1", FullName = "User1", Role = UserRole.DRIVER };
        var user2 = new User { Email = email, PasswordHash = "hash2", FullName = "User2", Role = UserRole.DRIVER };

        // Act
        context.Users.Add(user1);
        await context.SaveChangesAsync();

        context.Users.Add(user2);
        
        // Assert
        var exception = await Assert.ThrowsAsync<DbUpdateException>(() => context.SaveChangesAsync());
        exception.InnerException!.Message.Should().Contain("duplicate key value violates unique constraint");
    }

    [Fact]
    public async Task C_Transactions_CanBeRolledBack()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        
        var email = $"tx_{Guid.NewGuid()}@example.com";
        var user = new User { Email = email, PasswordHash = "hash", FullName = "TxUser", Role = UserRole.DRIVER };

        // Act
        using (var transaction = await context.Database.BeginTransactionAsync())
        {
            context.Users.Add(user);
            await context.SaveChangesAsync();
            await transaction.RollbackAsync();
        }

        // Assert
        var savedUser = await context.Users.FirstOrDefaultAsync(u => u.Email == email);
        savedUser.Should().BeNull("User should not have been saved due to transaction rollback");
    }
}
