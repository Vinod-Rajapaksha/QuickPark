import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/widgets/nav_bar.dart';

class ProviderLayout extends StatelessWidget {
  final StatefulNavigationShell navigationShell;

  const ProviderLayout({super.key, required this.navigationShell});

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
            icon: CupertinoIcons.chart_bar,
            activeIcon: CupertinoIcons.chart_bar_fill,
            label: 'Dashboard',
          ),
          NavBarItem(
            icon: CupertinoIcons.qrcode_viewfinder,
            activeIcon: CupertinoIcons.qrcode_viewfinder,
            label: 'Scan',
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
