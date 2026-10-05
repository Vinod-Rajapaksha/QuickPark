import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile_app/features/driver/presentation/screens/driver_bookings_screen.dart';
import 'package:mobile_app/features/feedback/presentation/providers/feedback_provider.dart';
import 'package:mobile_app/features/feedback/presentation/widgets/parking_feedback_dialog.dart';

class FeedbackPromptManager extends ConsumerStatefulWidget {
  final Widget child;
  const FeedbackPromptManager({super.key, required this.child});

  @override
  ConsumerState<FeedbackPromptManager> createState() => _FeedbackPromptManagerState();
}

class _FeedbackPromptManagerState extends ConsumerState<FeedbackPromptManager> {
  bool _checked = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkFeedback();
    });
  }

  Future<void> _checkFeedback() async {
    if (_checked) return;
    _checked = true;

    try {
      final bookings = await ref.read(myReservationsProvider.future);
      final feedbacks = await ref.read(myParkingFeedbackProvider.future);

      final checkedOutBookings = bookings.where((b) => b['status'] == 'CHECKED_OUT').toList();
      
      final prefs = await SharedPreferences.getInstance();
      
      for (var booking in checkedOutBookings) {
        final resId = booking['id'] ?? booking['reservationId'];
        final hasFeedback = feedbacks.any((f) => f.reservationId == resId);
        
        final skipKey = 'skip_feedback_$resId';
        final hasSkipped = prefs.getBool(skipKey) ?? false;

        if (!hasFeedback && !hasSkipped) {
          if (mounted) {
            await showDialog(
              context: context,
              barrierDismissible: false,
              builder: (ctx) => WillPopScope(
                onWillPop: () async {
                  prefs.setBool(skipKey, true);
                  return true;
                },
                child: _InterceptCancelDialog(
                  onCancel: () => prefs.setBool(skipKey, true),
                  child: ParkingFeedbackDialog(
                    parkingId: booking['parkingId'] ?? booking['facilityId'] ?? '',
                    reservationId: resId,
                  ),
                ),
              ),
            );
          }
          break;
        }
      }
    } catch (e) {
    }
  }

  @override
  Widget build(BuildContext context) {
    return widget.child;
  }
}

class _InterceptCancelDialog extends StatefulWidget {
  final Widget child;
  final VoidCallback onCancel;

  const _InterceptCancelDialog({required this.child, required this.onCancel});

  @override
  State<_InterceptCancelDialog> createState() => _InterceptCancelDialogState();
}

class _InterceptCancelDialogState extends State<_InterceptCancelDialog> {
  @override
  void dispose() {
    widget.onCancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return widget.child;
  }
}
