import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/presentation/providers/auth_provider.dart';
import '../features/auth/presentation/screens/login_screen.dart';
import '../features/auth/presentation/screens/register_screen.dart';
import '../features/onboarding/presentation/screens/onboarding_screen.dart';
import '../core/storage/local_storage_service.dart';

// Driver Screens
import '../features/driver/presentation/screens/driver_layout.dart';
import '../features/driver/presentation/screens/driver_home_screen.dart';
import '../features/driver/presentation/screens/driver_bookings_screen.dart';
import '../features/driver/presentation/screens/driver_profile_screen.dart';
import '../features/driver/presentation/screens/driver_facility_details_screen.dart';
import '../features/driver/presentation/screens/driver_checkout_screen.dart';
import '../features/driver/presentation/screens/driver_digital_pass_screen.dart';

// Provider Screens
import '../features/provider/presentation/screens/provider_layout.dart';
import '../features/provider/presentation/screens/provider_dashboard_screen.dart';
import '../features/provider/presentation/screens/provider_scanner_screen.dart';
import '../features/provider/presentation/screens/provider_profile_screen.dart';
import '../features/provider/presentation/screens/provider_reservation_approval_screen.dart';

// Admin Screens
import '../features/admin/presentation/screens/admin_layout.dart';
import '../features/admin/presentation/screens/admin_dashboard_screen.dart';
import '../features/admin/presentation/screens/admin_users_screen.dart';
import '../features/admin/presentation/screens/admin_approvals_screen.dart';
import '../features/admin/presentation/screens/admin_profile_screen.dart';

// Staff Screens
import '../features/parking_staff/presentation/screens/staff_layout.dart';
import '../features/parking_staff/presentation/screens/staff_home_screen.dart';
import '../features/parking_staff/presentation/screens/staff_profile_screen.dart';

final GlobalKey<NavigatorState> _rootNavigatorKey = GlobalKey<NavigatorState>();

String _getInitialRoute(String? role) {
  if (role == null) return '/login';
  switch (role) {
    case 'PARKING_OWNER':
      return '/provider/dashboard';
    case 'PARKING_STAFF':
      return '/staff/dashboard';
    case 'PLATFORM_ADMIN':
      return '/admin/dashboard';
    case 'DRIVER':
    default:
      return '/driver/home';
  }
}

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);
  final initialHasSeenOnboarding = ref
      .read(localStorageProvider)
      .hasSeenOnboarding;

  final isAuth = authState.status == AuthStatus.authenticated;
  final initialLocation = initialHasSeenOnboarding
      ? (isAuth ? _getInitialRoute(authState.user?.role) : '/login')
      : '/onboarding';

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: initialLocation,
    redirect: (context, state) {
      final currentHasSeenOnboarding = ref
          .read(localStorageProvider)
          .hasSeenOnboarding;
      final isAuth = authState.status == AuthStatus.authenticated;
      final isLoggingIn =
          state.matchedLocation == '/login' ||
          state.matchedLocation == '/register';
      final isOnboarding = state.matchedLocation == '/onboarding';

      if (!currentHasSeenOnboarding && !isOnboarding) {
        return '/onboarding';
      }
      if (currentHasSeenOnboarding && isOnboarding) {
        return isAuth ? _getInitialRoute(authState.user?.role) : '/login';
      }

      if (!isAuth && !isLoggingIn && currentHasSeenOnboarding) {
        return '/login';
      }
      if (isAuth && isLoggingIn) {
        return _getInitialRoute(authState.user?.role);
      }

      // Role-based protection
      if (isAuth) {
        final role = authState.user?.role ?? 'DRIVER';
        final path = state.matchedLocation;

        if (role == 'DRIVER' &&
            (path.startsWith('/provider') ||
                path.startsWith('/admin') ||
                path.startsWith('/staff'))) {
          return '/driver/home';
        } else if (role == 'PARKING_OWNER' &&
            (path.startsWith('/driver') ||
                path.startsWith('/admin') ||
                path.startsWith('/staff'))) {
          return '/provider/dashboard';
        } else if (role == 'PARKING_STAFF' &&
            (path.startsWith('/driver') ||
                path.startsWith('/admin') ||
                path.startsWith('/provider'))) {
          return '/staff/dashboard';
        } else if (role == 'PLATFORM_ADMIN' &&
            (path.startsWith('/driver') ||
                path.startsWith('/provider') ||
                path.startsWith('/staff'))) {
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
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),

      // DRIVER ROUTES
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) =>
            DriverLayout(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/driver/home',
                builder: (context, state) => const DriverHomeScreen(),
                routes: [
                  GoRoute(
                    path: 'facility/:id',
                    builder: (context, state) {
                      final facilityId = state.pathParameters['id']!;
                      final extra = state.extra as Map<String, dynamic>?;
                      return DriverFacilityDetailsScreen(
                        facilityId: facilityId,
                        facilityData: extra,
                      );
                    },
                  ),
                  GoRoute(
                    path: 'checkout',
                    builder: (context, state) {
                      final extra = state.extra as Map<String, dynamic>;
                      return DriverCheckoutScreen(
                        reservationRequest: extra['reservationRequest'],
                        facilityData: extra['facilityData'],
                        totalCost: extra['totalCost'],
                      );
                    },
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/driver/bookings',
                builder: (context, state) => const DriverBookingsScreen(),
                routes: [
                  GoRoute(
                    path: 'pass',
                    builder: (context, state) {
                      final booking = state.extra as Map<String, dynamic>;
                      return DriverDigitalPassScreen(booking: booking);
                    },
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/driver/profile',
                builder: (context, state) => const DriverProfileScreen(),
              ),
            ],
          ),
        ],
      ),

      // PROVIDER ROUTES
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) =>
            ProviderLayout(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/provider/dashboard',
                builder: (context, state) => const ProviderDashboardScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/provider/scanner',
                builder: (context, state) => const ProviderScannerScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/provider/reservations/approval',
                builder: (context, state) =>
                    const ProviderReservationApprovalScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/provider/profile',
                builder: (context, state) => const ProviderProfileScreen(),
              ),
            ],
          ),
        ],
      ),

      // STAFF ROUTES
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) =>
            StaffLayout(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/staff/dashboard',
                builder: (context, state) => const StaffHomeScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/staff/scanner',
                builder: (context, state) => const ProviderScannerScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/staff/profile',
                builder: (context, state) => const StaffProfileScreen(),
              ),
            ],
          ),
        ],
      ),

      // ADMIN ROUTES
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) =>
            AdminLayout(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/admin/dashboard',
                builder: (context, state) => const AdminDashboardScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/admin/users',
                builder: (context, state) => const AdminUsersScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/admin/approvals',
                builder: (context, state) => const AdminApprovalsScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/admin/profile',
                builder: (context, state) => const AdminProfileScreen(),
              ),
            ],
          ),
        ],
      ),
    ],
  );
});
