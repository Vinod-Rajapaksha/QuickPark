namespace QuickPark.API.DTOs.Payments;

public class PaymentResponse
{
    public Guid PaymentId { get; set; }
    public int AttemptNumber { get; set; }

    public Guid ReservationId { get; set; }
    public Guid DriverUserId { get; set; }
    public Guid ProviderId { get; set; }
    public Guid FacilityId { get; set; }
    public string FacilityName { get; set; } = string.Empty;
    public string SlotNumber { get; set; } = string.Empty;
    public string VehicleTypeName { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public int Hours { get; set; }

    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string ReservationStatus { get; set; } = string.Empty;

    public decimal? CommissionRate { get; set; }
    public decimal? CommissionAmount { get; set; }
    public decimal? ProviderAmount { get; set; }

    public string? CommissionStatus { get; set; }
    public bool CashCommissionDue { get; set; }

    public string GatewayProvider { get; set; } = string.Empty;
    public string? GatewayTransactionId { get; set; }
    public string? FailureReason { get; set; }

    public Guid? CashConfirmedBy { get; set; }
    public string? CashConfirmedByName { get; set; }
    public DateTime? CashConfirmedAt { get; set; }

    public DateTime? PaidAt { get; set; }
    public DateTime? FailedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public DateTime? RefundedAt { get; set; }
    public string? RefundReason { get; set; }

    public string? CheckoutReference { get; set; }
    public string? CheckoutPath { get; set; }
    public DateTime? CheckoutExpiresAt { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
