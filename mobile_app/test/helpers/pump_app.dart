import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

extension PumpApp on WidgetTester {
  Future<void> pumpApp(Widget widget, {List overrides = const []}) async {
    return pumpWidget(
      ProviderScope(
        overrides: List.from(overrides),
        child: MaterialApp(home: Scaffold(body: widget)),
      ),
    );
  }
}
