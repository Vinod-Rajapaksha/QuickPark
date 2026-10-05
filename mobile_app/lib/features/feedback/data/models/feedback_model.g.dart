// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'feedback_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_FeedbackReply _$FeedbackReplyFromJson(Map<String, dynamic> json) =>
    _FeedbackReply(
      id: json['id'] as String,
      repliedByUserId: json['repliedByUserId'] as String,
      role: json['role'] as String,
      message: json['message'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );

Map<String, dynamic> _$FeedbackReplyToJson(_FeedbackReply instance) =>
    <String, dynamic>{
      'id': instance.id,
      'repliedByUserId': instance.repliedByUserId,
      'role': instance.role,
      'message': instance.message,
      'createdAt': instance.createdAt.toIso8601String(),
    };

_FeedbackModel _$FeedbackModelFromJson(Map<String, dynamic> json) =>
    _FeedbackModel(
      id: json['id'] as String,
      userName: json['userName'] as String,
      type: $enumDecode(_$FeedbackTypeEnumMap, json['type']),
      parkingId: json['parkingId'] as String?,
      reservationId: json['reservationId'] as String?,
      rating: (json['rating'] as num).toInt(),
      comment: json['comment'] as String?,
      status: $enumDecode(_$FeedbackStatusEnumMap, json['status']),
      keywords:
          (json['keywords'] as List<dynamic>?)
              ?.map((e) => $enumDecode(_$FeedbackKeywordTypeEnumMap, e))
              .toList() ??
          const [],
      replies:
          (json['replies'] as List<dynamic>?)
              ?.map((e) => FeedbackReply.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$FeedbackModelToJson(_FeedbackModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'userName': instance.userName,
      'type': _$FeedbackTypeEnumMap[instance.type]!,
      'parkingId': instance.parkingId,
      'reservationId': instance.reservationId,
      'rating': instance.rating,
      'comment': instance.comment,
      'status': _$FeedbackStatusEnumMap[instance.status]!,
      'keywords': instance.keywords
          .map((e) => _$FeedbackKeywordTypeEnumMap[e]!)
          .toList(),
      'replies': instance.replies,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
    };

const _$FeedbackTypeEnumMap = {
  FeedbackType.parking: 'PARKING',
  FeedbackType.system: 'SYSTEM',
};

const _$FeedbackStatusEnumMap = {
  FeedbackStatus.pendingApproval: 'PENDING_APPROVAL',
  FeedbackStatus.active: 'ACTIVE',
  FeedbackStatus.hidden: 'HIDDEN',
  FeedbackStatus.removed: 'REMOVED',
};

const _$FeedbackKeywordTypeEnumMap = {
  FeedbackKeywordType.safe: 'SAFE',
  FeedbackKeywordType.clean: 'CLEAN',
  FeedbackKeywordType.userFriendly: 'USER_FRIENDLY',
  FeedbackKeywordType.goodLocation: 'GOOD_LOCATION',
  FeedbackKeywordType.affordable: 'AFFORDABLE',
};
