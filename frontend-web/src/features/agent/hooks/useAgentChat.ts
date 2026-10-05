import { useState, useCallback } from "react";
import { chatApi } from "../api/agentApi";
import type { ChatMessage } from "../types/chat.types";

export const useAgentChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "agent",
      content:
        "Hello! I am your QuickPark assistant. How can I help you with parking today?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      const userMessage: ChatMessage = {
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const response = await chatApi.sendMessage({
          session_id: sessionId,
          message: content,
        });

        setSessionId(response.session_id);
        setMessages((prev) => [...prev, response.message]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message");
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId],
  );

  const loadHistory = useCallback(async (sid: string) => {
    setIsLoading(true);
    try {
      const history = await chatApi.getHistory(sid);
      setSessionId(history.session_id);
      if (history.messages.length > 0) {
        setMessages(history.messages);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    loadHistory,
    addMessage,
  };
};
