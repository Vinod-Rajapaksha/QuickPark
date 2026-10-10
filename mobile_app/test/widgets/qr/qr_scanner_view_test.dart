import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/features/provider/presentation/screens/provider_scanner_screen.dart';
import 'package:visibility_detector/visibility_detector.dart';

void main() {
  setUpAll(() {
    VisibilityDetectorController.instance.updateInterval = Duration.zero;
  });

  group('QR Scanner View', () {
    testWidgets('Scanner screen should render', (WidgetTester tester) async {
      await tester.pumpWidget(
        const ProviderScope(child: MaterialApp(home: ProviderScannerScreen())),
      );

      await tester.pump();

      expect(find.byType(ProviderScannerScreen), findsOneWidget);

      await tester.pumpWidget(const SizedBox());
    });
  });
}
