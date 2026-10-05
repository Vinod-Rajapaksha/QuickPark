namespace QuickPark.API.DTOs.Slots;

// Status is what the owner set; EffectiveStatus folds in the live bookings.
public class ProviderSlotRowResponse
{
    public Guid SlotId { get; set; }
    public Guid FacilityId { get; set; }
    public string SlotNumber { get; set; } = string.Empty;

    public Guid VehicleTypeId { get; set; }
    public string VehicleTypeName { get; set; } = string.Empty;
    public string BayLabel { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;
    public string EffectiveStatus { get; set; } = string.Empty;
    public bool Bookable { get; set; }

    public decimal HourlyRate { get; set; }
    public DateTime? BusyFrom { get; set; }
    public DateTime? BusyUntil { get; set; }

    // Current reservation shown on the provider board row.
    public QuickPark.API.DTOs.Reservations.ReservationResponse? Current { get; set; }
}
