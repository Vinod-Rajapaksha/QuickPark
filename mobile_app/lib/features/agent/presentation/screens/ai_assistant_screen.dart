import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/features/agent/data/models/chat_message_model.dart';
import 'package:mobile_app/features/agent/presentation/widgets/chat_bubble.dart';
import 'package:mobile_app/features/agent/presentation/widgets/chat_input_field.dart';
import 'package:mobile_app/core/network/api_client.dart';
import 'package:mobile_app/core/storage/secure_storage_service.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:mobile_app/features/driver/presentation/screens/driver_checkout_screen.dart';

class AiAssistantModal extends ConsumerStatefulWidget {
  const AiAssistantModal({super.key});

  @override
  ConsumerState<AiAssistantModal> createState() => _AiAssistantModalState();
}

class _AiAssistantModalState extends ConsumerState<AiAssistantModal> {
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

  String? _sessionId;

  Future<void> _handleSendMessage(String text) async {
    setState(() {
      _messages.add(
        ChatMessage(role: 'user', content: text, timestamp: DateTime.now()),
      );
      _isLoading = true;
    });
    _scrollToBottom();

    try {
      final dio = ref.read(dioProvider);
      final agentUrl = dotenv.env['AGENT_API_URL'];

      final response = await dio.post(
        '$agentUrl/chat/message',
        data: {'session_id': _sessionId, 'message': text},
      );

      _sessionId = response.data['session_id'];

      setState(() {
        _isLoading = false;
        _messages.add(
          ChatMessage(
            role: 'agent',
            content: response.data['message']['content'] ?? 'No response',
            timestamp: DateTime.now(),
            actionType: response.data['message']['action_type'],
            actionPayload: response.data['message']['action_payload'],
          ),
        );
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _messages.add(
          ChatMessage(
            role: 'agent',
            content:
                'Sorry, I encountered an error connecting to the agent service.',
            timestamp: DateTime.now(),
          ),
        );
      });
    }
    _scrollToBottom();
  }

  void _handleAction(String actionType, Map<String, dynamic> payload) async {
    if (actionType == 'confirm_reservation') {
      try {
        final dio = ref.read(dioProvider);
        final baseUrl = dio.options.baseUrl
            .replaceAll('5034', '8000')
            .replaceAll('/api', '');

        final secureStorage = ref.read(secureStorageProvider);
        final token = await secureStorage.getToken() ?? '';

        await dio.post(
          '$baseUrl/api/reservation/create',
          data: {
            'payload': {
              'facilityId': payload['facility_id'],
              'startTime': payload['start_time'],
              'endTime': payload['end_time'],
              'vehicleType': payload['vehicle_type'],
            },
            'token': token,
          },
        );
        setState(() {
          _messages.add(
            ChatMessage(
              role: 'agent',
              content:
                  'Your reservation has been created! It is now waiting for the provider to approve it.',
              timestamp: DateTime.now(),
            ),
          );
        });
        _scrollToBottom();
      } catch (e) {
        _handleSendMessage(
          'Sorry, I encountered an error creating your booking.',
        );
      }
    } else if (actionType == 'cancel_reservation') {
      _handleSendMessage('I want to cancel the booking.');
    } else if (actionType == 'pay_reservation') {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => DriverCheckoutScreen(
            reservationRequest: {
              'facilityId': payload['facility_id'],
              'vehicleTypeId': payload['vehicle_type'],
              'startTime': payload['start_time'],
              'endTime': payload['end_time'],
            },
            facilityData: {'name': payload['facility_name']},
            totalCost:
                double.tryParse(payload['estimated_price'].toString()) ?? 0.0,
          ),
        ),
      );
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
