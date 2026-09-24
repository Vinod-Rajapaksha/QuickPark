import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/presentation/providers/auth_provider.dart';
import '../features/auth/presentation/screens/login_screen.dart';
import '../features/auth/presentation/screens/register_screen.dart';
import '../features/onboarding/presentation/screens/onboarding_screen.dart';
import '../features/home/presentation/screens/home_screen.dart';
import '../core/storage/local_storage_service.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);
  final hasSeenOnboarding = ref.watch(localStorageProvider).hasSeenOnboarding;

  return GoRouter(
    initialLocation: hasSeenOnboarding ? (authState.status == AuthStatus.authenticated ? '/' : '/login') : '/onboarding',
    redirect: (context, state) {
      final isAuth = authState.status == AuthStatus.authenticated;
      final isLoggingIn = state.matchedLocation == '/login' || state.matchedLocation == '/register';
      final isOnboarding = state.matchedLocation == '/onboarding';

      if (!hasSeenOnboarding && !isOnboarding) return '/onboarding';
      if (hasSeenOnboarding && isOnboarding) return isAuth ? '/' : '/login';

      if (!isAuth && !isLoggingIn && hasSeenOnboarding) return '/login';
      if (isAuth && isLoggingIn) return '/';

      return null;
    },
    routes: [
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OnboardingScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/',
        builder: (context, state) => const HomeScreen(),
      ),
    ],
  );
});
