namespace QuickPark.API.DTOs.Payments;

public class ProviderEarningsResponse
{
    public Guid ProviderId { get; set; }

    public decimal TotalRevenue { get; set; }
    public decimal CardRevenue { get; set; }
    public decimal CashRevenue { get; set; }

    public decimal QuickParkCommission { get; set; }
    public decimal ProviderEarnings { get; set; }

    public decimal PendingEarnings { get; set; }
    public decimal AvailableEarnings { get; set; }

    public decimal CashCommissionDue { get; set; }
    public int CashCommissionsOutstanding { get; set; }

    public int BookingsPaid { get; set; }
    public int BookingsCard { get; set; }
    public int BookingsCash { get; set; }
    public int PendingCashConfirmations { get; set; }
    public int FailedPayments { get; set; }
    public int CancelledPayments { get; set; }
    public int RefundedPayments { get; set; }
}
