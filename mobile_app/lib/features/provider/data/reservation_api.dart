import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/core/network/api_client.dart';
import 'package:mobile_app/features/reservations/domain/models/reservation.dart';

final reservationApiProvider = Provider<ReservationApi>((ref) {
  return ReservationApi(ref.read(dioProvider));
});

class ReservationApi {
  final Dio _dio;

  ReservationApi(this._dio);

  Future<List<Reservation>> getProviderReservations({String? status}) async {
    final response = await _dio.get(
      '/Reservations/provider',
      queryParameters: status != null ? {'status': status} : null,
    );
    return (response.data as List)
        .map((json) => Reservation.fromJson(json))
        .toList();
  }

  Future<Reservation> getReservationById(String id) async {
    final response = await _dio.get('/Reservations/$id');
    return Reservation.fromJson(response.data);
  }

  Future<Reservation> approveReservation(String id) async {
    final response = await _dio.post('/Reservations/$id/approve');
    return Reservation.fromJson(response.data);
  }

  Future<Reservation> rejectReservation(String id, {String? reason}) async {
    final response = await _dio.post(
      '/Reservations/$id/reject',
      data: {'reason': reason},
    );
    return Reservation.fromJson(response.data);
  }

  Future<void> sendMessage(String id, String message) async {
    await _dio.post('/Reservations/$id/message', data: {'message': message});
  }

  Future<Reservation> checkIn(String id) async {
    final response = await _dio.post('/Reservations/$id/check-in');
    return Reservation.fromJson(response.data);
  }

  Future<Reservation> checkOut(String id) async {
    final response = await _dio.post('/Reservations/$id/check-out');
    return Reservation.fromJson(response.data);
  }

  /// The owner's bay state: AVAILABLE, MAINTENANCE or DISABLED. The backend refuses
  /// a change while a vehicle holds the bay, so its message is the authority here.
  Future<Map<String, dynamic>> updateSlotStatus(
    String slotId, {
    required String status,
    String? reason,
  }) async {
    final response = await _dio.patch(
      '/ParkingSlots/provider/slots/$slotId/status',
      data: {'status': status, 'reason': reason},
    );
    return response.data as Map<String, dynamic>;
  }
}
