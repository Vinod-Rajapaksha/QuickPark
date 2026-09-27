import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:visibility_detector/visibility_detector.dart';
import 'package:mobile_app/core/network/api_client.dart';
import 'package:mobile_app/features/provider/presentation/widgets/reservation_scan_modal.dart';
import 'package:mobile_app/core/widgets/app_error.dart';
import 'package:mobile_app/core/widgets/app_loader.dart';

class ProviderScannerScreen extends ConsumerStatefulWidget {
  const ProviderScannerScreen({super.key});

  @override
  ConsumerState<ProviderScannerScreen> createState() => _ProviderScannerScreenState();
}

class _ProviderScannerScreenState extends ConsumerState<ProviderScannerScreen> {
  final MobileScannerController _scannerController = MobileScannerController(
    detectionSpeed: DetectionSpeed.normal,
    facing: CameraFacing.back,
    torchEnabled: false,
  );

  bool _isProcessing = false;
  bool _isScannerActive = true;

  @override
  void dispose() {
    _scannerController.dispose();
    super.dispose();
  }

  void _pauseScanner() {
    _scannerController.stop();
  }

  void _resumeScanner() {
    _scannerController.start();
  }

  Future<void> _handleBarcode(BarcodeCapture capture) async {
    if (_isProcessing || !_isScannerActive) return;

    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isEmpty) return;

    final String? rawCode = barcodes.first.rawValue;
    if (rawCode == null || rawCode.isEmpty) return;

    setState(() {
      _isProcessing = true;
      _isScannerActive = false;
    });

    _pauseScanner();

    try {
      final data = await _fetchReservationDetails(rawCode);
      if (data != null && mounted) {
        await _showReservationModal(data);
      } else if (mounted) {
        AppErrorHandler.showErrorModal(
          context: context,
          title: 'Invalid QR Code',
          message: 'The scanned code is not associated with any active reservation. Please try again.',
          onRetry: () {
            if (mounted) {
              _isScannerActive = true;
              _resumeScanner();
            }
          },
        );
      }
    } catch (e) {
      if (mounted) {
        AppErrorHandler.showErrorModal(
          context: context,
          title: 'Verification Failed',
          message: 'Unable to verify QR code. Please check your network connection and try again.',
          onRetry: () {
            if (mounted) {
              _isScannerActive = true;
              _resumeScanner();
            }
          },
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isProcessing = false;
        });
      }
    }
  }

  Future<Map<String, dynamic>?> _fetchReservationDetails(String code) async {
    try {
      final dio = ref.read(dioProvider);
      final response = await dio.get('/reservations/scan/$code');
      if (response.statusCode == 200 && response.data != null) {
        return response.data as Map<String, dynamic>;
      }
    } catch (_) {}
    return null;
  }

  Future<void> _updateStatus(
    String id,
    String action,
    Map<String, dynamic> currentData,
  ) async {
    try {
      final dio = ref.read(dioProvider);
      final response = await dio.put(
        '/reservations/$id/status',
        data: {'action': action},
      );

      if (mounted) {
        if (response.statusCode == 200) {
          AppErrorHandler.showSnackBar(
            context,
            'Reservation action ($action) processed successfully!',
            isError: false,
          );
        } else {
          AppErrorHandler.showSnackBar(
            context,
            'Failed to update status. Please try again.',
            isError: true,
          );
        }
      }
    } catch (e) {
      if (mounted) {
        AppErrorHandler.showSnackBar(
          context,
          'Error updating status: $e',
          isError: true,
        );
      }
    }
  }

  Future<void> _showReservationModal(Map<String, dynamic> data) async {
    await showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return ReservationScanModal(data: data, onUpdateStatus: _updateStatus);
      },
    );

    if (mounted) {
      _isScannerActive = true;
      _resumeScanner();
    }
  }

  @override
  Widget build(BuildContext context) {
    return VisibilityDetector(
      key: const Key('scanner-visibility'),
      onVisibilityChanged: (info) {
        if (info.visibleFraction == 0) {
          _scannerController.stop();
        } else if (info.visibleFraction > 0 && _isScannerActive && !_isProcessing) {
          _scannerController.start();
        }
      },
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          systemOverlayStyle: SystemUiOverlayStyle.dark,
          title: const Text(
            'Scan QR Code',
            style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black87),
          ),
          backgroundColor: Colors.white,
          elevation: 0,
          centerTitle: true,
        ),
        body: SafeArea(
          child: Column(
            children: [
              const SizedBox(height: 40),
              
              // Instruction Text
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  _isScannerActive
                      ? 'Align QR Code inside the frame'
                      : 'Camera is paused to save battery',
                  style: TextStyle(
                    color: Colors.blue.shade800,
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
              ),
              
              const SizedBox(height: 40),
              
              // Scanner Box Container
              Center(
                child: Container(
                  width: 260,
                  height: 260,
                  decoration: BoxDecoration(
                    color: Colors.black,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.08),
                        blurRadius: 20,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(24),
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        MobileScanner(
                          controller: _scannerController,
                          onDetect: _handleBarcode,
                        ),
                        if (_isProcessing)
                          Container(
                            color: Colors.black54,
                            child: const Center(
                              child: AppLoader(color: Colors.white, size: 40),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              ),
              
              const Spacer(),
            ],
          ),
        ),
      ),
    );
  }
}
