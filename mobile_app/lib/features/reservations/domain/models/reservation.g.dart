// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'reservation.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Reservation _$ReservationFromJson(Map<String, dynamic> json) => _Reservation(
  reservationId: json['reservationId'] as String,
  driverId: json['driverId'] as String,
  driverName: json['driverName'] as String,
  driverPhone: json['driverPhone'] as String,
  facilityId: json['facilityId'] as String,
  facilityName: json['facilityName'] as String,
  city: json['city'] as String,
  province: json['province'] as String,
  district: json['district'] as String,
  providerId: json['providerId'] as String,
  slotId: json['slotId'] as String,
  slotNumber: json['slotNumber'] as String,
  vehicleTypeId: json['vehicleTypeId'] as String,
  vehicleTypeName: json['vehicleTypeName'] as String,
  startTime: DateTime.parse(json['startTime'] as String),
  endTime: DateTime.parse(json['endTime'] as String),
  hours: (json['hours'] as num).toInt(),
  hourlyRate: (json['hourlyRate'] as num).toDouble(),
  totalAmount: (json['totalAmount'] as num).toDouble(),
  commissionRate: (json['commissionRate'] as num).toDouble(),
  commissionAmount: (json['commissionAmount'] as num).toDouble(),
  providerAmount: (json['providerAmount'] as num).toDouble(),
  status: json['status'] as String,
  isApprovedByProvider: json['isApprovedByProvider'] as bool,
  isAgentBooking: json['isAgentBooking'] as bool,
  checkedInAt: json['checkedInAt'] == null
      ? null
      : DateTime.parse(json['checkedInAt'] as String),
  checkedOutAt: json['checkedOutAt'] == null
      ? null
      : DateTime.parse(json['checkedOutAt'] as String),
  cancelReason: json['cancelReason'] as String?,
  cancelledBy: json['cancelledBy'] as String?,
  cancelledAt: json['cancelledAt'] == null
      ? null
      : DateTime.parse(json['cancelledAt'] as String),
  createdAt: DateTime.parse(json['createdAt'] as String),
  updatedAt: DateTime.parse(json['updatedAt'] as String),
);

Map<String, dynamic> _$ReservationToJson(_Reservation instance) =>
    <String, dynamic>{
      'reservationId': instance.reservationId,
      'driverId': instance.driverId,
      'driverName': instance.driverName,
      'driverPhone': instance.driverPhone,
      'facilityId': instance.facilityId,
      'facilityName': instance.facilityName,
      'city': instance.city,
      'province': instance.province,
      'district': instance.district,
      'providerId': instance.providerId,
      'slotId': instance.slotId,
      'slotNumber': instance.slotNumber,
      'vehicleTypeId': instance.vehicleTypeId,
      'vehicleTypeName': instance.vehicleTypeName,
      'startTime': instance.startTime.toIso8601String(),
      'endTime': instance.endTime.toIso8601String(),
      'hours': instance.hours,
      'hourlyRate': instance.hourlyRate,
      'totalAmount': instance.totalAmount,
      'commissionRate': instance.commissionRate,
      'commissionAmount': instance.commissionAmount,
      'providerAmount': instance.providerAmount,
      'status': instance.status,
      'isApprovedByProvider': instance.isApprovedByProvider,
      'isAgentBooking': instance.isAgentBooking,
      'checkedInAt': instance.checkedInAt?.toIso8601String(),
      'checkedOutAt': instance.checkedOutAt?.toIso8601String(),
      'cancelReason': instance.cancelReason,
      'cancelledBy': instance.cancelledBy,
      'cancelledAt': instance.cancelledAt?.toIso8601String(),
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
    };
