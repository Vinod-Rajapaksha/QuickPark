namespace QuickPark.API.DTOs.Parking;

// The rate window a provider must price inside, plus the commission on top.
public class SaveVehiclePricingRequest
{
    public decimal MinimumPrice { get; set; }
    public decimal MaximumPrice { get; set; }
    public decimal CommissionRate { get; set; }
    public bool IsActive { get; set; } = true;
}
