namespace QuickPark.API.DTOs.Payments;

// the booking and the method.
public class CreatePaymentRequest
{
    public Guid ReservationId { get; set; }


    public string? PaymentMethod { get; set; }
}
