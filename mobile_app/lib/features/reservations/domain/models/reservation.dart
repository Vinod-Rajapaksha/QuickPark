import 'package:freezed_annotation/freezed_annotation.dart';

part 'reservation.freezed.dart';
part 'reservation.g.dart';

@freezed
abstract class Reservation with _$Reservation {
  const factory Reservation({
    required String reservationId,
    required String driverId,
    required String driverName,
    required String driverPhone,
    required String facilityId,
    required String facilityName,
    required String city,
    required String province,
    required String district,
    required String providerId,
    required String slotId,
    required String slotNumber,
    required String vehicleTypeId,
    required String vehicleTypeName,
    required DateTime startTime,
    required DateTime endTime,
    required int hours,
    required double hourlyRate,
    required double totalAmount,
    required double commissionRate,
    required double commissionAmount,
    required double providerAmount,
    required String status,
    required bool isApprovedByProvider,
    required bool isAgentBooking,
    DateTime? checkedInAt,
    DateTime? checkedOutAt,
    String? cancelReason,
    String? cancelledBy,
    DateTime? cancelledAt,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _Reservation;

  factory Reservation.fromJson(Map<String, dynamic> json) =>
      _$ReservationFromJson(json);
}
