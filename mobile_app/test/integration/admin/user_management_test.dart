import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/features/admin/presentation/screens/admin_users_screen.dart';
import 'package:mobile_app/core/storage/local_storage_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile_app/features/auth/presentation/providers/auth_provider.dart';

class MockAuthNotifier extends AuthNotifier {
  @override
  AuthState build() {
    return AuthState(status: AuthStatus.authenticated, user: null);
  }
}

void main() {
  group('Admin User Management', () {
    testWidgets('Admin Users Screen renders correctly', (
      WidgetTester tester,
    ) async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            localStorageProvider.overrideWithValue(LocalStorageService(prefs)),
            adminUsersProvider.overrideWith((ref) => []),
            authProvider.overrideWith(() => MockAuthNotifier()),
          ],
          child: const MaterialApp(home: AdminUsersScreen()),
        ),
      );

      await tester.pump();

      expect(find.byType(AdminUsersScreen), findsOneWidget);
    });
  });
}
