import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/core/network/api_client.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

final facilitySlotsProvider = FutureProvider.family<List<dynamic>, String>((
  ref,
  facilityId,
) async {
  final dio = ref.watch(dioProvider);
  final res = await dio.get('/parkingFacilities/$facilityId/slots');
  return res.data as List<dynamic>;
});

class DriverFacilityDetailsScreen extends ConsumerStatefulWidget {
  final String facilityId;
  final Map<String, dynamic>? facilityData;

  const DriverFacilityDetailsScreen({
    super.key,
    required this.facilityId,
    this.facilityData,
  });

  @override
  ConsumerState<DriverFacilityDetailsScreen> createState() =>
      _DriverFacilityDetailsScreenState();
}

class _DriverFacilityDetailsScreenState
    extends ConsumerState<DriverFacilityDetailsScreen> {
  DateTime _startTime = DateTime.now().add(const Duration(minutes: 10));
  DateTime _endTime = DateTime.now().add(const Duration(hours: 1, minutes: 10));
  String? _selectedVehicleTypeId;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final primaryColor = theme.primaryColor;
    final slotsAsync = ref.watch(facilitySlotsProvider(widget.facilityId));

    final name = widget.facilityData?['name'] ?? 'Parking Facility';
    final address = widget.facilityData?['address'] ?? 'Unknown location';
    final imageUrl =
        widget.facilityData?['images'] != null &&
            (widget.facilityData!['images'] as List).isNotEmpty
        ? (widget.facilityData!['images'] as List).first['url']
        : null;

    final duration = _endTime.difference(_startTime);
    final hours = duration.inMinutes / 60.0;
    final vehicleTypes = <String, Map<String, dynamic>>{};
    double hourlyRate = widget.facilityData?['basePrice']?.toDouble() ?? 0.0;

    if (slotsAsync.hasValue) {
      for (var slot in slotsAsync.value!) {
        final vId = slot['vehicleTypeId'];
        if (vId != null) {
          vehicleTypes[vId] = {
            'id': vId,
            'name': slot['vehicleTypeName'] ?? 'Unknown',
            'rate': slot['hourlyRate']?.toDouble() ?? hourlyRate,
          };
        }
      }

      if (_selectedVehicleTypeId == null && vehicleTypes.isNotEmpty) {
        _selectedVehicleTypeId = vehicleTypes.keys.first;
      }

      if (_selectedVehicleTypeId != null) {
        hourlyRate = vehicleTypes[_selectedVehicleTypeId]!['rate'];
      }
    }

    final totalCost = hours > 0 ? (hours * hourlyRate) : 0.0;

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 250,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              title: Text(name),
              background: Hero(
                tag: 'facility_${widget.facilityId}',
                child: imageUrl != null
                    ? Image.network(imageUrl, fit: BoxFit.cover)
                    : Container(
                        color: primaryColor.withValues(alpha: 0.1),
                        child: Icon(
                          CupertinoIcons.building_2_fill,
                          size: 80,
                          color: primaryColor,
                        ),
                      ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(
                        CupertinoIcons.location_solid,
                        color: Colors.grey.shade600,
                        size: 16,
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          address,
                          style: TextStyle(color: Colors.grey.shade600),
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 40),

                  // Vehicle Type Selection
                  const Text(
                    'Select Vehicle Type',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  slotsAsync.when(
                    data: (_) {
                      if (vehicleTypes.isEmpty) {
                        return const Text('No spots available.');
                      }
                      return Wrap(
                        spacing: 12,
                        children: vehicleTypes.values.map((v) {
                          final isSelected = _selectedVehicleTypeId == v['id'];
                          return ChoiceChip(
                            label: Text(v['name']),
                            selected: isSelected,
                            onSelected: (selected) {
                              if (selected) {
                                setState(
                                  () => _selectedVehicleTypeId = v['id'],
                                );
                              }
                            },
                            selectedColor: primaryColor.withValues(alpha: 0.2),
                            labelStyle: TextStyle(
                              color: isSelected ? primaryColor : Colors.black87,
                              fontWeight: isSelected
                                  ? FontWeight.bold
                                  : FontWeight.normal,
                            ),
                          );
                        }).toList(),
                      );
                    },
                    loading: () => const CircularProgressIndicator(),
                    error: (e, _) => Text('Error loading slots: $e'),
                  ),
                  const SizedBox(height: 32),

                  // Time Pickers
                  const Text(
                    'Select Duration',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: _TimePickerBox(
                          label: 'Start Time',
                          time: _startTime,
                          onTap: () => _pickTime(context, true),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _TimePickerBox(
                          label: 'End Time',
                          time: _endTime,
                          onTap: () => _pickTime(context, false),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (duration.inMinutes <= 0)
                    const Text(
                      'End time must be after start time',
                      style: TextStyle(color: Colors.red),
                    ),

                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, -5),
            ),
          ],
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: SafeArea(
          child: Row(
            children: [
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Total Cost',
                      style: TextStyle(color: Colors.grey, fontSize: 12),
                    ),
                    Text(
                      'Rs.${totalCost.toStringAsFixed(2)}',
                      style: TextStyle(
                        color: primaryColor,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: ElevatedButton(
                  onPressed:
                      duration.inMinutes > 0 && _selectedVehicleTypeId != null
                      ? () {
                          final req = {
                            'facilityId': widget.facilityId,
                            'vehicleTypeId': _selectedVehicleTypeId,
                            'startTime': _startTime.toIso8601String(),
                            'endTime': _endTime.toIso8601String(),
                          };
                          context.push(
                            '/driver/home/checkout',
                            extra: {
                              'reservationRequest': req,
                              'facilityData':
                                  widget.facilityData ??
                                  {'name': name, 'address': address},
                              'totalCost': totalCost,
                            },
                          );
                        }
                      : null,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: const Text(
                    'Proceed',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _pickTime(BuildContext context, bool isStart) async {
    final initial = isStart ? _startTime : _endTime;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(initial),
    );
    if (time != null) {
      setState(() {
        final newDate = DateTime(
          initial.year,
          initial.month,
          initial.day,
          time.hour,
          time.minute,
        );
        if (isStart) {
          _startTime = newDate;
          if (_endTime.isBefore(_startTime)) {
            _endTime = _startTime.add(const Duration(hours: 1));
          }
        } else {
          _endTime = newDate;
        }
      });
    }
  }
}

class _TimePickerBox extends StatelessWidget {
  final String label;
  final DateTime time;
  final VoidCallback onTap;

  const _TimePickerBox({
    required this.label,
    required this.time,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.grey.shade100,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade300),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(
                  CupertinoIcons.clock,
                  size: 16,
                  color: Theme.of(context).primaryColor,
                ),
                const SizedBox(width: 8),
                Text(
                  DateFormat('hh:mm a').format(time),
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
