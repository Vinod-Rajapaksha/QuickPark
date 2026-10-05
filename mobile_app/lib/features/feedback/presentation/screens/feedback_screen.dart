import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/feedback_provider.dart';
import '../widgets/feedback_card.dart';
import '../widgets/system_feedback_dialog.dart';
import '../widgets/parking_feedback_dialog.dart';
import '../../../../core/widgets/app_error.dart';

class FeedbackScreen extends ConsumerWidget {
  const FeedbackScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final feedbackList = ref.watch(myParkingFeedbackProvider);

    ref.listen<AsyncValue<void>>(feedbackNotifierProvider, (previous, next) {
      next.whenOrNull(
        error: (error, stackTrace) {
          AppErrorHandler.showSnackBar(
            context,
            error.toString(),
            isError: true,
          );
        },
      );
    });

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Feedback'),
        actions: [
          IconButton(
            onPressed: () {
              showDialog(
                context: context,
                builder: (ctx) => const SystemFeedbackDialog(),
              );
            },
            icon: const Icon(Icons.add_comment),
            tooltip: 'Give System Feedback',
          ),
        ],
      ),
      body: feedbackList.when(
        data: (feedbacks) {
          if (feedbacks.isEmpty) {
            return const Center(child: Text('No parking feedback yet'));
          }
          return RefreshIndicator(
            onRefresh: () async {
              return ref.refresh(myParkingFeedbackProvider.future);
            },
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: feedbacks.length,
              itemBuilder: (context, index) {
                final feedback = feedbacks[index];
                return FeedbackCard(
                  feedback: feedback,
                  onEdit: () {
                    showDialog(
                      context: context,
                      builder: (ctx) =>
                          ParkingFeedbackDialog(feedback: feedback),
                    );
                  },
                  onDelete: () {
                    showDialog(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        actionsAlignment: MainAxisAlignment.center,
                        title: const Text('Delete Feedback?'),
                        content: const Text(
                          'Are you sure you want to delete this feedback?',
                        ),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(ctx),
                            child: const Text('Cancel'),
                          ),
                          TextButton(
                            onPressed: () async {
                              Navigator.pop(ctx);
                              await ref
                                  .read(feedbackNotifierProvider.notifier)
                                  .deleteFeedback(feedback.id);

                              if (context.mounted) {
                                final state = ref.read(
                                  feedbackNotifierProvider,
                                );
                                if (!state.hasError) {
                                  AppErrorHandler.showSnackBar(
                                    context,
                                    'Feedback deleted successfully',
                                    isError: false,
                                  );
                                }
                              }
                            },
                            child: const Text(
                              'Delete',
                              style: TextStyle(color: Colors.red),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                );
              },
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(child: Text('Error: $error')),
      ),
    );
  }
}
