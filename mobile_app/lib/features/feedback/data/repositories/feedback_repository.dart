import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../models/feedback_model.dart';
import '../models/feedback_request_models.dart';

final feedbackRepositoryProvider = Provider<FeedbackRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return FeedbackRepository(dio);
});

class FeedbackRepository {
  final Dio _dio;

  FeedbackRepository(this._dio);

  Future<List<FeedbackModel>> getAll() async {
    final response = await _dio.get('/Feedback');
    return (response.data as List)
        .map((e) => FeedbackModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<FeedbackModel> getById(String id) async {
    final response = await _dio.get('/Feedback/$id');
    return FeedbackModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<FeedbackModel> createSystemFeedback(
    CreateSystemFeedbackRequest request,
  ) async {
    final response = await _dio.post('/Feedback', data: request.toJson());
    return FeedbackModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<List<FeedbackModel>> getMyParkingFeedback() async {
    final response = await _dio.get('/Feedback/my-parking');
    return (response.data as List)
        .map((e) => FeedbackModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<FeedbackModel> createParkingFeedback(
    CreateParkingFeedbackRequest request,
  ) async {
    final response = await _dio.post('/Feedback', data: request.toJson());
    return FeedbackModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<FeedbackModel> update(String id, UpdateFeedbackRequest request) async {
    final response = await _dio.put('/Feedback/$id', data: request.toJson());
    return FeedbackModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> remove(String id) async {
    await _dio.delete('/Feedback/$id');
  }
}
