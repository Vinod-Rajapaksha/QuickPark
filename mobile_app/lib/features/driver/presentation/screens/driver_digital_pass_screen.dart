import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:intl/intl.dart';
import 'dart:async';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/core/network/api_client.dart';
import '../../../feedback/presentation/widgets/parking_feedback_dialog.dart';
import '../../../feedback/presentation/providers/feedback_provider.dart';

final qrTokenProvider = FutureProvider.family<String, String>((
  ref,
  reservationId,
) async {
  final dio = ref.watch(dioProvider);
  final res = await dio.get('/Tokens/reservation/$reservationId');
  return res.data['token'] as String;
});

class DriverDigitalPassScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic> booking;

  const DriverDigitalPassScreen({super.key, required this.booking});

  @override
  ConsumerState<DriverDigitalPassScreen> createState() =>
      _DriverDigitalPassScreenState();
}

class _DriverDigitalPassScreenState
    extends ConsumerState<DriverDigitalPassScreen> {
  late DateTime _endTime;
  Timer? _timer;
  Duration _timeLeft = Duration.zero;

  @override
  void initState() {
    super.initState();
    _endTime = DateTime.parse(widget.booking['endTime']);
    _updateTimer();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      _updateTimer();
    });
  }

  void _updateTimer() {
    final now = DateTime.now();
    setState(() {
      _timeLeft = _endTime.difference(now);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isExpired = _timeLeft.isNegative;

    return Scaffold(
      backgroundColor: theme.primaryColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(CupertinoIcons.clear, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Digital Pass',
          style: TextStyle(color: Colors.white),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            children: [
              _buildTicketCard(context, isExpired),
              const SizedBox(height: 32),
              _buildQuickActions(context, isExpired),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTicketCard(BuildContext context, bool isExpired) {
    final startTime = DateTime.parse(widget.booking['startTime']);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(24),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Row(
              children: [
                Icon(
                  CupertinoIcons.building_2_fill,
                  color: Theme.of(context).primaryColor,
                  size: 40,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.booking['facilityName'] ?? 'Parking',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        '${widget.booking['city']}, ${widget.booking['province']}',
                        style: TextStyle(color: Colors.grey.shade600),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Dashed Divider
          _buildDashedDivider(),

          // QR Code Section
          Padding(
            padding: const EdgeInsets.all(32.0),
            child: Column(
              children: [
                const Text(
                  'SCAN TO ENTER & EXIT',
                  style: TextStyle(
                    letterSpacing: 2,
                    color: Colors.grey,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 24),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border.all(color: Colors.grey.shade200, width: 2),
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: Consumer(
                    builder: (context, ref, _) {
                      final tokenAsync = ref.watch(
                        qrTokenProvider(widget.booking['reservationId']),
                      );
                      return tokenAsync.when(
                        data: (token) => QrImageView(
                          data: token,
                          version: QrVersions.auto,
                          size: 200.0,
                          dataModuleStyle: QrDataModuleStyle(
                            dataModuleShape: QrDataModuleShape.square,
                            color: isExpired ? Colors.grey : Colors.black,
                          ),
                          eyeStyle: QrEyeStyle(
                            eyeShape: QrEyeShape.square,
                            color: isExpired ? Colors.grey : Colors.black,
                          ),
                        ),
                        loading: () => const SizedBox(
                          height: 200,
                          width: 200,
                          child: Center(child: CircularProgressIndicator()),
                        ),
                        error: (err, _) => SizedBox(
                          height: 200,
                          width: 200,
                          child: Center(
                            child: Text(
                              'Error loading QR',
                              textAlign: TextAlign.center,
                              style: TextStyle(color: Colors.red.shade300),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  widget.booking['slotNumber'] ?? 'Any Bay',
                  style: const TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                Text(
                  'Assigned Bay',
                  style: TextStyle(color: Colors.grey.shade500),
                ),
              ],
            ),
          ),

          // Dashed Divider
          _buildDashedDivider(),

          // Details Section
          Padding(
            padding: const EdgeInsets.all(24.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildInfoCol(
                  'Entry',
                  DateFormat('hh:mm a').format(startTime),
                  DateFormat('MMM dd').format(startTime),
                ),
                _buildCountdown(isExpired),
                _buildInfoCol(
                  'Exit',
                  DateFormat('hh:mm a').format(_endTime),
                  DateFormat('MMM dd').format(_endTime),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDashedDivider() {
    return Row(
      children: [
        Container(
          width: 15,
          height: 30,
          decoration: const BoxDecoration(color: Colors.transparent),
        ),
        Expanded(
          child: LayoutBuilder(
            builder: (context, constraints) {
              final dashWidth = 8.0;
              final dashCount = (constraints.constrainWidth() / (2 * dashWidth))
                  .floor();
              return Flex(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                direction: Axis.horizontal,
                children: List.generate(dashCount, (_) {
                  return SizedBox(
                    width: dashWidth,
                    height: 2,
                    child: const DecoratedBox(
                      decoration: BoxDecoration(color: Colors.grey),
                    ),
                  );
                }),
              );
            },
          ),
        ),
        const SizedBox(width: 15),
      ],
    );
  }

  Widget _buildInfoCol(String title, String value1, String value2) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
        ),
        const SizedBox(height: 4),
        Text(
          value1,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        Text(
          value2,
          style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
        ),
      ],
    );
  }

  Widget _buildCountdown(bool isExpired) {
    if (isExpired) {
      return const Column(
        children: [
          Icon(CupertinoIcons.time, color: Colors.red, size: 24),
          SizedBox(height: 4),
          Text(
            'EXPIRED',
            style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
          ),
        ],
      );
    }

    String twoDigits(int n) => n.toString().padLeft(2, "0");
    String twoDigitMinutes = twoDigits(_timeLeft.inMinutes.remainder(60));
    String twoDigitSeconds = twoDigits(_timeLeft.inSeconds.remainder(60));

    return Column(
      children: [
        Text(
          '${twoDigits(_timeLeft.inHours)}:$twoDigitMinutes:$twoDigitSeconds',
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 24,
            color: Colors.green,
          ),
        ),
        Text(
          'Time Remaining',
          style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
        ),
      ],
    );
  }

  Widget _buildQuickActions(BuildContext context, bool isExpired) {
    return Row(
      children: [
        Expanded(
          child: ElevatedButton.icon(
            onPressed: () async {
              final lat = widget.booking['latitude'];
              final lng = widget.booking['longitude'];

              String destination;
              if (lat != null && lng != null && lat != 0 && lng != 0) {
                destination = '$lat,$lng';
              } else {
                destination = Uri.encodeComponent(
                  '${widget.booking['facilityName'] ?? ''} ${widget.booking['city'] ?? ''}',
                );
              }

              final url = Uri.parse(
                'https://www.google.com/maps/dir/?api=1&destination=$destination',
              );
              if (await canLaunchUrl(url)) {
                await launchUrl(url);
              } else {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Could not open map.')),
                  );
                }
              }
            },
            icon: const Icon(CupertinoIcons.location_fill),
            label: const Text('Navigate'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
          ),
        ),
        if (isExpired) ...[
          const SizedBox(width: 16),
          Consumer(
            builder: (context, ref, child) {
              final feedbacksAsync = ref.watch(myParkingFeedbackProvider);
              final hasFeedback = feedbacksAsync.maybeWhen(
                data: (feedbacks) => feedbacks.any(
                  (f) =>
                      f.reservationId ==
                      (widget.booking['reservationId'] ?? widget.booking['id']),
                ),
                orElse: () => false,
              );

              if (hasFeedback) return const SizedBox.shrink();

              return Expanded(
                child: ElevatedButton.icon(
                  onPressed: () {
                    showDialog(
                      context: context,
                      builder: (ctx) => ParkingFeedbackDialog(
                        parkingId:
                            widget.booking['parkingId'] ??
                            widget.booking['facilityId'] ??
                            '',
                        reservationId:
                            widget.booking['reservationId'] ??
                            widget.booking['id'] ??
                            '',
                      ),
                    );
                  },
                  icon: const Icon(CupertinoIcons.star_fill),
                  label: const Text('Rate'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.amber,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                ),
              );
            },
          ),
        ],
      ],
    );
  }
}
