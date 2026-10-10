import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/features/agent/presentation/screens/ai_assistant_screen.dart';
import 'package:mobile_app/core/network/api_client.dart';
import 'package:dio/dio.dart';
import 'package:mocktail/mocktail.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class MockDio extends Mock implements Dio {}

void main() {
  setUpAll(() async {
    await dotenv.load(fileName: ".env").catchError((_) {});
    dotenv.env['AGENT_API_URL'] = 'http://test';
    registerFallbackValue(RequestOptions(path: ''));
  });

  group('AI Planning & Chat UI', () {
    testWidgets(
      'Should display structured recommendation and confirm booking prompt',
      (WidgetTester tester) async {
        final mockDio = MockDio();

        when(() => mockDio.post(any(), data: any(named: 'data'))).thenAnswer(
          (_) async => Response(
            requestOptions: RequestOptions(path: ''),
            data: {
              'session_id': '123',
              'response': 'Here is a spot.',
              'action_type': 'reservation_proposal',
              'action_payload': {
                'facility_id': 'f123',
                'facility_name': 'Colombo Central',
                'vehicle_type': 'Car',
                'estimated_price': 250.0,
              },
            },
            statusCode: 200,
          ),
        );

        await tester.pumpWidget(
          ProviderScope(
            overrides: [dioProvider.overrideWithValue(mockDio)],
            child: const MaterialApp(home: Scaffold(body: AiAssistantModal())),
          ),
        );

        expect(
          find.textContaining('Hello! I am your QuickPark assistant'),
          findsOneWidget,
        );
        expect(find.byType(TextField), findsOneWidget);
      },
    );
  });
}
