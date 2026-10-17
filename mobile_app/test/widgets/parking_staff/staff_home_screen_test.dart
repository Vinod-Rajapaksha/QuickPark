
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/features/parking_staff/presentation/screens/staff_home_screen.dart';

Map<String, dynamic> mockDashboard({
  bool canManageReservations = true,
  String? facilityName = 'QuickPark Test Parking',
}) {
  return {
    'facilityName': facilityName,
    'availableSlots': 12,
    'totalSlots': 20,
    'occupiedSlots': 8,
    'todayReservationCount': 5,
    'canManageReservations': canManageReservations,
  };
}

Future<void> pumpStaffScreen(
  WidgetTester tester,
  Future<Map<String, dynamic>> Function() loader,
) async {
  tester.view.physicalSize = const Size(1080, 2400);
  tester.view.devicePixelRatio = 3;

  addTearDown(() {
    tester.view.resetPhysicalSize();
    tester.view.resetDevicePixelRatio();
  });

  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        staffDashboardProvider.overrideWith(
          (ref) => loader(),
        ),
      ],
      child: const MaterialApp(
        home: StaffHomeScreen(),
      ),
    ),
  );
}

void main() {
  group('Staff Management Widget Tests', () {
    testWidgets(
      'ST-W01: Staff dashboard displays facility name',
      (tester) async {
        await pumpStaffScreen(
          tester,
          () async => mockDashboard(),
        );

        await tester.pumpAndSettle();

        expect(
          find.text('Staff Dashboard'),
          findsOneWidget,
        );

        expect(
          find.text('QuickPark Test Parking'),
          findsOneWidget,
        );
      },
    );

    testWidgets(
      'ST-W02: Staff dashboard displays parking statistics',
      (tester) async {
        await pumpStaffScreen(
          tester,
          () async => mockDashboard(),
        );

        await tester.pumpAndSettle();

        expect(find.text('Available Spots'), findsOneWidget);
        expect(find.text('12 / 20'), findsOneWidget);
        expect(find.text('Occupied'), findsOneWidget);
        expect(find.text('8'), findsOneWidget);
        expect(
          find.text("Today's Reservations"),
          findsOneWidget,
        );
        expect(find.text('5'), findsOneWidget);
      },
    );

    testWidgets(
      'ST-W03: Staff with permission sees Manage Reservations',
      (tester) async {
        await pumpStaffScreen(
          tester,
          () async => mockDashboard(
            canManageReservations: true,
          ),
        );

        await tester.pumpAndSettle();

        expect(
          find.text('Manage Reservations'),
          findsOneWidget,
        );
      },
    );

    testWidgets(
      'ST-W04: Staff without permission cannot see Manage Reservations',
      (tester) async {
        await pumpStaffScreen(
          tester,
          () async => mockDashboard(
            canManageReservations: false,
          ),
        );

        await tester.pumpAndSettle();

        expect(
          find.text('Manage Reservations'),
          findsNothing,
        );

        expect(
          find.text('Scan QR Code'),
          findsOneWidget,
        );
      },
    );

    testWidgets(
      'ST-W05: API failure displays error message',
      (tester) async {
        await pumpStaffScreen(
          tester,
          () async => throw Exception('Network unavailable'),
        );

        await tester.pumpAndSettle();

        expect(
          find.textContaining('Error loading dashboard:'),
          findsOneWidget,
        );
      },
    );

    testWidgets(
      'ST-W06: API failure displays Retry button',
      (tester) async {
        await pumpStaffScreen(
          tester,
          () async => throw Exception('Connection failed'),
        );

        await tester.pumpAndSettle();

        expect(find.text('Retry'), findsOneWidget);
      },
    );

    testWidgets(
      'ST-W07: Missing facility name displays fallback',
      (tester) async {
        final data = mockDashboard();
        data.remove('facilityName');

        await pumpStaffScreen(
          tester,
          () async => data,
        );

        await tester.pumpAndSettle();

        expect(
          find.text('Unknown Facility'),
          findsOneWidget,
        );
      },
    );

    testWidgets(
      'ST-W08: Loading state displays progress indicator',
      (tester) async {
        final unresolved = Completer<Map<String, dynamic>>();

        await pumpStaffScreen(
          tester,
          () => unresolved.future,
        );

        await tester.pump();

        expect(
          find.byType(CircularProgressIndicator),
          findsOneWidget,
        );

        unresolved.complete(mockDashboard());
        await tester.pumpAndSettle();

        expect(
          find.text('QuickPark Test Parking'),
          findsOneWidget,
        );
      },
    );
  });
}
