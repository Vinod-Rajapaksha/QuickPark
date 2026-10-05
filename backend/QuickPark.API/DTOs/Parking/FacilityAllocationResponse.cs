namespace QuickPark.API.DTOs.Parking;

public class FacilityAllocationResponse
{
    public Guid VehicleTypeId { get; set; }
    public string VehicleTypeName { get; set; } = string.Empty;
    public string VehicleTypeCode { get; set; } = string.Empty;
    public decimal? BayLengthMeters { get; set; }
    public decimal? BayWidthMeters { get; set; }
    public int NumberOfSlots { get; set; }
    public decimal HourlyRate { get; set; }
    public decimal CommissionRate { get; set; }
}
