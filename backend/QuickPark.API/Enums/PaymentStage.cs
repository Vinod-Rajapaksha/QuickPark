namespace QuickPark.API.Enums;

// Which half of a booking's money a payment row settles. A booking pays the fee that confirms it
// and, later, the charge for the stay, so one booking can legitimately have one settled row of each.
public enum PaymentStage
{
    // Ordinal zero on purpose: the CLR default and the column default must agree, or EF would write
    // the default instead of the value a caller set.
    PARKING_CHARGE = 0,
    BOOKING_FEE = 1
}
