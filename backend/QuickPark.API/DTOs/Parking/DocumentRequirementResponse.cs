namespace QuickPark.API.DTOs.Parking;

public class DocumentRequirementResponse
{
    public string Type { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public int Count { get; set; }
    public int MinRequired { get; set; }
    public int? MaxAllowed { get; set; }
    public bool ReplacesExisting { get; set; }
    public bool Satisfied { get; set; }
}
