import 'package:flutter/material.dart';

class AppLoader extends StatelessWidget {
  final Color? color;
  final double size;

  const AppLoader({
    super.key,
    this.color,
    this.size = 24.0,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SizedBox(
        width: size,
        height: size,
        child: CircularProgressIndicator(
          color: color ?? Theme.of(context).colorScheme.primary,
          strokeWidth: 2.5,
        ),
      ),
    );
  }
}

class FullScreenLoader extends StatelessWidget {
  final bool isProcessing;
  final Widget child;

  const FullScreenLoader({
    super.key,
    required this.isProcessing,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.center,
      children: [
        child,
        if (isProcessing)
          Container(
            color: Colors.black54,
            child: const Center(
              child: AppLoader(color: Colors.white, size: 40),
            ),
          ),
      ],
    );
  }
}
