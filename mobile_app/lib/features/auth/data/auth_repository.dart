import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/storage/secure_storage_service.dart';
import '../domain/models/auth_models.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    ref.read(dioProvider),
    ref.read(secureStorageProvider),
  );
});

class AuthRepository {
  final Dio _dio;
  final SecureStorageService _secureStorage;

  AuthRepository(this._dio, this._secureStorage);

  Future<void> login(LoginRequest request) async {
    try {
      final response = await _dio.post('/auth/login', data: request.toJson());
      
      final setCookie = response.headers.map['set-cookie'];
      if (setCookie != null) {
        for (var cookie in setCookie) {
          if (cookie.startsWith('AuthToken=')) {
            final tokenPart = cookie.split(';').first;
            final token = tokenPart.substring('AuthToken='.length);
            await _secureStorage.saveToken(token);
            break;
          }
        }
      }
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> loginWithGoogle(String idToken) async {
    try {
      final request = GoogleLoginRequest(idToken: idToken);
      final response = await _dio.post('/auth/google', data: request.toJson());
      
      final setCookie = response.headers.map['set-cookie'];
      if (setCookie != null) {
        for (var cookie in setCookie) {
          if (cookie.startsWith('AuthToken=')) {
            final tokenPart = cookie.split(';').first;
            final token = tokenPart.substring('AuthToken='.length);
            await _secureStorage.saveToken(token);
            break;
          }
        }
      }
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> register(RegisterRequest request) async {
    try {
      await _dio.post('/auth/register', data: request.toJson());
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<User> getCurrentUser() async {
    try {
      final response = await _dio.get('/auth/me');
      return User.fromJson(response.data);
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> logout() async {
    try {
      await _dio.post('/auth/logout');
    } catch (_) {
      
    } finally {
      await _secureStorage.deleteToken();
    }
  }

  Exception _handleError(dynamic e) {
    if (e is DioException) {
      final message = e.response?.data?['message'] ?? e.message;
      return Exception(message);
    }
    return Exception(e.toString());
  }
}
