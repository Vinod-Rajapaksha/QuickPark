import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:mobile_app/features/auth/data/auth_repository.dart';
import 'package:mobile_app/core/storage/secure_storage_service.dart';
import 'package:mobile_app/features/auth/domain/models/auth_models.dart';

class MockDio extends Mock implements Dio {}

class MockSecureStorage extends Mock implements SecureStorageService {}

void main() {
  late AuthRepository authRepository;
  late MockDio mockDio;
  late MockSecureStorage mockSecureStorage;

  setUp(() {
    mockDio = MockDio();
    mockSecureStorage = MockSecureStorage();
    authRepository = AuthRepository(mockDio, mockSecureStorage);
  });

  group('AuthRepository - API Integration Tests', () {
    test('login sets cookie token in secure storage on success', () async {
      final request = LoginRequest(
        email: 'test@example.com',
        password: 'password123',
      );
      final responseData = {'message': 'Success'};

      final mockResponse = Response(
        requestOptions: RequestOptions(path: '/auth/login'),
        data: responseData,
        statusCode: 200,
        headers: Headers.fromMap({
          'set-cookie': ['quickpark_auth=mocked_token; Path=/; HttpOnly'],
        }),
      );

      when(
        () => mockDio.post(any(), data: any(named: 'data')),
      ).thenAnswer((_) async => mockResponse);
      when(() => mockSecureStorage.saveToken(any())).thenAnswer((_) async {});

      await authRepository.login(request);

      verify(
        () => mockDio.post('/auth/login', data: request.toJson()),
      ).called(1);
      verify(() => mockSecureStorage.saveToken('mocked_token')).called(1);
    });

    test('getCurrentUser parses User successfully', () async {
      final userData = {
        'id': '123',
        'email': 'test@example.com',
        'firstName': 'John',
        'lastName': 'Doe',
        'role': 1,
      };

      final mockResponse = Response(
        requestOptions: RequestOptions(path: '/auth/me'),
        data: userData,
        statusCode: 200,
      );

      when(() => mockDio.get(any())).thenAnswer((_) async => mockResponse);

      final user = await authRepository.getCurrentUser();

      expect(user.id, '123');
      expect(user.email, 'test@example.com');
      verify(() => mockDio.get('/auth/me')).called(1);
    });

    test('login throws Exception with proper message on DioError', () async {
      final request = LoginRequest(
        email: 'test@example.com',
        password: 'password123',
      );
      final dioException = DioException(
        requestOptions: RequestOptions(path: '/auth/login'),
        response: Response(
          requestOptions: RequestOptions(path: '/auth/login'),
          statusCode: 400,
          data: {'message': 'Invalid credentials'},
        ),
      );

      when(
        () => mockDio.post(any(), data: any(named: 'data')),
      ).thenThrow(dioException);

      expect(
        () => authRepository.login(request),
        throwsA(
          isA<Exception>().having(
            (e) => e.toString(),
            'message',
            contains('Invalid credentials'),
          ),
        ),
      );
    });

    test('register calls post on /auth/register', () async {
      final request = RegisterRequest(
        email: 'new@example.com',
        password: 'password123',
        fullName: 'John Doe',
        phone: '0123456789',
        nic: '991234567v',
        role: 'DRIVER',
      );

      final mockResponse = Response(
        requestOptions: RequestOptions(path: '/auth/register'),
        statusCode: 201,
      );

      when(
        () => mockDio.post(any(), data: any(named: 'data')),
      ).thenAnswer((_) async => mockResponse);

      await authRepository.register(request);

      verify(
        () => mockDio.post('/auth/register', data: request.toJson()),
      ).called(1);
    });

    test('loginWithGoogle saves token from cookie on success', () async {
      final mockResponse = Response(
        requestOptions: RequestOptions(path: '/auth/google'),
        statusCode: 200,
        headers: Headers.fromMap({
          'set-cookie': ['quickpark_auth=google_token; Path=/; HttpOnly'],
        }),
      );

      when(
        () => mockDio.post(any(), data: any(named: 'data')),
      ).thenAnswer((_) async => mockResponse);
      when(() => mockSecureStorage.saveToken(any())).thenAnswer((_) async {});

      await authRepository.loginWithGoogle('mock_id_token');

      final expectedData = GoogleLoginRequest(
        idToken: 'mock_id_token',
      ).toJson();
      verify(() => mockDio.post('/auth/google', data: expectedData)).called(1);
      verify(() => mockSecureStorage.saveToken('google_token')).called(1);
    });

    test('logout calls post on /auth/logout and deletes token', () async {
      final mockResponse = Response(
        requestOptions: RequestOptions(path: '/auth/logout'),
        statusCode: 200,
      );

      when(() => mockDio.post(any())).thenAnswer((_) async => mockResponse);
      when(() => mockSecureStorage.deleteToken()).thenAnswer((_) async {});

      await authRepository.logout();

      verify(() => mockDio.post('/auth/logout')).called(1);
      verify(() => mockSecureStorage.deleteToken()).called(1);
    });
  });
}
