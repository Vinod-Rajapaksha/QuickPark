namespace QuickPark.API.Enums;

// PENDING and CONFIRMED both hold the slot for their time window: a reservation is created
// as PENDING, and the payment module moves it to CONFIRMED. CANCELLED / COMPLETED / NOSHOW
// release it. A no-show is the owner recording that the driver never arrived — the row stays
// so the history and the earnings report keep counting it.
public enum ReservationStatus
{
    PENDING,
    CONFIRMED,
    CANCELLED,
    COMPLETED,
    NOSHOW
}
