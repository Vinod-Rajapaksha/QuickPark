namespace QuickPark.API.Models;

// A bookable vehicle category the admin defines; its SlotCode prefixes every bay number.
public class VehicleType
{
    public Guid Id { get; set; } = Guid.NewGuid(); // PK

    public string Name { get; set; } = string.Empty;

    // The bay-number prefix: "C" for Car, "B" for Bike, "V" for Van. ParkingSlot.SlotNumber is
    // built from it and stores the result, so the two are linked logically, not by a foreign key.
    public string SlotCode { get; set; } = string.Empty;

    // UI display order only: Car=1, Bike=2, Van=3.
    public int SortOrder { get; set; }

    public bool IsActive { get; set; } = true;

    public decimal? BayLengthMeters { get; set; }
    public decimal? BayWidthMeters { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
