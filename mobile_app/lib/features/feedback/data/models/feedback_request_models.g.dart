// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'feedback_request_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_CreateSystemFeedbackRequest _$CreateSystemFeedbackRequestFromJson(
  Map<String, dynamic> json,
) => _CreateSystemFeedbackRequest(
  type:
      $enumDecodeNullable(_$FeedbackTypeEnumMap, json['type']) ??
      FeedbackType.system,
  rating: (json['rating'] as num).toInt(),
  comment: json['comment'] as String,
);

Map<String, dynamic> _$CreateSystemFeedbackRequestToJson(
  _CreateSystemFeedbackRequest instance,
) => <String, dynamic>{
  'type': _$FeedbackTypeEnumMap[instance.type]!,
  'rating': instance.rating,
  'comment': instance.comment,
};

const _$FeedbackTypeEnumMap = {
  FeedbackType.parking: 'PARKING',
  FeedbackType.system: 'SYSTEM',
};

_CreateParkingFeedbackRequest _$CreateParkingFeedbackRequestFromJson(
  Map<String, dynamic> json,
) => _CreateParkingFeedbackRequest(
  type:
      $enumDecodeNullable(_$FeedbackTypeEnumMap, json['type']) ??
      FeedbackType.parking,
  parkingId: json['parkingId'] as String,
  reservationId: json['reservationId'] as String,
  rating: (json['rating'] as num).toInt(),
  comment: json['comment'] as String,
  keywords: (json['keywords'] as List<dynamic>)
      .map((e) => $enumDecode(_$FeedbackKeywordTypeEnumMap, e))
      .toList(),
);

Map<String, dynamic> _$CreateParkingFeedbackRequestToJson(
  _CreateParkingFeedbackRequest instance,
) => <String, dynamic>{
  'type': _$FeedbackTypeEnumMap[instance.type]!,
  'parkingId': instance.parkingId,
  'reservationId': instance.reservationId,
  'rating': instance.rating,
  'comment': instance.comment,
  'keywords': instance.keywords
      .map((e) => _$FeedbackKeywordTypeEnumMap[e]!)
      .toList(),
};

const _$FeedbackKeywordTypeEnumMap = {
  FeedbackKeywordType.safe: 'SAFE',
  FeedbackKeywordType.clean: 'CLEAN',
  FeedbackKeywordType.userFriendly: 'USER_FRIENDLY',
  FeedbackKeywordType.goodLocation: 'GOOD_LOCATION',
  FeedbackKeywordType.affordable: 'AFFORDABLE',
};

_UpdateFeedbackRequest _$UpdateFeedbackRequestFromJson(
  Map<String, dynamic> json,
) => _UpdateFeedbackRequest(
  rating: (json['rating'] as num).toInt(),
  comment: json['comment'] as String,
  keywords: (json['keywords'] as List<dynamic>?)
      ?.map((e) => $enumDecode(_$FeedbackKeywordTypeEnumMap, e))
      .toList(),
);

Map<String, dynamic> _$UpdateFeedbackRequestToJson(
  _UpdateFeedbackRequest instance,
) => <String, dynamic>{
  'rating': instance.rating,
  'comment': instance.comment,
  'keywords': instance.keywords
      ?.map((e) => _$FeedbackKeywordTypeEnumMap[e]!)
      .toList(),
};
