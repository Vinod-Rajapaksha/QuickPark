using QuickPark.API.Enums;

namespace QuickPark.API.Models;

public class Commission
{
    public Guid Id { get; set; } = Guid.NewGuid(); 

    // The booking is reached through the payment
    public Guid PaymentId { get; set; } 
    public Payment Payment { get; set; } = null!;

    // Links to provider and reservation (reservation may be from another module)
    public Guid ProviderId { get; set; }
    public Guid ReservationId { get; set; }

    public decimal GrossAmount { get; set; }
    public decimal CommissionRate { get; set; }
    public decimal CommissionAmount { get; set; }
    public decimal ProviderAmount { get; set; }

    public CommissionStatus Status { get; set; }

    // Only a Cash commission is ever awaited
    public DateTime? SettledAt { get; set; }
    public Guid? SettledBy { get; set; }

    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
