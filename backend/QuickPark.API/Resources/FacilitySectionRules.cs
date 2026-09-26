using QuickPark.API.Enums;

namespace QuickPark.API.Resources;

public sealed record SectionRule(
    FacilitySection Section,
    string Label,
    string Description);

public static class FacilitySectionRules
{
    private static readonly SectionRule[] All =
    {
        new(FacilitySection.BASIC_INFORMATION, "Basic information",
            "Property name, address and land area."),
        new(FacilitySection.PROPERTY_LOCATION, "Property location",
            "The latitude and longitude the property is pinned at."),
        new(FacilitySection.DOCUMENTS, "Documents and photos",
            "Proof of the land, the land owner's NIC, property photos and the slot sketch."),
        new(FacilitySection.PRICING, "Vehicle types and pricing",
            "The vehicle types offered, their standard bays, slot counts and hourly rates."),
    };

    public static IReadOnlyList<SectionRule> Ordered => All;

    public static SectionRule For(FacilitySection section) =>
        All.First(rule => rule.Section == section);
}
