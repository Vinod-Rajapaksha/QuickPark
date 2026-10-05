import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/feedback_model.dart';
import '../../data/models/feedback_enums.dart';
import '../../data/models/feedback_request_models.dart';
import '../providers/feedback_provider.dart';
import '../../../../core/widgets/app_error.dart';

class ParkingFeedbackDialog extends ConsumerStatefulWidget {
  final FeedbackModel? feedback;
  final String? parkingId;
  final String? reservationId;
  final VoidCallback? onSkip;

  const ParkingFeedbackDialog({
    super.key,
    this.feedback,
    this.parkingId,
    this.reservationId,
    this.onSkip,
  });

  @override
  ConsumerState<ParkingFeedbackDialog> createState() =>
      _ParkingFeedbackDialogState();
}

class _ParkingFeedbackDialogState extends ConsumerState<ParkingFeedbackDialog> {
  int _rating = 0;
  final _commentController = TextEditingController();
  final Set<FeedbackKeywordType> _selectedKeywords = {};

  @override
  void initState() {
    super.initState();
    if (widget.feedback != null) {
      _rating = widget.feedback!.rating;
      _commentController.text = widget.feedback!.comment ?? '';
      _selectedKeywords.addAll(widget.feedback!.keywords);
    }
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_rating == 0) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Please select a rating')));
      return;
    }

    if (widget.feedback == null) {
      if (widget.parkingId == null || widget.reservationId == null) {
        return;
      }
      final request = CreateParkingFeedbackRequest(
        parkingId: widget.parkingId!,
        reservationId: widget.reservationId!,
        rating: _rating,
        comment: _commentController.text.trim(),
        keywords: _selectedKeywords.toList(),
      );
      await ref
          .read(feedbackNotifierProvider.notifier)
          .createParkingFeedback(request);
    } else {
      final request = UpdateFeedbackRequest(
        rating: _rating,
        comment: _commentController.text.trim(),
        keywords: _selectedKeywords.toList(),
      );
      await ref
          .read(feedbackNotifierProvider.notifier)
          .updateFeedback(widget.feedback!.id, request);
    }

    if (!mounted) return;

    final state = ref.read(feedbackNotifierProvider);
    if (state.hasError) {
      AppErrorHandler.showSnackBar(
        context,
        state.error.toString(),
        isError: true,
      );
      return;
    }

    AppErrorHandler.showSnackBar(
      context,
      'Feedback submitted successfully!',
      isError: false,
    );
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = ref.watch(feedbackNotifierProvider).isLoading;

    return AlertDialog(
      actionsAlignment: MainAxisAlignment.center,
      title: Text(widget.feedback == null ? 'Rate Parking' : 'Edit Rating'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('How was your parking experience?'),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(5, (index) {
                return IconButton(
                  icon: Icon(
                    index < _rating ? Icons.star : Icons.star_border,
                    color: Colors.amber,
                    size: 32,
                  ),
                  onPressed: () {
                    setState(() {
                      _rating = index + 1;
                    });
                  },
                );
              }),
            ),
            const SizedBox(height: 16),
            const Text('Keywords (Optional)'),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: FeedbackKeywordType.values.map((keyword) {
                final isSelected = _selectedKeywords.contains(keyword);
                return FilterChip(
                  label: Text(keyword.displayName),
                  selected: isSelected,
                  onSelected: (selected) {
                    setState(() {
                      if (selected) {
                        _selectedKeywords.add(keyword);
                      } else {
                        _selectedKeywords.remove(keyword);
                      }
                    });
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _commentController,
              decoration: const InputDecoration(
                labelText: 'Additional Comments',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: isLoading ? null : _submit,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: isLoading
                    ? const SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Submit', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: TextButton(
                onPressed: isLoading ? null : () {
                  if (widget.onSkip != null) {
                    widget.onSkip!();
                  } else {
                    Navigator.of(context).pop();
                  }
                },
                style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                child: const Text('Cancel', style: TextStyle(color: Colors.grey, fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
