import 'package:flutter/material.dart';

class ChatInputField extends StatefulWidget {
  final Function(String) onSend;
  final bool isLoading;

  const ChatInputField({
    super.key,
    required this.onSend,
    this.isLoading = false,
  });

  @override
  State<ChatInputField> createState() => _ChatInputFieldState();
}

class _ChatInputFieldState extends State<ChatInputField> {
  final TextEditingController _controller = TextEditingController();
  bool _hasText = false;

  @override
  void initState() {
    super.initState();
    _controller.addListener(() {
      final hasText = _controller.text.trim().isNotEmpty;
      if (_hasText != hasText) {
        setState(() {
          _hasText = hasText;
        });
      }
    });
  }

  void _handleSend() {
    final text = _controller.text.trim();
    if (text.isNotEmpty && !widget.isLoading) {
      widget.onSend(text);
      _controller.clear();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        boxShadow: [
          BoxShadow(
            color: Theme.of(context).colorScheme.shadow.withValues(alpha: 0.05),
            offset: const Offset(0, -4),
            blurRadius: 16,
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(
              child: TextField(
                controller: _controller,
                autofocus: true,
                minLines: 1,
                maxLines: 4,
                textInputAction: TextInputAction.newline,
                style: TextStyle(
                  color: Theme.of(context).colorScheme.onSurface,
                ),
                decoration: InputDecoration(
                  hintText: 'Ask QuickPark AI...',
                  hintStyle: TextStyle(
                    color: Theme.of(
                      context,
                    ).colorScheme.onSurface.withValues(alpha: 0.5),
                  ),
                  filled: true,
                  fillColor: Color.lerp(
                    Theme.of(context).colorScheme.surface,
                    Theme.of(context).colorScheme.onSurface,
                    0.04,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24.0),
                    borderSide: BorderSide.none,
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24.0),
                    borderSide: BorderSide(
                      color: Theme.of(
                        context,
                      ).colorScheme.onSurface.withValues(alpha: 0.1),
                    ),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24.0),
                    borderSide: BorderSide(
                      color: Theme.of(
                        context,
                      ).colorScheme.primary.withValues(alpha: 0.5),
                      width: 1.0,
                    ),
                  ),
                  isDense: true,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 12,
                  ),
                ),
                enabled: !widget.isLoading,
              ),
            ),
            const SizedBox(width: 12.0),
            GestureDetector(
              onTap: _hasText && !widget.isLoading ? _handleSend : null,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                curve: Curves.easeInOut,
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: _hasText
                      ? Theme.of(context).colorScheme.primary
                      : Theme.of(
                          context,
                        ).colorScheme.onSurface.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                  boxShadow: _hasText
                      ? [
                          BoxShadow(
                            color: Theme.of(
                              context,
                            ).colorScheme.primary.withValues(alpha: 0.4),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ]
                      : [],
                ),
                child: Center(
                  child: widget.isLoading
                      ? SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            color: Theme.of(context).colorScheme.onPrimary,
                            strokeWidth: 2,
                          ),
                        )
                      : Icon(
                          Icons.send_rounded,
                          color: _hasText
                              ? Theme.of(context).colorScheme.onPrimary
                              : Theme.of(
                                  context,
                                ).colorScheme.onSurface.withValues(alpha: 0.4),
                        ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}
