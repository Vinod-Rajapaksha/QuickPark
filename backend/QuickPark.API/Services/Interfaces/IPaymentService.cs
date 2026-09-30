using QuickPark.API.DTOs.Payments;

namespace QuickPark.API.Services.Interfaces;

public interface IPaymentService
{
    // opens the driver's next attempt
    Task<PaymentResponse> CreateAsync(Guid driverUserId, CreatePaymentRequest request, CancellationToken ct = default);

    Task<CardCheckoutResponse> CheckoutCardAsync(Guid driverUserId, CardCheckoutRequest request, CancellationToken ct = default);

    Task<PaymentResponse> ConfirmCardAsync(Guid driverUserId, ConfirmCardPaymentRequest request, CancellationToken ct = default);

    Task<PaymentResponse> HandleGatewayCallbackAsync(string? callbackToken, CancellationToken ct = default);

    Task<PaymentResponse> ConfirmCashAsync(
        Guid providerUserId, Guid paymentId, CashConfirmationRequest? request, CancellationToken ct = default);

    Task<PaymentResponse?> GetAsync(Guid userId, Guid paymentId, CancellationToken ct = default);

    Task<PaymentResponse?> GetForReservationAsync(Guid userId, Guid reservationId, CancellationToken ct = default);

    // A driver's own history
    Task<IReadOnlyList<PaymentResponse>> ListForDriverAsync(
        Guid driverUserId, PaymentFilter? filter = null, CancellationToken ct = default);

    Task<IReadOnlyList<PaymentResponse>> ListForProviderAsync(
        Guid providerUserId, PaymentFilter? filter = null, CancellationToken ct = default);

    // the admin's monitoring list
    Task<IReadOnlyList<PaymentResponse>> ListForAdminAsync(
        PaymentFilter? filter = null, CancellationToken ct = default);

    // the admin's explicit adjustment route.
    Task<PaymentResponse> RefundAsync(
        Guid adminUserId, Guid paymentId, RefundPaymentRequest? request, CancellationToken ct = default);

    Task<PaymentResponse> SettleCashCommissionAsync(
        Guid adminUserId, Guid paymentId, SettleCommissionRequest? request, CancellationToken ct = default);
}
