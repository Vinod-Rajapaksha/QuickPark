import 'package:flutter/material.dart';
import 'package:mobile_app/features/agent/data/models/chat_message_model.dart';
import 'package:mobile_app/features/agent/presentation/widgets/chat_bubble.dart';
import 'package:mobile_app/features/agent/presentation/widgets/chat_input_field.dart';

class AiAssistantModal extends StatefulWidget {
  const AiAssistantModal({super.key});

  @override
  State<AiAssistantModal> createState() => _AiAssistantModalState();
}

class _AiAssistantModalState extends State<AiAssistantModal> {
  final List<ChatMessage> _messages = [
    ChatMessage(
      role: 'agent',
      content:
          'Hello! I am your QuickPark assistant. How can I help you today?',
      timestamp: DateTime.now(),
    ),
  ];
  bool _isLoading = false;
  final ScrollController _scrollController = ScrollController();

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _handleSendMessage(String text) async {
    setState(() {
      _messages.add(
        ChatMessage(role: 'user', content: text, timestamp: DateTime.now()),
      );
      _isLoading = true;
    });
    _scrollToBottom();

    await Future.delayed(const Duration(seconds: 2));

    setState(() {
      _isLoading = false;
      _messages.add(
        ChatMessage(
          role: 'agent',
          content:
              'I have received your request regarding: "$text". I am currently connecting to the agent service to process this.',
          timestamp: DateTime.now(),
        ),
      );
    });
    _scrollToBottom();
  }

  void _handleAction(String actionType, Map<String, dynamic> payload) {
    if (actionType == 'confirm_reservation') {
      _handleSendMessage(
        'I confirm the booking for ${payload['facility_name']}',
      );
    } else if (actionType == 'cancel_reservation') {
      _handleSendMessage('I want to cancel the booking.');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Container(
        height:
            (MediaQuery.of(context).size.height * 0.85) >
                MediaQuery.of(context).viewInsets.bottom
            ? (MediaQuery.of(context).size.height * 0.85) -
                  MediaQuery.of(context).viewInsets.bottom
            : 0,
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: ClipRRect(
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          child: Scaffold(
            resizeToAvoidBottomInset: false,
            backgroundColor: Colors.transparent,
            appBar: AppBar(
              backgroundColor: Theme.of(context).colorScheme.surface,
              elevation: 0,
              automaticallyImplyLeading: false,
              shape: const RoundedRectangleBorder(
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
              ),
              title: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.primary,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.smart_toy,
                      color: Theme.of(context).colorScheme.onPrimary,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'QuickPark AI',
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.onSurface,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Row(
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              color: Theme.of(context).colorScheme.primary,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            'Online',
                            style: TextStyle(
                              color: Theme.of(context).colorScheme.primary,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const Spacer(),
                  IconButton(
                    icon: Icon(
                      Icons.close,
                      color: Theme.of(context).colorScheme.onSurface,
                    ),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
            ),
            body: Column(
              children: [
                Expanded(
                  child: ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.symmetric(vertical: 16.0),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      return ChatBubble(
                        message: _messages[index],
                        onAction: _handleAction,
                      );
                    },
                  ),
                ),
                ChatInputField(
                  onSend: _handleSendMessage,
                  isLoading: _isLoading,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
