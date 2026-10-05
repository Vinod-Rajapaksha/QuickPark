namespace QuickPark.API.DTOs.Reservations;

// CONFIRM accepts a booking that is still pending, CHECK_IN opens the stay, CHECK_OUT ends it and
// is the moment the booking is re-priced for the hours the bay was actually used, and NO_SHOW
// records that the driver never arrived. 
public class TransitionBookingRequest
{
    public string? Action { get; set; }
}
