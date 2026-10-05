namespace QuickPark.API.Options;

public class AuthCookieOptions
{
    public const string SectionName = "Cookie";
    public string Name { get; set; } = "quickpark_auth";
    public int ExpirationMinutes { get; set; } = 60;
}
