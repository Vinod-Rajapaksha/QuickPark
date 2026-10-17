
import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mobile_app/features/feedback/data/models/feedback_model.dart';
import 'package:mobile_app/features/feedback/presentation/providers/feedback_provider.dart';
import 'package:mobile_app/features/feedback/presentation/screens/feedback_screen.dart';

Future<void> pumpFeedbackScreen(
  WidgetTester tester,
  Future<List<FeedbackModel>> Function() loader,
) async {
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        myParkingFeedbackProvider.overrideWith(
          (ref) => loader(),
        ),
      ],
      child: const MaterialApp(
        home: FeedbackScreen(),
      ),
    ),
  );
}

void main() {
  group('Mobile Feedback Screen Widget Tests', () {
    testWidgets('FB-W01: Feedback screen shows correct title',
        (tester) async {
      await pumpFeedbackScreen(tester, () async => []);

      await tester.pumpAndSettle();

      expect(find.text('My Feedback'), findsOneWidget);
    });

    testWidgets('FB-W02: Empty feedback list shows empty message',
        (tester) async {
      await pumpFeedbackScreen(tester, () async => []);

      await tester.pumpAndSettle();

      expect(
        find.text('No parking feedback yet'),
        findsOneWidget,
      );
    });

    testWidgets('FB-W03: System Feedback action is available',
        (tester) async {
      await pumpFeedbackScreen(tester, () async => []);

      await tester.pumpAndSettle();

      expect(
        find.byIcon(Icons.add_comment),
        findsOneWidget,
      );

      expect(
        find.byTooltip('Give System Feedback'),
        findsOneWidget,
      );
    });

    testWidgets('FB-W04: Feedback loading indicator appears',
        (tester) async {
      final completer = Completer<List<FeedbackModel>>();

      await pumpFeedbackScreen(
        tester,
        () => completer.future,
      );

      await tester.pump();

      expect(
        find.byType(CircularProgressIndicator),
        findsOneWidget,
      );

      completer.complete([]);

      await tester.pumpAndSettle();

      expect(
        find.text('No parking feedback yet'),
        findsOneWidget,
      );
    });

    testWidgets('FB-W05: API error message is displayed',
        (tester) async {
      await pumpFeedbackScreen(
        tester,
        () async => throw Exception('Network unavailable'),
      );

      await tester.pumpAndSettle();

      expect(
        find.textContaining('Error:'),
        findsOneWidget,
      );

      expect(
        find.textContaining('Network unavailable'),
        findsOneWidget,
      );
    });

    testWidgets('FB-W06: User can open System Feedback dialog',
        (tester) async {
      await pumpFeedbackScreen(tester, () async => []);

      await tester.pumpAndSettle();

      await tester.tap(
        find.byTooltip('Give System Feedback'),
      );

      await tester.pumpAndSettle();

      expect(
        find.byType(Dialog),
        findsWidgets,
      );
    });
  });
}
