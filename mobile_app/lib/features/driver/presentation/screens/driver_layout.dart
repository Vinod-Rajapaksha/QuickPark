import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/widgets/nav_bar.dart';

class DriverLayout extends StatelessWidget {
  final StatefulNavigationShell navigationShell;

  const DriverLayout({super.key, required this.navigationShell});

  void _goBranch(int index) {
    navigationShell.goBranch(
      index,
      initialLocation: index == navigationShell.currentIndex,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
      body: navigationShell,
      bottomNavigationBar: NavBar(
        currentIndex: navigationShell.currentIndex,
        onTap: _goBranch,
        items: [
          NavBarItem(
            icon: CupertinoIcons.home,
            activeIcon: CupertinoIcons.house_fill,
            label: 'Home',
          ),
          NavBarItem(
            icon: CupertinoIcons.list_bullet,
            activeIcon: CupertinoIcons.list_bullet,
            label: 'Bookings',
          ),
          NavBarItem(
            icon: CupertinoIcons.person,
            activeIcon: CupertinoIcons.person_solid,
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
