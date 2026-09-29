import 'dart:async';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import '../screens/ai_assistant_screen.dart';

class AgentBubbleFAB extends StatefulWidget {
  const AgentBubbleFAB({super.key});

  @override
  State<AgentBubbleFAB> createState() => _AgentBubbleFABState();
}

class _AgentBubbleFABState extends State<AgentBubbleFAB>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _scaleAnimation;
  late Animation<Offset> _floatAnimation;
  bool _showIdea = false;
  Timer? _ideaTimer;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat(reverse: true);

    _scaleAnimation = Tween<double>(begin: 1.0, end: 1.08).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOutSine),
    );

    _floatAnimation =
        Tween<Offset>(
          begin: const Offset(0, 0.0),
          end: const Offset(0, -0.06),
        ).animate(
          CurvedAnimation(
            parent: _pulseController,
            curve: Curves.easeInOutSine,
          ),
        );

    _startIdeaTimer();
  }

  void _startIdeaTimer() {
    _ideaTimer = Timer.periodic(const Duration(seconds: 15), (timer) {
      if (!mounted) return;
      setState(() {
        _showIdea = true;
      });
      Future.delayed(const Duration(seconds: 4), () {
        if (!mounted) return;
        setState(() {
          _showIdea = false;
        });
      });
    });

    Future.delayed(const Duration(seconds: 5), () {
      if (!mounted) return;
      setState(() {
        _showIdea = true;
      });
      Future.delayed(const Duration(seconds: 4), () {
        if (!mounted) return;
        setState(() {
          _showIdea = false;
        });
      });
    });
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _ideaTimer?.cancel();
    super.dispose();
  }

  void _openAgentModal() {
    setState(() {
      _showIdea = false;
    });
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      useRootNavigator: true,
      builder: (context) {
        return const AiAssistantModal();
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      alignment: Alignment.bottomRight,
      children: [
        AnimatedPositioned(
          duration: const Duration(milliseconds: 600),
          curve: Curves.easeOutBack,
          bottom: _showIdea ? 68 : 40,
          right: 20,
          child: AnimatedOpacity(
            duration: const Duration(milliseconds: 400),
            curve: Curves.easeIn,
            opacity: _showIdea ? 1.0 : 0.0,
            child: SlideTransition(
              position: _floatAnimation,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          Theme.of(context).colorScheme.surface,
                          Color.lerp(
                            Theme.of(context).colorScheme.surface,
                            Theme.of(context).colorScheme.primary,
                            0.08,
                          )!,
                        ],
                      ),
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: Theme.of(
                            context,
                          ).colorScheme.primary.withValues(alpha: 0.4),
                          blurRadius: 16,
                          offset: const Offset(0, 6),
                        ),
                      ],
                      border: Border.all(
                        color: Theme.of(
                          context,
                        ).colorScheme.primary.withValues(alpha: 0.6),
                        width: 1.5,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          CupertinoIcons.sparkles,
                          color: Colors.amber,
                          size: 18,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Need parking ideas?',
                          style: TextStyle(
                            color: Theme.of(context).colorScheme.onSurface,
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    margin: const EdgeInsets.only(right: 28),
                    width: 12,
                    height: 12,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          Theme.of(context).colorScheme.surface,
                          Color.lerp(
                            Theme.of(context).colorScheme.surface,
                            Theme.of(context).colorScheme.primary,
                            0.08,
                          )!,
                        ],
                      ),
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Theme.of(
                            context,
                          ).colorScheme.primary.withValues(alpha: 0.3),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                      border: Border.all(
                        color: Theme.of(
                          context,
                        ).colorScheme.primary.withValues(alpha: 0.6),
                        width: 1.5,
                      ),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Container(
                    margin: const EdgeInsets.only(right: 15),
                    width: 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: Color.lerp(
                        Theme.of(context).colorScheme.surface,
                        Theme.of(context).colorScheme.primary,
                        0.05,
                      )!,
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: Theme.of(
                          context,
                        ).colorScheme.primary.withValues(alpha: 0.6),
                        width: 1.0,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        ScaleTransition(
          scale: _scaleAnimation,
          child: FloatingActionButton(
            onPressed: _openAgentModal,
            backgroundColor: Theme.of(context).colorScheme.primary,
            elevation: 8,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(30.0),
            ),
            child: Icon(
              Icons.support_agent,
              color: Theme.of(context).colorScheme.onPrimary,
              size: 28,
            ),
          ),
        ),
      ],
    );
  }
}
