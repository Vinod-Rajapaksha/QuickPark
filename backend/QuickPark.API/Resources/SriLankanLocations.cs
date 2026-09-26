namespace QuickPark.API.Resources;

public static class SriLankanLocations
{
    private static readonly (string Province, string[] Districts)[] ProvinceDistricts =
    {
        ("Western", new[] { "Colombo", "Gampaha", "Kalutara" }),
        ("Central", new[] { "Kandy", "Matale", "Nuwara Eliya" }),
        ("Southern", new[] { "Galle", "Matara", "Hambantota" }),
        ("Northern", new[] { "Jaffna", "Kilinochchi", "Mannar", "Mullaitivu", "Vavuniya" }),
        ("Eastern", new[] { "Batticaloa", "Ampara", "Trincomalee" }),
        ("North Western", new[] { "Kurunegala", "Puttalam" }),
        ("North Central", new[] { "Anuradhapura", "Polonnaruwa" }),
        ("Uva", new[] { "Badulla", "Monaragala" }),
        ("Sabaragamuwa", new[] { "Ratnapura", "Kegalle" })
    };

    private static readonly Dictionary<string, string[]> DistrictLookup =
        ProvinceDistricts.ToDictionary(entry => entry.Province, entry => entry.Districts, StringComparer.Ordinal);

    public static IReadOnlyList<string> Provinces { get; } =
        ProvinceDistricts.Select(entry => entry.Province).ToList();

    public static IReadOnlyList<string> Districts { get; } =
        ProvinceDistricts.SelectMany(entry => entry.Districts).ToList();

    public static bool IsProvince(string? value) =>
        !string.IsNullOrWhiteSpace(value) && DistrictLookup.ContainsKey(value);

    public static IReadOnlyList<string> GetDistricts(string? province) =>
        province is not null && DistrictLookup.TryGetValue(province, out var districts)
            ? districts
            : Array.Empty<string>();

    public static bool IsDistrictOfProvince(string? province, string? district) =>
        !string.IsNullOrWhiteSpace(province)
        && !string.IsNullOrWhiteSpace(district)
        && DistrictLookup.TryGetValue(province, out var districts)
        && Array.IndexOf(districts, district) >= 0;
}
