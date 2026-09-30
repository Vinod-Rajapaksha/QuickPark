// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'reservation.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$Reservation {

 String get reservationId; String get driverId; String get driverName; String get driverPhone; String get facilityId; String get facilityName; String get city; String get province; String get district; String get providerId; String get slotId; String get slotNumber; String get vehicleTypeId; String get vehicleTypeName; DateTime get startTime; DateTime get endTime; int get hours; double get hourlyRate; double get totalAmount; double get commissionRate; double get commissionAmount; double get providerAmount; String get status; bool get isApprovedByProvider; bool get isAgentBooking; DateTime? get checkedInAt; DateTime? get checkedOutAt; String? get cancelReason; String? get cancelledBy; DateTime? get cancelledAt; DateTime get createdAt; DateTime get updatedAt;
/// Create a copy of Reservation
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ReservationCopyWith<Reservation> get copyWith => _$ReservationCopyWithImpl<Reservation>(this as Reservation, _$identity);

  /// Serializes this Reservation to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Reservation&&(identical(other.reservationId, reservationId) || other.reservationId == reservationId)&&(identical(other.driverId, driverId) || other.driverId == driverId)&&(identical(other.driverName, driverName) || other.driverName == driverName)&&(identical(other.driverPhone, driverPhone) || other.driverPhone == driverPhone)&&(identical(other.facilityId, facilityId) || other.facilityId == facilityId)&&(identical(other.facilityName, facilityName) || other.facilityName == facilityName)&&(identical(other.city, city) || other.city == city)&&(identical(other.province, province) || other.province == province)&&(identical(other.district, district) || other.district == district)&&(identical(other.providerId, providerId) || other.providerId == providerId)&&(identical(other.slotId, slotId) || other.slotId == slotId)&&(identical(other.slotNumber, slotNumber) || other.slotNumber == slotNumber)&&(identical(other.vehicleTypeId, vehicleTypeId) || other.vehicleTypeId == vehicleTypeId)&&(identical(other.vehicleTypeName, vehicleTypeName) || other.vehicleTypeName == vehicleTypeName)&&(identical(other.startTime, startTime) || other.startTime == startTime)&&(identical(other.endTime, endTime) || other.endTime == endTime)&&(identical(other.hours, hours) || other.hours == hours)&&(identical(other.hourlyRate, hourlyRate) || other.hourlyRate == hourlyRate)&&(identical(other.totalAmount, totalAmount) || other.totalAmount == totalAmount)&&(identical(other.commissionRate, commissionRate) || other.commissionRate == commissionRate)&&(identical(other.commissionAmount, commissionAmount) || other.commissionAmount == commissionAmount)&&(identical(other.providerAmount, providerAmount) || other.providerAmount == providerAmount)&&(identical(other.status, status) || other.status == status)&&(identical(other.isApprovedByProvider, isApprovedByProvider) || other.isApprovedByProvider == isApprovedByProvider)&&(identical(other.isAgentBooking, isAgentBooking) || other.isAgentBooking == isAgentBooking)&&(identical(other.checkedInAt, checkedInAt) || other.checkedInAt == checkedInAt)&&(identical(other.checkedOutAt, checkedOutAt) || other.checkedOutAt == checkedOutAt)&&(identical(other.cancelReason, cancelReason) || other.cancelReason == cancelReason)&&(identical(other.cancelledBy, cancelledBy) || other.cancelledBy == cancelledBy)&&(identical(other.cancelledAt, cancelledAt) || other.cancelledAt == cancelledAt)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,reservationId,driverId,driverName,driverPhone,facilityId,facilityName,city,province,district,providerId,slotId,slotNumber,vehicleTypeId,vehicleTypeName,startTime,endTime,hours,hourlyRate,totalAmount,commissionRate,commissionAmount,providerAmount,status,isApprovedByProvider,isAgentBooking,checkedInAt,checkedOutAt,cancelReason,cancelledBy,cancelledAt,createdAt,updatedAt]);

@override
String toString() {
  return 'Reservation(reservationId: $reservationId, driverId: $driverId, driverName: $driverName, driverPhone: $driverPhone, facilityId: $facilityId, facilityName: $facilityName, city: $city, province: $province, district: $district, providerId: $providerId, slotId: $slotId, slotNumber: $slotNumber, vehicleTypeId: $vehicleTypeId, vehicleTypeName: $vehicleTypeName, startTime: $startTime, endTime: $endTime, hours: $hours, hourlyRate: $hourlyRate, totalAmount: $totalAmount, commissionRate: $commissionRate, commissionAmount: $commissionAmount, providerAmount: $providerAmount, status: $status, isApprovedByProvider: $isApprovedByProvider, isAgentBooking: $isAgentBooking, checkedInAt: $checkedInAt, checkedOutAt: $checkedOutAt, cancelReason: $cancelReason, cancelledBy: $cancelledBy, cancelledAt: $cancelledAt, createdAt: $createdAt, updatedAt: $updatedAt)';
}


}

/// @nodoc
abstract mixin class $ReservationCopyWith<$Res>  {
  factory $ReservationCopyWith(Reservation value, $Res Function(Reservation) _then) = _$ReservationCopyWithImpl;
@useResult
$Res call({
 String reservationId, String driverId, String driverName, String driverPhone, String facilityId, String facilityName, String city, String province, String district, String providerId, String slotId, String slotNumber, String vehicleTypeId, String vehicleTypeName, DateTime startTime, DateTime endTime, int hours, double hourlyRate, double totalAmount, double commissionRate, double commissionAmount, double providerAmount, String status, bool isApprovedByProvider, bool isAgentBooking, DateTime? checkedInAt, DateTime? checkedOutAt, String? cancelReason, String? cancelledBy, DateTime? cancelledAt, DateTime createdAt, DateTime updatedAt
});




}
/// @nodoc
class _$ReservationCopyWithImpl<$Res>
    implements $ReservationCopyWith<$Res> {
  _$ReservationCopyWithImpl(this._self, this._then);

  final Reservation _self;
  final $Res Function(Reservation) _then;

/// Create a copy of Reservation
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? reservationId = null,Object? driverId = null,Object? driverName = null,Object? driverPhone = null,Object? facilityId = null,Object? facilityName = null,Object? city = null,Object? province = null,Object? district = null,Object? providerId = null,Object? slotId = null,Object? slotNumber = null,Object? vehicleTypeId = null,Object? vehicleTypeName = null,Object? startTime = null,Object? endTime = null,Object? hours = null,Object? hourlyRate = null,Object? totalAmount = null,Object? commissionRate = null,Object? commissionAmount = null,Object? providerAmount = null,Object? status = null,Object? isApprovedByProvider = null,Object? isAgentBooking = null,Object? checkedInAt = freezed,Object? checkedOutAt = freezed,Object? cancelReason = freezed,Object? cancelledBy = freezed,Object? cancelledAt = freezed,Object? createdAt = null,Object? updatedAt = null,}) {
  return _then(Reservation(
reservationId: null == reservationId ? _self.reservationId : reservationId // ignore: cast_nullable_to_non_nullable
as String,driverId: null == driverId ? _self.driverId : driverId // ignore: cast_nullable_to_non_nullable
as String,driverName: null == driverName ? _self.driverName : driverName // ignore: cast_nullable_to_non_nullable
as String,driverPhone: null == driverPhone ? _self.driverPhone : driverPhone // ignore: cast_nullable_to_non_nullable
as String,facilityId: null == facilityId ? _self.facilityId : facilityId // ignore: cast_nullable_to_non_nullable
as String,facilityName: null == facilityName ? _self.facilityName : facilityName // ignore: cast_nullable_to_non_nullable
as String,city: null == city ? _self.city : city // ignore: cast_nullable_to_non_nullable
as String,province: null == province ? _self.province : province // ignore: cast_nullable_to_non_nullable
as String,district: null == district ? _self.district : district // ignore: cast_nullable_to_non_nullable
as String,providerId: null == providerId ? _self.providerId : providerId // ignore: cast_nullable_to_non_nullable
as String,slotId: null == slotId ? _self.slotId : slotId // ignore: cast_nullable_to_non_nullable
as String,slotNumber: null == slotNumber ? _self.slotNumber : slotNumber // ignore: cast_nullable_to_non_nullable
as String,vehicleTypeId: null == vehicleTypeId ? _self.vehicleTypeId : vehicleTypeId // ignore: cast_nullable_to_non_nullable
as String,vehicleTypeName: null == vehicleTypeName ? _self.vehicleTypeName : vehicleTypeName // ignore: cast_nullable_to_non_nullable
as String,startTime: null == startTime ? _self.startTime : startTime // ignore: cast_nullable_to_non_nullable
as DateTime,endTime: null == endTime ? _self.endTime : endTime // ignore: cast_nullable_to_non_nullable
as DateTime,hours: null == hours ? _self.hours : hours // ignore: cast_nullable_to_non_nullable
as int,hourlyRate: null == hourlyRate ? _self.hourlyRate : hourlyRate // ignore: cast_nullable_to_non_nullable
as double,totalAmount: null == totalAmount ? _self.totalAmount : totalAmount // ignore: cast_nullable_to_non_nullable
as double,commissionRate: null == commissionRate ? _self.commissionRate : commissionRate // ignore: cast_nullable_to_non_nullable
as double,commissionAmount: null == commissionAmount ? _self.commissionAmount : commissionAmount // ignore: cast_nullable_to_non_nullable
as double,providerAmount: null == providerAmount ? _self.providerAmount : providerAmount // ignore: cast_nullable_to_non_nullable
as double,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,isApprovedByProvider: null == isApprovedByProvider ? _self.isApprovedByProvider : isApprovedByProvider // ignore: cast_nullable_to_non_nullable
as bool,isAgentBooking: null == isAgentBooking ? _self.isAgentBooking : isAgentBooking // ignore: cast_nullable_to_non_nullable
as bool,checkedInAt: freezed == checkedInAt ? _self.checkedInAt : checkedInAt // ignore: cast_nullable_to_non_nullable
as DateTime?,checkedOutAt: freezed == checkedOutAt ? _self.checkedOutAt : checkedOutAt // ignore: cast_nullable_to_non_nullable
as DateTime?,cancelReason: freezed == cancelReason ? _self.cancelReason : cancelReason // ignore: cast_nullable_to_non_nullable
as String?,cancelledBy: freezed == cancelledBy ? _self.cancelledBy : cancelledBy // ignore: cast_nullable_to_non_nullable
as String?,cancelledAt: freezed == cancelledAt ? _self.cancelledAt : cancelledAt // ignore: cast_nullable_to_non_nullable
as DateTime?,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,updatedAt: null == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}

}


/// Adds pattern-matching-related methods to [Reservation].
extension ReservationPatterns on Reservation {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Reservation value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Reservation() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Reservation value)  $default,){
final _that = this;
switch (_that) {
case _Reservation():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Reservation value)?  $default,){
final _that = this;
switch (_that) {
case _Reservation() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String reservationId,  String driverId,  String driverName,  String driverPhone,  String facilityId,  String facilityName,  String city,  String province,  String district,  String providerId,  String slotId,  String slotNumber,  String vehicleTypeId,  String vehicleTypeName,  DateTime startTime,  DateTime endTime,  int hours,  double hourlyRate,  double totalAmount,  double commissionRate,  double commissionAmount,  double providerAmount,  String status,  bool isApprovedByProvider,  bool isAgentBooking,  DateTime? checkedInAt,  DateTime? checkedOutAt,  String? cancelReason,  String? cancelledBy,  DateTime? cancelledAt,  DateTime createdAt,  DateTime updatedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Reservation() when $default != null:
return $default(_that.reservationId,_that.driverId,_that.driverName,_that.driverPhone,_that.facilityId,_that.facilityName,_that.city,_that.province,_that.district,_that.providerId,_that.slotId,_that.slotNumber,_that.vehicleTypeId,_that.vehicleTypeName,_that.startTime,_that.endTime,_that.hours,_that.hourlyRate,_that.totalAmount,_that.commissionRate,_that.commissionAmount,_that.providerAmount,_that.status,_that.isApprovedByProvider,_that.isAgentBooking,_that.checkedInAt,_that.checkedOutAt,_that.cancelReason,_that.cancelledBy,_that.cancelledAt,_that.createdAt,_that.updatedAt);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String reservationId,  String driverId,  String driverName,  String driverPhone,  String facilityId,  String facilityName,  String city,  String province,  String district,  String providerId,  String slotId,  String slotNumber,  String vehicleTypeId,  String vehicleTypeName,  DateTime startTime,  DateTime endTime,  int hours,  double hourlyRate,  double totalAmount,  double commissionRate,  double commissionAmount,  double providerAmount,  String status,  bool isApprovedByProvider,  bool isAgentBooking,  DateTime? checkedInAt,  DateTime? checkedOutAt,  String? cancelReason,  String? cancelledBy,  DateTime? cancelledAt,  DateTime createdAt,  DateTime updatedAt)  $default,) {final _that = this;
switch (_that) {
case _Reservation():
return $default(_that.reservationId,_that.driverId,_that.driverName,_that.driverPhone,_that.facilityId,_that.facilityName,_that.city,_that.province,_that.district,_that.providerId,_that.slotId,_that.slotNumber,_that.vehicleTypeId,_that.vehicleTypeName,_that.startTime,_that.endTime,_that.hours,_that.hourlyRate,_that.totalAmount,_that.commissionRate,_that.commissionAmount,_that.providerAmount,_that.status,_that.isApprovedByProvider,_that.isAgentBooking,_that.checkedInAt,_that.checkedOutAt,_that.cancelReason,_that.cancelledBy,_that.cancelledAt,_that.createdAt,_that.updatedAt);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String reservationId,  String driverId,  String driverName,  String driverPhone,  String facilityId,  String facilityName,  String city,  String province,  String district,  String providerId,  String slotId,  String slotNumber,  String vehicleTypeId,  String vehicleTypeName,  DateTime startTime,  DateTime endTime,  int hours,  double hourlyRate,  double totalAmount,  double commissionRate,  double commissionAmount,  double providerAmount,  String status,  bool isApprovedByProvider,  bool isAgentBooking,  DateTime? checkedInAt,  DateTime? checkedOutAt,  String? cancelReason,  String? cancelledBy,  DateTime? cancelledAt,  DateTime createdAt,  DateTime updatedAt)?  $default,) {final _that = this;
switch (_that) {
case _Reservation() when $default != null:
return $default(_that.reservationId,_that.driverId,_that.driverName,_that.driverPhone,_that.facilityId,_that.facilityName,_that.city,_that.province,_that.district,_that.providerId,_that.slotId,_that.slotNumber,_that.vehicleTypeId,_that.vehicleTypeName,_that.startTime,_that.endTime,_that.hours,_that.hourlyRate,_that.totalAmount,_that.commissionRate,_that.commissionAmount,_that.providerAmount,_that.status,_that.isApprovedByProvider,_that.isAgentBooking,_that.checkedInAt,_that.checkedOutAt,_that.cancelReason,_that.cancelledBy,_that.cancelledAt,_that.createdAt,_that.updatedAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Reservation implements Reservation {
  const _Reservation({required this.reservationId, required this.driverId, required this.driverName, required this.driverPhone, required this.facilityId, required this.facilityName, required this.city, required this.province, required this.district, required this.providerId, required this.slotId, required this.slotNumber, required this.vehicleTypeId, required this.vehicleTypeName, required this.startTime, required this.endTime, required this.hours, required this.hourlyRate, required this.totalAmount, required this.commissionRate, required this.commissionAmount, required this.providerAmount, required this.status, required this.isApprovedByProvider, required this.isAgentBooking, this.checkedInAt, this.checkedOutAt, this.cancelReason, this.cancelledBy, this.cancelledAt, required this.createdAt, required this.updatedAt});
  factory _Reservation.fromJson(Map<String, dynamic> json) => _$ReservationFromJson(json);

@override final  String reservationId;
@override final  String driverId;
@override final  String driverName;
@override final  String driverPhone;
@override final  String facilityId;
@override final  String facilityName;
@override final  String city;
@override final  String province;
@override final  String district;
@override final  String providerId;
@override final  String slotId;
@override final  String slotNumber;
@override final  String vehicleTypeId;
@override final  String vehicleTypeName;
@override final  DateTime startTime;
@override final  DateTime endTime;
@override final  int hours;
@override final  double hourlyRate;
@override final  double totalAmount;
@override final  double commissionRate;
@override final  double commissionAmount;
@override final  double providerAmount;
@override final  String status;
@override final  bool isApprovedByProvider;
@override final  bool isAgentBooking;
@override final  DateTime? checkedInAt;
@override final  DateTime? checkedOutAt;
@override final  String? cancelReason;
@override final  String? cancelledBy;
@override final  DateTime? cancelledAt;
@override final  DateTime createdAt;
@override final  DateTime updatedAt;

/// Create a copy of Reservation
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ReservationCopyWith<_Reservation> get copyWith => __$ReservationCopyWithImpl<_Reservation>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ReservationToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Reservation&&(identical(other.reservationId, reservationId) || other.reservationId == reservationId)&&(identical(other.driverId, driverId) || other.driverId == driverId)&&(identical(other.driverName, driverName) || other.driverName == driverName)&&(identical(other.driverPhone, driverPhone) || other.driverPhone == driverPhone)&&(identical(other.facilityId, facilityId) || other.facilityId == facilityId)&&(identical(other.facilityName, facilityName) || other.facilityName == facilityName)&&(identical(other.city, city) || other.city == city)&&(identical(other.province, province) || other.province == province)&&(identical(other.district, district) || other.district == district)&&(identical(other.providerId, providerId) || other.providerId == providerId)&&(identical(other.slotId, slotId) || other.slotId == slotId)&&(identical(other.slotNumber, slotNumber) || other.slotNumber == slotNumber)&&(identical(other.vehicleTypeId, vehicleTypeId) || other.vehicleTypeId == vehicleTypeId)&&(identical(other.vehicleTypeName, vehicleTypeName) || other.vehicleTypeName == vehicleTypeName)&&(identical(other.startTime, startTime) || other.startTime == startTime)&&(identical(other.endTime, endTime) || other.endTime == endTime)&&(identical(other.hours, hours) || other.hours == hours)&&(identical(other.hourlyRate, hourlyRate) || other.hourlyRate == hourlyRate)&&(identical(other.totalAmount, totalAmount) || other.totalAmount == totalAmount)&&(identical(other.commissionRate, commissionRate) || other.commissionRate == commissionRate)&&(identical(other.commissionAmount, commissionAmount) || other.commissionAmount == commissionAmount)&&(identical(other.providerAmount, providerAmount) || other.providerAmount == providerAmount)&&(identical(other.status, status) || other.status == status)&&(identical(other.isApprovedByProvider, isApprovedByProvider) || other.isApprovedByProvider == isApprovedByProvider)&&(identical(other.isAgentBooking, isAgentBooking) || other.isAgentBooking == isAgentBooking)&&(identical(other.checkedInAt, checkedInAt) || other.checkedInAt == checkedInAt)&&(identical(other.checkedOutAt, checkedOutAt) || other.checkedOutAt == checkedOutAt)&&(identical(other.cancelReason, cancelReason) || other.cancelReason == cancelReason)&&(identical(other.cancelledBy, cancelledBy) || other.cancelledBy == cancelledBy)&&(identical(other.cancelledAt, cancelledAt) || other.cancelledAt == cancelledAt)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,reservationId,driverId,driverName,driverPhone,facilityId,facilityName,city,province,district,providerId,slotId,slotNumber,vehicleTypeId,vehicleTypeName,startTime,endTime,hours,hourlyRate,totalAmount,commissionRate,commissionAmount,providerAmount,status,isApprovedByProvider,isAgentBooking,checkedInAt,checkedOutAt,cancelReason,cancelledBy,cancelledAt,createdAt,updatedAt]);

@override
String toString() {
  return 'Reservation(reservationId: $reservationId, driverId: $driverId, driverName: $driverName, driverPhone: $driverPhone, facilityId: $facilityId, facilityName: $facilityName, city: $city, province: $province, district: $district, providerId: $providerId, slotId: $slotId, slotNumber: $slotNumber, vehicleTypeId: $vehicleTypeId, vehicleTypeName: $vehicleTypeName, startTime: $startTime, endTime: $endTime, hours: $hours, hourlyRate: $hourlyRate, totalAmount: $totalAmount, commissionRate: $commissionRate, commissionAmount: $commissionAmount, providerAmount: $providerAmount, status: $status, isApprovedByProvider: $isApprovedByProvider, isAgentBooking: $isAgentBooking, checkedInAt: $checkedInAt, checkedOutAt: $checkedOutAt, cancelReason: $cancelReason, cancelledBy: $cancelledBy, cancelledAt: $cancelledAt, createdAt: $createdAt, updatedAt: $updatedAt)';
}


}

/// @nodoc
abstract mixin class _$ReservationCopyWith<$Res> implements $ReservationCopyWith<$Res> {
  factory _$ReservationCopyWith(_Reservation value, $Res Function(_Reservation) _then) = __$ReservationCopyWithImpl;
@override @useResult
$Res call({
 String reservationId, String driverId, String driverName, String driverPhone, String facilityId, String facilityName, String city, String province, String district, String providerId, String slotId, String slotNumber, String vehicleTypeId, String vehicleTypeName, DateTime startTime, DateTime endTime, int hours, double hourlyRate, double totalAmount, double commissionRate, double commissionAmount, double providerAmount, String status, bool isApprovedByProvider, bool isAgentBooking, DateTime? checkedInAt, DateTime? checkedOutAt, String? cancelReason, String? cancelledBy, DateTime? cancelledAt, DateTime createdAt, DateTime updatedAt
});




}
/// @nodoc
class __$ReservationCopyWithImpl<$Res>
    implements _$ReservationCopyWith<$Res> {
  __$ReservationCopyWithImpl(this._self, this._then);

  final _Reservation _self;
  final $Res Function(_Reservation) _then;

/// Create a copy of Reservation
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? reservationId = null,Object? driverId = null,Object? driverName = null,Object? driverPhone = null,Object? facilityId = null,Object? facilityName = null,Object? city = null,Object? province = null,Object? district = null,Object? providerId = null,Object? slotId = null,Object? slotNumber = null,Object? vehicleTypeId = null,Object? vehicleTypeName = null,Object? startTime = null,Object? endTime = null,Object? hours = null,Object? hourlyRate = null,Object? totalAmount = null,Object? commissionRate = null,Object? commissionAmount = null,Object? providerAmount = null,Object? status = null,Object? isApprovedByProvider = null,Object? isAgentBooking = null,Object? checkedInAt = freezed,Object? checkedOutAt = freezed,Object? cancelReason = freezed,Object? cancelledBy = freezed,Object? cancelledAt = freezed,Object? createdAt = null,Object? updatedAt = null,}) {
  return _then(_Reservation(
reservationId: null == reservationId ? _self.reservationId : reservationId // ignore: cast_nullable_to_non_nullable
as String,driverId: null == driverId ? _self.driverId : driverId // ignore: cast_nullable_to_non_nullable
as String,driverName: null == driverName ? _self.driverName : driverName // ignore: cast_nullable_to_non_nullable
as String,driverPhone: null == driverPhone ? _self.driverPhone : driverPhone // ignore: cast_nullable_to_non_nullable
as String,facilityId: null == facilityId ? _self.facilityId : facilityId // ignore: cast_nullable_to_non_nullable
as String,facilityName: null == facilityName ? _self.facilityName : facilityName // ignore: cast_nullable_to_non_nullable
as String,city: null == city ? _self.city : city // ignore: cast_nullable_to_non_nullable
as String,province: null == province ? _self.province : province // ignore: cast_nullable_to_non_nullable
as String,district: null == district ? _self.district : district // ignore: cast_nullable_to_non_nullable
as String,providerId: null == providerId ? _self.providerId : providerId // ignore: cast_nullable_to_non_nullable
as String,slotId: null == slotId ? _self.slotId : slotId // ignore: cast_nullable_to_non_nullable
as String,slotNumber: null == slotNumber ? _self.slotNumber : slotNumber // ignore: cast_nullable_to_non_nullable
as String,vehicleTypeId: null == vehicleTypeId ? _self.vehicleTypeId : vehicleTypeId // ignore: cast_nullable_to_non_nullable
as String,vehicleTypeName: null == vehicleTypeName ? _self.vehicleTypeName : vehicleTypeName // ignore: cast_nullable_to_non_nullable
as String,startTime: null == startTime ? _self.startTime : startTime // ignore: cast_nullable_to_non_nullable
as DateTime,endTime: null == endTime ? _self.endTime : endTime // ignore: cast_nullable_to_non_nullable
as DateTime,hours: null == hours ? _self.hours : hours // ignore: cast_nullable_to_non_nullable
as int,hourlyRate: null == hourlyRate ? _self.hourlyRate : hourlyRate // ignore: cast_nullable_to_non_nullable
as double,totalAmount: null == totalAmount ? _self.totalAmount : totalAmount // ignore: cast_nullable_to_non_nullable
as double,commissionRate: null == commissionRate ? _self.commissionRate : commissionRate // ignore: cast_nullable_to_non_nullable
as double,commissionAmount: null == commissionAmount ? _self.commissionAmount : commissionAmount // ignore: cast_nullable_to_non_nullable
as double,providerAmount: null == providerAmount ? _self.providerAmount : providerAmount // ignore: cast_nullable_to_non_nullable
as double,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,isApprovedByProvider: null == isApprovedByProvider ? _self.isApprovedByProvider : isApprovedByProvider // ignore: cast_nullable_to_non_nullable
as bool,isAgentBooking: null == isAgentBooking ? _self.isAgentBooking : isAgentBooking // ignore: cast_nullable_to_non_nullable
as bool,checkedInAt: freezed == checkedInAt ? _self.checkedInAt : checkedInAt // ignore: cast_nullable_to_non_nullable
as DateTime?,checkedOutAt: freezed == checkedOutAt ? _self.checkedOutAt : checkedOutAt // ignore: cast_nullable_to_non_nullable
as DateTime?,cancelReason: freezed == cancelReason ? _self.cancelReason : cancelReason // ignore: cast_nullable_to_non_nullable
as String?,cancelledBy: freezed == cancelledBy ? _self.cancelledBy : cancelledBy // ignore: cast_nullable_to_non_nullable
as String?,cancelledAt: freezed == cancelledAt ? _self.cancelledAt : cancelledAt // ignore: cast_nullable_to_non_nullable
as DateTime?,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,updatedAt: null == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}


}

// dart format on
