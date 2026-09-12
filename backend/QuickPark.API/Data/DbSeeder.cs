using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using QuickPark.API.Models;
using QuickPark.API.Options;

namespace QuickPark.API.Data;

public class DbSeeder
{
    private readonly AppDbContext _context;
    private readonly AdminSeedOptions _adminSeedOptions;

    public DbSeeder(AppDbContext context, IOptions<AdminSeedOptions> adminSeedOptions)
    {
        _context = context;
        _adminSeedOptions = adminSeedOptions.Value;
    }

    public async Task SeedAsync()
    {
        await _context.Database.MigrateAsync();

        if (!await _context.Users.AnyAsync(u => u.Role == Role.PLATFORM_ADMIN))
        {
            if (!string.IsNullOrEmpty(_adminSeedOptions.Email) && !string.IsNullOrEmpty(_adminSeedOptions.Password))
            {
                var adminUser = new User
                {
                    FullName = "Platform Administrator",
                    Email = _adminSeedOptions.Email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(_adminSeedOptions.Password),
                    Role = Role.PLATFORM_ADMIN,
                    Phone = _adminSeedOptions.Phone,
                    NIC = _adminSeedOptions.NIC
                };

                _context.Users.Add(adminUser);
                await _context.SaveChangesAsync();
            }
        }
    }
}
