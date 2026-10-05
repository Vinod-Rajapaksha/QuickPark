import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import 'package:mobile_app/core/network/api_client.dart';

final providerDashboardStatsProvider = FutureProvider<Map<String, dynamic>>((
  ref,
) async {
  final dio = ref.watch(dioProvider);

  final profileRes = await dio
      .get('/providers/me')
      .then<Response<dynamic>?>((value) => value)
      .catchError((_) => null);
  final propsRes = await dio
      .get('/parkingFacilities/me')
      .then<Response<dynamic>?>((value) => value)
      .catchError((_) => null);
  final resRes = await dio
      .get('/Reservations/provider')
      .then<Response<dynamic>?>((value) => value)
      .catchError((_) => null);

  return {
    'verificationStatus': profileRes?.data?['verificationStatus'] ?? 'UNKNOWN',
    'totalProperties': (propsRes?.data as List?)?.length ?? 0,
    'totalReservations': (resRes?.data as List?)?.length ?? 0,
  };
});

class ProviderDashboardScreen extends ConsumerWidget {
  const ProviderDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(providerDashboardStatsProvider);

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(
        title: const Text(
          'Provider Dashboard',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        elevation: 0,
      ),
      body: statsAsync.when(
        data: (stats) {
          final isApproved = stats['verificationStatus'] == 'APPROVED';
          return RefreshIndicator(
            onRefresh: () => ref.refresh(providerDashboardStatsProvider.future),
            child: ListView(
              padding: const EdgeInsets.only(
                left: 24,
                right: 24,
                top: 24,
                bottom: 120,
              ),
              children: [
                const Text(
                  'Overview',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: _StatCard(
                        title: 'Properties',
                        value: stats['totalProperties'].toString(),
                        icon: CupertinoIcons.building_2_fill,
                        color: Colors.blue,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _StatCard(
                        title: 'Reservations',
                        value: stats['totalReservations'].toString(),
                        icon: CupertinoIcons.calendar,
                        color: Colors.indigo,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _StatCard(
                  title: 'Account Status',
                  value: stats['verificationStatus'].toString(),
                  icon: isApproved
                      ? CupertinoIcons.check_mark_circled_solid
                      : CupertinoIcons.exclamationmark_shield_fill,
                  color: isApproved ? Colors.green : Colors.amber.shade700,
                  isFullWidth: true,
                ),
                const SizedBox(height: 24),
                const Text(
                  'Quick Actions',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                _buildActionCard(
                  context,
                  title: 'Manage Properties',
                  subtitle: 'Add or edit parking facilities',
                  icon: CupertinoIcons.building_2_fill,
                  color: Colors.blue,
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Manage Properties coming soon'),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 12),
                _buildActionCard(
                  context,
                  title: 'View Reservations',
                  subtitle: 'Check incoming bookings',
                  icon: CupertinoIcons.calendar,
                  color: Colors.indigo,
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('View Reservations coming soon'),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 12),
                _buildActionCard(
                  context,
                  title: 'Approvals',
                  subtitle: 'Review AI Agent bookings',
                  icon: CupertinoIcons.check_mark_circled_solid,
                  color: Colors.amber.shade700,
                  onTap: () => context.go('/provider/reservations/approval'),
                ),
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Error: $err'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () =>
                    ref.refresh(providerDashboardStatsProvider.future),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildActionCard(
    BuildContext context, {
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: ListTile(
          contentPadding: const EdgeInsets.all(16),
          leading: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color),
          ),
          title: Text(
            title,
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          subtitle: Text(subtitle, style: const TextStyle(fontSize: 12)),
          trailing: const Icon(CupertinoIcons.chevron_right, size: 20),
          onTap: onTap,
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;
  final bool isFullWidth;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
    this.isFullWidth = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: isFullWidth
          ? Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, color: color, size: 24),
                ),
                const SizedBox(width: 16),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        color: Theme.of(
                          context,
                        ).colorScheme.onSurface.withValues(alpha: 0.6),
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      value,
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: color,
                      ),
                    ),
                  ],
                ),
              ],
            )
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, color: color, size: 24),
                ),
                const SizedBox(height: 16),
                Text(
                  title,
                  style: TextStyle(
                    color: Theme.of(
                      context,
                    ).colorScheme.onSurface.withValues(alpha: 0.6),
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
    );
  }
}
