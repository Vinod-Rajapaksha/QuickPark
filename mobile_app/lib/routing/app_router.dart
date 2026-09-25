import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/presentation/providers/auth_provider.dart';
import '../features/auth/presentation/screens/login_screen.dart';
import '../features/auth/presentation/screens/register_screen.dart';
import '../features/onboarding/presentation/screens/onboarding_screen.dart';
import '../features/home/presentation/screens/home_screen.dart';
import '../core/storage/local_storage_service.dart';

// Driver Screens
import '../features/driver/presentation/screens/driver_layout.dart';
import '../features/driver/presentation/screens/driver_bookings_screen.dart';
import '../features/driver/presentation/screens/driver_profile_screen.dart';

// Provider Screens
import '../features/provider/presentation/screens/provider_layout.dart';
import '../features/provider/presentation/screens/provider_dashboard_screen.dart';
import '../features/provider/presentation/screens/provider_scanner_screen.dart';
import '../features/provider/presentation/screens/provider_profile_screen.dart';

// Admin Screens
import '../features/admin/presentation/screens/admin_layout.dart';
import '../features/admin/presentation/screens/admin_dashboard_screen.dart';
import '../features/admin/presentation/screens/admin_users_screen.dart';
import '../features/admin/presentation/screens/admin_settings_screen.dart';

final GlobalKey<NavigatorState> _rootNavigatorKey = GlobalKey<NavigatorState>();

String _getInitialRoute(int? role) {
  if (role == null) return '/login';
  switch (role) {
    case 1:
      return '/provider/dashboard';
    case 2:
      return '/admin/dashboard';
    case 0:
    default:
      return '/driver/home';
  }
}

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);
  final hasSeenOnboarding = ref.watch(localStorageProvider).hasSeenOnboarding;

  final isAuth = authState.status == AuthStatus.authenticated;
  final initialLocation = hasSeenOnboarding 
      ? (isAuth ? _getInitialRoute(authState.user?.role) : '/login') 
      : '/onboarding';

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: initialLocation,
    redirect: (context, state) {
      final isAuth = authState.status == AuthStatus.authenticated;
      final isLoggingIn = state.matchedLocation == '/login' || state.matchedLocation == '/register';
      final isOnboarding = state.matchedLocation == '/onboarding';

      if (!hasSeenOnboarding && !isOnboarding) return '/onboarding';
      if (hasSeenOnboarding && isOnboarding) return isAuth ? _getInitialRoute(authState.user?.role) : '/login';

      if (!isAuth && !isLoggingIn && hasSeenOnboarding) return '/login';
      if (isAuth && isLoggingIn) return _getInitialRoute(authState.user?.role);
      
      // Role-based protection
      if (isAuth) {
        final role = authState.user?.role ?? 0;
        final path = state.matchedLocation;
        
        if (role == 0 && (path.startsWith('/provider') || path.startsWith('/admin'))) {
          return '/driver/home';
        } else if (role == 1 && (path.startsWith('/driver') || path.startsWith('/admin'))) {
          return '/provider/dashboard';
        } else if (role == 2 && (path.startsWith('/driver') || path.startsWith('/provider'))) {
          return '/admin/dashboard';
        }
      }

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
      
      // DRIVER ROUTES
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) => DriverLayout(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/driver/home',
              builder: (context, state) => const HomeScreen(),
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/driver/bookings',
              builder: (context, state) => const DriverBookingsScreen(),
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/driver/profile',
              builder: (context, state) => const DriverProfileScreen(),
            ),
          ]),
        ],
      ),

      // PROVIDER ROUTES
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) => ProviderLayout(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/provider/dashboard',
              builder: (context, state) => const ProviderDashboardScreen(),
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/provider/scanner',
              builder: (context, state) => const ProviderScannerScreen(),
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/provider/profile',
              builder: (context, state) => const ProviderProfileScreen(),
            ),
          ]),
        ],
      ),

      // ADMIN ROUTES
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) => AdminLayout(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/admin/dashboard',
              builder: (context, state) => const AdminDashboardScreen(),
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/admin/users',
              builder: (context, state) => const AdminUsersScreen(),
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/admin/settings',
              builder: (context, state) => const AdminSettingsScreen(),
            ),
          ]),
        ],
      ),
    ],
  );
});
