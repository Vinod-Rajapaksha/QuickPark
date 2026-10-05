import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:screenshot/screenshot.dart';
import 'package:gal/gal.dart';
import '../../domain/reservation_qr_codec.dart';

class ReservationQrCode extends StatefulWidget {
  final String reservationId;

  const ReservationQrCode({super.key, required this.reservationId});

  @override
  State<ReservationQrCode> createState() => _ReservationQrCodeState();
}

class _ReservationQrCodeState extends State<ReservationQrCode> {
  final ScreenshotController _screenshotController = ScreenshotController();
  bool _isSaving = false;

  Future<void> _saveQrCode() async {
    setState(() {
      _isSaving = true;
    });

    try {
      final image = await _screenshotController.capture();
      if (image != null) {
        await Gal.putImageBytes(
          image,
          name: 'QuickPark_QR_${widget.reservationId}',
        );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('QR Code saved to gallery')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error saving QR Code: $e')));
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final payload = ReservationQrCodec.encode(widget.reservationId);

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Screenshot(
          controller: _screenshotController,
          child: Container(
            color: Colors.white,
            padding: const EdgeInsets.all(16.0),
            child: QrImageView(
              data: payload,
              version: QrVersions.auto,
              size: 200.0,
            ),
          ),
        ),
        const SizedBox(height: 16),
        ElevatedButton.icon(
          onPressed: _isSaving ? null : _saveQrCode,
          icon: _isSaving
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.download),
          label: Text(_isSaving ? 'Saving...' : 'Save QR to Gallery'),
        ),
      ],
    );
  }
}
