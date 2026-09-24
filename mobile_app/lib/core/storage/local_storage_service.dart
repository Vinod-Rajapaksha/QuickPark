import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

final localStorageProvider = Provider<LocalStorageService>((ref) {
  throw UnimplementedError('LocalStorageService must be initialized in main');
});

class LocalStorageService {
  final SharedPreferences _prefs;

  LocalStorageService(this._prefs);

  static const String _hasSeenOnboardingKey = 'has_seen_onboarding';

  Future<void> setHasSeenOnboarding(bool value) async {
    await _prefs.setBool(_hasSeenOnboardingKey, value);
  }

  bool get hasSeenOnboarding {
    return _prefs.getBool(_hasSeenOnboardingKey) ?? false;
  }
}
