"use client";

import { Toaster as Sonner } from "sonner";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastOptions {
  description?: string;
  duration?: number;
  closeButton?: boolean;
}

interface Toast {
  (options?: ToastOptions): string;
  success: (options?: ToastOptions) => string;
  error: (options?: ToastOptions) => string;
  warning: (options?: ToastOptions) => string;
  info: (options?: ToastOptions) => string;
}

export const toast: Toast = ((options?: ToastOptions) => {
  // This will be handled by Sonner's toast
  return "";
}) as Toast;

toast.success = (options?: ToastOptions) => "";
toast.error = (options?: ToastOptions) => "";
toast.warning = (options?: ToastOptions) => "";
toast.info = (options?: ToastOptions) => "";

export function ToastProvider() {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        style: {
          background: "linear-gradient(135deg, rgba(20,20,35,0.98) 0%, rgba(10,10,20,0.98) 100%)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "16px",
          padding: "16px 20px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05) inset",
        },
        className: "font-sans",
      }}
      className="toaster-group"
      richColors
      closeButton
      duration={5000}
    />
  );
}

export { Sonner };