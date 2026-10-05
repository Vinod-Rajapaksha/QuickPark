import 'package:freezed_annotation/freezed_annotation.dart';
import 'feedback_enums.dart';

part 'feedback_request_models.freezed.dart';
part 'feedback_request_models.g.dart';

@freezed
abstract class CreateSystemFeedbackRequest with _$CreateSystemFeedbackRequest {
  const factory CreateSystemFeedbackRequest({
    @Default(FeedbackType.system) FeedbackType type,
    required int rating,
    required String comment,
  }) = _CreateSystemFeedbackRequest;

  factory CreateSystemFeedbackRequest.fromJson(Map<String, dynamic> json) =>
      _$CreateSystemFeedbackRequestFromJson(json);
}

@freezed
abstract class CreateParkingFeedbackRequest
    with _$CreateParkingFeedbackRequest {
  const factory CreateParkingFeedbackRequest({
    @Default(FeedbackType.parking) FeedbackType type,
    required String parkingId,
    required String reservationId,
    required int rating,
    required String comment,
    required List<FeedbackKeywordType> keywords,
  }) = _CreateParkingFeedbackRequest;

  factory CreateParkingFeedbackRequest.fromJson(Map<String, dynamic> json) =>
      _$CreateParkingFeedbackRequestFromJson(json);
}

@freezed
abstract class UpdateFeedbackRequest with _$UpdateFeedbackRequest {
  const factory UpdateFeedbackRequest({
    required int rating,
    required String comment,
    List<FeedbackKeywordType>? keywords,
  }) = _UpdateFeedbackRequest;

  factory UpdateFeedbackRequest.fromJson(Map<String, dynamic> json) =>
      _$UpdateFeedbackRequestFromJson(json);
}
