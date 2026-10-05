namespace QuickPark.API.DTOs.Parking;

public class FacilitySlotGroup
{
    public Guid VehicleTypeId { get; set; }
    public string VehicleTypeName { get; set; } = string.Empty;
    public string VehicleTypeCode { get; set; } = string.Empty;
    public string BayLabel { get; set; } = string.Empty;
    public decimal HourlyRate { get; set; }
    public int Total { get; set; }
    public int Available { get; set; }
}
