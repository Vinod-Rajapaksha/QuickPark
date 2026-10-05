import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import Button from "../../../components/common/Button/Button";

interface NicPreviewModalProps {
  open: boolean;
  url: string | null;
  title: string;
  onClose: () => void;
  emptyMessage?: string;
}

export const NicPreviewModal: React.FC<NicPreviewModalProps> = ({
  open,
  url,
  title,
  onClose,
  emptyMessage = "No NIC document is available for this provider.",
}) => {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h4 className="truncate font-semibold text-slate-900">{title}</h4>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close preview"
            onClick={onClose}
          >
            <X size={18} />
          </Button>
        </div>

        <div className="flex-1 overflow-auto bg-slate-50 p-4">
          {url ? (
            <img
              src={url}
              alt={title}
              className="mx-auto max-h-[70vh] w-auto rounded-lg border border-slate-200 object-contain"
            />
          ) : (
            <p className="py-10 text-center text-sm text-slate-500">
              {emptyMessage}
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default NicPreviewModal;
