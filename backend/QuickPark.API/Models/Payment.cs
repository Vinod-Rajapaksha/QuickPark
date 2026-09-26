using QuickPark.API.Enums;

namespace QuickPark.API.Models;

public class Payment
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ReservationId { get; set; }

    // The booking this payment settles.
    public Reservation Reservation { get; set; } = null!;

    // One settled payment produced exactly one commission split (§11).
    public Commission? Commission { get; set; }

    // ParkingProvider.Id, copied from the booking so an owner's money is one indexed lookup away
    // instead of a join through the facility.
    public Guid ProviderId { get; set; }

    public Guid DriverId { get; set; }

    public int AttemptNumber { get; set; } = 1;

    public decimal Amount { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.PENDING;

    // What the gateway was called, what it named the transaction, and the checkout reference it
    // issued. TransactionId is unique, so a replayed webhook cannot pay twice (§31).
    public string GatewayProvider { get; set; } = string.Empty;
    public string? GatewayTransactionId { get; set; }
    public string? GatewayReference { get; set; }
    public string? FailureReason { get; set; }

    public DateTime? PaidAt { get; set; }
    public DateTime? FailedAt { get; set; }
    public DateTime? CancelledAt { get; set; }

    public Guid? CashConfirmedBy { get; set; }
    public string? CashConfirmedByName { get; set; }
    public DateTime? CashConfirmedAt { get; set; }

    public DateTime? RefundedAt { get; set; }
    public string? RefundReason { get; set; }
    public Guid? RefundedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
