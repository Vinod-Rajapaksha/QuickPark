namespace QuickPark.API.DTOs.Parking;

// Location filters; the lat/long pair adds a distance and nearest-first order, RadiusKm then cuts the list.
public class ParkingSearchRequest
{
    public string? Province { get; set; }
    public string? District { get; set; }
    public string? City { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public int? RadiusKm { get; set; }
}
