namespace QuickPark.API.DTOs.Reservations;

public class CreateReservationRequest
{
    public Guid FacilityId { get; set; }
    public Guid VehicleTypeId { get; set; }
    public Guid? SlotId { get; set; }

    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public bool IsAgentBooking { get; set; } = false;
}
