using QuickPark.API.Enums;

namespace QuickPark.API.Resources;

public sealed record DocumentRule(
    FacilityDocumentType Type,
    string Label,
    int MinRequired,
    int? MaxAllowed,
    bool ReplacesExisting);

// What each document tab needs; single source for the upload guard and the owner checklist.
public static class FacilityDocumentRules
{
    public const int RequiredPropertyPhotos = 4;

    private static readonly DocumentRule[] All =
    {
        new(FacilityDocumentType.VERIFIED_DEED, "Verified deed", 1, 1, true),
        new(FacilityDocumentType.LAND_OWNER_NIC, "Land owner NIC", 1, 1, true),
        new(FacilityDocumentType.PROPERTY_PHOTO, "Property photos", RequiredPropertyPhotos, RequiredPropertyPhotos, false),
        new(FacilityDocumentType.SLOT_SKETCH, "Parking slot sketch", 1, 1, true),
        new(FacilityDocumentType.LAND_DOCUMENT, "Land documents", 0, null, false)
    };

    public static IReadOnlyList<DocumentRule> Ordered => All;

    public static DocumentRule For(FacilityDocumentType type) =>
        All.First(rule => rule.Type == type);
}
