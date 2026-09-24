using QuickPark.API.DTOs.Reservations;

namespace QuickPark.API.DTOs.Slots;

public class ProviderSlotDetailsResponse
{
    public ProviderSlotRowResponse Slot { get; set; } = new();
    public IReadOnlyList<ReservationResponse> Upcoming { get; set; } = Array.Empty<ReservationResponse>();
    public IReadOnlyList<ReservationResponse> History { get; set; } = Array.Empty<ReservationResponse>();
}
