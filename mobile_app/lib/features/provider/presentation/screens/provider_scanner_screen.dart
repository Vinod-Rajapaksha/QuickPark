import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:visibility_detector/visibility_detector.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile_app/core/widgets/app_button.dart';
import 'package:mobile_app/features/provider/domain/reservation_repository.dart';
import 'package:mobile_app/features/provider/presentation/providers/reservation_provider.dart';
import 'package:mobile_app/features/provider/presentation/widgets/reservation_scan_modal.dart';
import 'package:mobile_app/features/reservations/domain/models/reservation.dart';
import 'package:mobile_app/features/reservations/domain/reservation_qr_codec.dart';
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

    final reservationId = ReservationQrCodec.decode(rawCode);

    setState(() {
      _isProcessing = true;
      _isScannerActive = false;
    });

    _pauseScanner();

    try {
      if (reservationId == null) {
        await _showFailure(
          'Not a QuickPark ticket',
          'This code is not a QuickPark reservation. Scan the QR the driver '
              'was shown at booking time.',
        );
        return;
      }

      final reservation = await ref
          .read(reservationRepositoryProvider)
          .getReservationById(reservationId);

      if (mounted) await _showReservationModal(reservation);
    } catch (error) {
      if (mounted) {
        await _showFailure(
          'Verification Failed',
          AppErrorHandler.messageFrom(
            error,
            fallback:
                'No reservation matches this code, or the server could not be '
                'reached.',
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isProcessing = false;
          _isScannerActive = true;
        });
        _resumeScanner();
      }
    }
  }

  Future<void> _showFailure(String title, String message) {
    return AppErrorHandler.showErrorModal(
      context: context,
      title: title,
      message: message,
      // Closing the sheet is the retry: the scanner restarts in the finally
      // block of _handleBarcode.
      onRetry: () {},
    );
  }

  Future<void> _showReservationModal(Reservation reservation) async {
    await showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetContext) {
        return ReservationScanModal(
          reservation: reservation,
          onAction: _runAction,
        );
      },
    );
  }

  /// The server owns the booking transition, so the sheet only closes once the
  /// action has come back, and the rule the server refused is shown verbatim.
  Future<void> _runAction(Reservation reservation, String action) async {
    final notifier = ref.read(reservationActionProvider.notifier);
    final isCheckOut = action == 'check-out';

    try {
      final updated = isCheckOut
          ? await notifier.checkOut(reservation.reservationId)
          : await notifier.checkIn(reservation.reservationId);

      if (!mounted) return;
      Navigator.of(context, rootNavigator: true).pop();
      AppErrorHandler.showSnackBar(
        context,
        isCheckOut
            ? '${updated.driverName} checked out.'
            : '${updated.driverName} checked in.',
        isError: false,
      );
    } catch (error) {
      if (!mounted) return;
      AppErrorHandler.showSnackBar(
        context,
        AppErrorHandler.messageFrom(
          error,
          fallback: 'The booking could not be updated.',
        ),
      );
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
              errorBuilder: (context, error) =>
                  _CameraErrorView(error: error, onRetry: _resumeScanner),
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

/// A denied or broken camera used to leave the owner on a black screen with no
/// explanation; the plugin reports the reason, so it is shown with a retry.
class _CameraErrorView extends StatelessWidget {
  final MobileScannerException error;
  final VoidCallback onRetry;

  const _CameraErrorView({required this.error, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    final isPermissionDenied =
        error.errorCode == MobileScannerErrorCode.permissionDenied;

    return Container(
      color: Colors.black,
      padding: const EdgeInsets.all(32),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              isPermissionDenied
                  ? Icons.no_photography_outlined
                  : Icons.videocam_off_outlined,
              color: Colors.white,
              size: 48,
            ),
            const SizedBox(height: 16),
            Text(
              isPermissionDenied
                  ? 'Camera access needed'
                  : 'Camera unavailable',
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              isPermissionDenied
                  ? 'Allow camera access for QuickPark in your device settings, '
                        'then try again.'
                  : error.errorCode == MobileScannerErrorCode.unsupported
                  ? 'This device cannot scan QR codes.'
                  : 'The camera could not be started. Try again.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.8),
                fontSize: 14,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 24),
            AppButton(
              label: 'Try again',
              icon: Icons.refresh,
              onPressed: onRetry,
              backgroundColor: Colors.blueAccent,
              foregroundColor: Colors.white,
            ),
          ],
        ),
      ),
    );
  }
}
