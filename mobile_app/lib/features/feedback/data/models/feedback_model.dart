import 'package:freezed_annotation/freezed_annotation.dart';
import 'feedback_enums.dart';

part 'feedback_model.freezed.dart';
part 'feedback_model.g.dart';

@freezed
abstract class FeedbackReply with _$FeedbackReply {
  const factory FeedbackReply({
    required String id,
    required String repliedByUserId,
    required String role,
    required String message,
    required DateTime createdAt,
  }) = _FeedbackReply;

  factory FeedbackReply.fromJson(Map<String, dynamic> json) =>
      _$FeedbackReplyFromJson(json);
}

@freezed
abstract class FeedbackModel with _$FeedbackModel {
  const factory FeedbackModel({
    required String id,
    required String userName,
    required FeedbackType type,
    String? parkingId,
    String? reservationId,
    required int rating,
    String? comment,
    required FeedbackStatus status,
    @Default([]) List<FeedbackKeywordType> keywords,
    @Default([]) List<FeedbackReply> replies,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _FeedbackModel;

  factory FeedbackModel.fromJson(Map<String, dynamic> json) =>
      _$FeedbackModelFromJson(json);
}
