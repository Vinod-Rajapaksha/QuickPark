namespace QuickPark.API.Integrations.Payments;

public interface ICardPaymentGateway
{
    
    string Provider { get; }

    GatewayCheckout CreateCheckout(Guid paymentId, Guid reservationId, decimal amount);

    GatewayCheckoutResult CompleteCheckout(string checkoutReference, CardCheckoutDetails card);

    GatewayCallback VerifyCallback(string callbackToken);

    string RefundReceiptId(string transactionId);
}

public sealed record CardCheckoutDetails(string? CardNumber, string? HolderName, string? Expiry, string? Cvv);

// Going out: what the driver is sent to the hosted page with.
public sealed record GatewayCheckout(
    string Provider,
    string Reference,
    string CheckoutPath,
    DateTime ExpiresAt);

// Coming back, before verification: the signed token in here is the only part anyone may act on.
public sealed record GatewayCheckoutResult(
    string Provider,
    string TransactionId,
    decimal Amount,
    bool Approved,
    string? DeclineReason,
    string CallbackToken);

// Coming back, after VerifyCallback has checked the signature.
public sealed record GatewayCallback(
    string Provider,
    Guid PaymentId,
    string TransactionId,
    decimal Amount,
    bool Approved,
    string? DeclineReason,
    DateTime ExpiresAt);
