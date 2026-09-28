namespace QuickPark.API.DTOs.Parking;

// Location filters; the lat/long pair adds a distance and nearest-first order, RadiusKm then cuts the list.
// Name matches partially; HasEvCharging and the hourly-rate window filter on the facility's vehicle allocations.
public class ParkingSearchRequest
{
    public string? Name { get; set; }
    public string? Province { get; set; }
    public string? District { get; set; }
    public string? City { get; set; }
    public bool HasEvCharging { get; set; }
    public decimal? MinHourlyRate { get; set; }
    public decimal? MaxHourlyRate { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public int? RadiusKm { get; set; }
}
