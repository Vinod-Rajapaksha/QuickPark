namespace QuickPark.API.DTOs.Reservations;

public class CreateReservationRequest
{
    public Guid FacilityId { get; set; }
    public Guid VehicleTypeId { get; set; }

    // Optional: pick a specific bay, otherwise the service assigns the first free one.
    public Guid? SlotId { get; set; }

    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
}
