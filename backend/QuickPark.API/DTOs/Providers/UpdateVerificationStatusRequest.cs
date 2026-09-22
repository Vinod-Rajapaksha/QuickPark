namespace QuickPark.API.DTOs.Providers;

// Admin payload to approve or reject a Parking Owner's verification.
public class UpdateVerificationStatusRequest
{
    // Expected values: "APPROVED" or "REJECTED".
    public string Status { get; set; } = string.Empty;
    public string? Remarks { get; set; }
}
