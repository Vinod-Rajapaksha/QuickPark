import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_app/features/auth/presentation/screens/login_screen.dart';
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

  group('LoginScreen - Widget, Validation & Navigation Tests', () {
    testWidgets('renders login form correctly', (tester) async {
      await tester.pumpApp(
        InheritedGoRouter(goRouter: mockRouter, child: const LoginScreen()),
        overrides: [authProvider.overrideWith(() => MockAuthNotifier())],
      );

      expect(find.text('Welcome Back'), findsOneWidget);
      expect(find.text('Sign in to continue your journey'), findsOneWidget);
      expect(find.byType(TextFormField), findsNWidgets(2));
      expect(find.text('Sign In'), findsOneWidget);
      expect(find.text('Continue with Google'), findsOneWidget);
    });

    testWidgets('displays form validation errors for empty fields', (
      tester,
    ) async {
      await tester.pumpApp(
        InheritedGoRouter(goRouter: mockRouter, child: const LoginScreen()),
        overrides: [authProvider.overrideWith(() => MockAuthNotifier())],
      );

      await tester.tap(find.text('Sign In'));
      await tester.pump();

      expect(find.text('Please enter your email'), findsOneWidget);
      expect(find.text('Please enter your password'), findsOneWidget);
    });

    testWidgets('displays validation error for invalid email', (tester) async {
      await tester.pumpApp(
        InheritedGoRouter(goRouter: mockRouter, child: const LoginScreen()),
        overrides: [authProvider.overrideWith(() => MockAuthNotifier())],
      );

      await tester.enterText(find.byType(TextFormField).first, 'invalidemail');
      await tester.tap(find.text('Sign In'));
      await tester.pump();

      expect(find.text('Please enter a valid email'), findsOneWidget);
    });

    testWidgets('navigates to register screen when Create one is clicked', (
      tester,
    ) async {
      when(() => mockRouter.push('/register')).thenAnswer((_) async => null);

      await tester.pumpApp(
        InheritedGoRouter(goRouter: mockRouter, child: const LoginScreen()),
        overrides: [authProvider.overrideWith(() => MockAuthNotifier())],
      );

      await tester.drag(find.byType(CustomScrollView), const Offset(0, -500));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Create one'));

      verify(() => mockRouter.push('/register')).called(1);
    });

    testWidgets('calls login provider method on valid form submission', (
      tester,
    ) async {
      final mockNotifier = MockAuthNotifier();

      await tester.pumpApp(
        InheritedGoRouter(goRouter: mockRouter, child: const LoginScreen()),
        overrides: [authProvider.overrideWith(() => mockNotifier)],
      );

      await tester.enterText(
        find.byType(TextFormField).first,
        'test@example.com',
      );
      await tester.enterText(find.byType(TextFormField).last, 'password123');

      await tester.tap(find.text('Sign In'));
      await tester.pump();

      expect(find.text('Please enter your email'), findsNothing);
      expect(find.text('Please enter your password'), findsNothing);
    });
  });
}
