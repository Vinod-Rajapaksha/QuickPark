namespace QuickPark.API.DTOs.Payments;

public class RevenueOverviewResponse
{
    public decimal TotalRevenue { get; set; }
    public decimal TotalCommission { get; set; }
    public decimal TotalProviderAmount { get; set; }
    public decimal CashCommissionDue { get; set; }

    public int PaidPayments { get; set; }

    // One booking can settle a fee and a stay, so the count of money rows is not the count of cars.
    public int BookingsPaid { get; set; }

    public int CardPayments { get; set; }
    public int CashPayments { get; set; }
    public int FailedPayments { get; set; }
    public int CancelledPayments { get; set; }
    public int RefundedPayments { get; set; }
    public int PendingCashConfirmations { get; set; }

    public List<RevenueMethodResponse> ByMethod { get; set; } = new();
    public List<RevenueBucketResponse> Trend { get; set; } = new();
    public List<RevenuePropertyResponse> ByProperty { get; set; } = new();
    public List<RevenueVehicleTypeResponse> ByVehicleType { get; set; } = new();
}

public class RevenueMethodResponse
{
    public string PaymentMethod { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal Commission { get; set; }
    public decimal ProviderAmount { get; set; }
    public int Payments { get; set; }
}

public class RevenueBucketResponse
{
    public string Period { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal Commission { get; set; }
    public decimal ProviderAmount { get; set; }
    public decimal CardAmount { get; set; }
    public decimal CashAmount { get; set; }
    public int Payments { get; set; }
}

public class RevenuePropertyResponse
{
    public Guid FacilityId { get; set; }
    public string FacilityName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal Commission { get; set; }
    public decimal ProviderAmount { get; set; }
    public int Payments { get; set; }
}

// What one vehicle category brought in over the period, with the bay hours it consumed.
public class RevenueVehicleTypeResponse
{
    public Guid VehicleTypeId { get; set; }
    public string VehicleTypeName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal Commission { get; set; }
    public decimal ProviderAmount { get; set; }
    public int Payments { get; set; }
    public int BookedHours { get; set; }
}
