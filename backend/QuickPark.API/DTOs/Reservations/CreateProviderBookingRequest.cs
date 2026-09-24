namespace QuickPark.API.DTOs.Reservations;

// §13: the owner books a bay themselves — a walk-in at the gate, or a regular who telephones in.
// The driver is named with the email their account was made with, and the bay is optional so the
// system can pick the free one when the owner does not care which. The rate and the commission
// are copied from the property's own pricing, exactly as a driver booking does (§8).
public class CreateProviderBookingRequest
{
    public Guid FacilityId { get; set; }
    public Guid VehicleTypeId { get; set; }
    public Guid? SlotId { get; set; }
    public string? DriverEmail { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
}

// §14: an owner moves a booking to another bay or another window. Every change goes through the
// same ownership and availability checks a new booking has to pass.
public class UpdateProviderBookingRequest
{
    public Guid? SlotId { get; set; }
    public string? DriverEmail { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
}
