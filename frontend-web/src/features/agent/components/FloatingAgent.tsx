import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { AgentChatView } from "./AgentChatView";

const AICoreIcon = () => (
  <div className="relative w-8 h-8 flex items-center justify-center">
    <motion.div
      className="absolute inset-[-4px] bg-white/30 rounded-[10px] rotate-45 blur-[1px]"
      animate={{ rotate: [45, 225, 405], scale: [1, 1.1, 1] }}
      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
    />
    <motion.div
      className="absolute inset-[-4px] bg-white/20 rounded-[10px] rotate-[135deg] blur-[1px]"
      animate={{ rotate: [135, -45, -225], scale: [1, 1.2, 1] }}
      transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
    />
    <motion.div
      className="absolute inset-0 bg-white/40 rounded-full"
      animate={{ scale: [1, 0.85, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    />
    <Sparkles
      size={18}
      className="relative z-10 text-primary-100 drop-shadow-sm"
      strokeWidth={2.5}
    />
  </div>
);

export const FloatingAgent: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-28 right-6 z-50 shadow-2xl rounded-3xl overflow-hidden flex flex-col"
            style={{ width: "400px" }}
          >
            {/* Header overlay for close button */}
            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 bg-black/20 hover:bg-black/40 text-white/80 hover:text-white rounded-full backdrop-blur-md transition-colors"
                aria-label="Close chat"
              >
                <X size={18} />
              </button>
            </div>

            <AgentChatView />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-8 right-8 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white shadow-[0_8px_32px_rgba(37,99,235,0.4)] hover:shadow-[0_8px_40px_rgba(37,99,235,0.6)] transition-shadow group"
        aria-label="Open AI Assistant"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={28} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="relative"
            >
              <AICoreIcon />
            </motion.div>
          )}
        </AnimatePresence>

        {!isOpen && (
          <span
            className="absolute inset-0 rounded-full border border-primary-400 animate-ping opacity-30"
            style={{ animationDuration: "2s" }}
          ></span>
        )}
        {!isOpen && (
          <span
            className="absolute inset-[-8px] rounded-full bg-primary-400 animate-pulse opacity-10"
            style={{ animationDuration: "3s" }}
          ></span>
        )}
      </motion.button>
    </>
  );
};
