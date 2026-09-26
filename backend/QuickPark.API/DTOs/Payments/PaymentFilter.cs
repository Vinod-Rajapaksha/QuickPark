namespace QuickPark.API.DTOs.Payments;

public class PaymentFilter
{
    public string? Status { get; set; }
    public string? PaymentMethod { get; set; }
    public Guid? FacilityId { get; set; }
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
}
