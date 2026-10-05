import 'package:dio/dio.dart';
import '../storage/secure_storage_service.dart';

class ApiInterceptor extends Interceptor {
  final SecureStorageService _secureStorage;

  ApiInterceptor(this._secureStorage);

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _secureStorage.getToken();
    if (token != null) {
      options.headers['Cookie'] = 'quickpark_auth=$token';
    }

    options.headers['Accept'] = 'application/json';
    options.headers['Content-Type'] = 'application/json';

    super.onRequest(options, handler);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      await _secureStorage.deleteToken();
    }
    super.onError(err, handler);
  }
}
