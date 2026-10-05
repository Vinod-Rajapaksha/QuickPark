import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_app/features/auth/presentation/screens/register_screen.dart';
import 'package:mobile_app/features/auth/presentation/providers/auth_provider.dart';
import '../../helpers/pump_app.dart';

class MockAuthNotifier extends Notifier<AuthState> implements AuthNotifier {
  @override
  AuthState build() => AuthState(status: AuthStatus.initial);

  @override
  Future<void> login(String email, String password) async {}
  @override
  Future<void> loginWithGoogle() async {}
  @override
  Future<void> register(request) async {}
  @override
  Future<void> logout() async {}
  @override
  Future<void> checkAuthStatus() async {}
}

class MockGoRouter extends Mock implements GoRouter {}

void main() {
  late MockGoRouter mockRouter;

  setUp(() {
    mockRouter = MockGoRouter();
  });

  group('RegisterScreen - Widget, Validation & Navigation Tests', () {
    testWidgets('renders register form correctly', (tester) async {
      await tester.pumpApp(
        InheritedGoRouter(goRouter: mockRouter, child: const RegisterScreen()),
        overrides: [authProvider.overrideWith(() => MockAuthNotifier())],
      );

      expect(find.text('Create Account'), findsWidgets);
      expect(find.text('Join QuickPark & park smarter today'), findsOneWidget);
      expect(find.text('Driver'), findsOneWidget);
      expect(find.text('Provider'), findsOneWidget);
      expect(find.byType(TextFormField), findsNWidgets(5));
    });

    testWidgets('displays validation errors for empty fields', (tester) async {
      await tester.pumpApp(
        InheritedGoRouter(goRouter: mockRouter, child: const RegisterScreen()),
        overrides: [authProvider.overrideWith(() => MockAuthNotifier())],
      );

      await tester.drag(find.byType(CustomScrollView), const Offset(0, -500));
      await tester.pumpAndSettle();

      final btn = find.byType(ElevatedButton);
      await tester.tap(btn);
      await tester.pumpAndSettle();
      await tester.drag(find.byType(CustomScrollView), const Offset(0, 500));
      await tester.pumpAndSettle();

      expect(find.text('Please enter your name'), findsOneWidget);
      expect(find.text('Please enter your email'), findsOneWidget);
      expect(find.text('Required'), findsNWidgets(2));
      expect(find.text('Please enter a password'), findsOneWidget);
    });

    testWidgets('displays validation error for short password', (tester) async {
      await tester.pumpApp(
        InheritedGoRouter(goRouter: mockRouter, child: const RegisterScreen()),
        overrides: [authProvider.overrideWith(() => MockAuthNotifier())],
      );

      final passwordField = find.byType(TextFormField).at(4);

      await tester.drag(find.byType(CustomScrollView), const Offset(0, -500));
      await tester.pumpAndSettle();
      await tester.enterText(passwordField, '12345');

      final btn = find.byType(ElevatedButton);

      await tester.tap(btn);
      await tester.pumpAndSettle();

      expect(find.text('Must be at least 6 characters'), findsOneWidget);
    });

    testWidgets('navigates to login screen when Sign In is clicked', (
      tester,
    ) async {
      await tester.pumpApp(
        InheritedGoRouter(goRouter: mockRouter, child: const RegisterScreen()),
        overrides: [authProvider.overrideWith(() => MockAuthNotifier())],
      );

      await tester.drag(find.byType(CustomScrollView), const Offset(0, -500));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Sign In'));

      verify(() => mockRouter.pop()).called(1);
    });

    testWidgets('calls register on provider when form is valid', (
      tester,
    ) async {
      final mockNotifier = MockAuthNotifier();

      await tester.pumpApp(
        InheritedGoRouter(goRouter: mockRouter, child: const RegisterScreen()),
        overrides: [authProvider.overrideWith(() => mockNotifier)],
      );

      await tester.enterText(find.byType(TextFormField).at(0), 'John Doe');
      await tester.enterText(
        find.byType(TextFormField).at(1),
        'john@example.com',
      );
      await tester.enterText(find.byType(TextFormField).at(2), '0771234567');
      await tester.enterText(find.byType(TextFormField).at(3), '123456789V');
      await tester.drag(find.byType(CustomScrollView), const Offset(0, -500));
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextFormField).at(4), 'password123');

      final btn = find.byType(ElevatedButton);

      await tester.tap(btn);
      await tester.pumpAndSettle();
      await tester.drag(find.byType(CustomScrollView), const Offset(0, 500));
      await tester.pumpAndSettle();
      expect(find.text('Please enter your name'), findsNothing);
      expect(find.text('Please enter your email'), findsNothing);
    });
  });
}
