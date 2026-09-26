import React from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

export type AlertTone = "error" | "warning" | "success" | "info";

const ALERT_TONE_CLASSES: Record<AlertTone, string> = {
  error: "border-red-200 bg-red-50 text-red-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
};

const ALERT_TONE_ICON_CLASSES: Record<AlertTone, string> = {
  error: "text-red-600",
  warning: "text-amber-600",
  success: "text-emerald-600",
  info: "text-blue-600",
};

const ALERT_TONE_ICON: Record<AlertTone, React.ElementType> = {
  error: AlertTriangle,
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Info,
};

interface AlertProps {
  tone?: AlertTone;
  title?: string;
  children?: React.ReactNode;
  className?: string;
  onDismiss?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  tone = "info",
  title,
  children,
  className = "",
  onDismiss,
}) => {
  const Icon = ALERT_TONE_ICON[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${ALERT_TONE_CLASSES[tone]} ${className}`}
    >
      <Icon size={16} className={`mt-0.5 shrink-0 ${ALERT_TONE_ICON_CLASSES[tone]}`} />
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={title ? "mt-0.5" : ""}>{children}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          aria-label="Dismiss this message"
          onClick={onDismiss}
          className="shrink-0 rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default Alert;
