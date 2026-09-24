using QuickPark.API.DTOs.Parking;

namespace QuickPark.API.DTOs.Slots;

public class ProviderSlotBoardResponse
{
    public ParkingResponse Facility { get; set; } = new();
    public ProviderSlotCountsResponse Counts { get; set; } = new();
    public IReadOnlyList<ProviderSlotRowResponse> Slots { get; set; } = Array.Empty<ProviderSlotRowResponse>();
}
