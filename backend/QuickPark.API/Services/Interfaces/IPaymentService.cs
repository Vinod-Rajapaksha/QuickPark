using QuickPark.API.DTOs.Payments;

namespace QuickPark.API.Services.Interfaces;

public interface IPaymentService
{
    // opens the driver's next attempt at paying a booking
    Task<PaymentResponse> CreateAsync(Guid driverUserId, CreatePaymentRequest request, CancellationToken ct = default);

    // runs a card through the gateway and returns its signed outcome. Settles nothing.
    Task<CardCheckoutResponse> CheckoutCardAsync(Guid driverUserId, CardCheckoutRequest request, CancellationToken ct = default);

    // settles a card payment once the gateway's signed confirmation has been verified.
    Task<PaymentResponse> ConfirmCardAsync(Guid driverUserId, ConfirmCardPaymentRequest request, CancellationToken ct = default);

    // the same verification arriving from the gateway rather than the driver
    Task<PaymentResponse> HandleGatewayCallbackAsync(string? callbackToken, CancellationToken ct = default);

    // the owner of the booking's own property recording that the driver paid them cash.
    Task<PaymentResponse> ConfirmCashAsync(
        Guid providerUserId, Guid paymentId, CashConfirmationRequest? request, CancellationToken ct = default);

    // Reads are scoped by who asks
    Task<PaymentResponse?> GetAsync(Guid userId, Guid paymentId, CancellationToken ct = default);

    // the newest attempt against a booking
    Task<PaymentResponse?> GetForReservationAsync(Guid userId, Guid reservationId, CancellationToken ct = default);

    // A driver's own history
    Task<IReadOnlyList<PaymentResponse>> ListForDriverAsync(
        Guid driverUserId, PaymentFilter? filter = null, CancellationToken ct = default);

    // An owner's history for their own properties, split included
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
