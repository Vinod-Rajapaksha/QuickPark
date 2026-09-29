export interface ChatMessage {
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  action_type?: string;
  action_payload?: {
    facility_name?: string;
    vehicle_type?: string;
    start_time?: string;
    end_time?: string;
    estimated_price?: number;
    [key: string]: unknown;
  };
}

export interface ChatSession {
  session_id: string;
  driver_id?: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface ChatRequest {
  session_id?: string;
  driver_id?: string;
  message: string;
  location_lat?: number;
  location_lng?: number;
}

export interface ChatResponse {
  session_id: string;
  message: ChatMessage;
}
