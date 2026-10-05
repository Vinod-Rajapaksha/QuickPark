namespace QuickPark.API.Models;

// The admin's pricing rules for one vehicle type.
public class VehiclePricingConfiguration
{
    public Guid Id { get; set; } = Guid.NewGuid(); 

    public Guid VehicleTypeId { get; set; } 
    public VehicleType VehicleType { get; set; } = null!;

    public decimal MinimumPrice { get; set; }
    public decimal MaximumPrice { get; set; }
    public decimal CommissionRate { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
