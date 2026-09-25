using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuickPark.API.Data;
using QuickPark.API.DTOs.Users;
using QuickPark.API.Models;

namespace QuickPark.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "PLATFORM_ADMIN")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetUsers([FromQuery] string? search, [FromQuery] string? role, [FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int limit = 10)
        {
            var query = _context.Users.AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                var s = search.ToLower();
                query = query.Where(u => u.FullName.ToLower().Contains(s) || u.Email.ToLower().Contains(s));
            }

            if (!string.IsNullOrEmpty(role) && Enum.TryParse<UserRole>(role, out var parsedRole))
            {
                query = query.Where(u => u.Role == parsedRole);
            }

            if (!string.IsNullOrEmpty(status))
            {
                bool isActive = status == "ACTIVE";
                query = query.Where(u => u.IsActive == isActive);
            }

            var total = await query.CountAsync();
            var users = await query
                .OrderByDescending(u => u.Role == UserRole.PLATFORM_ADMIN)
                .ThenByDescending(u => u.Role == UserRole.PARKING_OWNER)
                .ThenByDescending(u => u.Role == UserRole.PARKING_STAFF)
                .ThenByDescending(u => u.CreatedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    Email = u.Email,
                    Phone = u.Phone,
                    NIC = u.NIC,
                    Role = u.Role.ToString(),
                    IsActive = u.IsActive,
                    CreatedAt = u.CreatedAt
                })
                .ToListAsync();

            return Ok(new { data = users, total, page, limit });
        }

        [HttpPost]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
        {
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return BadRequest("Email already exists.");
            }

            if (!Enum.TryParse<UserRole>(request.Role, out var role))
            {
                return BadRequest("Invalid role.");
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                FullName = request.FullName,
                Email = request.Email,
                Phone = request.Phone,
                NIC = request.NIC,
                Role = role,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User created successfully" });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserRequest request)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            if (user.Email != request.Email && await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return BadRequest("Email already exists.");
            }

            user.FullName = request.FullName;
            user.Email = request.Email;
            user.Phone = request.Phone;
            user.NIC = request.NIC;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "User updated successfully" });
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateUserStatus(Guid id, [FromBody] UpdateUserStatusRequest request)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (currentUserId == id.ToString())
            {
                return BadRequest(new { message = "You cannot change your own status." });
            }

            user.IsActive = request.IsActive;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "User status updated successfully" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (currentUserId == id.ToString())
            {
                return BadRequest(new { message = "You cannot delete your own profile." });
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return Ok(new { message = "User deleted successfully" });
        }
    }
}
