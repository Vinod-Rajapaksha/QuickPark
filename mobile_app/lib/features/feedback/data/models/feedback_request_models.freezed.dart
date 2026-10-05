// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'feedback_request_models.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$CreateSystemFeedbackRequest {

 FeedbackType get type; int get rating; String get comment;
/// Create a copy of CreateSystemFeedbackRequest
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$CreateSystemFeedbackRequestCopyWith<CreateSystemFeedbackRequest> get copyWith => _$CreateSystemFeedbackRequestCopyWithImpl<CreateSystemFeedbackRequest>(this as CreateSystemFeedbackRequest, _$identity);

  /// Serializes this CreateSystemFeedbackRequest to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is CreateSystemFeedbackRequest&&(identical(other.type, type) || other.type == type)&&(identical(other.rating, rating) || other.rating == rating)&&(identical(other.comment, comment) || other.comment == comment));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,type,rating,comment);

@override
String toString() {
  return 'CreateSystemFeedbackRequest(type: $type, rating: $rating, comment: $comment)';
}


}

/// @nodoc
abstract mixin class $CreateSystemFeedbackRequestCopyWith<$Res>  {
  factory $CreateSystemFeedbackRequestCopyWith(CreateSystemFeedbackRequest value, $Res Function(CreateSystemFeedbackRequest) _then) = _$CreateSystemFeedbackRequestCopyWithImpl;
@useResult
$Res call({
 FeedbackType type, int rating, String comment
});




}
/// @nodoc
class _$CreateSystemFeedbackRequestCopyWithImpl<$Res>
    implements $CreateSystemFeedbackRequestCopyWith<$Res> {
  _$CreateSystemFeedbackRequestCopyWithImpl(this._self, this._then);

  final CreateSystemFeedbackRequest _self;
  final $Res Function(CreateSystemFeedbackRequest) _then;

/// Create a copy of CreateSystemFeedbackRequest
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? type = null,Object? rating = null,Object? comment = null,}) {
  return _then(CreateSystemFeedbackRequest(
type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as FeedbackType,rating: null == rating ? _self.rating : rating // ignore: cast_nullable_to_non_nullable
as int,comment: null == comment ? _self.comment : comment // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [CreateSystemFeedbackRequest].
extension CreateSystemFeedbackRequestPatterns on CreateSystemFeedbackRequest {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _CreateSystemFeedbackRequest value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _CreateSystemFeedbackRequest() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _CreateSystemFeedbackRequest value)  $default,){
final _that = this;
switch (_that) {
case _CreateSystemFeedbackRequest():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _CreateSystemFeedbackRequest value)?  $default,){
final _that = this;
switch (_that) {
case _CreateSystemFeedbackRequest() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( FeedbackType type,  int rating,  String comment)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _CreateSystemFeedbackRequest() when $default != null:
return $default(_that.type,_that.rating,_that.comment);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( FeedbackType type,  int rating,  String comment)  $default,) {final _that = this;
switch (_that) {
case _CreateSystemFeedbackRequest():
return $default(_that.type,_that.rating,_that.comment);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( FeedbackType type,  int rating,  String comment)?  $default,) {final _that = this;
switch (_that) {
case _CreateSystemFeedbackRequest() when $default != null:
return $default(_that.type,_that.rating,_that.comment);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _CreateSystemFeedbackRequest implements CreateSystemFeedbackRequest {
  const _CreateSystemFeedbackRequest({this.type = FeedbackType.system, required this.rating, required this.comment});
  factory _CreateSystemFeedbackRequest.fromJson(Map<String, dynamic> json) => _$CreateSystemFeedbackRequestFromJson(json);

@override@JsonKey() final  FeedbackType type;
@override final  int rating;
@override final  String comment;

/// Create a copy of CreateSystemFeedbackRequest
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$CreateSystemFeedbackRequestCopyWith<_CreateSystemFeedbackRequest> get copyWith => __$CreateSystemFeedbackRequestCopyWithImpl<_CreateSystemFeedbackRequest>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$CreateSystemFeedbackRequestToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _CreateSystemFeedbackRequest&&(identical(other.type, type) || other.type == type)&&(identical(other.rating, rating) || other.rating == rating)&&(identical(other.comment, comment) || other.comment == comment));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,type,rating,comment);

@override
String toString() {
  return 'CreateSystemFeedbackRequest(type: $type, rating: $rating, comment: $comment)';
}


}

/// @nodoc
abstract mixin class _$CreateSystemFeedbackRequestCopyWith<$Res> implements $CreateSystemFeedbackRequestCopyWith<$Res> {
  factory _$CreateSystemFeedbackRequestCopyWith(_CreateSystemFeedbackRequest value, $Res Function(_CreateSystemFeedbackRequest) _then) = __$CreateSystemFeedbackRequestCopyWithImpl;
@override @useResult
$Res call({
 FeedbackType type, int rating, String comment
});




}
/// @nodoc
class __$CreateSystemFeedbackRequestCopyWithImpl<$Res>
    implements _$CreateSystemFeedbackRequestCopyWith<$Res> {
  __$CreateSystemFeedbackRequestCopyWithImpl(this._self, this._then);

  final _CreateSystemFeedbackRequest _self;
  final $Res Function(_CreateSystemFeedbackRequest) _then;

/// Create a copy of CreateSystemFeedbackRequest
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? type = null,Object? rating = null,Object? comment = null,}) {
  return _then(_CreateSystemFeedbackRequest(
type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as FeedbackType,rating: null == rating ? _self.rating : rating // ignore: cast_nullable_to_non_nullable
as int,comment: null == comment ? _self.comment : comment // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}


/// @nodoc
mixin _$CreateParkingFeedbackRequest {

 FeedbackType get type; String get parkingId; String get reservationId; int get rating; String get comment; List<FeedbackKeywordType> get keywords;
/// Create a copy of CreateParkingFeedbackRequest
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$CreateParkingFeedbackRequestCopyWith<CreateParkingFeedbackRequest> get copyWith => _$CreateParkingFeedbackRequestCopyWithImpl<CreateParkingFeedbackRequest>(this as CreateParkingFeedbackRequest, _$identity);

  /// Serializes this CreateParkingFeedbackRequest to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is CreateParkingFeedbackRequest&&(identical(other.type, type) || other.type == type)&&(identical(other.parkingId, parkingId) || other.parkingId == parkingId)&&(identical(other.reservationId, reservationId) || other.reservationId == reservationId)&&(identical(other.rating, rating) || other.rating == rating)&&(identical(other.comment, comment) || other.comment == comment)&&const DeepCollectionEquality().equals(other.keywords, keywords));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,type,parkingId,reservationId,rating,comment,const DeepCollectionEquality().hash(keywords));

@override
String toString() {
  return 'CreateParkingFeedbackRequest(type: $type, parkingId: $parkingId, reservationId: $reservationId, rating: $rating, comment: $comment, keywords: $keywords)';
}


}

/// @nodoc
abstract mixin class $CreateParkingFeedbackRequestCopyWith<$Res>  {
  factory $CreateParkingFeedbackRequestCopyWith(CreateParkingFeedbackRequest value, $Res Function(CreateParkingFeedbackRequest) _then) = _$CreateParkingFeedbackRequestCopyWithImpl;
@useResult
$Res call({
 FeedbackType type, String parkingId, String reservationId, int rating, String comment, List<FeedbackKeywordType> keywords
});




}
/// @nodoc
class _$CreateParkingFeedbackRequestCopyWithImpl<$Res>
    implements $CreateParkingFeedbackRequestCopyWith<$Res> {
  _$CreateParkingFeedbackRequestCopyWithImpl(this._self, this._then);

  final CreateParkingFeedbackRequest _self;
  final $Res Function(CreateParkingFeedbackRequest) _then;

/// Create a copy of CreateParkingFeedbackRequest
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? type = null,Object? parkingId = null,Object? reservationId = null,Object? rating = null,Object? comment = null,Object? keywords = null,}) {
  return _then(CreateParkingFeedbackRequest(
type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as FeedbackType,parkingId: null == parkingId ? _self.parkingId : parkingId // ignore: cast_nullable_to_non_nullable
as String,reservationId: null == reservationId ? _self.reservationId : reservationId // ignore: cast_nullable_to_non_nullable
as String,rating: null == rating ? _self.rating : rating // ignore: cast_nullable_to_non_nullable
as int,comment: null == comment ? _self.comment : comment // ignore: cast_nullable_to_non_nullable
as String,keywords: null == keywords ? _self.keywords : keywords // ignore: cast_nullable_to_non_nullable
as List<FeedbackKeywordType>,
  ));
}

}


/// Adds pattern-matching-related methods to [CreateParkingFeedbackRequest].
extension CreateParkingFeedbackRequestPatterns on CreateParkingFeedbackRequest {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _CreateParkingFeedbackRequest value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _CreateParkingFeedbackRequest() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _CreateParkingFeedbackRequest value)  $default,){
final _that = this;
switch (_that) {
case _CreateParkingFeedbackRequest():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _CreateParkingFeedbackRequest value)?  $default,){
final _that = this;
switch (_that) {
case _CreateParkingFeedbackRequest() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( FeedbackType type,  String parkingId,  String reservationId,  int rating,  String comment,  List<FeedbackKeywordType> keywords)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _CreateParkingFeedbackRequest() when $default != null:
return $default(_that.type,_that.parkingId,_that.reservationId,_that.rating,_that.comment,_that.keywords);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( FeedbackType type,  String parkingId,  String reservationId,  int rating,  String comment,  List<FeedbackKeywordType> keywords)  $default,) {final _that = this;
switch (_that) {
case _CreateParkingFeedbackRequest():
return $default(_that.type,_that.parkingId,_that.reservationId,_that.rating,_that.comment,_that.keywords);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( FeedbackType type,  String parkingId,  String reservationId,  int rating,  String comment,  List<FeedbackKeywordType> keywords)?  $default,) {final _that = this;
switch (_that) {
case _CreateParkingFeedbackRequest() when $default != null:
return $default(_that.type,_that.parkingId,_that.reservationId,_that.rating,_that.comment,_that.keywords);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _CreateParkingFeedbackRequest implements CreateParkingFeedbackRequest {
  const _CreateParkingFeedbackRequest({this.type = FeedbackType.parking, required this.parkingId, required this.reservationId, required this.rating, required this.comment, required  List<FeedbackKeywordType> keywords}): _keywords = keywords;
  factory _CreateParkingFeedbackRequest.fromJson(Map<String, dynamic> json) => _$CreateParkingFeedbackRequestFromJson(json);

@override@JsonKey() final  FeedbackType type;
@override final  String parkingId;
@override final  String reservationId;
@override final  int rating;
@override final  String comment;
 final  List<FeedbackKeywordType> _keywords;
@override List<FeedbackKeywordType> get keywords {
  if (_keywords is EqualUnmodifiableListView) return _keywords;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_keywords);
}


/// Create a copy of CreateParkingFeedbackRequest
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$CreateParkingFeedbackRequestCopyWith<_CreateParkingFeedbackRequest> get copyWith => __$CreateParkingFeedbackRequestCopyWithImpl<_CreateParkingFeedbackRequest>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$CreateParkingFeedbackRequestToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _CreateParkingFeedbackRequest&&(identical(other.type, type) || other.type == type)&&(identical(other.parkingId, parkingId) || other.parkingId == parkingId)&&(identical(other.reservationId, reservationId) || other.reservationId == reservationId)&&(identical(other.rating, rating) || other.rating == rating)&&(identical(other.comment, comment) || other.comment == comment)&&const DeepCollectionEquality().equals(other._keywords, _keywords));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,type,parkingId,reservationId,rating,comment,const DeepCollectionEquality().hash(_keywords));

@override
String toString() {
  return 'CreateParkingFeedbackRequest(type: $type, parkingId: $parkingId, reservationId: $reservationId, rating: $rating, comment: $comment, keywords: $keywords)';
}


}

/// @nodoc
abstract mixin class _$CreateParkingFeedbackRequestCopyWith<$Res> implements $CreateParkingFeedbackRequestCopyWith<$Res> {
  factory _$CreateParkingFeedbackRequestCopyWith(_CreateParkingFeedbackRequest value, $Res Function(_CreateParkingFeedbackRequest) _then) = __$CreateParkingFeedbackRequestCopyWithImpl;
@override @useResult
$Res call({
 FeedbackType type, String parkingId, String reservationId, int rating, String comment, List<FeedbackKeywordType> keywords
});




}
/// @nodoc
class __$CreateParkingFeedbackRequestCopyWithImpl<$Res>
    implements _$CreateParkingFeedbackRequestCopyWith<$Res> {
  __$CreateParkingFeedbackRequestCopyWithImpl(this._self, this._then);

  final _CreateParkingFeedbackRequest _self;
  final $Res Function(_CreateParkingFeedbackRequest) _then;

/// Create a copy of CreateParkingFeedbackRequest
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? type = null,Object? parkingId = null,Object? reservationId = null,Object? rating = null,Object? comment = null,Object? keywords = null,}) {
  return _then(_CreateParkingFeedbackRequest(
type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as FeedbackType,parkingId: null == parkingId ? _self.parkingId : parkingId // ignore: cast_nullable_to_non_nullable
as String,reservationId: null == reservationId ? _self.reservationId : reservationId // ignore: cast_nullable_to_non_nullable
as String,rating: null == rating ? _self.rating : rating // ignore: cast_nullable_to_non_nullable
as int,comment: null == comment ? _self.comment : comment // ignore: cast_nullable_to_non_nullable
as String,keywords: null == keywords ? _self._keywords : keywords // ignore: cast_nullable_to_non_nullable
as List<FeedbackKeywordType>,
  ));
}


}


/// @nodoc
mixin _$UpdateFeedbackRequest {

 int get rating; String get comment; List<FeedbackKeywordType>? get keywords;
/// Create a copy of UpdateFeedbackRequest
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$UpdateFeedbackRequestCopyWith<UpdateFeedbackRequest> get copyWith => _$UpdateFeedbackRequestCopyWithImpl<UpdateFeedbackRequest>(this as UpdateFeedbackRequest, _$identity);

  /// Serializes this UpdateFeedbackRequest to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is UpdateFeedbackRequest&&(identical(other.rating, rating) || other.rating == rating)&&(identical(other.comment, comment) || other.comment == comment)&&const DeepCollectionEquality().equals(other.keywords, keywords));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,rating,comment,const DeepCollectionEquality().hash(keywords));

@override
String toString() {
  return 'UpdateFeedbackRequest(rating: $rating, comment: $comment, keywords: $keywords)';
}


}

/// @nodoc
abstract mixin class $UpdateFeedbackRequestCopyWith<$Res>  {
  factory $UpdateFeedbackRequestCopyWith(UpdateFeedbackRequest value, $Res Function(UpdateFeedbackRequest) _then) = _$UpdateFeedbackRequestCopyWithImpl;
@useResult
$Res call({
 int rating, String comment, List<FeedbackKeywordType>? keywords
});




}
/// @nodoc
class _$UpdateFeedbackRequestCopyWithImpl<$Res>
    implements $UpdateFeedbackRequestCopyWith<$Res> {
  _$UpdateFeedbackRequestCopyWithImpl(this._self, this._then);

  final UpdateFeedbackRequest _self;
  final $Res Function(UpdateFeedbackRequest) _then;

/// Create a copy of UpdateFeedbackRequest
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? rating = null,Object? comment = null,Object? keywords = freezed,}) {
  return _then(UpdateFeedbackRequest(
rating: null == rating ? _self.rating : rating // ignore: cast_nullable_to_non_nullable
as int,comment: null == comment ? _self.comment : comment // ignore: cast_nullable_to_non_nullable
as String,keywords: freezed == keywords ? _self.keywords : keywords // ignore: cast_nullable_to_non_nullable
as List<FeedbackKeywordType>?,
  ));
}

}


/// Adds pattern-matching-related methods to [UpdateFeedbackRequest].
extension UpdateFeedbackRequestPatterns on UpdateFeedbackRequest {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _UpdateFeedbackRequest value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _UpdateFeedbackRequest() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _UpdateFeedbackRequest value)  $default,){
final _that = this;
switch (_that) {
case _UpdateFeedbackRequest():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _UpdateFeedbackRequest value)?  $default,){
final _that = this;
switch (_that) {
case _UpdateFeedbackRequest() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int rating,  String comment,  List<FeedbackKeywordType>? keywords)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _UpdateFeedbackRequest() when $default != null:
return $default(_that.rating,_that.comment,_that.keywords);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int rating,  String comment,  List<FeedbackKeywordType>? keywords)  $default,) {final _that = this;
switch (_that) {
case _UpdateFeedbackRequest():
return $default(_that.rating,_that.comment,_that.keywords);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int rating,  String comment,  List<FeedbackKeywordType>? keywords)?  $default,) {final _that = this;
switch (_that) {
case _UpdateFeedbackRequest() when $default != null:
return $default(_that.rating,_that.comment,_that.keywords);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _UpdateFeedbackRequest implements UpdateFeedbackRequest {
  const _UpdateFeedbackRequest({required this.rating, required this.comment,  List<FeedbackKeywordType>? keywords}): _keywords = keywords;
  factory _UpdateFeedbackRequest.fromJson(Map<String, dynamic> json) => _$UpdateFeedbackRequestFromJson(json);

@override final  int rating;
@override final  String comment;
 final  List<FeedbackKeywordType>? _keywords;
@override List<FeedbackKeywordType>? get keywords {
  final value = _keywords;
  if (value == null) return null;
  if (_keywords is EqualUnmodifiableListView) return _keywords;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(value);
}


/// Create a copy of UpdateFeedbackRequest
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$UpdateFeedbackRequestCopyWith<_UpdateFeedbackRequest> get copyWith => __$UpdateFeedbackRequestCopyWithImpl<_UpdateFeedbackRequest>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$UpdateFeedbackRequestToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _UpdateFeedbackRequest&&(identical(other.rating, rating) || other.rating == rating)&&(identical(other.comment, comment) || other.comment == comment)&&const DeepCollectionEquality().equals(other._keywords, _keywords));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,rating,comment,const DeepCollectionEquality().hash(_keywords));

@override
String toString() {
  return 'UpdateFeedbackRequest(rating: $rating, comment: $comment, keywords: $keywords)';
}


}

/// @nodoc
abstract mixin class _$UpdateFeedbackRequestCopyWith<$Res> implements $UpdateFeedbackRequestCopyWith<$Res> {
  factory _$UpdateFeedbackRequestCopyWith(_UpdateFeedbackRequest value, $Res Function(_UpdateFeedbackRequest) _then) = __$UpdateFeedbackRequestCopyWithImpl;
@override @useResult
$Res call({
 int rating, String comment, List<FeedbackKeywordType>? keywords
});




}
/// @nodoc
class __$UpdateFeedbackRequestCopyWithImpl<$Res>
    implements _$UpdateFeedbackRequestCopyWith<$Res> {
  __$UpdateFeedbackRequestCopyWithImpl(this._self, this._then);

  final _UpdateFeedbackRequest _self;
  final $Res Function(_UpdateFeedbackRequest) _then;

/// Create a copy of UpdateFeedbackRequest
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? rating = null,Object? comment = null,Object? keywords = freezed,}) {
  return _then(_UpdateFeedbackRequest(
rating: null == rating ? _self.rating : rating // ignore: cast_nullable_to_non_nullable
as int,comment: null == comment ? _self.comment : comment // ignore: cast_nullable_to_non_nullable
as String,keywords: freezed == keywords ? _self._keywords : keywords // ignore: cast_nullable_to_non_nullable
as List<FeedbackKeywordType>?,
  ));
}


}

// dart format on
