namespace QuickPark.API.DTOs.Payments;

public class CashConfirmationRequest
{
    public string? Note { get; set; }
}

public class RefundPaymentRequest
{
    public string? Reason { get; set; }
}

public class SettleCommissionRequest
{
    public string? Note { get; set; }
}
