import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/storage/local_storage_service.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen>
    with TickerProviderStateMixin {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<Map<String, dynamic>> _onboardingData = [
    {
      "title": "Find Parking Fast",
      "description": "Locate the nearest available parking spots in real-time.",
      "icon": CupertinoIcons.location_solid,
      "color1": const Color(0xFF00F2FE),
      "color2": const Color(0xFF4FACFE),
    },
    {
      "title": "Reserve Your Spot",
      "description":
          "Book a parking spot ahead of time and guarantee your space.",
      "icon": CupertinoIcons.calendar_badge_plus,
      "color1": const Color(0xFF4FACFE),
      "color2": const Color(0xFF00C9FF),
    },
    {
      "title": "Easy Payment",
      "description": "Pay securely and seamlessly through the app.",
      "icon": CupertinoIcons.creditcard_fill,
      "color1": const Color(0xFF00C9FF),
      "color2": const Color(0xFF92FE9D),
    },
  ];

  late AnimationController _iconAnimationController;

  @override
  void initState() {
    super.initState();
    _iconAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pageController.dispose();
    _iconAnimationController.dispose();
    super.dispose();
  }

  Future<void> _completeOnboarding() async {
    HapticFeedback.heavyImpact();
    await ref.read(localStorageProvider).setHasSeenOnboarding(true);
    if (mounted) {
      context.go('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentColor1 = _onboardingData[_currentPage]["color1"] as Color;
    final currentColor2 = _onboardingData[_currentPage]["color2"] as Color;

    return Scaffold(
      backgroundColor: const Color(0xFF0D0D12),
      body: Stack(
        children: [
          AnimatedPositioned(
            duration: const Duration(milliseconds: 500),
            curve: Curves.easeInOut,
            top: _currentPage == 1 ? -50 : -100,
            left: _currentPage == 2 ? -50 : -150,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 500),
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    currentColor1.withValues(alpha: 0.3),
                    currentColor1.withValues(alpha: 0.0),
                  ],
                ),
              ),
            ),
          ),
          AnimatedPositioned(
            duration: const Duration(milliseconds: 500),
            curve: Curves.easeInOut,
            bottom: _currentPage == 0 ? -100 : -50,
            right: _currentPage == 1 ? -150 : -50,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 500),
              width: 350,
              height: 350,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    currentColor2.withValues(alpha: 0.2),
                    currentColor2.withValues(alpha: 0.0),
                  ],
                ),
              ),
            ),
          ),

          SafeArea(
            child: Column(
              children: [
                // Top Bar
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 12,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      if (_currentPage != _onboardingData.length - 1)
                        TextButton(
                          onPressed: _completeOnboarding,
                          child: const Text(
                            "Skip",
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),

                // Main Content
                Expanded(
                  child: PageView.builder(
                    controller: _pageController,
                    onPageChanged: (value) {
                      HapticFeedback.selectionClick();
                      setState(() {
                        _currentPage = value;
                      });
                    },
                    itemCount: _onboardingData.length,
                    itemBuilder: (context, index) {
                      return Padding(
                        padding: const EdgeInsets.all(40.0),
                        child: SingleChildScrollView(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            AnimatedBuilder(
                              animation: _iconAnimationController,
                              builder: (context, child) {
                                return Transform.translate(
                                  offset: Offset(
                                    0,
                                    10 * _iconAnimationController.value - 5,
                                  ),
                                  child: Container(
                                    height: 200,
                                    width: 200,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      gradient: LinearGradient(
                                        colors: [
                                          _onboardingData[index]["color1"]
                                              .withOpacity(0.2),
                                          _onboardingData[index]["color2"]
                                              .withOpacity(0.2),
                                        ],
                                        begin: Alignment.topLeft,
                                        end: Alignment.bottomRight,
                                      ),
                                      boxShadow: [
                                        BoxShadow(
                                          color:
                                              _onboardingData[index]["color1"]
                                                  .withOpacity(0.3),
                                          blurRadius: 40,
                                          spreadRadius: 10,
                                        ),
                                      ],
                                      border: Border.all(
                                        color: _onboardingData[index]["color1"]
                                            .withOpacity(0.5),
                                        width: 2,
                                      ),
                                    ),
                                    child: Icon(
                                      _onboardingData[index]["icon"],
                                      size: 80,
                                      color: Colors.white,
                                    ),
                                  ),
                                );
                              },
                            ),
                            const SizedBox(height: 60),
                            Text(
                              _onboardingData[index]["title"]!,
                              style: const TextStyle(
                                fontSize: 32,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                                letterSpacing: 1.2,
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 20),
                            Text(
                              _onboardingData[index]["description"]!,
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                fontSize: 16,
                                color: Colors.white70,
                                height: 1.5,
                              ),
                            ),
                          ],
                        ),
                       ),
                      );
                    },
                  ),
                ),

                // Bottom Controls
                Padding(
                  padding: const EdgeInsets.all(32.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: List.generate(
                          _onboardingData.length,
                          (index) =>
                              buildDot(index: index, color: currentColor1),
                        ),
                      ),
                      GestureDetector(
                        onTap: () {
                          if (_currentPage == _onboardingData.length - 1) {
                            _completeOnboarding();
                          } else {
                            HapticFeedback.lightImpact();
                            _pageController.nextPage(
                              duration: const Duration(milliseconds: 500),
                              curve: Curves.easeOutQuint,
                            );
                          }
                        },
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 300),
                          height: 60,
                          width: _currentPage == _onboardingData.length - 1
                              ? 140
                              : 60,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(30),
                            gradient: LinearGradient(
                              colors: [currentColor1, currentColor2],
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: currentColor1.withValues(alpha: 0.4),
                                blurRadius: 20,
                                offset: const Offset(0, 10),
                              ),
                            ],
                          ),
                          child: Center(
                            child: _currentPage == _onboardingData.length - 1
                                ? const Text(
                                    "Get Started",
                                    style: TextStyle(
                                      color: Colors.black87,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16,
                                    ),
                                  )
                                : const Icon(
                                    CupertinoIcons.arrow_right,
                                    color: Colors.black87,
                                    size: 28,
                                  ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget buildDot({required int index, required Color color}) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      margin: const EdgeInsets.only(right: 8),
      height: 8,
      width: _currentPage == index ? 24 : 8,
      decoration: BoxDecoration(
        color: _currentPage == index ? color : Colors.white24,
        borderRadius: BorderRadius.circular(4),
      ),
    );
  }
}
