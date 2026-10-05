import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile_app/features/provider/data/provider_api.dart';

final providerVerificationProvider =
    FutureProvider.autoDispose<ProviderVerificationProfile>((ref) {
      return ref.read(providerApiProvider).getMyProfile();
    });

class NicUploadNotifier extends Notifier<AsyncValue<void>> {
  @override
  AsyncValue<void> build() {
    return const AsyncData(null);
  }

  Future<void> upload(XFile image) async {
    state = const AsyncLoading();
    try {
      await ref
          .read(providerApiProvider)
          .uploadNic(filePath: image.path, fileName: image.name);
      ref.invalidate(providerVerificationProvider);
      state = const AsyncData(null);
    } catch (e, st) {
      state = AsyncError(e, st);
      rethrow;
    }
  }
}

final nicUploadProvider =
    NotifierProvider.autoDispose<NicUploadNotifier, AsyncValue<void>>(
      NicUploadNotifier.new,
    );
