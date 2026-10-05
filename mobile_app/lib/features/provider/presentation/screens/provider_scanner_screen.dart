import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:visibility_detector/visibility_detector.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile_app/core/network/api_client.dart';
import 'package:mobile_app/features/provider/presentation/widgets/reservation_scan_modal.dart';
import 'package:mobile_app/core/widgets/app_error.dart';
import 'package:mobile_app/core/widgets/app_loader.dart';

class ScannerOverlay extends CustomPainter {
  final Rect scanWindow;
  final double borderRadius;

  ScannerOverlay({required this.scanWindow, this.borderRadius = 24.0});

  @override
  void paint(Canvas canvas, Size size) {
    final backgroundPath = Path()
      ..addRect(Rect.fromLTWH(0, 0, size.width, size.height));
    final cutoutPath = Path()
      ..addRRect(
        RRect.fromRectAndRadius(scanWindow, Radius.circular(borderRadius)),
      );

    final backgroundPaint = Paint()
      ..color = Colors.black.withValues(alpha: 0.65)
      ..style = PaintingStyle.fill;

    final overlayPath = Path.combine(
      PathOperation.difference,
      backgroundPath,
      cutoutPath,
    );
    canvas.drawPath(overlayPath, backgroundPaint);

    final borderPaint = Paint()
      ..color = Colors.blueAccent
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4.0
      ..strokeCap = StrokeCap.round;

    final cornerLength = 40.0;

    final cornerRadius = Radius.circular(borderRadius);

    // Top Left
    final topLeftPath = Path()
      ..moveTo(scanWindow.left, scanWindow.top + cornerLength)
      ..lineTo(scanWindow.left, scanWindow.top + borderRadius)
      ..arcToPoint(
        Offset(scanWindow.left + borderRadius, scanWindow.top),
        radius: cornerRadius,
        clockwise: true,
      )
      ..lineTo(scanWindow.left + cornerLength, scanWindow.top);
    canvas.drawPath(topLeftPath, borderPaint);

    // Top Right
    final topRightPath = Path()
      ..moveTo(scanWindow.right - cornerLength, scanWindow.top)
      ..lineTo(scanWindow.right - borderRadius, scanWindow.top)
      ..arcToPoint(
        Offset(scanWindow.right, scanWindow.top + borderRadius),
        radius: cornerRadius,
        clockwise: true,
      )
      ..lineTo(scanWindow.right, scanWindow.top + cornerLength);
    canvas.drawPath(topRightPath, borderPaint);

    // Bottom Right
    final bottomRightPath = Path()
      ..moveTo(scanWindow.right, scanWindow.bottom - cornerLength)
      ..lineTo(scanWindow.right, scanWindow.bottom - borderRadius)
      ..arcToPoint(
        Offset(scanWindow.right - borderRadius, scanWindow.bottom),
        radius: cornerRadius,
        clockwise: true,
      )
      ..lineTo(scanWindow.right - cornerLength, scanWindow.bottom);
    canvas.drawPath(bottomRightPath, borderPaint);

    // Bottom Left
    final bottomLeftPath = Path()
      ..moveTo(scanWindow.left + cornerLength, scanWindow.bottom)
      ..lineTo(scanWindow.left + borderRadius, scanWindow.bottom)
      ..arcToPoint(
        Offset(scanWindow.left, scanWindow.bottom - borderRadius),
        radius: cornerRadius,
        clockwise: true,
      )
      ..lineTo(scanWindow.left, scanWindow.bottom - cornerLength);
    canvas.drawPath(bottomLeftPath, borderPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class ProviderScannerScreen extends ConsumerStatefulWidget {
  const ProviderScannerScreen({super.key});

  @override
  ConsumerState<ProviderScannerScreen> createState() =>
      _ProviderScannerScreenState();
}

class _ProviderScannerScreenState extends ConsumerState<ProviderScannerScreen> {
  final MobileScannerController _scannerController = MobileScannerController(
    detectionSpeed: DetectionSpeed.normal,
    facing: CameraFacing.back,
    torchEnabled: false,
  );

  bool _isProcessing = false;
  bool _isScannerActive = true;
  bool _isTorchOn = false;

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
          message:
              'The scanned code is not associated with any active reservation. Please try again.',
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
          message:
              'Unable to verify QR code. Please check your network connection and try again.',
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
      final tokenResponse = await dio.post(
        '/Tokens/scan',
        data: {'token': code},
      );

      if (tokenResponse.statusCode == 200 && tokenResponse.data != null) {
        final resId = tokenResponse.data['reservationId'];
        if (resId == null) return null;

        final reservationId = resId.toString();

        final response = await dio.get('/reservations/$reservationId');
        if (response.statusCode == 200 && response.data != null) {
          return response.data as Map<String, dynamic>;
        }
      }
    } catch (_) {}
    return null;
  }

  Future<void> _updateStatus(
    String id,
    String action,
    Map<String, dynamic> currentData,
  ) async {
    final actionName = action == 'check-in' ? 'Check-In' : 'Check-Out';

    final bool? confirm = await showDialog<bool>(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('Confirm $actionName', textAlign: TextAlign.center),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Are you sure you want to $actionName this driver?',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.of(context).pop(true),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: action == 'check-in'
                        ? Colors.blue.shade600
                        : Colors.orange.shade600,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: const Text('Confirm', style: TextStyle(fontSize: 16)),
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: TextButton(
                  onPressed: () => Navigator.of(context).pop(false),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: const Text(
                    'Cancel',
                    style: TextStyle(color: Colors.grey, fontSize: 16),
                  ),
                ),
              ),
            ],
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        );
      },
    );

    if (confirm != true) return;

    try {
      final dio = ref.read(dioProvider);
      final endpoint = action == 'check-in'
          ? '/reservations/$id/check-in'
          : '/reservations/$id/check-out';
      final response = await dio.post(endpoint);

      if (mounted) {
        if (response.statusCode == 200) {
          Navigator.of(context, rootNavigator: true).pop();

          AppErrorHandler.showSnackBar(
            context,
            'Driver successfully ${action == 'check-in' ? 'checked in' : 'checked out'}!',
            isError: false,
          );
        } else {
          AppErrorHandler.showSnackBar(
            context,
            'Failed to $actionName. Please try again.',
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

  Future<void> _toggleTorch() async {
    await _scannerController.toggleTorch();
    setState(() {
      _isTorchOn = !_isTorchOn;
    });
  }

  Future<void> _scanFromGallery() async {
    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      final BarcodeCapture? barcodeCapture = await _scannerController
          .analyzeImage(image.path);
      if (barcodeCapture != null && barcodeCapture.barcodes.isNotEmpty) {
        _handleBarcode(barcodeCapture);
      } else {
        if (mounted) {
          AppErrorHandler.showSnackBar(
            context,
            'No QR Code found in the image.',
            isError: true,
          );
        }
      }
    }
  }

  Widget _buildControlButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    bool isActive = false,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isActive ? Colors.blueAccent : Colors.white24,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: Colors.white, size: 28),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final screenSize = MediaQuery.sizeOf(context);
    final scanWindowWidth = screenSize.width * 0.75;
    final scanWindow = Rect.fromCenter(
      center: screenSize.center(const Offset(0, -50)),
      width: scanWindowWidth,
      height: scanWindowWidth,
    );

    return VisibilityDetector(
      key: const Key('scanner-visibility'),
      onVisibilityChanged: (info) {
        if (info.visibleFraction == 0) {
          _scannerController.stop();
        } else if (info.visibleFraction > 0 &&
            _isScannerActive &&
            !_isProcessing) {
          _scannerController.start();
        }
      },
      child: Scaffold(
        backgroundColor: Colors.black,
        extendBodyBehindAppBar: true,
        appBar: AppBar(
          systemOverlayStyle: SystemUiOverlayStyle.light,
          backgroundColor: Colors.transparent,
          elevation: 0,
          title: const Text(
            'Scan QR Code',
            style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
          ),
          centerTitle: true,
        ),
        body: Stack(
          fit: StackFit.expand,
          children: [
            MobileScanner(
              controller: _scannerController,
              scanWindow: scanWindow,
              onDetect: _handleBarcode,
            ),
            CustomPaint(painter: ScannerOverlay(scanWindow: scanWindow)),
            if (_isProcessing)
              Container(
                color: Colors.black54,
                child: const Center(
                  child: AppLoader(color: Colors.blueAccent, size: 50),
                ),
              ),
            // Floating controls
            Positioned(
              bottom: 160,
              left: 0,
              right: 0,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _buildControlButton(
                    icon: Icons.image_outlined,
                    label: 'Gallery',
                    onTap: _scanFromGallery,
                  ),
                  _buildControlButton(
                    icon: _isTorchOn ? Icons.flash_on : Icons.flash_off,
                    label: 'Flash',
                    onTap: _toggleTorch,
                    isActive: _isTorchOn,
                  ),
                ],
              ),
            ),
            // Instruction Text
            Positioned(
              top: scanWindow.top - 90,
              left: 0,
              right: 0,
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 12,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.black45,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    _isScannerActive
                        ? 'Align QR Code inside the frame'
                        : 'Camera paused',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
