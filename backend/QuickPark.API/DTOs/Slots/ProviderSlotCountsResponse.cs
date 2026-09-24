namespace QuickPark.API.DTOs.Slots;

// Counts over today's layout; a retired bay appears only under Disabled.
public class ProviderSlotCountsResponse
{
    public int Total { get; set; }
    public int Available { get; set; }
    public int Reserved { get; set; }
    public int Occupied { get; set; }
    public int Maintenance { get; set; }
    public int Disabled { get; set; }
    public IReadOnlyList<ProviderSlotTypeCount> ByVehicleType { get; set; } =
        Array.Empty<ProviderSlotTypeCount>();
}

public class ProviderSlotTypeCount
{
    public Guid VehicleTypeId { get; set; }
    public string VehicleTypeName { get; set; } = string.Empty;
    public int Total { get; set; }
    public int Available { get; set; }
}
