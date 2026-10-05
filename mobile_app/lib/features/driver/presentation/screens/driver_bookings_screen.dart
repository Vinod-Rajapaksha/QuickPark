import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_app/core/network/api_client.dart';

final myReservationsProvider = FutureProvider.family<List<dynamic>, String>((
  ref,
  status,
) async {
  final dio = ref.watch(dioProvider);
  final res = await dio.get(
    '/reservations/me',
    queryParameters: {'status': status},
  );
  return res.data as List<dynamic>;
});

class DriverBookingsScreen extends StatefulWidget {
  const DriverBookingsScreen({super.key});

  @override
  State<DriverBookingsScreen> createState() => _DriverBookingsScreenState();
}

class _DriverBookingsScreenState extends State<DriverBookingsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text(
          'My Bookings',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          labelColor: theme.primaryColor,
          unselectedLabelColor: Colors.grey,
          indicatorColor: theme.primaryColor,
          indicatorWeight: 3,
          tabs: const [
            Tab(text: 'Active'),
            Tab(text: 'Upcoming'),
            Tab(text: 'Past'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [
          _BookingsList(status: 'ACTIVE'),
          _BookingsList(status: 'PENDING'),
          _BookingsList(status: 'COMPLETED'),
        ],
      ),
    );
  }
}

class _BookingsList extends ConsumerWidget {
  final String status;
  const _BookingsList({required this.status});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncBookings = ref.watch(myReservationsProvider(status));

    return asyncBookings.when(
      data: (bookings) {
        if (bookings.isEmpty) {
          return _buildEmptyState(context);
        }
        return RefreshIndicator(
          onRefresh: () => ref.refresh(myReservationsProvider(status).future),
          child: ListView.separated(
            padding: const EdgeInsets.all(16).copyWith(bottom: 100),
            itemCount: bookings.length,
            separatorBuilder: (_, _) => const SizedBox(height: 16),
            itemBuilder: (context, index) {
              final booking = bookings[index];
              return _BookingCard(booking: booking);
            },
          ),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (err, _) => Center(child: Text('Failed to load bookings: $err')),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(CupertinoIcons.ticket, size: 80, color: Colors.grey.shade300),
          const SizedBox(height: 16),
          Text(
            'No $status Bookings',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.grey.shade600,
            ),
          ),
        ],
      ),
    );
  }
}

class _BookingCard extends StatelessWidget {
  final Map<String, dynamic> booking;

  const _BookingCard({required this.booking});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final startTime = DateTime.parse(booking['startTime']);
    final isPast =
        booking['status'] == 'COMPLETED' || booking['status'] == 'CANCELLED';

    return GestureDetector(
      onTap: () {
        if (!isPast) {
          context.push('/driver/bookings/pass', extra: booking);
        }
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: theme.primaryColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      CupertinoIcons.building_2_fill,
                      color: theme.primaryColor,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          booking['facilityName'] ?? 'Parking',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${booking['city']}, ${booking['province']}',
                          style: TextStyle(
                            color: Colors.grey.shade600,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (!isPast)
                    const Icon(
                      CupertinoIcons.chevron_right,
                      color: Colors.grey,
                      size: 16,
                    ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: const BorderRadius.vertical(
                  bottom: Radius.circular(20),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Date & Time',
                        style: TextStyle(color: Colors.grey, fontSize: 12),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${DateFormat('MMM dd').format(startTime)}, ${DateFormat('hh:mm a').format(startTime)}',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      const Text(
                        'Amount',
                        style: TextStyle(color: Colors.grey, fontSize: 12),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Rs.${booking['totalAmount']}',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                          color: theme.primaryColor,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
