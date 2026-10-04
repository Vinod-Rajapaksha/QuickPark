using QuickPark.API.DTOs.Auth;
using QuickPark.API.Models;

namespace QuickPark.Tests.Helpers;

public static class TestDataBuilder
{
    public static User CreateUser(string email = "test@example.com", UserRole role = UserRole.DRIVER)
    {
        return new User
        {
            Id = Guid.NewGuid(),
            FullName = "Test User",
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123"),
            Role = role,
            Phone = "0712345678",
            NIC = "123456789V",
            IsActive = true
        };
    }

    public static RegisterRequest CreateRegisterRequest(string email = "test@example.com")
    {
        return new RegisterRequest
        {
            FullName = "Test User",
            Email = email,
            Password = "Password123",
            Phone = "0712345678",
            NIC = "123456789V",
            Role = UserRole.DRIVER
        };
    }
    
    public static LoginRequest CreateLoginRequest(string email = "test@example.com")
    {
        return new LoginRequest
        {
            Email = email,
            Password = "Password123"
        };
    }
}
