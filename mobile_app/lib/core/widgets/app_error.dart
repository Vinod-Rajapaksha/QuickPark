import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'app_button.dart';

class AppErrorHandler {
  /// The API answers failures with `{ "message": ... }`, so that text is shown
  /// as-is; anything else falls back to a transport-level explanation.
  static String messageFrom(
    Object error, {
    String fallback = 'Something went wrong. Please try again.',
  }) {
    if (error is DioException) {
      final data = error.response?.data;
      if (data is Map) {
        final message = data['message'] ?? data['detail'] ?? data['title'];
        if (message is String && message.isNotEmpty) return message;
      }

      switch (error.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.sendTimeout:
        case DioExceptionType.receiveTimeout:
          return 'The server took too long to answer. Try again.';
        case DioExceptionType.connectionError:
          return 'Cannot reach the server. Check your connection.';
        default:
          final status = error.response?.statusCode;
          if (status == 404) return 'That record was not found.';
          if (status == 401 || status == 403) {
            return 'You are not allowed to do that from this account.';
          }
      }
    }

    return fallback;
  }

  static void showSnackBar(
    BuildContext context,
    String message, {
    bool isError = true,
  }) {
    if (!context.mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.red : Colors.green,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  /// Awaitable so a caller that paused the camera can resume it exactly when
  /// the sheet goes away, however the owner closed it.
  static Future<void> showErrorModal({
    required BuildContext context,
    required String title,
    required String message,
    required VoidCallback onRetry,
  }) async {
    await showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 24),
              const Icon(
                Icons.error_outline_rounded,
                color: Colors.redAccent,
                size: 64,
              ),
              const SizedBox(height: 16),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                message,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey.shade600,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 24),
              AppButton(
                label: 'Try Again / Rescan',
                onPressed: () {
                  Navigator.of(context, rootNavigator: true).pop();
                  onRetry();
                },
                backgroundColor: Colors.blueAccent,
              ),
              const SizedBox(height: 12),
            ],
          ),
        );
      },
    );
  }
}
