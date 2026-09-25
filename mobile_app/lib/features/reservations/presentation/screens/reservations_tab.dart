import 'package:flutter/material.dart';

class ReservationsTab extends StatelessWidget {
  const ReservationsTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Reservations')),
      body: const Center(
        child: Text('Active and past reservations will appear here.'),
      ),
    );
  }
}
