import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:mobile_app/core/widgets/app_button.dart';
import 'package:mobile_app/features/reservations/domain/models/reservation.dart';

class ReservationScanModal extends StatelessWidget {
  final Reservation reservation;
  final void Function(Reservation reservation, String action) onAction;

  const ReservationScanModal({
    super.key,
    required this.reservation,
    required this.onAction,
  });

  Widget _buildStatusChip(String status) {
    Color bgColor;
    Color textColor;

    switch (status.toUpperCase()) {
      case 'CONFIRMED':
        bgColor = Colors.blue.withValues(alpha: 0.1);
        textColor = Colors.blue.shade700;
        break;
      case 'CHECKED_IN':
        bgColor = Colors.orange.withValues(alpha: 0.1);
        textColor = Colors.orange.shade700;
        break;
      case 'CHECKED_OUT':
      case 'COMPLETED':
        bgColor = Colors.green.withValues(alpha: 0.1);
        textColor = Colors.green.shade700;
        break;
      case 'CANCELLED':
        bgColor = Colors.red.withValues(alpha: 0.1);
        textColor = Colors.red.shade700;
        break;
      default:
        bgColor = Colors.grey.withValues(alpha: 0.1);
        textColor = Colors.grey.shade700;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(
          color: textColor,
          fontWeight: FontWeight.bold,
          fontSize: 12,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  Widget _buildDetailItem(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.grey.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 20, color: Colors.grey.shade700),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.grey.shade600,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final status = reservation.status.toUpperCase();
    final times =
        '${DateFormat('dd MMM, HH:mm').format(reservation.startTime)}'
        ' - ${DateFormat('HH:mm').format(reservation.endTime)}';

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        child: Padding(
          padding: EdgeInsets.fromLTRB(
            24,
            12,
            24,
            24 + MediaQuery.viewInsetsOf(context).bottom,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Drag Handle
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Expanded(
                      child: Text(
                        'Reservation',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          letterSpacing: -0.5,
                        ),
                      ),
                    ),
                    _buildStatusChip(status),
                  ],
                ),
                const SizedBox(height: 24),

                // Details Card
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: Column(
                    children: [
                      _buildDetailItem(
                        Icons.person_outline,
                        'Driver',
                        reservation.driverName,
                      ),
                      _buildDetailItem(
                        Icons.phone_outlined,
                        'Phone',
                        reservation.driverPhone,
                      ),
                      _buildDetailItem(
                        Icons.directions_car_outlined,
                        'Vehicle Type',
                        reservation.vehicleTypeName,
                      ),
                      _buildDetailItem(
                        Icons.local_parking_outlined,
                        'Slot',
                        reservation.slotNumber,
                      ),
                      _buildDetailItem(
                        Icons.access_time,
                        'Duration',
                        times,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),

                // Action Buttons
                if (status == 'CONFIRMED')
                  AppButton(
                    label: 'Check In Driver',
                    icon: Icons.login,
                    onPressed: () => onAction(reservation, 'check-in'),
                    backgroundColor: Colors.blue.shade600,
                    foregroundColor: Colors.white,
                  )
                else if (status == 'CHECKED_IN')
                  AppButton(
                    label: 'Check Out Driver',
                    icon: Icons.logout,
                    onPressed: () => onAction(reservation, 'check-out'),
                    backgroundColor: Colors.orange.shade600,
                    foregroundColor: Colors.white,
                  )
                else
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.info_outline,
                          color: Colors.grey.shade600,
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'No actions available for status: $status',
                            style: TextStyle(
                              color: Colors.grey.shade700,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
