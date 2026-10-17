import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage } from '../types/chat.types';

interface ChatBubbleProps {
  message: ChatMessage;
  onAction?: (actionType: string, payload: NonNullable<ChatMessage['action_payload']>) => void;
  isActionLocked?: boolean;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onAction, isActionLocked = false }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] px-4 py-3 rounded-[18px] text-[0.95rem] leading-relaxed relative ${
        isUser 
          ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-br-sm shadow-[0_4px_15px_rgba(37,99,235,0.2)]' 
          : 'bg-white text-slate-700 rounded-bl-sm border border-slate-200 shadow-sm'
      }`}>
        <div className="markdown-content">
          <ReactMarkdown
            components={{
              p: ({...props}) => <p className="m-0 mb-1 whitespace-pre-wrap" {...props} />,
              strong: ({...props}) => <strong className="font-semibold" {...props} />,
              ul: ({...props}) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
              ol: ({...props}) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
              li: ({...props}) => <li className="pl-1" {...props} />
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        
        {message.action_type === 'reservation_approval' && message.action_payload && (
          <div className={`mt-3 border rounded-xl p-3 text-sm ${isUser ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-200 shadow-inner'}`}>
            <h4 className={`font-semibold mb-2 flex items-center gap-2 ${isUser ? 'text-white' : 'text-slate-800'}`}>
              <svg className={`w-4 h-4 ${isUser ? 'text-primary-200' : 'text-primary-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Reservation Details
            </h4>
            <div className={`flex flex-col gap-1 mb-3 text-xs ${isUser ? 'text-white/80' : 'text-slate-600'}`}>
              <div className="flex justify-between"><span className="opacity-70">Location:</span> <span className={`font-medium ${isUser ? 'text-white' : 'text-slate-900'}`}>{message.action_payload.facility_name}</span></div>
              <div className="flex justify-between"><span className="opacity-70">Vehicle:</span> <span className={`font-medium ${isUser ? 'text-white' : 'text-slate-900'}`}>{message.action_payload.vehicle_type}</span></div>
              <div className="flex justify-between"><span className="opacity-70">Times:</span> <span className={`font-medium ${isUser ? 'text-white' : 'text-slate-900'}`}>{new Date(message.action_payload.start_time as string).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})} - {new Date(message.action_payload.end_time as string).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span></div>
              <div className={`flex justify-between mt-1 pt-1 border-t ${isUser ? 'border-white/20' : 'border-slate-200'}`}>
                <span className="opacity-70 font-semibold">Total Price:</span> 
                <span className={`font-bold ${isUser ? 'text-white' : 'text-primary-600'}`}>{message.action_payload.estimated_price} LKR</span>
              </div>
            </div>
            {isActionLocked ? (
              <div className="w-full py-2 bg-slate-100 rounded-lg text-center text-xs font-semibold text-slate-500 border border-slate-200 flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Reservation Submitted
              </div>
            ) : (
              <div className="flex gap-2">
                <button 
                  className={`flex-1 rounded-lg py-1.5 transition-all shadow-sm font-medium ${
                    isUser 
                      ? 'bg-white text-primary-600 hover:bg-white/90' 
                      : 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-md'
                  }`}
                  onClick={() => onAction && onAction('confirm_reservation', message.action_payload!)}
                >
                  Confirm
                </button>
                <button 
                  className={`flex-1 rounded-lg py-1.5 transition-colors ${
                    isUser 
                      ? 'bg-black/20 hover:bg-black/30 text-white' 
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                  onClick={() => onAction && onAction('cancel_reservation', message.action_payload!)}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {message.action_type === 'payment_required' && message.action_payload && (
          <div className="mt-3 border rounded-xl p-3 text-sm bg-slate-50 border-slate-200 shadow-inner">
            <div className="flex flex-col items-center gap-2 mb-3">
              <span className="text-xl">{isActionLocked ? "✅" : "💳"}</span>
              <span className="font-semibold text-slate-800">{isActionLocked ? "Payment Completed" : "Payment Pending"}</span>
              <span className={`text-xl font-bold ${isActionLocked ? "text-slate-500" : "text-primary-600"}`}>{message.action_payload.estimated_price} LKR</span>
            </div>
            <button 
              disabled={isActionLocked}
              className={`w-full rounded-lg py-2 transition-all shadow-sm font-medium flex items-center justify-center gap-2 ${
                isActionLocked
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300"
                  : "bg-green-600 text-white hover:bg-green-700 hover:shadow-md cursor-pointer"
              }`}
              onClick={() => !isActionLocked && onAction && onAction('pay_reservation', message.action_payload!)}
            >
              {isActionLocked ? (
                <>
                  <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Paid
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Pay Now
                </>
              )}
            </button>
          </div>
        )}

        <span className={`text-[0.7rem] opacity-70 block text-right mt-1 ${isUser ? 'text-white' : 'text-slate-400'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};
