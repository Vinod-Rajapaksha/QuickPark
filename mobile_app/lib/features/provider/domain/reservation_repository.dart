import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/features/reservations/domain/models/reservation.dart';
import 'package:mobile_app/features/provider/data/reservation_repository_impl.dart';

final reservationRepositoryProvider = Provider<ReservationRepository>((ref) {
  return ReservationRepositoryImpl(ref);
});

abstract class ReservationRepository {
  Future<List<Reservation>> getProviderReservations({String? status});
  Future<Reservation> getReservationById(String id);
  Future<Reservation> approveReservation(String id);
  Future<Reservation> rejectReservation(String id, {String? reason});
  Future<void> sendMessage(String id, String message);
  Future<Reservation> checkIn(String id);
  Future<Reservation> checkOut(String id);
  Future<Map<String, dynamic>> updateSlotStatus(
    String slotId, {
    required String status,
    String? reason,
  });
}
