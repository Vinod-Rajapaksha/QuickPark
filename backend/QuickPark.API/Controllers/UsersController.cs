using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuickPark.API.Data;
using QuickPark.API.DTOs.Users;
using QuickPark.API.Models;
using QuickPark.API.Integrations.Storage;

namespace QuickPark.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly CloudinaryStorageClient _storage;

        public UsersController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;

            var cloudName = Resolve(configuration["Cloudinary:CloudName"], "CLOUDINARY_CLOUD_NAME");
            var apiKey = Resolve(configuration["Cloudinary:ApiKey"], "CLOUDINARY_API_KEY");
            var apiSecret = Resolve(configuration["Cloudinary:ApiSecret"], "CLOUDINARY_API_SECRET");
            var folder = Resolve(configuration["Cloudinary:AvatarFolder"], "CLOUDINARY_AVATAR_FOLDER", "quickpark/avatars");

            _storage = new CloudinaryStorageClient(cloudName, apiKey, apiSecret, folder);
        }

        private static string Resolve(string? configValue, string envName, string fallback = "") =>
            !string.IsNullOrWhiteSpace(configValue)
                ? configValue!
                : Environment.GetEnvironmentVariable(envName) ?? fallback;

        [HttpGet]
        [Authorize(Roles = "PLATFORM_ADMIN")]
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
                    ProfilePictureUrl = u.ProfilePictureUrl,
                    Role = u.Role.ToString(),
                    IsActive = u.IsActive,
                    CreatedAt = u.CreatedAt
                })
                .ToListAsync();

            return Ok(new { data = users, total, page, limit });
        }

        [HttpPost]
        [Authorize(Roles = "PLATFORM_ADMIN")]
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
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isPlatformAdmin = User.IsInRole("PLATFORM_ADMIN");

            if (currentUserId != id.ToString() && !isPlatformAdmin)
            {
                return Forbid();
            }

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
            if (!string.IsNullOrEmpty(request.ProfilePictureUrl))
            {
                user.ProfilePictureUrl = request.ProfilePictureUrl;
            }
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "User updated successfully" });
        }

        [HttpPatch("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            var currentUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(currentUserIdStr) || !Guid.TryParse(currentUserIdStr, out Guid currentUserId))
            {
                return Unauthorized();
            }

            var user = await _context.Users.FindAsync(currentUserId);
            if (user == null)
            {
                return NotFound();
            }

            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            {
                return BadRequest(new { message = "Incorrect current password." });
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Password updated successfully" });
        }

        [HttpPost("profile-picture")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadProfilePicture([FromForm] IFormFile file, CancellationToken ct)
        {
            var currentUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(currentUserIdStr) || !Guid.TryParse(currentUserIdStr, out Guid currentUserId))
            {
                return Unauthorized();
            }

            var user = await _context.Users.FindAsync(new object[] { currentUserId }, ct);
            if (user == null)
            {
                return NotFound();
            }

            try
            {
                var validated = await DocumentFileValidator.ValidateAndReadAsync(file, "Profile picture", ct);
                var extension = DocumentFileValidator.ExtensionFor(validated.ContentType);
                var fileName = $"avatar_{currentUserId:N}_{DateTime.UtcNow:yyyyMMddHHmmss}.{extension}";

                var upload = await _storage.UploadImageAsync(validated.Bytes, fileName, validated.ContentType, ct);

                user.ProfilePictureUrl = upload.SecureUrl;
                user.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync(ct);

                return Ok(new
                {
                    message = "Profile picture uploaded successfully",
                    profilePictureUrl = upload.SecureUrl
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Failed to upload profile picture: {ex.Message}" });
            }
        }

        [HttpPatch("{id}/status")]
        [Authorize(Roles = "PLATFORM_ADMIN")]
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
        [Authorize(Roles = "PLATFORM_ADMIN")]
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
