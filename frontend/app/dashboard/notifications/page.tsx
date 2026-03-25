"use client";

import React, { useState } from "react";
import { Bell, AlertTriangle, FileText, ShieldCheck, CheckCheck, Trash2, Clock } from "lucide-react";
import { NOTIFICATIONS } from "@/lib/mock-data";

const typeIcon: Record<string, React.ReactNode> = {
  deadline:   <Clock       size={15} className="text-amber-500" />,
  document:   <FileText    size={15} className="text-blue-500"  />,
  compliance: <ShieldCheck size={15} className="text-violet-500" />,
};

const typeIconBg: Record<string, string> = {
  deadline:   "bg-amber-500/10 border border-amber-500/20",
  document:   "bg-blue-500/10  border border-blue-500/20",
  compliance: "bg-violet-500/10 border border-violet-500/20",
};

const severityStyle: Record<string, string> = {
  critical: "border-rose-500/30   bg-rose-500/5",
  high:     "border-amber-500/25  bg-amber-500/4",
  medium:   "border-blue-500/20   bg-blue-500/3",
  info:     "border-[var(--border)] bg-transparent",
};

const dotStyle: Record<string, string> = {
  critical: "bg-rose-500 animate-pulse shadow-[0_0_6px_#fb7185]",
  high:     "bg-amber-500",
  medium:   "bg-blue-500",
  info:     "bg-[var(--fg-muted)] opacity-40",
};

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState(NOTIFICATIONS);
  const [filter, setFilter] = useState<"all"|"unread"|"deadline"|"compliance"|"document">("all");

  const filtered = notifs.filter((n) => {
    if (filter === "unread")  return !n.read;
    if (filter === "deadline" || filter === "compliance" || filter === "document") return n.type === filter;
    return true;
  });

  const unreadCount = notifs.filter((n) => !n.read).length;

  const markRead    = (id: string) => setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const markAllRead = ()           => setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  const deleteNotif = (id: string) => setNotifs((prev) => prev.filter((n) => n.id !== id));

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--fg)] flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-500 text-white text-xs font-black shadow-[0_0_8px_#e11d48]">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-[var(--fg-muted)] text-sm mt-0.5">{unreadCount} unread · {notifs.length} total</p>
        </div>
        <button type="button" onClick={markAllRead}
          className="flex items-center gap-1.5 text-[var(--fg-muted)] text-xs hover:text-[var(--fg)] transition-colors px-3 py-2 rounded-xl hover:bg-[var(--surface)]">
          <CheckCheck size={13} /> Mark all read
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {(["all","unread","deadline","compliance","document"] as const).map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs capitalize transition-all ${
              filter === f
                ? "bg-violet-500 text-white font-semibold shadow-lg shadow-violet-500/25"
                : "bg-[var(--surface)] border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-violet-500/30"
            }`}>
            {f}
          </button>
        ))}
      </div>

      {/* Notifications */}
      <div className="flex flex-col gap-2">
        {filtered.map((n) => (
          <div key={n.id}
            onClick={() => markRead(n.id)}
            className={`group relative flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
              severityStyle[n.severity]
            } ${!n.read ? "opacity-100" : "opacity-60 hover:opacity-80"}`}>

            {/* Unread dot */}
            {!n.read && (
              <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${dotStyle[n.severity]}`} />
            )}

            {/* Icon */}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${typeIconBg[n.type] || "bg-[var(--surface)] border border-[var(--border)]"}`}>
              {typeIcon[n.type] || <Bell size={15} className="text-[var(--fg-muted)]" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${!n.read ? "text-[var(--fg)]" : "text-[var(--fg-muted)]"}`}>
                {n.title}
              </p>
              <p className="text-[var(--fg-muted)] text-xs mt-0.5 leading-relaxed">{n.body}</p>
              <p className="text-[var(--fg-muted)] text-[10px] mt-1.5 opacity-50">
                {new Date(n.createdAt).toLocaleString()}
              </p>
            </div>

            {/* Delete button */}
            <button type="button"
              onClick={(e) => { e.stopPropagation(); deleteNotif(n.id); }}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-all flex-shrink-0 mt-0.5"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <Bell size={32} className="mx-auto text-[var(--fg-muted)] mb-3 opacity-30" />
            <p className="text-[var(--fg-muted)] text-sm">No notifications here</p>
          </div>
        )}
      </div>
    </div>
  );
}
