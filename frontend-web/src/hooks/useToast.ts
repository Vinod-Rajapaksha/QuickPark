import { useContext } from "react";
import { ToastContext, type ToastApi } from "../app/providers/ToastProvider";

export const useToast = (): ToastApi => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside <ToastProvider>.");
  }
  return context;
};

export default useToast;
