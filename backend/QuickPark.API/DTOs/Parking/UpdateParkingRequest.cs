namespace QuickPark.API.DTOs.Parking;

// Full replace: omitting the pin clears it, and re-submitting puts it back for review.
public class UpdateParkingRequest
{
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Province { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public decimal LandAreaPerches { get; set; }
    public TimeOnly OpeningTime { get; set; } = new(0, 0);
    public TimeOnly ClosingTime { get; set; } = new(23, 59);
    public bool HasEvCharging { get; set; }
}
