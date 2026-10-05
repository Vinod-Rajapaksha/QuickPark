import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/feedback_request_models.dart';
import '../providers/feedback_provider.dart';
import '../../../../core/widgets/app_error.dart';

class SystemFeedbackDialog extends ConsumerStatefulWidget {
  const SystemFeedbackDialog({super.key});

  @override
  ConsumerState<SystemFeedbackDialog> createState() =>
      _SystemFeedbackDialogState();
}

class _SystemFeedbackDialogState extends ConsumerState<SystemFeedbackDialog> {
  int _rating = 0;
  final _commentController = TextEditingController();

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

    final request = CreateSystemFeedbackRequest(
      rating: _rating,
      comment: _commentController.text.trim(),
    );

    await ref.read(feedbackNotifierProvider.notifier).createSystemFeedback(request);
    
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
      'Thank you for your feedback!',
      isError: false,
    );
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = ref.watch(feedbackNotifierProvider).isLoading;

    return AlertDialog(
      actionsAlignment: MainAxisAlignment.center,
      title: const Text('Give System Feedback'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'How would you rate your overall experience with QuickPark?',
            ),
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
                onPressed: isLoading ? null : () => Navigator.of(context).pop(),
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
