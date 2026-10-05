using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace QuickPark.API.Integrations.Payments;

public sealed class SandboxCardPaymentGateway : ICardPaymentGateway
{

    public const string FallbackSecret = "quickpark-sandbox-card-secret-not-for-production";

    private const string TokenVersion = "v1";
    private const string CheckoutPurpose = "checkout";
    private const string CallbackPurpose = "callback";
    private const string TransactionPrefix = "QPSBX";

    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = false };

    private readonly byte[] _secret;
    private readonly int _checkoutTtlMinutes;
    private readonly int _callbackTtlMinutes;

    public SandboxCardPaymentGateway(IConfiguration configuration)
    {
        var secret = Resolve(configuration?["PaymentGateway:SandboxSecret"], "QUICKPARK_PAYMENT_SANDBOX_SECRET")
                     ?? FallbackSecret;
        _secret = Encoding.UTF8.GetBytes(secret);
        _checkoutTtlMinutes = ReadTtl(configuration?["PaymentGateway:CheckoutTtlMinutes"], 15);
        _callbackTtlMinutes = ReadTtl(configuration?["PaymentGateway:CallbackTtlMinutes"], 10);
    }

    public string Provider => "QUICKPARK_SANDBOX";

    private static readonly HashSet<string> ApprovedCards = new(StringComparer.Ordinal)
    {
        "4242424242424242"
    };

    private static readonly Dictionary<string, string> DeclinedCards = new(StringComparer.Ordinal)
    {
        ["4000000000000002"] = "The card was declined by the issuer.",
        ["4000000000009995"] = "The card has expired.",
        ["5555555555554444"] = "Insufficient funds."
    };

    // Signs the checkout reference the driver is sent to the gateway with, and its expiry.
    public GatewayCheckout CreateCheckout(Guid paymentId, Guid reservationId, decimal amount)
    {
        var now = DateTimeOffset.UtcNow;
        var payload = new GatewayPayload
        {
            Purpose = CheckoutPurpose,
            PaymentId = paymentId.ToString(),
            ReservationId = reservationId.ToString(),
            Amount = Money(amount),
            IssuedAt = now.ToUnixTimeSeconds(),
            ExpiresAt = now.AddMinutes(_checkoutTtlMinutes).ToUnixTimeSeconds()
        };

        var reference = Issue(payload);

        return new GatewayCheckout(
            Provider,
            reference,
            $"/payments/card?reference={Uri.EscapeDataString(reference)}",
            DateTimeOffset.FromUnixTimeSeconds(payload.ExpiresAt).UtcDateTime);
    }

    public GatewayCheckoutResult CompleteCheckout(string checkoutReference, CardCheckoutDetails card)
    {
        var checkout = Read(checkoutReference, CheckoutPurpose);
        var paymentId = ParseGuid(checkout.PaymentId, "This checkout does not belong to a payment.");

        var number = NormalizeCardNumber(card.CardNumber);
        ValidateExpiry(card.Expiry);
        ValidateCvv(card.Cvv);

        var approved = ApprovedCards.Contains(number);
        var reason = approved
            ? null
            : DeclinedCards.TryGetValue(number, out var decline)
                ? decline
                : "This card number is not part of the sandbox test set. Use 4242 4242 4242 4242 to pay successfully.";

        var transactionId = TransactionPrefix + "-" + Fingerprint(checkoutReference, 24);

        var now = DateTimeOffset.UtcNow;
        var callback = Issue(new GatewayPayload
        {
            Purpose = CallbackPurpose,
            PaymentId = paymentId.ToString(),
            ReservationId = checkout.ReservationId,
            Amount = checkout.Amount,
            TransactionId = transactionId,
            Approved = approved,
            Reason = reason,
            IssuedAt = now.ToUnixTimeSeconds(),
            ExpiresAt = now.AddMinutes(_callbackTtlMinutes).ToUnixTimeSeconds()
        });

        return new GatewayCheckoutResult(
            Provider,
            transactionId,
            ParseMoney(checkout.Amount),
            approved,
            reason,
            callback);
    }

    public GatewayCallback VerifyCallback(string callbackToken)
    {
        var payload = Read(callbackToken, CallbackPurpose);

        return new GatewayCallback(
            Provider,
            ParseGuid(payload.PaymentId, "This confirmation does not belong to a payment."),
            payload.TransactionId ?? string.Empty,
            ParseMoney(payload.Amount),
            payload.Approved ?? false,
            payload.Reason,
            DateTimeOffset.FromUnixTimeSeconds(payload.ExpiresAt).UtcDateTime);
    }

    public string RefundReceiptId(string transactionId) =>
        TransactionPrefix + "-RF-" + Fingerprint($"refund|{transactionId}", 20);

    // ---- token plumbing ----

    private string Issue(GatewayPayload payload)
    {
        var body = Base64Url(JsonSerializer.SerializeToUtf8Bytes(payload, JsonOptions));
        return $"{TokenVersion}.{body}.{Signature(body)}";
    }

    private GatewayPayload Read(string token, string expectedPurpose)
    {
        var parts = (token ?? string.Empty).Split('.', 3);
        if (parts.Length != 3 || parts[0] != TokenVersion)
        {
            throw new InvalidOperationException("The payment gateway reference is not recognised.");
        }

        var expected = Signature(parts[1]);
        if (!FixedTimeEqualsUrl(parts[2], expected))
        {
            throw new InvalidOperationException("The payment gateway reference failed its signature check.");
        }

        GatewayPayload? payload;
        try
        {
            payload = JsonSerializer.Deserialize<GatewayPayload>(UnBase64Url(parts[1]), JsonOptions);
        }
        catch (Exception ex) when (ex is FormatException or JsonException)
        {
            throw new InvalidOperationException("The payment gateway reference could not be read.");
        }

        if (payload is null || payload.Purpose != expectedPurpose)
        {
            throw new InvalidOperationException($"This is not a gateway {expectedPurpose} reference.");
        }

        if (DateTimeOffset.UtcNow.ToUnixTimeSeconds() >= payload.ExpiresAt)
        {
            throw new InvalidOperationException("This payment gateway reference has expired. Start the payment again.");
        }

        return payload;
    }

    private string Signature(string body)
    {
        var mac = HMACSHA256.HashData(_secret, Encoding.UTF8.GetBytes(body));
        return Base64Url(mac);
    }

    // Compared in constant time so a wrong signature cannot be probed one byte at a time.
    private static bool FixedTimeEqualsUrl(string provided, string expected)
    {
        var a = Encoding.UTF8.GetBytes(provided);
        var b = Encoding.UTF8.GetBytes(expected);
        return a.Length == b.Length && CryptographicOperations.FixedTimeEquals(a, b);
    }

    private static string Base64Url(byte[] bytes) =>
        Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');

    private static byte[] UnBase64Url(string text)
    {
        var padded = text.Replace('-', '+').Replace('_', '/');
        return Convert.FromBase64String(padded.PadRight(padded.Length + (4 - padded.Length % 4) % 4, '='));
    }

    private static string Fingerprint(string value, int length)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(hash)[..length];
    }

    private static string Money(decimal amount) =>
        Math.Round(amount, 2, MidpointRounding.AwayFromZero).ToString("0.00", CultureInfo.InvariantCulture);

    private static decimal ParseMoney(string amount) =>
        decimal.TryParse(amount, NumberStyles.Number, CultureInfo.InvariantCulture, out var value)
            ? value
            : throw new InvalidOperationException("The payment gateway reference carries an unreadable amount.");

    private static Guid ParseGuid(string value, string message) =>
        Guid.TryParse(value, out var id) ? id : throw new InvalidOperationException(message);

    // ---- card checks ----

    private static string NormalizeCardNumber(string? raw)
    {
        var digits = new string((raw ?? string.Empty).Where(char.IsDigit).ToArray());

        if (digits.Length is < 13 or > 19)
        {
            throw new InvalidOperationException("A card number must be 13 to 19 digits.");
        }

        return digits;
    }

    private static void ValidateExpiry(string? raw)
    {
        var text = (raw ?? string.Empty).Trim();
        var halves = text.Split('/', 2);

        if (halves.Length != 2 ||
            !int.TryParse(halves[0].Trim(), NumberStyles.None, CultureInfo.InvariantCulture, out var month) ||
            !int.TryParse(halves[1].Trim(), NumberStyles.None, CultureInfo.InvariantCulture, out var year) ||
            month is < 1 or > 12)
        {
            throw new InvalidOperationException("The card expiry must be given as MM/YY.");
        }

        if (year < 100) year += 2000;
        if (year < 2000 || year > 2100)
        {
            throw new InvalidOperationException("The card expiry year is not valid.");
        }

        if (new DateTime(year, month, 1).AddMonths(1) <= DateTime.UtcNow)
        {
            throw new InvalidOperationException("The card has expired.");
        }
    }

    private static void ValidateCvv(string? raw)
    {
        var text = (raw ?? string.Empty).Trim();
        if (text.Length is < 3 or > 4 || !text.All(char.IsDigit))
        {
            throw new InvalidOperationException("The card security code must be 3 or 4 digits.");
        }
    }

    private static int ReadTtl(string? configured, int fallback)
    {
        var fromEnv = Environment.GetEnvironmentVariable("QUICKPARK_PAYMENT_GATEWAY_TTL_MINUTES");
        var value = string.IsNullOrWhiteSpace(configured) ? fromEnv : configured;
        return int.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var minutes) && minutes > 0
            ? minutes
            : fallback;
    }

    // Config value first, environment variable when it is missing or blank.
    private static string? Resolve(string? configValue, string envVar)
    {
        if (!string.IsNullOrWhiteSpace(configValue)) return configValue;
        var fromEnv = Environment.GetEnvironmentVariable(envVar);
        return string.IsNullOrWhiteSpace(fromEnv) ? null : fromEnv;
    }

    // The body inside every signed token
    private sealed class GatewayPayload
    {
        public string Purpose { get; set; } = string.Empty;
        public string PaymentId { get; set; } = string.Empty;
        public string? ReservationId { get; set; }
        public string Amount { get; set; } = string.Empty;
        public string? TransactionId { get; set; }
        public bool? Approved { get; set; }
        public string? Reason { get; set; }
        public long IssuedAt { get; set; }
        public long ExpiresAt { get; set; }
    }
}
