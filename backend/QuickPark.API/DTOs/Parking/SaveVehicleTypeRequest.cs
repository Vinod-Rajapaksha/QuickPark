namespace QuickPark.API.DTOs.Parking;

// Master row; SlotCode prefixes generated slot numbers, so it is upper-case alphanumerics.
public class SaveVehicleTypeRequest
{
    public string? Name { get; set; }
    public string? SlotCode { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;

    // The standard bay for this type; while it is missing the type cannot be allocated.
    public decimal? BayLengthMeters { get; set; }
    public decimal? BayWidthMeters { get; set; }
}
