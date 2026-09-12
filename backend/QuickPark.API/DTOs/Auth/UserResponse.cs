using System;
using QuickPark.API.Models;

namespace QuickPark.API.DTOs.Auth;

public class UserResponse
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string NIC { get; set; } = string.Empty;
    public Role Role { get; set; }
}
