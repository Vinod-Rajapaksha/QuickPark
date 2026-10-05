namespace QuickPark.API.DTOs.Parking;

// Master data behind the allocation form; no bay-size list, the admin fixes it per type.
public class RegistrationOptionsResponse
{
    public IReadOnlyList<VehicleTypeOptionResponse> VehicleTypes { get; set; } =
        Array.Empty<VehicleTypeOptionResponse>();
}

public class VehicleTypeOptionResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public int SortOrder { get; set; }

    // The admin's standard bay for this type; display-only and stamped server-side.
    public decimal? BayLengthMeters { get; set; }
    public decimal? BayWidthMeters { get; set; }

    // Admin pricing; all null until configured, which keeps the type out of the form.
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }

    // Read-only for the provider: the platform stamps it onto the allocation.
    public decimal? CommissionRate { get; set; }
}
