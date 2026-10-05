namespace QuickPark.API.DTOs.Parking;

public class VehiclePricingAdminResponse
{
    public Guid Id { get; set; }
    public Guid VehicleTypeId { get; set; }
    public string VehicleTypeName { get; set; } = string.Empty;
    public string VehicleTypeCode { get; set; } = string.Empty;
    public decimal MinimumPrice { get; set; }
    public decimal MaximumPrice { get; set; }
    public decimal CommissionRate { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
