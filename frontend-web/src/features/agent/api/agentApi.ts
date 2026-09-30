import type {
  ChatRequest,
  ChatResponse,
  ChatSession,
} from "../types/chat.types";

const BASE_URL = import.meta.env.VITE_AGENT_API_URL;

export const chatApi = {
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${BASE_URL}/chat/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error("Failed to send message");
    }

    return response.json();
  },

  async getHistory(sessionId: string): Promise<ChatSession> {
    const response = await fetch(`${BASE_URL}/chat/history/${sessionId}`);

    if (!response.ok) {
      throw new Error("Failed to fetch history");
    }

    return response.json();
  },
};
