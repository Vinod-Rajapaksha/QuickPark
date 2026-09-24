import React from "react";
import { X } from "lucide-react";
import {
  ALERT_TONE_CLASSES,
  ALERT_TONE_ICON,
  ALERT_TONE_ICON_CLASSES,
  type AlertTone,
} from "./Alert";

export interface ToastMessage {
  id: number;
  tone: AlertTone;
  title: string;
  description?: string;
}

interface ToastCardProps {
  toast: ToastMessage;
  onDismiss: (id: number) => void;
}

export const ToastCard: React.FC<ToastCardProps> = ({ toast, onDismiss }) => {
  const Icon = ALERT_TONE_ICON[toast.tone];
  return (
    <div
      className={`pointer-events-auto flex w-80 items-start gap-2 rounded-lg border px-3 py-2.5 shadow-lg backdrop-blur-sm ${ALERT_TONE_CLASSES[toast.tone]}`}
    >
      <Icon size={16} className={`mt-0.5 shrink-0 ${ALERT_TONE_ICON_CLASSES[toast.tone]}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 break-words text-xs opacity-90">{toast.description}</p>
        )}
      </div>
      <button
        type="button"
        aria-label="Dismiss this notification"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
      >
        <X size={14} />
      </button>
    </div>
  );
};

interface ToastStackProps {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}

export const ToastStack: React.FC<ToastStackProps> = ({ toasts, onDismiss }) => (
  <div
    aria-live="polite"
    className="pointer-events-none fixed right-4 top-4 z-50 flex flex-col items-end gap-2"
  >
    {toasts.map((toast) => (
      <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
    ))}
  </div>
);

export default ToastStack;
