using QuickPark.API.Enums;

namespace QuickPark.API.Models;

public class ProviderLedger
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // ParkingProvider.Id.
    public Guid ProviderId { get; set; }

    // All optional because an admin adjustment can belong to the account rather than to one
    // booking.
    public Guid? ReservationId { get; set; }
    public Guid? PaymentId { get; set; }
    public Guid? CommissionId { get; set; }

    // The statement line is only legible next to the booking it came from, so the row reads
    // through the payment to the property and the bay.
    public Payment? Payment { get; set; }

    public LedgerTransactionType TransactionType { get; set; }
    public decimal Amount { get; set; }

    // Human-readable bookkeeping line: what the row is and which record it reverses or settles.
    public string Reference { get; set; } = string.Empty;

    public Guid? CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
