namespace QuickPark.API.DTOs.Payments;

public class LedgerEntryResponse
{
    public Guid EntryId { get; set; }
    public Guid ProviderId { get; set; }
    public string TransactionType { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Reference { get; set; } = string.Empty;

    public Guid? ReservationId { get; set; }
    public Guid? PaymentId { get; set; }
    public Guid? CommissionId { get; set; }

    public string? FacilityName { get; set; }
    public string? SlotNumber { get; set; }
    public string? PaymentMethod { get; set; }

    public DateTime CreatedAt { get; set; }
}

public class CommissionLineResponse
{
    public Guid CommissionId { get; set; }
    public Guid PaymentId { get; set; }
    public Guid ReservationId { get; set; }
    public Guid ProviderId { get; set; }

    public decimal GrossAmount { get; set; }
    public decimal CommissionRate { get; set; }
    public decimal CommissionAmount { get; set; }
    public decimal ProviderAmount { get; set; }

    public string Status { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = string.Empty;
    public string ProviderName { get; set; } = string.Empty;
    public string FacilityName { get; set; } = string.Empty;
    public DateTime BookingStart { get; set; }
    public DateTime? SettledAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
