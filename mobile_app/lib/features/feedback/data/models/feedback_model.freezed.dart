// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'feedback_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$FeedbackReply {

 String get id; String get repliedByUserId; String get role; String get message; DateTime get createdAt;
/// Create a copy of FeedbackReply
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$FeedbackReplyCopyWith<FeedbackReply> get copyWith => _$FeedbackReplyCopyWithImpl<FeedbackReply>(this as FeedbackReply, _$identity);

  /// Serializes this FeedbackReply to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is FeedbackReply&&(identical(other.id, id) || other.id == id)&&(identical(other.repliedByUserId, repliedByUserId) || other.repliedByUserId == repliedByUserId)&&(identical(other.role, role) || other.role == role)&&(identical(other.message, message) || other.message == message)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,repliedByUserId,role,message,createdAt);

@override
String toString() {
  return 'FeedbackReply(id: $id, repliedByUserId: $repliedByUserId, role: $role, message: $message, createdAt: $createdAt)';
}


}

/// @nodoc
abstract mixin class $FeedbackReplyCopyWith<$Res>  {
  factory $FeedbackReplyCopyWith(FeedbackReply value, $Res Function(FeedbackReply) _then) = _$FeedbackReplyCopyWithImpl;
@useResult
$Res call({
 String id, String repliedByUserId, String role, String message, DateTime createdAt
});




}
/// @nodoc
class _$FeedbackReplyCopyWithImpl<$Res>
    implements $FeedbackReplyCopyWith<$Res> {
  _$FeedbackReplyCopyWithImpl(this._self, this._then);

  final FeedbackReply _self;
  final $Res Function(FeedbackReply) _then;

/// Create a copy of FeedbackReply
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? repliedByUserId = null,Object? role = null,Object? message = null,Object? createdAt = null,}) {
  return _then(FeedbackReply(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,repliedByUserId: null == repliedByUserId ? _self.repliedByUserId : repliedByUserId // ignore: cast_nullable_to_non_nullable
as String,role: null == role ? _self.role : role // ignore: cast_nullable_to_non_nullable
as String,message: null == message ? _self.message : message // ignore: cast_nullable_to_non_nullable
as String,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}

}


/// Adds pattern-matching-related methods to [FeedbackReply].
extension FeedbackReplyPatterns on FeedbackReply {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _FeedbackReply value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _FeedbackReply() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _FeedbackReply value)  $default,){
final _that = this;
switch (_that) {
case _FeedbackReply():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _FeedbackReply value)?  $default,){
final _that = this;
switch (_that) {
case _FeedbackReply() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String repliedByUserId,  String role,  String message,  DateTime createdAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _FeedbackReply() when $default != null:
return $default(_that.id,_that.repliedByUserId,_that.role,_that.message,_that.createdAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String repliedByUserId,  String role,  String message,  DateTime createdAt)  $default,) {final _that = this;
switch (_that) {
case _FeedbackReply():
return $default(_that.id,_that.repliedByUserId,_that.role,_that.message,_that.createdAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String repliedByUserId,  String role,  String message,  DateTime createdAt)?  $default,) {final _that = this;
switch (_that) {
case _FeedbackReply() when $default != null:
return $default(_that.id,_that.repliedByUserId,_that.role,_that.message,_that.createdAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _FeedbackReply implements FeedbackReply {
  const _FeedbackReply({required this.id, required this.repliedByUserId, required this.role, required this.message, required this.createdAt});
  factory _FeedbackReply.fromJson(Map<String, dynamic> json) => _$FeedbackReplyFromJson(json);

@override final  String id;
@override final  String repliedByUserId;
@override final  String role;
@override final  String message;
@override final  DateTime createdAt;

/// Create a copy of FeedbackReply
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$FeedbackReplyCopyWith<_FeedbackReply> get copyWith => __$FeedbackReplyCopyWithImpl<_FeedbackReply>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$FeedbackReplyToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _FeedbackReply&&(identical(other.id, id) || other.id == id)&&(identical(other.repliedByUserId, repliedByUserId) || other.repliedByUserId == repliedByUserId)&&(identical(other.role, role) || other.role == role)&&(identical(other.message, message) || other.message == message)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,repliedByUserId,role,message,createdAt);

@override
String toString() {
  return 'FeedbackReply(id: $id, repliedByUserId: $repliedByUserId, role: $role, message: $message, createdAt: $createdAt)';
}


}

/// @nodoc
abstract mixin class _$FeedbackReplyCopyWith<$Res> implements $FeedbackReplyCopyWith<$Res> {
  factory _$FeedbackReplyCopyWith(_FeedbackReply value, $Res Function(_FeedbackReply) _then) = __$FeedbackReplyCopyWithImpl;
@override @useResult
$Res call({
 String id, String repliedByUserId, String role, String message, DateTime createdAt
});




}
/// @nodoc
class __$FeedbackReplyCopyWithImpl<$Res>
    implements _$FeedbackReplyCopyWith<$Res> {
  __$FeedbackReplyCopyWithImpl(this._self, this._then);

  final _FeedbackReply _self;
  final $Res Function(_FeedbackReply) _then;

/// Create a copy of FeedbackReply
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? repliedByUserId = null,Object? role = null,Object? message = null,Object? createdAt = null,}) {
  return _then(_FeedbackReply(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,repliedByUserId: null == repliedByUserId ? _self.repliedByUserId : repliedByUserId // ignore: cast_nullable_to_non_nullable
as String,role: null == role ? _self.role : role // ignore: cast_nullable_to_non_nullable
as String,message: null == message ? _self.message : message // ignore: cast_nullable_to_non_nullable
as String,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}


}


/// @nodoc
mixin _$FeedbackModel {

 String get id; String get userName; FeedbackType get type; String? get parkingId; String? get reservationId; int get rating; String? get comment; FeedbackStatus get status; List<FeedbackKeywordType> get keywords; List<FeedbackReply> get replies; DateTime get createdAt; DateTime get updatedAt;
/// Create a copy of FeedbackModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$FeedbackModelCopyWith<FeedbackModel> get copyWith => _$FeedbackModelCopyWithImpl<FeedbackModel>(this as FeedbackModel, _$identity);

  /// Serializes this FeedbackModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is FeedbackModel&&(identical(other.id, id) || other.id == id)&&(identical(other.userName, userName) || other.userName == userName)&&(identical(other.type, type) || other.type == type)&&(identical(other.parkingId, parkingId) || other.parkingId == parkingId)&&(identical(other.reservationId, reservationId) || other.reservationId == reservationId)&&(identical(other.rating, rating) || other.rating == rating)&&(identical(other.comment, comment) || other.comment == comment)&&(identical(other.status, status) || other.status == status)&&const DeepCollectionEquality().equals(other.keywords, keywords)&&const DeepCollectionEquality().equals(other.replies, replies)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,userName,type,parkingId,reservationId,rating,comment,status,const DeepCollectionEquality().hash(keywords),const DeepCollectionEquality().hash(replies),createdAt,updatedAt);

@override
String toString() {
  return 'FeedbackModel(id: $id, userName: $userName, type: $type, parkingId: $parkingId, reservationId: $reservationId, rating: $rating, comment: $comment, status: $status, keywords: $keywords, replies: $replies, createdAt: $createdAt, updatedAt: $updatedAt)';
}


}

/// @nodoc
abstract mixin class $FeedbackModelCopyWith<$Res>  {
  factory $FeedbackModelCopyWith(FeedbackModel value, $Res Function(FeedbackModel) _then) = _$FeedbackModelCopyWithImpl;
@useResult
$Res call({
 String id, String userName, FeedbackType type, String? parkingId, String? reservationId, int rating, String? comment, FeedbackStatus status, List<FeedbackKeywordType> keywords, List<FeedbackReply> replies, DateTime createdAt, DateTime updatedAt
});




}
/// @nodoc
class _$FeedbackModelCopyWithImpl<$Res>
    implements $FeedbackModelCopyWith<$Res> {
  _$FeedbackModelCopyWithImpl(this._self, this._then);

  final FeedbackModel _self;
  final $Res Function(FeedbackModel) _then;

/// Create a copy of FeedbackModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? userName = null,Object? type = null,Object? parkingId = freezed,Object? reservationId = freezed,Object? rating = null,Object? comment = freezed,Object? status = null,Object? keywords = null,Object? replies = null,Object? createdAt = null,Object? updatedAt = null,}) {
  return _then(FeedbackModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,userName: null == userName ? _self.userName : userName // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as FeedbackType,parkingId: freezed == parkingId ? _self.parkingId : parkingId // ignore: cast_nullable_to_non_nullable
as String?,reservationId: freezed == reservationId ? _self.reservationId : reservationId // ignore: cast_nullable_to_non_nullable
as String?,rating: null == rating ? _self.rating : rating // ignore: cast_nullable_to_non_nullable
as int,comment: freezed == comment ? _self.comment : comment // ignore: cast_nullable_to_non_nullable
as String?,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as FeedbackStatus,keywords: null == keywords ? _self.keywords : keywords // ignore: cast_nullable_to_non_nullable
as List<FeedbackKeywordType>,replies: null == replies ? _self.replies : replies // ignore: cast_nullable_to_non_nullable
as List<FeedbackReply>,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,updatedAt: null == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}

}


/// Adds pattern-matching-related methods to [FeedbackModel].
extension FeedbackModelPatterns on FeedbackModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _FeedbackModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _FeedbackModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _FeedbackModel value)  $default,){
final _that = this;
switch (_that) {
case _FeedbackModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _FeedbackModel value)?  $default,){
final _that = this;
switch (_that) {
case _FeedbackModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String userName,  FeedbackType type,  String? parkingId,  String? reservationId,  int rating,  String? comment,  FeedbackStatus status,  List<FeedbackKeywordType> keywords,  List<FeedbackReply> replies,  DateTime createdAt,  DateTime updatedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _FeedbackModel() when $default != null:
return $default(_that.id,_that.userName,_that.type,_that.parkingId,_that.reservationId,_that.rating,_that.comment,_that.status,_that.keywords,_that.replies,_that.createdAt,_that.updatedAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String userName,  FeedbackType type,  String? parkingId,  String? reservationId,  int rating,  String? comment,  FeedbackStatus status,  List<FeedbackKeywordType> keywords,  List<FeedbackReply> replies,  DateTime createdAt,  DateTime updatedAt)  $default,) {final _that = this;
switch (_that) {
case _FeedbackModel():
return $default(_that.id,_that.userName,_that.type,_that.parkingId,_that.reservationId,_that.rating,_that.comment,_that.status,_that.keywords,_that.replies,_that.createdAt,_that.updatedAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String userName,  FeedbackType type,  String? parkingId,  String? reservationId,  int rating,  String? comment,  FeedbackStatus status,  List<FeedbackKeywordType> keywords,  List<FeedbackReply> replies,  DateTime createdAt,  DateTime updatedAt)?  $default,) {final _that = this;
switch (_that) {
case _FeedbackModel() when $default != null:
return $default(_that.id,_that.userName,_that.type,_that.parkingId,_that.reservationId,_that.rating,_that.comment,_that.status,_that.keywords,_that.replies,_that.createdAt,_that.updatedAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _FeedbackModel implements FeedbackModel {
  const _FeedbackModel({required this.id, required this.userName, required this.type, this.parkingId, this.reservationId, required this.rating, this.comment, required this.status,  List<FeedbackKeywordType> keywords = const [],  List<FeedbackReply> replies = const [], required this.createdAt, required this.updatedAt}): _keywords = keywords,_replies = replies;
  factory _FeedbackModel.fromJson(Map<String, dynamic> json) => _$FeedbackModelFromJson(json);

@override final  String id;
@override final  String userName;
@override final  FeedbackType type;
@override final  String? parkingId;
@override final  String? reservationId;
@override final  int rating;
@override final  String? comment;
@override final  FeedbackStatus status;
 final  List<FeedbackKeywordType> _keywords;
@override@JsonKey() List<FeedbackKeywordType> get keywords {
  if (_keywords is EqualUnmodifiableListView) return _keywords;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_keywords);
}

 final  List<FeedbackReply> _replies;
@override@JsonKey() List<FeedbackReply> get replies {
  if (_replies is EqualUnmodifiableListView) return _replies;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_replies);
}

@override final  DateTime createdAt;
@override final  DateTime updatedAt;

/// Create a copy of FeedbackModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$FeedbackModelCopyWith<_FeedbackModel> get copyWith => __$FeedbackModelCopyWithImpl<_FeedbackModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$FeedbackModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _FeedbackModel&&(identical(other.id, id) || other.id == id)&&(identical(other.userName, userName) || other.userName == userName)&&(identical(other.type, type) || other.type == type)&&(identical(other.parkingId, parkingId) || other.parkingId == parkingId)&&(identical(other.reservationId, reservationId) || other.reservationId == reservationId)&&(identical(other.rating, rating) || other.rating == rating)&&(identical(other.comment, comment) || other.comment == comment)&&(identical(other.status, status) || other.status == status)&&const DeepCollectionEquality().equals(other._keywords, _keywords)&&const DeepCollectionEquality().equals(other._replies, _replies)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,userName,type,parkingId,reservationId,rating,comment,status,const DeepCollectionEquality().hash(_keywords),const DeepCollectionEquality().hash(_replies),createdAt,updatedAt);

@override
String toString() {
  return 'FeedbackModel(id: $id, userName: $userName, type: $type, parkingId: $parkingId, reservationId: $reservationId, rating: $rating, comment: $comment, status: $status, keywords: $keywords, replies: $replies, createdAt: $createdAt, updatedAt: $updatedAt)';
}


}

/// @nodoc
abstract mixin class _$FeedbackModelCopyWith<$Res> implements $FeedbackModelCopyWith<$Res> {
  factory _$FeedbackModelCopyWith(_FeedbackModel value, $Res Function(_FeedbackModel) _then) = __$FeedbackModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String userName, FeedbackType type, String? parkingId, String? reservationId, int rating, String? comment, FeedbackStatus status, List<FeedbackKeywordType> keywords, List<FeedbackReply> replies, DateTime createdAt, DateTime updatedAt
});




}
/// @nodoc
class __$FeedbackModelCopyWithImpl<$Res>
    implements _$FeedbackModelCopyWith<$Res> {
  __$FeedbackModelCopyWithImpl(this._self, this._then);

  final _FeedbackModel _self;
  final $Res Function(_FeedbackModel) _then;

/// Create a copy of FeedbackModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? userName = null,Object? type = null,Object? parkingId = freezed,Object? reservationId = freezed,Object? rating = null,Object? comment = freezed,Object? status = null,Object? keywords = null,Object? replies = null,Object? createdAt = null,Object? updatedAt = null,}) {
  return _then(_FeedbackModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,userName: null == userName ? _self.userName : userName // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as FeedbackType,parkingId: freezed == parkingId ? _self.parkingId : parkingId // ignore: cast_nullable_to_non_nullable
as String?,reservationId: freezed == reservationId ? _self.reservationId : reservationId // ignore: cast_nullable_to_non_nullable
as String?,rating: null == rating ? _self.rating : rating // ignore: cast_nullable_to_non_nullable
as int,comment: freezed == comment ? _self.comment : comment // ignore: cast_nullable_to_non_nullable
as String?,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as FeedbackStatus,keywords: null == keywords ? _self._keywords : keywords // ignore: cast_nullable_to_non_nullable
as List<FeedbackKeywordType>,replies: null == replies ? _self._replies : replies // ignore: cast_nullable_to_non_nullable
as List<FeedbackReply>,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,updatedAt: null == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}


}

// dart format on
