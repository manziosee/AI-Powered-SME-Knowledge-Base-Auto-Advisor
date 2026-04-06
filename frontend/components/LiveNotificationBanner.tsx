"use client";

import React, { useState, useCallback } from "react";
import { Bell, X, Wifi, WifiOff } from "lucide-react";
import { useWebSocket, WsMessage } from "@/hooks/useWebSocket";

interface Toast {
  id: string;
  title: string;
  message: string;
  type: string;
}

export default function LiveNotificationBanner() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const handleMessage = useCallback((msg: WsMessage) => {
    if (msg.type !== "notification") return;
    const d = msg.data;
    const toast: Toast = {
      id: d.id ?? String(Date.now()),
      title: d.title ?? "New notification",
      message: d.message ?? "",
      type: d.notification_type ?? "system",
    };
    setToasts(prev => [toast, ...prev].slice(0, 4));
    // Auto-dismiss after 6 s
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toast.id)), 6_000);
  }, []);

  const { connected } = useWebSocket({ onMessage: handleMessage });

  const dismiss = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const typeColor: Record<string, string> = {
    deadline:          "border-amber-500/40 bg-amber-500/8",
    risk_alert:        "border-rose-500/40 bg-rose-500/8",
    compliance:        "border-violet-500/40 bg-violet-500/8",
    expiring_contract: "border-orange-500/40 bg-orange-500/8",
    system:            "border-[var(--border)] bg-[var(--surface)]",
  };

  return (
    <>
      {/* Connection status badge (top-right, subtle) */}
      <div className="fixed top-4 right-4 z-40 flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[10px] text-[var(--fg-muted)] shadow-sm">
        {connected
          ? <><Wifi size={10} className="text-emerald-400" /> Live</>
          : <><WifiOff size={10} className="text-rose-400" /> Offline</>}
      </div>

      {/* Toast stack */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 w-80">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-start gap-3 p-4 rounded-2xl border shadow-xl animate-slide-in ${typeColor[t.type] ?? typeColor.system}`}
          >
            <Bell size={15} className="text-violet-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[var(--fg-soft)] font-semibold text-xs">{t.title}</p>
              {t.message && <p className="text-[var(--fg-muted)] text-xs mt-0.5 line-clamp-2">{t.message}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="text-[var(--fg-muted)] hover:text-[var(--fg)] flex-shrink-0">
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
