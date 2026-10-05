/// The QuickPark reservation ticket payload: `qp-res-v1:<reservation id>`.
/// The driver's ticket encodes it and the owner's scanner decodes it, so both
/// sides read the prefix and the identifier through this single codec.
class ReservationQrCodec {
  static const String _prefix = 'qp-res-v1:';

  static final RegExp _reservationId = RegExp(
    r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-'
    r'[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
  );

  static String encode(String reservationId) => '$_prefix$reservationId';

  /// The reservation id inside a scanned code, or null when it is not a
  /// QuickPark ticket.
  static String? decode(String? rawValue) {
    final payload = rawValue?.trim();
    if (payload == null || !payload.startsWith(_prefix)) return null;

    final reservationId = payload.substring(_prefix.length).trim();
    return _reservationId.hasMatch(reservationId) ? reservationId : null;
  }
}
