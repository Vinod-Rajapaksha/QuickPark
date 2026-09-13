import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Info, X } from "lucide-react";
import Button from "../Button/Button";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "info",
  isLoading = false,
}) => {
  const icons = {
    danger: <AlertTriangle className="w-6 h-6 text-red-600" />,
    warning: <AlertTriangle className="w-6 h-6 text-amber-600" />,
    info: <Info className="w-6 h-6 text-blue-600" />,
  };

  const bgColors = {
    danger: "bg-red-50",
    warning: "bg-amber-50",
    info: "bg-blue-50",
  };

  const confirmVariants = {
    danger: "danger",
    warning: "primary",
    info: "primary",
  } as const;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
            onClick={isLoading ? undefined : onClose}
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden pointer-events-auto"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${bgColors[type]}`}
                  >
                    {icons[type]}
                  </div>

                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold text-slate-900">
                        {title}
                      </h3>
                      <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="text-slate-400 hover:text-slate-500 transition-colors disabled:opacity-50"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      {description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <Button variant="ghost" onClick={onClose} disabled={isLoading}>
                  {cancelText}
                </Button>
                <Button
                  variant={confirmVariants[type]}
                  onClick={onConfirm}
                  isLoading={isLoading}
                >
                  {confirmText}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;
