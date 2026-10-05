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

    // AVAILABLE / PENDING / RESERVED / OCCUPIED / MAINTENANCE / DISABLED: the owner's state folded with
    // whoever is holding the bay, so a driver never has to work out occupancy from a time window.
    // PENDING means an unpaid booking holds the bay for its window; only a settled fee reads RESERVED.
    public string EffectiveStatus { get; set; } = string.Empty;

    public decimal HourlyRate { get; set; }
    public bool AvailableForPeriod { get; set; }
    public DateTime? BusyFrom { get; set; }
    public DateTime? BusyUntil { get; set; }
}
