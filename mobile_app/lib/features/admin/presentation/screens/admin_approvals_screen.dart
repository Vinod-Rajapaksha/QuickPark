import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/core/network/api_client.dart';
import 'package:mobile_app/core/widgets/app_error.dart';

final adminPendingFacilitiesProvider = FutureProvider<List<dynamic>>((
  ref,
) async {
  final dio = ref.watch(dioProvider);
  final res = await dio.get('/parkingFacilities/admin/pending');
  return res.data as List<dynamic>;
});

class AdminApprovalsScreen extends ConsumerWidget {
  const AdminApprovalsScreen({super.key});

  Future<void> _reviewFacility(
    BuildContext context,
    WidgetRef ref,
    String id,
    String decision,
  ) async {
    try {
      final dio = ref.read(dioProvider);
      await dio.put(
        '/parkingFacilities/admin/$id',
        data: {
          'decision': decision,
          'rejectionReason': decision == 'REJECTED'
              ? 'Did not meet requirements'
              : null,
        },
      );
      if (context.mounted) {
        AppErrorHandler.showSnackBar(
          context,
          'Facility $decision successfully',
          isError: false,
        );
        ref.refresh(adminPendingFacilitiesProvider.future);
      }
    } catch (e) {
      if (context.mounted) {
        AppErrorHandler.showSnackBar(
          context,
          'Failed to $decision facility: $e',
          isError: true,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final facilitiesAsync = ref.watch(adminPendingFacilitiesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Pending Approvals'), centerTitle: true),
      body: facilitiesAsync.when(
        data: (facilities) {
          if (facilities.isEmpty) {
            return const Center(
              child: Text('No pending facilities to approve.'),
            );
          }
          return RefreshIndicator(
            onRefresh: () => ref.refresh(adminPendingFacilitiesProvider.future),
            child: ListView.separated(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.only(
                left: 16,
                right: 16,
                top: 16,
                bottom: 120,
              ),
              itemCount: facilities.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final facility =
                    facilities[index]['facility'] ?? facilities[index];
                final facilityId = facility['facilityId'] ?? facility['id'];

                return Container(
                  decoration: BoxDecoration(
                    color: Theme.of(context).cardColor,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: ExpansionTile(
                    leading: const Icon(
                      CupertinoIcons.building_2_fill,
                      color: Colors.amber,
                    ),
                    title: Text(
                      facility['name'] ?? 'Unnamed Facility',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    subtitle: Text(
                      '${facility['address'] ?? ''} - ${facility['city'] ?? ''}',
                    ),
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text('Slots: ${facility['slotCount'] ?? 0}'),
                            const SizedBox(height: 8),
                            Text('Status: ${facility['status']}'),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Expanded(
                                  child: ElevatedButton(
                                    onPressed: () => _reviewFacility(
                                      context,
                                      ref,
                                      facilityId,
                                      'REJECTED',
                                    ),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.red.shade100,
                                      foregroundColor: Colors.red.shade800,
                                    ),
                                    child: const Text('Reject'),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: ElevatedButton(
                                    onPressed: () => _reviewFacility(
                                      context,
                                      ref,
                                      facilityId,
                                      'APPROVED',
                                    ),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.green,
                                      foregroundColor: Colors.white,
                                    ),
                                    child: const Text('Approve'),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
    );
  }
}
