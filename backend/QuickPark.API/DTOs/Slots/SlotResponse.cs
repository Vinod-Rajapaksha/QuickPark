namespace QuickPark.API.DTOs.Slots;

public class SlotResponse
{
    public Guid SlotId { get; set; }
    public Guid FacilityId { get; set; }
    public string SlotNumber { get; set; } = string.Empty;

    public Guid VehicleTypeId { get; set; }
    public string VehicleTypeName { get; set; } = string.Empty;
    public string BayLabel { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;
    public decimal HourlyRate { get; set; }
    public bool AvailableForPeriod { get; set; }
    public DateTime? BusyFrom { get; set; }
    public DateTime? BusyUntil { get; set; }
}
