import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:mobile_app/core/network/api_client.dart';
import 'package:mobile_app/features/driver/presentation/screens/driver_digital_pass_screen.dart';
import '../../helpers/pump_app.dart';

class MockDio extends Mock implements Dio {}

void main() {
  late MockDio mockDio;

  final bookingData = {
    'reservationId': 'res_123',
    'facilityName': 'Central Parking',
    'city': 'Colombo',
    'province': 'Western',
    'slotNumber': 'A-12',
    'startTime': DateTime.now()
        .subtract(const Duration(hours: 1))
        .toIso8601String(),
    'endTime': DateTime.now().add(const Duration(hours: 2)).toIso8601String(),
  };

  final expiredBookingData = {
    ...bookingData,
    'startTime': DateTime.now()
        .subtract(const Duration(hours: 3))
        .toIso8601String(),
    'endTime': DateTime.now()
        .subtract(const Duration(hours: 1))
        .toIso8601String(),
  };

  setUp(() {
    mockDio = MockDio();
  });

  group('DriverDigitalPassScreen - Widget Tests', () {
    testWidgets('renders loading state initially for QR token', (tester) async {
      final completer = Completer<Response<dynamic>>();
      when(
        () => mockDio.get('/Tokens/reservation/res_123'),
      ).thenAnswer((_) => completer.future);

      await tester.pumpApp(
        DriverDigitalPassScreen(booking: bookingData),
        overrides: [dioProvider.overrideWithValue(mockDio)],
      );

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      expect(find.text('Central Parking'), findsOneWidget);
      expect(find.text('Colombo, Western'), findsOneWidget);
      expect(find.text('A-12'), findsOneWidget);

      completer.complete(
        Response(
          requestOptions: RequestOptions(path: ''),
          data: {'token': 'mocked_qr_token'},
          statusCode: 200,
        ),
      );
      await tester.pumpAndSettle();

      await tester.pumpWidget(const SizedBox());
    });

    testWidgets('renders QR Code when token is loaded successfully', (
      tester,
    ) async {
      final mockResponse = Response(
        requestOptions: RequestOptions(path: '/Tokens/reservation/res_123'),
        data: {'token': 'mocked_qr_token'},
        statusCode: 200,
      );

      when(
        () => mockDio.get('/Tokens/reservation/res_123'),
      ).thenAnswer((_) async => mockResponse);

      await tester.pumpApp(
        DriverDigitalPassScreen(booking: bookingData),
        overrides: [dioProvider.overrideWithValue(mockDio)],
      );

      await tester.pumpAndSettle();

      expect(find.byType(CustomPaint), findsWidgets);
      expect(find.byType(CircularProgressIndicator), findsNothing);
    });

    testWidgets('renders Error state when token fetch fails', (tester) async {
      when(
        () => mockDio.get('/Tokens/reservation/res_123'),
      ).thenThrow(Exception('Failed to fetch'));

      await tester.pumpApp(
        DriverDigitalPassScreen(booking: bookingData),
        overrides: [dioProvider.overrideWithValue(mockDio)],
      );

      await tester.pumpAndSettle();

      expect(find.text('Error loading QR'), findsOneWidget);

      await tester.pumpWidget(const SizedBox());
    });

    testWidgets('displays EXPIRED text when endTime has passed', (
      tester,
    ) async {
      final mockResponse = Response(
        requestOptions: RequestOptions(path: '/Tokens/reservation/res_123'),
        data: {'token': 'mocked_qr_token'},
        statusCode: 200,
      );

      when(
        () => mockDio.get('/Tokens/reservation/res_123'),
      ).thenAnswer((_) async => mockResponse);

      await tester.pumpApp(
        DriverDigitalPassScreen(booking: expiredBookingData),
        overrides: [dioProvider.overrideWithValue(mockDio)],
      );

      await tester.pumpAndSettle();

      expect(find.text('EXPIRED'), findsOneWidget);
      expect(find.text('Time Remaining'), findsNothing);

      await tester.pumpWidget(const SizedBox());
    });
  });
}
