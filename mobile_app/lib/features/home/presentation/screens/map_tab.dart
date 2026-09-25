import 'package:flutter/material.dart';

class MapTab extends StatelessWidget {
  const MapTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Find Parking')),
      body: const Center(child: Text('Map View Integration Goes Here')),
    );
  }
}
