import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/widgets/nav_bar.dart';

class AdminLayout extends StatelessWidget {
  final StatefulNavigationShell navigationShell;

  const AdminLayout({super.key, required this.navigationShell});

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
            label: 'Dashboard',
          ),
          NavBarItem(
            icon: CupertinoIcons.group,
            activeIcon: CupertinoIcons.group_solid,
            label: 'Users',
          ),
          NavBarItem(
            icon: CupertinoIcons.settings,
            activeIcon: CupertinoIcons.settings_solid,
            label: 'Settings',
          ),
        ],
      ),
    );
  }
}
