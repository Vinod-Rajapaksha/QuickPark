import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { AlertTone } from "../../components/feedback/Alert";
import { ToastStack, type ToastMessage } from "../../components/feedback/Toast";

export interface ToastApi {
  show: (tone: AlertTone, title: string, description?: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  dismiss: (id: number) => void;
}

// Null until a <ToastProvider> is mounted — useToast() turns that into a readable error.
export const ToastContext = createContext<ToastApi | null>(null);

const LIFETIME_MS = 6000;
const MAX_VISIBLE = 4;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pending = timers.current;
  useEffect(
    () => () => {
      pending.forEach(clearTimeout);
      pending.clear();
    },
    [pending],
  );

  const show = useCallback(
    (tone: AlertTone, title: string, description?: string) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, tone, title, description }].slice(-MAX_VISIBLE));
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), LIFETIME_MS),
      );
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      dismiss,
      success: (title, description) => show("success", title, description),
      error: (title, description) => show("error", title, description),
      warning: (title, description) => show("warning", title, description),
      info: (title, description) => show("info", title, description),
    }),
    [show, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
};

export default ToastProvider;
