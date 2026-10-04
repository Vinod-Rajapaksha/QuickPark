import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/widgets/nav_bar.dart';
import '../../../agent/presentation/widgets/agent_bubble_fab.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';

class HideAgentBubbleNotifier extends Notifier<bool> {
  @override
  bool build() => false;

  void hide() => state = true;
  void show() => state = false;
}

final hideAgentBubbleProvider = NotifierProvider<HideAgentBubbleNotifier, bool>(
  () {
    return HideAgentBubbleNotifier();
  },
);

class DriverLayout extends ConsumerWidget {
  final StatefulNavigationShell navigationShell;

  const DriverLayout({super.key, required this.navigationShell});

  void _goBranch(int index) {
    navigationShell.goBranch(
      index,
      initialLocation: index == navigationShell.currentIndex,
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hideAgent = ref.watch(hideAgentBubbleProvider);

    return Scaffold(
      extendBody: true,
      body: navigationShell,
      floatingActionButton: hideAgent ? null : const AgentBubbleFAB(),
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
