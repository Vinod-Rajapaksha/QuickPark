namespace QuickPark.API.DTOs.Reservations;

// Driver booking request (§13): a vehicle type at an approved property for one period. The
// service copies the concrete bay's number and hourly rate onto the booking. SlotId is optional
// (§8): name a bay and that exact bay is held for you, or leave it out and the lowest-numbered
// free one is assigned.
public class CreateReservationRequest
{
    public Guid FacilityId { get; set; }
    public Guid VehicleTypeId { get; set; }
    public Guid? SlotId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
}
