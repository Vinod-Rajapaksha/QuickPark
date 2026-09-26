namespace QuickPark.API.DTOs.Payments;

public class CardCheckoutRequest
{
    public string? Reference { get; set; }

    public string? CardNumber { get; set; }
    public string? HolderName { get; set; }

    // MM/YY
    public string? Expiry { get; set; }
    public string? Cvv { get; set; }
}

public class CardCheckoutResponse
{
    public Guid PaymentId { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public bool Approved { get; set; }
    public string? TransactionId { get; set; }
    public string? DeclineReason { get; set; }
    public string? CallbackToken { get; set; }
}

public class ConfirmCardPaymentRequest
{
    public string? CallbackToken { get; set; }
}
