using System;

namespace QuickPark.API.DTOs.Parking;

// One registration section and its decision
public class FacilitySectionResponse
{
    public string Section { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = "NOT_SUBMITTED";
    public string? Remarks { get; set; }
    public Guid? ReviewedBy { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public IReadOnlyList<string> MissingRequirements { get; set; } = Array.Empty<string>();
}
