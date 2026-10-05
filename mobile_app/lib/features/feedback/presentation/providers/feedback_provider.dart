import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../data/models/feedback_model.dart';
import '../../data/models/feedback_request_models.dart';
import '../../data/repositories/feedback_repository.dart';

final myParkingFeedbackProvider =
    FutureProvider.autoDispose<List<FeedbackModel>>((ref) async {
      final repository = ref.watch(feedbackRepositoryProvider);
      return repository.getMyParkingFeedback();
    });

class FeedbackNotifier extends Notifier<AsyncValue<void>> {
  late FeedbackRepository _repository;

  String _handleError(Object e) {
    if (e is DioException) {
      final responseStr = e.response?.data?.toString() ?? '';

      if (responseStr.contains('already been submitted')) {
        return 'You have already rated this parking reservation.';
      }
      if (responseStr.contains('completed or checked-out')) {
        return 'Feedback can only be submitted for completed parking sessions.';
      }

      if (responseStr.isNotEmpty && responseStr.length < 100) {
        return responseStr;
      }
      return 'An unexpected error occurred. Please try again.';
    }
    return e.toString();
  }

  @override
  AsyncValue<void> build() {
    _repository = ref.watch(feedbackRepositoryProvider);
    return const AsyncValue.data(null);
  }

  Future<void> createSystemFeedback(CreateSystemFeedbackRequest request) async {
    state = const AsyncValue.loading();
    try {
      await _repository.createSystemFeedback(request);
      state = const AsyncValue.data(null);
    } catch (e, st) {
      state = AsyncValue.error(_handleError(e), st);
    }
  }

  Future<void> createParkingFeedback(
    CreateParkingFeedbackRequest request,
  ) async {
    state = const AsyncValue.loading();
    try {
      await _repository.createParkingFeedback(request);
      ref.invalidate(myParkingFeedbackProvider);
      state = const AsyncValue.data(null);
    } catch (e, st) {
      state = AsyncValue.error(_handleError(e), st);
    }
  }

  Future<void> updateFeedback(String id, UpdateFeedbackRequest request) async {
    state = const AsyncValue.loading();
    try {
      await _repository.update(id, request);
      ref.invalidate(myParkingFeedbackProvider);
      state = const AsyncValue.data(null);
    } catch (e, st) {
      state = AsyncValue.error(_handleError(e), st);
    }
  }

  Future<void> deleteFeedback(String id) async {
    state = const AsyncValue.loading();
    try {
      await _repository.remove(id);
      ref.invalidate(myParkingFeedbackProvider);
      state = const AsyncValue.data(null);
    } catch (e, st) {
      state = AsyncValue.error(_handleError(e), st);
    }
  }
}

final feedbackNotifierProvider =
    NotifierProvider.autoDispose<FeedbackNotifier, AsyncValue<void>>(
      FeedbackNotifier.new,
    );
