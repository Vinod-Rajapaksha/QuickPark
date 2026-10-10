import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/features/admin/presentation/screens/admin_approvals_screen.dart';

void main() {
  group('Provider Approval & Governance', () {
    testWidgets('Admin Approvals Screen renders correctly', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        const ProviderScope(child: MaterialApp(home: AdminApprovalsScreen())),
      );

      await tester.pump();

      expect(find.byType(AdminApprovalsScreen), findsOneWidget);
      expect(find.byType(AdminApprovalsScreen), findsOneWidget);
    });
  });
}
