import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api_interceptor.dart';
import '../storage/secure_storage_service.dart';

final dioProvider = Provider<Dio>((ref) {
  final dio = Dio();
  final baseUrl = dotenv.env['API_BASE_URL'];

  if (baseUrl == null || baseUrl.isEmpty) {
    throw Exception('API_BASE_URL is not configured');
  }

  dio.options.baseUrl = baseUrl;
  dio.options.connectTimeout = const Duration(seconds: 10);
  dio.options.receiveTimeout = const Duration(seconds: 10);

  final secureStorage = ref.read(secureStorageProvider);
  dio.interceptors.add(ApiInterceptor(secureStorage));

  return dio;
});
