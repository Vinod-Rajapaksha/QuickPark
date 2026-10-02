using QuickPark.API.Enums;

namespace QuickPark.API.DTOs.Staff;

public class UpdateStaffRequest
{
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string NIC { get; set; } = string.Empty;
    public string? Password { get; set; }
    public StaffType Type { get; set; }
    public string Position { get; set; } = string.Empty;
}
