import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile_app/core/widgets/app_button.dart';
import 'package:mobile_app/core/widgets/app_error.dart';
import 'package:mobile_app/core/widgets/app_loader.dart';
import 'package:mobile_app/features/provider/data/provider_api.dart';
import 'package:mobile_app/features/provider/presentation/providers/provider_verification_provider.dart';

/// The Parking Owner's NIC verification: what the admin sees, what is still
/// missing, and the upload that moves the profile to PENDING. An approved
/// profile cannot re-upload; only support can reset it.
class ProviderVerificationScreen extends ConsumerWidget {
  const ProviderVerificationScreen({super.key});

  static const int _maxBytes = 5 * 1024 * 1024;

  Future<void> _pickAndUpload(
    BuildContext context,
    WidgetRef ref,
    ImageSource source,
  ) async {
    final picked = await ImagePicker().pickImage(
      source: source,
      maxWidth: 2000,
      imageQuality: 85,
    );
    if (picked == null || !context.mounted) return;

    final name = picked.name.toLowerCase();
    if (!(name.endsWith('.jpg') ||
        name.endsWith('.jpeg') ||
        name.endsWith('.png'))) {
      AppErrorHandler.showSnackBar(
        context,
        'Only JPG and PNG images are allowed.',
      );
      return;
    }

    if (await picked.length() > _maxBytes) {
      if (!context.mounted) return;
      AppErrorHandler.showSnackBar(
        context,
        'The image must be 5 MB or smaller.',
      );
      return;
    }

    try {
      await ref.read(nicUploadProvider.notifier).upload(picked);
      if (context.mounted) {
        AppErrorHandler.showSnackBar(
          context,
          'NIC submitted for verification.',
          isError: false,
        );
      }
    } catch (error) {
      if (context.mounted) {
        AppErrorHandler.showSnackBar(
          context,
          AppErrorHandler.messageFrom(
            error,
            fallback: 'The upload failed. Please try again.',
          ),
        );
      }
    }
  }

  Widget _buildStatusCard(
    BuildContext context,
    ProviderVerificationProfile profile,
  ) {
    final theme = Theme.of(context);
    final status = profile.verificationStatus.toUpperCase();
    final isApproved = profile.isApproved;
    final isRejected = profile.isRejected;
    final accent = isApproved
        ? Colors.green
        : isRejected
        ? theme.colorScheme.error
        : theme.colorScheme.primary;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: accent.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: accent.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                isApproved
                    ? CupertinoIcons.checkmark_seal_fill
                    : isRejected
                    ? CupertinoIcons.xmark_seal_fill
                    : CupertinoIcons.clock_fill,
                color: accent,
                size: 22,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Verification status: $status',
                  style: TextStyle(
                    color: accent,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ),
            ],
          ),
          if (profile.verificationRemarks != null &&
              profile.verificationRemarks!.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              profile.verificationRemarks!,
              style: TextStyle(
                color: theme.colorScheme.onSurface.withValues(alpha: 0.8),
                fontSize: 14,
                height: 1.4,
              ),
            ),
          ],
          if (profile.nicSubmittedAt != null) ...[
            const SizedBox(height: 8),
            Text(
              'Submitted ${profile.nicSubmittedAt!.toString().split('.').first}',
              style: TextStyle(
                color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                fontSize: 12,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildRow(BuildContext context, String label, String value) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 130,
            child: Text(
              label,
              style: TextStyle(
                color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                fontSize: 14,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value.isEmpty ? '—' : value,
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(providerVerificationProvider);
    final uploadState = ref.watch(nicUploadProvider);
    final themePrimary = Theme.of(context).primaryColor;

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(
        title: const Text('Verification Documents'),
        centerTitle: true,
      ),
      body: SafeArea(
        child: profileAsync.when(
          loading: () => const Center(child: AppLoader()),
          error: (error, _) => Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  AppErrorHandler.messageFrom(
                    error,
                    fallback: 'Your verification details could not be loaded.',
                  ),
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
                const SizedBox(height: 20),
                AppButton(
                  label: 'Try again',
                  icon: CupertinoIcons.arrow_clockwise,
                  onPressed: () => ref.invalidate(providerVerificationProvider),
                ),
              ],
            ),
          ),
          data: (profile) => SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 40),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildStatusCard(context, profile),
                const SizedBox(height: 24),

                Text(
                  'Account',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: themePrimary,
                  ),
                ),
                const SizedBox(height: 8),
                _buildRow(context, 'Full name', profile.fullName),
                _buildRow(context, 'Email', profile.email),
                _buildRow(context, 'Phone', profile.phone),
                _buildRow(context, 'NIC number', profile.nicNumber),
                _buildRow(context, 'Business', profile.businessName ?? ''),

                const SizedBox(height: 24),
                Text(
                  'NIC document',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: themePrimary,
                  ),
                ),
                const SizedBox(height: 8),
                if (profile.hasNicDocument && profile.nicDocumentUrl != null)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: Image.network(
                      profile.nicDocumentUrl!,
                      height: 200,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      errorBuilder: (context, _, _) => Container(
                        height: 80,
                        alignment: Alignment.center,
                        color: Colors.grey.shade100,
                        child: Text(
                          'The stored document could not be displayed.',
                          style: TextStyle(color: Colors.grey.shade700),
                        ),
                      ),
                    ),
                  )
                else
                  Text(
                    'No NIC document has been uploaded yet.',
                    style: TextStyle(color: Colors.grey.shade700, fontSize: 14),
                  ),

                const SizedBox(height: 24),
                if (profile.isApproved)
                  Text(
                    'Your profile is verified. Contact support to change the '
                    'NIC document on file.',
                    style: TextStyle(
                      color: Colors.grey.shade700,
                      fontSize: 14,
                      height: 1.4,
                    ),
                  )
                else
                  Column(
                    children: [
                      AppButton(
                        label: profile.hasNicDocument
                            ? 'Replace NIC photo'
                            : 'Upload NIC photo',
                        icon: CupertinoIcons.camera_fill,
                        isLoading: uploadState.isLoading,
                        onPressed: () =>
                            _pickAndUpload(context, ref, ImageSource.camera),
                      ),
                      const SizedBox(height: 12),
                      AppButton(
                        label: 'Choose from gallery',
                        icon: CupertinoIcons.photo_on_rectangle,
                        isLoading: uploadState.isLoading,
                        backgroundColor: Colors.grey.shade200,
                        foregroundColor: Colors.black87,
                        onPressed: () =>
                            _pickAndUpload(context, ref, ImageSource.gallery),
                      ),
                    ],
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
