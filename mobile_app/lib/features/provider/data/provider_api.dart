import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/core/network/api_client.dart';

final providerApiProvider = Provider<ProviderApi>((ref) {
  return ProviderApi(ref.read(dioProvider));
});

class ProviderApi {
  final Dio _dio;

  ProviderApi(this._dio);

  Future<ProviderVerificationProfile> getMyProfile() async {
    final response = await _dio.get('/Providers/me');
    return ProviderVerificationProfile.fromJson(
      response.data as Map<String, dynamic>,
    );
  }

  /// Posts the NIC as `multipart/form-data` with the field name the API binds
  /// (`IFormFile file`). The server rejects anything over 5 MB or not JPG/PNG.
  Future<ProviderVerificationProfile> uploadNic({
    required String filePath,
    required String fileName,
  }) async {
    final form = FormData.fromMap({
      'file': await MultipartFile.fromFile(filePath, filename: fileName),
    });

    final response = await _dio.post('/Providers/me/nic', data: form);
    return ProviderVerificationProfile.fromJson(
      response.data as Map<String, dynamic>,
    );
  }
}

/// The owner's own profile and its verification state, as `GET /Providers/me`
/// returns it.
class ProviderVerificationProfile {
  const ProviderVerificationProfile({
    required this.providerId,
    required this.fullName,
    required this.email,
    required this.phone,
    required this.nicNumber,
    required this.businessName,
    required this.verificationStatus,
    required this.verificationRemarks,
    required this.hasNicDocument,
    required this.nicDocumentUrl,
    required this.nicSubmittedAt,
  });

  final String providerId;
  final String fullName;
  final String email;
  final String phone;
  final String nicNumber;
  final String? businessName;
  final String verificationStatus;
  final String? verificationRemarks;
  final bool hasNicDocument;
  final String? nicDocumentUrl;
  final DateTime? nicSubmittedAt;

  bool get isApproved => verificationStatus.toUpperCase() == 'APPROVED';
  bool get isRejected => verificationStatus.toUpperCase() == 'REJECTED';

  factory ProviderVerificationProfile.fromJson(Map<String, dynamic> json) {
    return ProviderVerificationProfile(
      providerId: json['providerId'] as String? ?? '',
      fullName: json['fullName'] as String? ?? '',
      email: json['email'] as String? ?? '',
      phone: json['phone'] as String? ?? '',
      nicNumber: json['nicNumber'] as String? ?? '',
      businessName: json['businessName'] as String?,
      verificationStatus: json['verificationStatus'] as String? ?? 'PENDING',
      verificationRemarks: json['verificationRemarks'] as String?,
      hasNicDocument: json['hasNicDocument'] as bool? ?? false,
      nicDocumentUrl: json['nicDocumentUrl'] as String?,
      nicSubmittedAt: json['nicSubmittedAt'] == null
          ? null
          : DateTime.parse(json['nicSubmittedAt'] as String),
    );
  }
}
