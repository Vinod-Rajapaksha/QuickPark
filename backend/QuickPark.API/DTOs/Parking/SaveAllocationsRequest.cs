namespace QuickPark.API.DTOs.Parking;

// Types, bay counts and hourly price; saving regenerates the slots. Bay size and commission are stamped server-side, never accepted here.
public class SaveAllocationsRequest
{
    public List<VehicleAllocationInput> Allocations { get; set; } = new();
}

public class VehicleAllocationInput
{
    public Guid VehicleTypeId { get; set; }
    public int NumberOfSlots { get; set; }
    public decimal HourlyRate { get; set; }
}
