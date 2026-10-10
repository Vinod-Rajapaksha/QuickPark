import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/features/driver/presentation/screens/driver_digital_pass_screen.dart';

void main() {
  group('Digital Pass Screen', () {
    testWidgets('Should display digital pass data', (
      WidgetTester tester,
    ) async {
      final dummyReservation = <String, dynamic>{
        'reservationId': '123',
        'facilityName': 'Test Facility',
        'slotNumber': 'A1',
        'startTime': DateTime.now().toIso8601String(),
        'endTime': DateTime.now()
            .add(const Duration(hours: 2))
            .toIso8601String(),
        'status': 'CONFIRMED',
      };

      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: DriverDigitalPassScreen(booking: dummyReservation),
            ),
          ),
        ),
      );

      expect(find.byType(DriverDigitalPassScreen), findsOneWidget);
      expect(find.textContaining('Test Facility'), findsOneWidget);
    });
  });
}
