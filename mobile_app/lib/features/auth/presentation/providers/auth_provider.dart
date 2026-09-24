import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../../data/auth_repository.dart';
import '../../domain/models/auth_models.dart';
import '../../../../core/storage/secure_storage_service.dart';

enum AuthStatus { initial, unauthenticated, authenticated, loading, error }

class AuthState {
  final AuthStatus status;
  final User? user;
  final String? errorMessage;

  AuthState({
    required this.status,
    this.user,
    this.errorMessage,
  });

  AuthState copyWith({
    AuthStatus? status,
    User? user,
    String? errorMessage,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      errorMessage: errorMessage,
    );
  }
}

final authProvider = NotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);

class AuthNotifier extends Notifier<AuthState> {
  late final AuthRepository _authRepository;
  late final SecureStorageService _secureStorage;

  @override
  AuthState build() {
    _authRepository = ref.read(authRepositoryProvider);
    _secureStorage = ref.read(secureStorageProvider);
    checkAuthStatus();
    return AuthState(status: AuthStatus.initial);
  }

  Future<void> checkAuthStatus() async {
    final token = await _secureStorage.getToken();
    if (token != null) {
      try {
        final user = await _authRepository.getCurrentUser();
        state = AuthState(status: AuthStatus.authenticated, user: user);
      } catch (e) {
        await _secureStorage.deleteToken();
        state = AuthState(status: AuthStatus.unauthenticated);
      }
    } else {
      state = AuthState(status: AuthStatus.unauthenticated);
    }
  }

  Future<void> login(String email, String password) async {
    state = state.copyWith(status: AuthStatus.loading);
    try {
      await _authRepository.login(LoginRequest(email: email, password: password));
      final user = await _authRepository.getCurrentUser();
      state = AuthState(status: AuthStatus.authenticated, user: user);
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      );
    }
  }

  Future<void> loginWithGoogle() async {
    state = state.copyWith(status: AuthStatus.loading);
    try {
      final googleUser = await GoogleSignIn().signIn();
      if (googleUser == null) {
        state = state.copyWith(status: AuthStatus.unauthenticated);
        return;
      }
      
      final googleAuth = await googleUser.authentication;
      final idToken = googleAuth.idToken;
      
      if (idToken == null) {
        throw Exception('Failed to get ID token from Google.');
      }
      
      await _authRepository.loginWithGoogle(idToken);
      final user = await _authRepository.getCurrentUser();
      state = AuthState(status: AuthStatus.authenticated, user: user);
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      );
    }
  }

  Future<void> register(RegisterRequest request) async {
    state = state.copyWith(status: AuthStatus.loading);
    try {
      await _authRepository.register(request);
      await login(request.email, request.password);
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      );
    }
  }

  Future<void> logout() async {
    state = state.copyWith(status: AuthStatus.loading);
    await _authRepository.logout();
    state = AuthState(status: AuthStatus.unauthenticated);
  }
}
