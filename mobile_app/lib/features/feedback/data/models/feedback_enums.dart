import 'package:freezed_annotation/freezed_annotation.dart';

enum FeedbackType {
  @JsonValue('PARKING')
  parking,
  @JsonValue('SYSTEM')
  system,
}

enum FeedbackStatus {
  @JsonValue('PENDING_APPROVAL')
  pendingApproval,
  @JsonValue('ACTIVE')
  active,
  @JsonValue('HIDDEN')
  hidden,
  @JsonValue('REMOVED')
  removed,
}

enum FeedbackKeywordType {
  @JsonValue('SAFE')
  safe,
  @JsonValue('CLEAN')
  clean,
  @JsonValue('USER_FRIENDLY')
  userFriendly,
  @JsonValue('GOOD_LOCATION')
  goodLocation,
  @JsonValue('AFFORDABLE')
  affordable,
}

extension FeedbackKeywordTypeExtension on FeedbackKeywordType {
  String get displayName {
    switch (this) {
      case FeedbackKeywordType.safe:
        return 'Safe';
      case FeedbackKeywordType.clean:
        return 'Clean';
      case FeedbackKeywordType.userFriendly:
        return 'User Friendly';
      case FeedbackKeywordType.goodLocation:
        return 'Good Location';
      case FeedbackKeywordType.affordable:
        return 'Affordable';
    }
  }
}
