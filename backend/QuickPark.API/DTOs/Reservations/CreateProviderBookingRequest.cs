namespace QuickPark.API.DTOs.Reservations;

public class CreateProviderBookingRequest
{
    public Guid FacilityId { get; set; }
    public Guid VehicleTypeId { get; set; }
    public Guid? SlotId { get; set; }
    public string? DriverEmail { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
}

public class UpdateProviderBookingRequest
{
    public Guid? SlotId { get; set; }
    public string? DriverEmail { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
}
