namespace QuickPark.API.Helpers;

public static class ValueFormatExtensions
{
    
    public static string? TrimToNull(this string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    public static string ClampedTo(this string value, int maxLength) =>
        value.Length <= maxLength ? value : string.Concat(value.AsSpan(0, maxLength - 1), "…");

    public static string FormatRate(this decimal amount) => $"{amount:0.##} LKR";

    public static DateTime AsUtc(this DateTime value) => value.Kind switch
    {
        DateTimeKind.Utc => value,
        DateTimeKind.Local => value.ToUniversalTime(),
        _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
    };
}
