
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:mobile_app/core/network/api_client.dart';
import 'package:mobile_app/features/parking_staff/presentation/screens/staff_home_screen.dart';

class MockDio extends Mock implements Dio {}

void main() {
  late MockDio mockDio;
  late ProviderContainer container;

  setUp(() {
    mockDio = MockDio();

    container = ProviderContainer(
      overrides: [
        dioProvider.overrideWithValue(mockDio),
      ],
    );
  });

  tearDown(() {
    container.dispose();
  });

  group('Staff Dashboard API Unit Tests', () {
    test('ST-M01: valid API data loads successfully', () async {
      final response = <String, dynamic>{
        'facilityName': 'QuickPark Test Parking',
        'availableSlots': 12,
        'totalSlots': 20,
        'occupiedSlots': 8,
        'todayReservationCount': 5,
        'canManageReservations': true,
      };

      when(
        () => mockDio.get<dynamic>('/staff/dashboard'),
      ).thenAnswer(
        (_) async => Response<dynamic>(
          requestOptions: RequestOptions(
            path: '/staff/dashboard',
          ),
          statusCode: 200,
          data: response,
        ),
      );

      final result = await container.read(
        staffDashboardProvider.future,
      );

      expect(result['facilityName'], 'QuickPark Test Parking');
      expect(result['availableSlots'], 12);
      expect(result['totalSlots'], 20);
      expect(result['occupiedSlots'], 8);
      expect(result['todayReservationCount'], 5);
      expect(result['canManageReservations'], true);

      verify(
        () => mockDio.get<dynamic>('/staff/dashboard'),
      ).called(1);
    });

    test('ST-M02: API response with zero occupancy loads',
        () async {
      when(
        () => mockDio.get<dynamic>('/staff/dashboard'),
      ).thenAnswer(
        (_) async => Response<dynamic>(
          requestOptions: RequestOptions(
            path: '/staff/dashboard',
          ),
          statusCode: 200,
          data: <String, dynamic>{
            'facilityName': 'Empty Parking',
            'availableSlots': 10,
            'totalSlots': 10,
            'occupiedSlots': 0,
            'todayReservationCount': 0,
            'canManageReservations': false,
          },
        ),
      );

      final result = await container.read(
        staffDashboardProvider.future,
      );

      expect(result['occupiedSlots'], 0);
      expect(result['availableSlots'], 10);
      expect(result['todayReservationCount'], 0);
    });

    test('ST-M03: API connection error is propagated',
        () async {
      when(
        () => mockDio.get<dynamic>('/staff/dashboard'),
      ).thenThrow(
        DioException(
          requestOptions: RequestOptions(
            path: '/staff/dashboard',
          ),
          type: DioExceptionType.connectionError,
          message: 'Connection failed',
        ),
      );

      await expectLater(
        container.read(staffDashboardProvider.future),
        throwsA(isA<DioException>()),
      );
    });

    test('ST-M04: unauthorized API response is propagated',
        () async {
      when(
        () => mockDio.get<dynamic>('/staff/dashboard'),
      ).thenThrow(
        DioException(
          requestOptions: RequestOptions(
            path: '/staff/dashboard',
          ),
          response: Response<dynamic>(
            requestOptions: RequestOptions(
              path: '/staff/dashboard',
            ),
            statusCode: 401,
            data: <String, dynamic>{
              'message': 'Unauthorized',
            },
          ),
          type: DioExceptionType.badResponse,
        ),
      );

      await expectLater(
        container.read(staffDashboardProvider.future),
        throwsA(
          isA<DioException>().having(
            (error) => error.response?.statusCode,
            'statusCode',
            401,
          ),
        ),
      );
    });
  });
}
