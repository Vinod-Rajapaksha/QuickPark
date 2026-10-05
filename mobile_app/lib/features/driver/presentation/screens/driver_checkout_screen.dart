import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:mobile_app/core/network/api_client.dart';
import 'package:payhere_mobilesdk_flutter/payhere_mobilesdk_flutter.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:mobile_app/features/auth/presentation/providers/auth_provider.dart';
import 'package:dio/dio.dart';

class DriverCheckoutScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic> reservationRequest;
  final Map<String, dynamic> facilityData;
  final double totalCost;

  const DriverCheckoutScreen({
    super.key,
    required this.reservationRequest,
    required this.facilityData,
    required this.totalCost,
  });

  @override
  ConsumerState<DriverCheckoutScreen> createState() =>
      _DriverCheckoutScreenState();
}

class _DriverCheckoutScreenState extends ConsumerState<DriverCheckoutScreen>
    with SingleTickerProviderStateMixin {
  bool _isProcessing = false;
  bool _isSuccess = false;
  double _dragPosition = 0.0;

  Future<void> _processPaymentAndBooking() async {
    setState(() => _isProcessing = true);

    try {
      final user = ref.read(authProvider).user;
      final fullName = user?.fullName ?? 'Driver User';
      final nameParts = fullName.split(' ');
      final firstName = nameParts.first;
      final lastName = nameParts.length > 1
          ? nameParts.sublist(1).join(' ')
          : 'User';

      Map paymentObject = {
        "sandbox": true,
        "merchant_id": dotenv.env['PAYHERE_MERCHANT_ID'] ?? "1228806",
        "merchant_secret": dotenv.env['PAYHERE_MERCHANT_SECRET'] ?? "",
        "notify_url":
            dotenv.env['PAYHERE_NOTIFY_URL'] ??
            "http://0.0.0.0:5034/reservations/notify",
        "order_id": widget.reservationRequest['facilityId'],
        "items":
            "QuickPark Reservation - ${widget.facilityData['name'] ?? 'Facility'}",
        "amount": widget.totalCost.toStringAsFixed(2),
        "currency": "LKR",
        "first_name": firstName,
        "last_name": lastName,
        "email": user?.email ?? "driver@quickpark.com",
        "phone": "0771234567",
        "address": "Colombo",
        "city": "Colombo",
        "country": "Sri Lanka",
      };

      PayHere.startPayment(
        paymentObject,
        (paymentId) async {
          try {
            final dio = ref.read(dioProvider);
            final res = await dio.post(
              '/reservations',
              data: widget.reservationRequest,
            );
            final reservationId = res.data['id'];

            await dio.post(
              '/payments/external/confirm',
              data: {
                'reservationId': reservationId,
                'transactionId': paymentId,
              },
            );

            if (mounted) {
              setState(() {
                _isProcessing = false;
                _isSuccess = true;
              });

              await Future.delayed(const Duration(seconds: 2));
              if (mounted) {
                context.go('/driver/bookings?tab=1');
              }
            }
          } catch (e) {
            String errorMsg = e.toString();
            if (e is DioException && e.response?.data != null) {
              final data = e.response!.data;
              if (data is Map && data['message'] != null) {
                errorMsg = data['message'].toString();
              } else {
                errorMsg = data.toString();
              }
            }
            _showError('Booking/Payment failed: $errorMsg');
          }
        },
        (error) {
          _showError('Payment Failed: $error');
        },
        () {
          _showError('Payment Dismissed');
        },
      );
    } catch (e) {
      _showError('Unexpected error: $e');
    }
  }

  void _showError(String message) {
    if (mounted) {
      setState(() {
        _isProcessing = false;
        _dragPosition = 0.0;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final primaryColor = theme.primaryColor;

    final startTime = DateTime.parse(widget.reservationRequest['startTime']);
    final endTime = DateTime.parse(widget.reservationRequest['endTime']);

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('Checkout'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: _isSuccess
          ? _buildSuccessView(primaryColor)
          : ListView(
              padding: const EdgeInsets.all(24),
              children: [
                _buildOrderSummary(primaryColor, startTime, endTime),
                const SizedBox(height: 32),
                _buildPaymentMethod(primaryColor),
                const SizedBox(height: 48),
                _buildSwipeToPay(primaryColor),
              ],
            ),
    );
  }

  Widget _buildOrderSummary(
    Color primaryColor,
    DateTime startTime,
    DateTime endTime,
  ) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Order Summary',
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: primaryColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(CupertinoIcons.location_solid, color: primaryColor),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.facilityData['name'] ?? 'Parking',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      widget.facilityData['address'] ?? '',
                      style: TextStyle(
                        color: Colors.grey.shade600,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 16),
            child: Divider(),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildTimeColumn('Start', startTime),
              Icon(CupertinoIcons.arrow_right, color: Colors.grey.shade400),
              _buildTimeColumn('End', endTime),
            ],
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 16),
            child: Divider(),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Total Amount',
                style: TextStyle(fontSize: 16, color: Colors.grey),
              ),
              Text(
                'Rs.${widget.totalCost.toStringAsFixed(2)}',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: primaryColor,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTimeColumn(String label, DateTime time) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
        ),
        const SizedBox(height: 4),
        Text(
          DateFormat('hh:mm a').format(time),
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        Text(
          DateFormat('MMM dd, yyyy').format(time),
          style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
        ),
      ],
    );
  }

  Widget _buildPaymentMethod(Color primaryColor) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Payment Method',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border.all(color: primaryColor, width: 2),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            children: [
              Icon(CupertinoIcons.creditcard, color: primaryColor, size: 32),
              const SizedBox(width: 16),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'PayHere Secure',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    Text(
                      'Sandbox Integration',
                      style: TextStyle(color: Colors.grey, fontSize: 12),
                    ),
                  ],
                ),
              ),
              Icon(CupertinoIcons.checkmark_circle_fill, color: primaryColor),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSwipeToPay(Color primaryColor) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final maxDrag = constraints.maxWidth - 60;
        return Container(
          height: 60,
          decoration: BoxDecoration(
            color: primaryColor.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(30),
          ),
          child: Stack(
            children: [
              Center(
                child: Text(
                  _isProcessing ? 'Processing Payment...' : 'Swipe to Pay',
                  style: TextStyle(
                    color: primaryColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ),
              if (!_isProcessing)
                Positioned(
                  left: _dragPosition,
                  child: GestureDetector(
                    onPanUpdate: (details) {
                      setState(() {
                        _dragPosition += details.delta.dx;
                        if (_dragPosition < 0) _dragPosition = 0;
                        if (_dragPosition > maxDrag) _dragPosition = maxDrag;
                      });
                    },
                    onPanEnd: (details) {
                      if (_dragPosition > maxDrag * 0.8) {
                        setState(() => _dragPosition = maxDrag);
                        _processPaymentAndBooking();
                      } else {
                        setState(() => _dragPosition = 0);
                      }
                    },
                    child: Container(
                      width: 60,
                      height: 60,
                      decoration: BoxDecoration(
                        color: primaryColor,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: primaryColor.withValues(alpha: 0.4),
                            blurRadius: 10,
                            offset: const Offset(2, 0),
                          ),
                        ],
                      ),
                      child: const Icon(
                        CupertinoIcons.chevron_right_2,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSuccessView(Color primaryColor) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.green.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              CupertinoIcons.check_mark_circled_solid,
              color: Colors.green,
              size: 100,
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'Payment Successful!',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            'Generating your QR Pass...',
            style: TextStyle(color: Colors.grey.shade600),
          ),
        ],
      ),
    );
  }
}
