namespace QuickPark.API.Enums;
// Represents the status of a reservation.
public enum ReservationStatus
{
    PENDING,
    CONFIRMED,
    CHECKED_IN,
    CHECKED_OUT,
    COMPLETED,
    CANCELLED,
    NOSHOW
}