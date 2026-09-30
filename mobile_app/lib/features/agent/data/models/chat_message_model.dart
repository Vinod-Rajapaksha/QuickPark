class ChatMessage {
  final String role;
  final String content;
  final DateTime timestamp;
  final String? actionType;
  final Map<String, dynamic>? actionPayload;

  ChatMessage({
    required this.role,
    required this.content,
    required this.timestamp,
    this.actionType,
    this.actionPayload,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      role: json['role'] ?? 'user',
      content: json['content'] ?? '',
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'])
          : DateTime.now(),
      actionType: json['action_type'],
      actionPayload: json['action_payload'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'role': role,
      'content': content,
      'timestamp': timestamp.toIso8601String(),
      if (actionType != null) 'action_type': actionType,
      if (actionPayload != null) 'action_payload': actionPayload,
    };
  }
}
