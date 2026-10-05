namespace QuickPark.API.DTOs.Slots;

// Only the three owner-settable states; a bay is never marked reserved by hand.
public class UpdateSlotRequest
{
    public string? Status { get; set; }
    public string? Reason { get; set; }
}
