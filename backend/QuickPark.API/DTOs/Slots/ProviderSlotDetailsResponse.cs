namespace QuickPark.API.DTOs.Slots;

public class ProviderSlotDetailsResponse
{
    public ProviderSlotRowResponse Slot { get; set; } = new();
    public IReadOnlyList<QuickPark.API.DTOs.Reservations.ReservationResponse> Upcoming { get; set; } = Array.Empty<QuickPark.API.DTOs.Reservations.ReservationResponse>();
    public IReadOnlyList<QuickPark.API.DTOs.Reservations.ReservationResponse> History { get; set; } = Array.Empty<QuickPark.API.DTOs.Reservations.ReservationResponse>();
}
