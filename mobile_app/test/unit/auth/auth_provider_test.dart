import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/features/auth/presentation/providers/auth_provider.dart';
import 'package:mobile_app/features/auth/data/auth_repository.dart';
import 'package:mobile_app/features/auth/domain/models/auth_models.dart';
import 'package:mobile_app/core/storage/secure_storage_service.dart';

class FakeSecureStorageService implements SecureStorageService {
  String? token;
  @override
  Future<String?> getToken() async => token;
  @override
  Future<void> saveToken(String t) async {
    token = t;
  }

  @override
  Future<void> deleteToken() async {
    token = null;
  }
}

class FakeAuthRepository implements AuthRepository {
  User? currentUser;
  bool shouldThrowOnLogin = false;

  @override
  Future<User> getCurrentUser() async {
    if (currentUser == null) throw Exception('No user');
    return currentUser!;
  }

  @override
  Future<void> login(LoginRequest request) async {
    if (shouldThrowOnLogin) throw Exception('Invalid Credentials');
    currentUser = User(
      id: '123',
      fullName: 'Test User',
      email: request.email,
      role: 'DRIVER',
    );
  }

  @override
  Future<void> loginWithGoogle(String idToken) async {}
  @override
  Future<void> logout() async {
    currentUser = null;
  }

  @override
  Future<void> register(RegisterRequest request) async {}
}

void main() {
  late FakeAuthRepository fakeAuthRepository;
  late FakeSecureStorageService fakeSecureStorage;
  late ProviderContainer container;

  final testUser = User(
    id: '123',
    fullName: 'Test User',
    email: 'test@example.com',
    role: 'DRIVER',
  );

  setUp(() {
    fakeAuthRepository = FakeAuthRepository();
    fakeSecureStorage = FakeSecureStorageService();

    container = ProviderContainer(
      overrides: [
        authRepositoryProvider.overrideWithValue(fakeAuthRepository),
        secureStorageProvider.overrideWithValue(fakeSecureStorage),
      ],
    );
  });

  tearDown(() {
    container.dispose();
  });

  group('AuthNotifier Unit Tests', () {
    test('initial state is unauthenticated when no token is present', () async {
      container.read(authProvider);

      await Future.delayed(Duration.zero);

      final finalState = container.read(authProvider);
      expect(finalState.status, AuthStatus.unauthenticated);
    });

    test('initial state becomes authenticated if valid token exists', () async {
      fakeSecureStorage.token = 'valid_token';
      fakeAuthRepository.currentUser = testUser;

      final newContainer = ProviderContainer(
        overrides: [
          authRepositoryProvider.overrideWithValue(fakeAuthRepository),
          secureStorageProvider.overrideWithValue(fakeSecureStorage),
        ],
      );

      newContainer.read(authProvider);

      await Future.delayed(Duration.zero);

      final state = newContainer.read(authProvider);
      expect(state.status, AuthStatus.authenticated);
      expect(state.user?.email, 'test@example.com');
      newContainer.dispose();
    });

    test('login successfully sets state to authenticated', () async {
      final notifier = container.read(authProvider.notifier);

      await notifier.login('test@example.com', 'password123');

      final state = container.read(authProvider);
      expect(state.status, AuthStatus.authenticated);
      expect(state.user?.email, 'test@example.com');
    });

    test('login updates state to error on failure', () async {
      fakeAuthRepository.shouldThrowOnLogin = true;

      final notifier = container.read(authProvider.notifier);

      await notifier.login('test@example.com', 'password123');

      final state = container.read(authProvider);
      expect(state.status, AuthStatus.error);
      expect(state.errorMessage, 'Invalid Credentials');
    });

    test('logout clears user state and calls repository logout', () async {
      // Login
      final notifier = container.read(authProvider.notifier);
      await notifier.login('test@example.com', 'password123');

      // Logout
      await notifier.logout();

      final state = container.read(authProvider);
      expect(state.status, AuthStatus.unauthenticated);
      expect(fakeAuthRepository.currentUser, isNull);
    });
  });
}
