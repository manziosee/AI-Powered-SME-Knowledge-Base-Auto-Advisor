"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Bell, AlertTriangle, FileText, ShieldCheck,
  CheckCheck, Trash2, Clock, BellOff, RefreshCw,
} from "lucide-react";
import { notifications as notifApi, type ApiNotification } from "@/lib/api";
import { useWebSocket } from "@/hooks/useWebSocket";

/* ── Config maps ─────────────────────────────────────────────── */
const typeIcon: Record<string, React.ReactNode> = {
  deadline:   <Clock       size={14} className="text-amber-500"  />,
  document:   <FileText    size={14} className="text-blue-500"   />,
  compliance: <ShieldCheck size={14} className="text-violet-500" />,
};

const typeIconBg: Record<string, string> = {
  deadline:   "bg-amber-500/10  border-amber-500/20",
  document:   "bg-blue-500/10   border-blue-500/20",
  compliance: "bg-violet-500/10 border-violet-500/20",
};

/* left accent bar color per severity */
const accentBar: Record<string, string> = {
  critical: "bg-rose-500",
  high:     "bg-amber-500",
  medium:   "bg-blue-500",
  info:     "bg-violet-400",
};

const dotGlow: Record<string, string> = {
  critical: "bg-rose-500 shadow-[0_0_6px_#fb7185] animate-pulse",
  high:     "bg-amber-500",
  medium:   "bg-blue-500",
  info:     "bg-violet-400",
};

/* ── Stat pill ───────────────────────────────────────────────── */
function StatPill({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${color}`}>
      <span className="text-xl font-black">{count}</span>
      <span className="text-[var(--fg-muted)] text-xs">{label}</span>
    </div>
  );
}

/* ── Filter chip ─────────────────────────────────────────────── */
type Filter = "all" | "unread" | "deadline" | "compliance" | "document";

const FILTERS: { id: Filter; label: string; icon: React.ReactNode }[] = [
  { id: "all",        label: "All",        icon: <Bell size={11} />        },
  { id: "unread",     label: "Unread",     icon: <BellOff size={11} />     },
  { id: "deadline",   label: "Deadlines",  icon: <Clock size={11} />       },
  { id: "compliance", label: "Compliance", icon: <ShieldCheck size={11} /> },
  { id: "document",   label: "Documents",  icon: <FileText size={11} />    },
];

type Notif = ApiNotification & { severity?: string };

export default function NotificationsPage() {
  const [notifs,  setNotifs]  = useState<Notif[]>([]);
  const [filter,  setFilter]  = useState<Filter>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notifApi.list(false, 100).then(({ data }) => {
      if (data?.items) setNotifs(data.items as Notif[]);
      setLoading(false);
    });
  }, []);

  // Live push: prepend new notifications from WebSocket
  const handleWsMessage = useCallback((msg: { type: string; data: Record<string, any> }) => {
    if (msg.type !== "notification") return;
    const d = msg.data;
    const incoming: Notif = {
      id: d.id ?? String(Date.now()),
      title: d.title ?? "New notification",
      message: d.message ?? "",
      notification_type: d.notification_type ?? "system",
      is_read: false,
      created_at: d.created_at ?? new Date().toISOString(),
    };
    setNotifs(prev => {
      if (prev.some(n => n.id === incoming.id)) return prev;
      return [incoming, ...prev];
    });
  }, []);

  useWebSocket({ onMessage: handleWsMessage });

  const filtered = notifs.filter((n) => {
    if (filter === "unread")   return !n.is_read;
    if (filter === "deadline" || filter === "compliance" || filter === "document")
      return n.notification_type === filter;
    return true;
  });

  const unread   = notifs.filter((n) => !n.is_read).length;
  const critical = notifs.filter((n) => n.severity === "critical").length;
  const high     = notifs.filter((n) => n.severity === "high").length;

  const markRead = async (id: string) => {
    await notifApi.markRead(id);
    setNotifs((p) => p.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };
  const markAllRead = async () => {
    await notifApi.markAllRead();
    setNotifs((p) => p.map((n) => ({ ...n, is_read: true })));
  };
  const deleteNotif = async (id: string) => {
    await notifApi.delete(id);
    setNotifs((p) => p.filter((n) => n.id !== id));
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.4)]">
              <Bell size={20} className="text-white" />
            </div>
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black shadow-[0_0_8px_rgba(239,68,68,0.6)] border-2 border-[var(--bg)]">
                {unread}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black text-[var(--fg)] tracking-tight">Notifications</h1>
            <p className="text-[var(--fg-muted)] text-sm mt-0.5">Stay on top of deadlines and compliance alerts</p>
          </div>
        </div>
        <button type="button" onClick={markAllRead}
          className="flex items-center gap-1.5 text-[var(--fg-muted)] text-xs hover:text-[var(--fg)] transition-all px-3 py-2 rounded-xl hover:bg-[var(--surface)] border border-transparent hover:border-[var(--border)]">
          <CheckCheck size={13} /> Mark all read
        </button>
      </div>

      {/* ── Summary stats ────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <StatPill label="Unread"   count={unread}   color="border-[var(--border)] text-[var(--fg)]" />
        <StatPill label="Critical" count={critical}  color="border-rose-500/25   bg-rose-500/5   text-rose-500"   />
        <StatPill label="High"     count={high}      color="border-amber-500/25  bg-amber-500/5  text-amber-500"  />
        <StatPill label="Total"    count={notifs.length} color="border-violet-500/20 bg-violet-500/5 text-violet-500" />
      </div>

      {/* ── Filter chips ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {FILTERS.map(({ id, label, icon }) => (
          <button key={id} type="button" onClick={() => setFilter(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              filter === id
                ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/25 scale-105"
                : "bg-[var(--surface)] border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-violet-500/30 hover:scale-105"
            }`}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ── Notification list ────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-[var(--fg-muted)]">
          <RefreshCw size={16} className="animate-spin" />
          <span className="text-sm">Loading notifications…</span>
        </div>
      ) : (
      <div className="flex flex-col gap-2.5">
        {filtered.map((n) => (
          <div
            key={n.id}
            onClick={() => markRead(n.id)}
            className={`group relative flex items-start gap-0 rounded-2xl border overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.01] ${
              !n.is_read ? "opacity-100" : "opacity-55 hover:opacity-80"
            } ${
              n.severity === "critical" ? "border-rose-500/25   bg-rose-500/4"   :
              n.notification_type === "deadline" ? "border-amber-500/20  bg-amber-500/3"  :
              n.notification_type === "compliance" ? "border-blue-500/15   bg-blue-500/3"   :
                                          "border-[var(--border)] bg-[var(--surface)]"
            }`}
          >
            <div className={`w-1 self-stretch flex-shrink-0 ${accentBar[n.severity ?? n.notification_type] ?? "bg-[var(--border)]"}`} />
            <div className={`m-3.5 w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${typeIconBg[n.notification_type] ?? "bg-[var(--surface)] border-[var(--border)]"}`}>
              {typeIcon[n.notification_type] ?? <Bell size={14} className="text-[var(--fg-muted)]" />}
            </div>
            <div className="flex-1 min-w-0 py-3.5 pr-10">
              <div className="flex items-center gap-2 mb-0.5">
                <p className={`text-sm font-semibold ${!n.is_read ? "text-[var(--fg)]" : "text-[var(--fg-muted)]"}`}>
                  {n.title}
                </p>
                {!n.is_read && (
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotGlow[n.severity ?? "info"]}`} />
                )}
              </div>
              <p className="text-[var(--fg-muted)] text-xs leading-relaxed line-clamp-2">{n.message}</p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-[var(--fg-muted)] text-[10px] opacity-60">
                  {new Date(n.created_at).toLocaleString()}
                </span>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-500">
                  {n.notification_type}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); deleteNotif(n.id); }}
              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--fg-muted)] hover:text-rose-500 transition-all"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center">
              <Bell size={24} className="text-[var(--fg-muted)] opacity-30" />
            </div>
            <p className="text-[var(--fg-muted)] text-sm">No notifications match this filter</p>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
