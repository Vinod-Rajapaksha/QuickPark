namespace QuickPark.API.Resources;

public static class FacilitySections
{
    public sealed record SectionInfo(Enums.FacilitySection Section, string Label, string Description);

    public static readonly IReadOnlyList<SectionInfo> Ordered = new[]
    {
        new SectionInfo(Enums.FacilitySection.BASIC_INFORMATION,
            "Basic information", "Name, address and land area."),
        new SectionInfo(Enums.FacilitySection.PROPERTY_LOCATION,
            "Property location", "The latitude and longitude the property is pinned at."),
        new SectionInfo(Enums.FacilitySection.DOCUMENTS,
            "Documents and photos", "Proof of the land, the owner's NIC, and the property photos."),
        new SectionInfo(Enums.FacilitySection.PRICING,
            "Vehicle types and pricing", "The vehicle types offered, their bays, slot counts and rates."),
    };

    public static string LabelFor(Enums.FacilitySection section) =>
        Ordered.First(info => info.Section == section).Label;
}
