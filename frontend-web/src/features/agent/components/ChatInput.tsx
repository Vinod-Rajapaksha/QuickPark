import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input);
      setInput('');
    }
  };

  return (
    <form className="flex gap-2 items-center bg-slate-50 rounded-full p-1.5 pl-4 border border-slate-200 transition-all duration-300 focus-within:border-primary-400 focus-within:bg-white focus-within:shadow-sm" onSubmit={handleSubmit}>
      <input
        type="text"
        className="flex-1 bg-transparent border-none text-slate-800 text-[0.95rem] outline-none placeholder:text-slate-400"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask for parking..."
        disabled={isLoading}
      />
      <button 
        type="submit" 
        className="shrink-0 bg-primary-600 border-none w-10 h-10 rounded-full flex items-center justify-center text-white cursor-pointer transition-all duration-200 hover:bg-primary-700 hover:shadow-md disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
        disabled={!input.trim() || isLoading}
      >
        {isLoading ? (
          <span className="w-5 h-5 border-2 border-slate-400 border-t-slate-100 rounded-full animate-spin"></span>
        ) : (
          <Send size={18} className="mr-0.5 mt-0.5" />
        )}
      </button>
    </form>
  );
};
