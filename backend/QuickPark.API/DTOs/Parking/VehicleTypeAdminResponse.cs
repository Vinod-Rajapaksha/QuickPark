namespace QuickPark.API.DTOs.Parking;

// Includes deactivated types so the admin can switch them back on.
public class VehicleTypeAdminResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string SlotCode { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
    public decimal? BayLengthMeters { get; set; }
    public decimal? BayWidthMeters { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
