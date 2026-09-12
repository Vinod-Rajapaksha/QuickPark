namespace QuickPark.API.Options;

public class AdminSeedOptions
{
    public const string SectionName = "AdminSeed";
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string NIC { get; set; } = string.Empty;
}
