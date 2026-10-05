import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:mobile_app/core/network/api_client.dart';
import 'package:go_router/go_router.dart';
import 'dart:async';
import 'driver_layout.dart';

class LiveLocationNotifier extends Notifier<LatLng?> {
  @override
  LatLng? build() => null;

  void updateLocation(LatLng? loc) => state = loc;
}

final liveLocationProvider = NotifierProvider<LiveLocationNotifier, LatLng?>(
  () {
    return LiveLocationNotifier();
  },
);

final userLocationProvider = FutureProvider<LatLng?>((ref) async {
  bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
  if (!serviceEnabled) {
    return null;
  }

  LocationPermission permission = await Geolocator.checkPermission();
  if (permission == LocationPermission.denied) {
    permission = await Geolocator.requestPermission();
    if (permission == LocationPermission.denied) {
      return null;
    }
  }

  if (permission == LocationPermission.deniedForever) {
    return null;
  }

  final pos = await Geolocator.getCurrentPosition();
  final loc = LatLng(pos.latitude, pos.longitude);
  ref.read(liveLocationProvider.notifier).updateLocation(loc);
  return loc;
});

class MapFilter {
  final double? latitude;
  final double? longitude;
  final int? radiusKm;
  final bool hasEvCharging;
  final String? name;
  final double? minHourlyRate;
  final double? maxHourlyRate;
  final String? province;
  final String? district;
  final String? city;

  MapFilter({
    this.latitude,
    this.longitude,
    this.radiusKm,
    this.hasEvCharging = false,
    this.name,
    this.minHourlyRate,
    this.maxHourlyRate,
    this.province,
    this.district,
    this.city,
  });

  MapFilter copyWith({
    double? latitude,
    double? longitude,
    int? radiusKm,
    bool? hasEvCharging,
    String? name,
    double? minHourlyRate,
    double? maxHourlyRate,
    String? province,
    String? district,
    String? city,
  }) {
    return MapFilter(
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      radiusKm: radiusKm ?? this.radiusKm,
      hasEvCharging: hasEvCharging ?? this.hasEvCharging,
      name: name ?? this.name,
      minHourlyRate: minHourlyRate ?? this.minHourlyRate,
      maxHourlyRate: maxHourlyRate ?? this.maxHourlyRate,
      province: province ?? this.province,
      district: district ?? this.district,
      city: city ?? this.city,
    );
  }
}

class MapFilterNotifier extends Notifier<MapFilter> {
  @override
  MapFilter build() => MapFilter();

  void updateFilter(MapFilter Function(MapFilter state) update) {
    state = update(state);
  }
}

final mapFilterProvider = NotifierProvider<MapFilterNotifier, MapFilter>(() {
  return MapFilterNotifier();
});

final facilitiesProvider = FutureProvider<List<dynamic>>((ref) async {
  final dio = ref.watch(dioProvider);
  final filter = ref.watch(mapFilterProvider);

  final queryParams = <String, dynamic>{};
  if (filter.latitude != null) queryParams['Latitude'] = filter.latitude;
  if (filter.longitude != null) queryParams['Longitude'] = filter.longitude;
  if (filter.radiusKm != null) queryParams['RadiusKm'] = filter.radiusKm;
  if (filter.hasEvCharging) queryParams['HasEvCharging'] = true;
  if (filter.name != null && filter.name!.isNotEmpty) {
    queryParams['Name'] = filter.name;
  }
  if (filter.minHourlyRate != null) {
    queryParams['MinHourlyRate'] = filter.minHourlyRate;
  }
  if (filter.maxHourlyRate != null) {
    queryParams['MaxHourlyRate'] = filter.maxHourlyRate;
  }
  if (filter.province != null && filter.province!.isNotEmpty) {
    queryParams['Province'] = filter.province;
  }
  if (filter.district != null && filter.district!.isNotEmpty) {
    queryParams['District'] = filter.district;
  }
  if (filter.city != null && filter.city!.isNotEmpty) {
    queryParams['City'] = filter.city;
  }

  final res = await dio.get('/parkingFacilities', queryParameters: queryParams);
  return res.data as List<dynamic>;
});

class DriverHomeScreen extends ConsumerStatefulWidget {
  const DriverHomeScreen({super.key});

  @override
  ConsumerState<DriverHomeScreen> createState() => _DriverHomeScreenState();
}

class _DriverHomeScreenState extends ConsumerState<DriverHomeScreen> {
  final MapController _mapController = MapController();
  Map<String, dynamic>? _selectedFacility;
  StreamSubscription? _mapEventSub;
  bool _showSearchHereButton = false;

  @override
  void initState() {
    super.initState();
    _mapEventSub = _mapController.mapEventStream.listen((event) {
      if (event is MapEventMoveEnd) {
        if (!_showSearchHereButton) {
          setState(() {
            _showSearchHereButton = true;
          });
        }
      }
    });
  }

  @override
  void dispose() {
    _mapEventSub?.cancel();
    super.dispose();
  }

  void _showFilterSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useRootNavigator: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => const _FilterSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final locationAsync = ref.watch(userLocationProvider);
    final facilitiesAsync = ref.watch(facilitiesProvider);
    final liveLoc = ref.watch(liveLocationProvider);
    final theme = Theme.of(context);

    return Scaffold(
      body: Stack(
        children: [
          // Map
          locationAsync.when(
            data: (userLoc) {
              final initialCenter = userLoc ?? const LatLng(7.8731, 80.7718);
              return FlutterMap(
                mapController: _mapController,
                options: MapOptions(
                  initialCenter: initialCenter,
                  initialZoom: userLoc != null ? 13.0 : 7.5,
                  onTap: (_, _) {
                    setState(() => _selectedFacility = null);
                    ref.read(hideAgentBubbleProvider.notifier).show();
                  },
                ),
                children: [
                  TileLayer(
                    urlTemplate:
                        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    userAgentPackageName: 'com.quickpark.app',
                  ),
                  MarkerLayer(
                    markers: [
                      // User Location Marker
                      if (liveLoc != null)
                        Marker(
                          point: liveLoc,
                          width: 40,
                          height: 40,
                          child: Container(
                            decoration: BoxDecoration(
                              color: Colors.blue.withValues(alpha: 0.2),
                              shape: BoxShape.circle,
                            ),
                            child: Center(
                              child: Container(
                                width: 20,
                                height: 20,
                                decoration: const BoxDecoration(
                                  color: Colors.blue,
                                  shape: BoxShape.circle,
                                  border: Border.fromBorderSide(
                                    BorderSide(color: Colors.white, width: 2),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      // Facilities Markers
                      ...?facilitiesAsync.value?.map((f) {
                        final lat = f['latitude'] as double?;
                        final lng = f['longitude'] as double?;
                        if (lat == null || lng == null) return null;

                        final isSelected =
                            _selectedFacility?['facilityId'] == f['facilityId'];

                        final allocations =
                            f['allocations'] as List<dynamic>? ?? [];
                        double basePrice = 0.0;
                        if (allocations.isNotEmpty) {
                          basePrice = allocations
                              .map((a) => (a['hourlyRate'] as num).toDouble())
                              .reduce((a, b) => a < b ? a : b);
                        }

                        return Marker(
                          point: LatLng(lat, lng),
                          width: 100,
                          height: 50,
                          child: GestureDetector(
                            onTap: () {
                              setState(() => _selectedFacility = f);
                              ref.read(hideAgentBubbleProvider.notifier).hide();
                              _mapController.move(LatLng(lat, lng), 15.0);
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? theme.primaryColor
                                    : Colors.white,
                                borderRadius: BorderRadius.circular(20),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.1),
                                    blurRadius: 8,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                                border: Border.all(
                                  color: isSelected
                                      ? Colors.white
                                      : theme.primaryColor,
                                  width: 2,
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    CupertinoIcons.car_detailed,
                                    size: 16,
                                    color: isSelected
                                        ? Colors.white
                                        : theme.primaryColor,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    'Rs.$basePrice',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: isSelected
                                          ? Colors.white
                                          : Colors.black87,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      }).whereType<Marker>(),
                    ],
                  ),
                ],
              );
            },
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (err, _) => Center(child: Text('Error: $err')),
          ),

          // Search Bar
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(30),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.1),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: TextField(
                            onSubmitted: (val) {
                              ref
                                  .read(mapFilterProvider.notifier)
                                  .updateFilter(
                                    (state) => state.copyWith(name: val),
                                  );
                            },
                            decoration: InputDecoration(
                              hintText: 'Where do you want to park?',
                              prefixIcon: const Icon(CupertinoIcons.search),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(30),
                                borderSide: BorderSide.none,
                              ),
                              filled: true,
                              fillColor: Colors.white,
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 20,
                                vertical: 16,
                              ),
                            ),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.only(right: 8.0),
                          child: IconButton(
                            icon: const Icon(
                              CupertinoIcons.slider_horizontal_3,
                            ),
                            onPressed: _showFilterSheet,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (_showSearchHereButton) ...[
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: () {
                        setState(() {
                          _showSearchHereButton = false;
                        });
                        final center = _mapController.camera.center;
                        final zoom = _mapController.camera.zoom;
                        int radius = 100;
                        if (zoom > 16) {
                          radius = 2;
                        } else if (zoom > 14) {
                          radius = 5;
                        } else if (zoom > 12) {
                          radius = 15;
                        } else if (zoom > 10) {
                          radius = 30;
                        }

                        ref
                            .read(mapFilterProvider.notifier)
                            .updateFilter(
                              (state) => state.copyWith(
                                latitude: center.latitude,
                                longitude: center.longitude,
                                radiusKm: radius,
                              ),
                            );
                      },
                      icon: const Icon(CupertinoIcons.search, size: 16),
                      label: const Text('Search this area'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: theme.primaryColor,
                        elevation: 4,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),

          // My Location Button
          Positioned(
            top: 130,
            right: 16,
            child: FloatingActionButton(
              heroTag: 'my_loc_btn',
              backgroundColor: Colors.white,
              mini: true,
              onPressed: () async {
                bool serviceEnabled =
                    await Geolocator.isLocationServiceEnabled();
                if (!serviceEnabled) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Please enable location services.'),
                      ),
                    );
                  }
                  ref.read(liveLocationProvider.notifier).updateLocation(null);
                  return;
                }

                LocationPermission permission =
                    await Geolocator.checkPermission();
                if (permission == LocationPermission.denied) {
                  permission = await Geolocator.requestPermission();
                  if (permission == LocationPermission.denied) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Location permission denied.'),
                        ),
                      );
                    }
                    ref
                        .read(liveLocationProvider.notifier)
                        .updateLocation(null);
                    return;
                  }
                }

                if (permission == LocationPermission.deniedForever) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text(
                          'Location permissions are permanently denied.',
                        ),
                      ),
                    );
                  }
                  ref.read(liveLocationProvider.notifier).updateLocation(null);
                  return;
                }

                final pos = await Geolocator.getCurrentPosition();
                final loc = LatLng(pos.latitude, pos.longitude);
                ref.read(liveLocationProvider.notifier).updateLocation(loc);
                _mapController.move(loc, 15.0);
              },
              child: Icon(
                CupertinoIcons.location_fill,
                color: theme.primaryColor,
              ),
            ),
          ),

          // Bottom Sheet Card
          AnimatedPositioned(
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOutBack,
            bottom: _selectedFacility != null ? 100 : -300,
            left: 16,
            right: 16,
            child: _selectedFacility != null
                ? _FacilityCard(facility: _selectedFacility!)
                : const SizedBox.shrink(),
          ),
        ],
      ),
    );
  }
}

class _FacilityCard extends StatelessWidget {
  final Map<String, dynamic> facility;

  const _FacilityCard({required this.facility});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final primaryColor = theme.primaryColor;

    final name = facility['name'] ?? 'Parking Facility';
    final address = facility['address'] ?? 'Unknown location';

    final allocations = facility['allocations'] as List<dynamic>? ?? [];
    double basePrice = 0.0;
    if (allocations.isNotEmpty) {
      basePrice = allocations
          .map((a) => (a['hourlyRate'] as num).toDouble())
          .reduce((a, b) => a < b ? a : b);
    }

    final slotGroups = facility['slotGroups'] as List<dynamic>? ?? [];
    int availableSlots = 0;
    if (slotGroups.isNotEmpty) {
      availableSlots = slotGroups
          .map((g) => (g['available'] as num?)?.toInt() ?? 0)
          .fold(0, (a, b) => a + b);
    }

    final isAvailable = availableSlots > 0;
    final hasEvCharging = facility['hasEvCharging'] == true;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.15),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: primaryColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(16),
                  image:
                      facility['images'] != null &&
                          (facility['images'] as List).isNotEmpty
                      ? DecorationImage(
                          image: NetworkImage(
                            (facility['images'] as List).first['url'],
                          ),
                          fit: BoxFit.cover,
                        )
                      : null,
                ),
                child:
                    facility['images'] == null ||
                        (facility['images'] as List).isEmpty
                    ? Icon(CupertinoIcons.building_2_fill, color: primaryColor)
                    : null,
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      address,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey.shade600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(
                          isAvailable
                              ? CupertinoIcons.check_mark_circled_solid
                              : CupertinoIcons.clear_thick_circled,
                          color: isAvailable ? Colors.green : Colors.red,
                          size: 16,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          isAvailable ? 'Available' : 'Full',
                          style: TextStyle(
                            color: isAvailable ? Colors.green : Colors.red,
                            fontWeight: FontWeight.w600,
                            fontSize: 12,
                          ),
                        ),
                        if (hasEvCharging) ...[
                          const SizedBox(width: 12),
                          Icon(
                            CupertinoIcons.bolt_fill,
                            color: Colors.amber.shade700,
                            size: 16,
                          ),
                          const SizedBox(width: 2),
                          Text(
                            'EV',
                            style: TextStyle(
                              color: Colors.amber.shade700,
                              fontWeight: FontWeight.w600,
                              fontSize: 12,
                            ),
                          ),
                        ],
                        const Spacer(),
                        Text(
                          'Rs.$basePrice / hr',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: primaryColor,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                context.go(
                  '/driver/home/facility/${facility['facilityId']}',
                  extra: facility,
                );
              },
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: const Text(
                'Book Now',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterSheet extends ConsumerStatefulWidget {
  const _FilterSheet();

  @override
  ConsumerState<_FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends ConsumerState<_FilterSheet> {
  late bool ev;
  late final TextEditingController provCtrl;
  late final TextEditingController distCtrl;
  late final TextEditingController citCtrl;
  late final TextEditingController minRateCtrl;
  late final TextEditingController maxRateCtrl;

  @override
  void initState() {
    super.initState();
    final filter = ref.read(mapFilterProvider);
    ev = filter.hasEvCharging;
    provCtrl = TextEditingController(text: filter.province);
    distCtrl = TextEditingController(text: filter.district);
    citCtrl = TextEditingController(text: filter.city);
    minRateCtrl = TextEditingController(
      text: filter.minHourlyRate?.toString() ?? '',
    );
    maxRateCtrl = TextEditingController(
      text: filter.maxHourlyRate?.toString() ?? '',
    );
  }

  @override
  void dispose() {
    provCtrl.dispose();
    distCtrl.dispose();
    citCtrl.dispose();
    minRateCtrl.dispose();
    maxRateCtrl.dispose();
    super.dispose();
  }

  Widget _buildTextField(
    String label,
    TextEditingController controller, {
    TextInputType? keyboardType,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: TextField(
        controller: controller,
        keyboardType: keyboardType,
        decoration: InputDecoration(
          labelText: label,
          filled: true,
          fillColor: Colors.grey.shade100,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none,
          ),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 16,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SingleChildScrollView(
      child: Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom + 24,
          left: 24,
          right: 24,
          top: 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Filter Facilities',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                TextButton(
                  onPressed: () {
                    ref
                        .read(mapFilterProvider.notifier)
                        .updateFilter((_) => MapFilter());
                    Navigator.pop(context);
                  },
                  child: const Text('Reset'),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // EV Charging
            Container(
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(12),
              ),
              child: SwitchListTile(
                title: const Text(
                  'EV Charging Available',
                  style: TextStyle(fontWeight: FontWeight.w500),
                ),
                value: ev,
                activeThumbColor: theme.primaryColor,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                onChanged: (val) => setState(() => ev = val),
              ),
            ),
            const SizedBox(height: 16),

            // Location Filters
            _buildTextField('Province', provCtrl),
            _buildTextField('District', distCtrl),
            _buildTextField('City', citCtrl),

            // Price Range
            Row(
              children: [
                Expanded(
                  child: _buildTextField(
                    'Min Rate (Rs.)',
                    minRateCtrl,
                    keyboardType: TextInputType.number,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildTextField(
                    'Max Rate (Rs.)',
                    maxRateCtrl,
                    keyboardType: TextInputType.number,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),

            // Apply Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  ref
                      .read(mapFilterProvider.notifier)
                      .updateFilter(
                        (s) => s.copyWith(
                          hasEvCharging: ev,
                          province: provCtrl.text.isEmpty
                              ? null
                              : provCtrl.text,
                          district: distCtrl.text.isEmpty
                              ? null
                              : distCtrl.text,
                          city: citCtrl.text.isEmpty ? null : citCtrl.text,
                          minHourlyRate: double.tryParse(minRateCtrl.text),
                          maxHourlyRate: double.tryParse(maxRateCtrl.text),
                        ),
                      );
                  Navigator.pop(context);
                },
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  backgroundColor: theme.primaryColor,
                  foregroundColor: Colors.white,
                  elevation: 0,
                ),
                child: const Text(
                  'Apply Filters',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
