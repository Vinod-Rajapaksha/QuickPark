namespace QuickPark.API.DTOs.Parking;

// The decision about one section; the other three keep their answer.
public class ReviewFacilitySectionRequest
{
    // Expected values: "APPROVED" or "REJECTED".
    public string Decision { get; set; } = string.Empty;

    // Required on a rejection so the owner knows what to fix; an optional note on an approval.
    public string? Remarks { get; set; }
}
