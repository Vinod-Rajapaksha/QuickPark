namespace QuickPark.API.DTOs.Parking;

// Result of re-stamping identity copies; admin-only, so it may echo the account email.
public class ProviderIdentitySyncResponse
{
    public Guid ProviderUserId { get; set; }
    public string ProviderName { get; set; } = string.Empty;
    public string ProviderEmail { get; set; } = string.Empty;
    public string? ProviderBusinessName { get; set; }
    public int FacilitiesUpdated { get; set; }
    public int BaysUpdated { get; set; }
    public int PricingRowsUpdated { get; set; }
    public int DocumentsUpdated { get; set; }
    public int ReservationsUpdated { get; set; }
}
