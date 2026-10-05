import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/features/provider/data/reservation_api.dart';
import 'package:mobile_app/features/reservations/domain/models/reservation.dart';
import 'package:mobile_app/features/provider/domain/reservation_repository.dart';

class ReservationRepositoryImpl implements ReservationRepository {
  final Ref _ref;

  ReservationRepositoryImpl(this._ref);

  ReservationApi get _api => _ref.read(reservationApiProvider);

  @override
  Future<List<Reservation>> getProviderReservations({String? status}) {
    return _api.getProviderReservations(status: status);
  }

  @override
  Future<Reservation> getReservationById(String id) {
    return _api.getReservationById(id);
  }

  @override
  Future<Reservation> approveReservation(String id) {
    return _api.approveReservation(id);
  }

  @override
  Future<Reservation> rejectReservation(String id, {String? reason}) {
    return _api.rejectReservation(id, reason: reason);
  }

  @override
  Future<void> sendMessage(String id, String message) {
    return _api.sendMessage(id, message);
  }

  @override
  Future<Reservation> checkIn(String id) {
    return _api.checkIn(id);
  }

  @override
  Future<Reservation> checkOut(String id) {
    return _api.checkOut(id);
  }

  @override
  Future<Map<String, dynamic>> updateSlotStatus(
    String slotId, {
    required String status,
    String? reason,
  }) {
    return _api.updateSlotStatus(slotId, status: status, reason: reason);
  }
}
