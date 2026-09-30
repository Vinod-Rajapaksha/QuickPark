import React, { useEffect, useRef } from 'react';
import { useAgentChat } from '../hooks/useAgentChat';
import { ChatBubble } from './ChatBubble';
import { ChatInput } from './ChatInput';
import type { ChatMessage } from '../types/chat.types';

export const AgentChatView: React.FC = () => {
  const { messages, isLoading, error, sendMessage } = useAgentChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleAction = async (actionType: string, payload: NonNullable<ChatMessage['action_payload']>) => {
    if (actionType === 'confirm_reservation') {
      sendMessage(`I confirm the booking for ${payload.facility_name}.`);
    } else if (actionType === 'cancel_reservation') {
      sendMessage(`I want to cancel the booking.`);
    }
  };

  return (
    <div className="flex flex-col h-[600px] max-h-[80vh] w-full max-w-[450px] bg-white/95 backdrop-blur-xl border border-slate-200 rounded-3xl overflow-hidden shadow-[0_12px_40px_0_rgba(0,0,0,0.15)] font-sans">
      <div className="flex items-center px-5 py-4 bg-slate-50 border-b border-slate-200">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mr-3 text-white shadow-md">
           <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1H1a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2zM5.5 14a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm13 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
           </svg>
        </div>
        <div>
          <h3 className="m-0 text-lg font-semibold text-slate-900">QuickPark AI</h3>
          <span className="text-xs text-primary-600 font-medium flex items-center gap-1.5 before:content-[''] before:inline-block before:w-1.5 before:h-1.5 before:rounded-full before:bg-primary-500 before:shadow-[0_0_6px_rgba(37,99,235,0.6)]">Online</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 bg-slate-50/50 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-sm">
        {messages.map((msg, idx) => (
          <ChatBubble key={idx} message={msg} onAction={handleAction} />
        ))}
        {isLoading && (
          <div className="flex w-full justify-start">
            <div className="max-w-[80%] px-4 py-3 rounded-[18px] text-[0.95rem] leading-relaxed relative bg-white text-slate-500 rounded-bl-sm border border-slate-200 shadow-sm flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse"></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse delay-75"></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse delay-150"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && <div className="text-red-500 text-sm text-center p-2 bg-red-50 font-medium border-y border-red-100">{error}</div>}
      
      <div className="p-4 bg-white border-t border-slate-200">
        <ChatInput onSend={sendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
};
