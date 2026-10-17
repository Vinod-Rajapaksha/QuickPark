
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:mobile_app/features/feedback/data/repositories/feedback_repository.dart';

class MockDio extends Mock implements Dio {}

void main() {
  late MockDio dio;
  late FeedbackRepository repository;

  setUp(() {
    dio = MockDio();
    repository = FeedbackRepository(dio);
  });

  group('Mobile Feedback Repository Tests', () {
    test('FB-M01: Empty feedback list loads successfully', () async {
      when(() => dio.get<dynamic>('/Feedback/my-parking'))
          .thenAnswer((_) async => Response<dynamic>(
                requestOptions:
                    RequestOptions(path: '/Feedback/my-parking'),
                statusCode: 200,
                data: <dynamic>[],
              ));

      final result = await repository.getMyParkingFeedback();

      expect(result, isEmpty);

      verify(() => dio.get<dynamic>('/Feedback/my-parking')).called(1);
    });

    test('FB-M02: All feedback endpoint returns an empty list', () async {
      when(() => dio.get<dynamic>('/Feedback'))
          .thenAnswer((_) async => Response<dynamic>(
                requestOptions: RequestOptions(path: '/Feedback'),
                statusCode: 200,
                data: <dynamic>[],
              ));

      final result = await repository.getAll();

      expect(result, isEmpty);
      verify(() => dio.get<dynamic>('/Feedback')).called(1);
    });

    test('FB-M03: Network failure is propagated', () async {
      when(() => dio.get<dynamic>('/Feedback/my-parking'))
          .thenThrow(DioException(
        requestOptions: RequestOptions(path: '/Feedback/my-parking'),
        type: DioExceptionType.connectionError,
        message: 'Connection failed',
      ));

      await expectLater(
        repository.getMyParkingFeedback(),
        throwsA(isA<DioException>()),
      );
    });

    test('FB-M04: Unauthorized response is propagated', () async {
      when(() => dio.get<dynamic>('/Feedback/my-parking'))
          .thenThrow(DioException(
        requestOptions: RequestOptions(path: '/Feedback/my-parking'),
        response: Response<dynamic>(
          requestOptions: RequestOptions(path: '/Feedback/my-parking'),
          statusCode: 401,
          data: {'message': 'Unauthorized'},
        ),
        type: DioExceptionType.badResponse,
      ));

      await expectLater(
        repository.getMyParkingFeedback(),
        throwsA(
          isA<DioException>().having(
            (error) => error.response?.statusCode,
            'statusCode',
            401,
          ),
        ),
      );
    });

    test('FB-M05: Delete sends the correct API request', () async {
      const feedbackId = 'feedback-test-123';

      when(() => dio.delete<dynamic>('/Feedback/$feedbackId'))
          .thenAnswer((_) async => Response<dynamic>(
                requestOptions:
                    RequestOptions(path: '/Feedback/$feedbackId'),
                statusCode: 204,
              ));

      await repository.remove(feedbackId);

      verify(
        () => dio.delete<dynamic>('/Feedback/$feedbackId'),
      ).called(1);
    });
  });
}
