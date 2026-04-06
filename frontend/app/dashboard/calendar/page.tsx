"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar, ChevronLeft, ChevronRight, AlertTriangle,
  CheckCircle, Clock, Filter, RefreshCw, ExternalLink, Plus, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { insights } from "@/lib/api";

// ── Types ────────────────────────────────────────────────────────
interface CalendarEvent {
  id: string;
  title: string;
  category: string;
  color: string;
  priority: "critical" | "high" | "medium" | "low";
  description: string;
  due_date: string;
  due_month: string;
  days_until: number;
  overdue: boolean;
  urgent: boolean;
  custom?: boolean;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const CATEGORY_LABELS: Record<string, string> = {
  tax: "Tax", payroll: "Payroll", compliance: "Compliance",
  finance: "Finance", hr: "HR", custom: "Custom",
};

const CATEGORY_COLORS: Record<string, string> = {
  tax: "#f59e0b", payroll: "#3b82f6", compliance: "#10b981",
  finance: "#8b5cf6", hr: "#ec4899", custom: "#6366f1",
};

const PRIORITY_CONFIG = {
  critical: { label: "Critical", bg: "bg-rose-500/15 border-rose-500/30",   text: "text-rose-500"   },
  high:     { label: "High",     bg: "bg-amber-500/15 border-amber-500/30", text: "text-amber-500"  },
  medium:   { label: "Medium",   bg: "bg-blue-500/15  border-blue-500/30",  text: "text-blue-500"   },
  low:      { label: "Low",      bg: "bg-green-500/15 border-green-500/30", text: "text-green-500"  },
};

const STORAGE_KEY = "advisorai_custom_events";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function computeDaysUntil(dateStr: string) {
  return Math.floor((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

// ── Add Event Modal ───────────────────────────────────────────────
function AddEventModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (ev: CalendarEvent) => void;
}) {
  const [title,    setTitle]    = useState("");
  const [date,     setDate]     = useState(() => new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState("custom");
  const [priority, setPriority] = useState<CalendarEvent["priority"]>("medium");
  const [desc,     setDesc]     = useState("");

  const handleSave = () => {
    if (!title.trim() || !date) return;
    const daysUntil = computeDaysUntil(date);
    const ev: CalendarEvent = {
      id: `custom-${Date.now()}`,
      title: title.trim(),
      category,
      color: CATEGORY_COLORS[category] ?? CATEGORY_COLORS.custom,
      priority,
      description: desc.trim() || title.trim(),
      due_date: date,
      due_month: `${MONTHS[new Date(date).getMonth()]} ${new Date(date).getFullYear()}`,
      days_until: daysUntil,
      overdue: daysUntil < 0,
      urgent: daysUntil >= 0 && daysUntil <= 7,
      custom: true,
    };
    onSave(ev);
    onClose();
  };

  const INPUT = "w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--fg)] text-sm focus:outline-none focus:border-violet-500/50 transition-all";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[var(--bg-soft)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[var(--fg)] font-bold text-base">Add Event</h3>
          <button type="button" onClick={onClose} className="text-[var(--fg-muted)] hover:text-[var(--fg)] p-1 rounded-lg hover:bg-[var(--surface-hover)] transition-all" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[var(--fg-muted)] text-xs uppercase tracking-wide mb-1.5">Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title…" className={INPUT} />
          </div>
          <div>
            <label className="block text-[var(--fg-muted)] text-xs uppercase tracking-wide mb-1.5">Due Date *</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Due date" title="Due date" className={INPUT} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[var(--fg-muted)] text-xs uppercase tracking-wide mb-1.5">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category" className={INPUT}>
                {Object.keys(CATEGORY_LABELS).map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[var(--fg-muted)] text-xs uppercase tracking-wide mb-1.5">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as CalendarEvent["priority"])} aria-label="Priority" className={INPUT}>
                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[var(--fg-muted)] text-xs uppercase tracking-wide mb-1.5">Description</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Optional details…" rows={3} className={INPUT + " resize-none"} />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button type="button" onClick={handleSave} disabled={!title.trim() || !date}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-sm font-bold transition-all disabled:opacity-40 active:scale-95">
            Save Event
          </button>
          <button type="button" onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] text-sm transition-all">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────
export default function ComplianceCalendarPage() {
  const today = new Date();
  const [viewYear,   setViewYear]   = useState(today.getFullYear());
  const [viewMonth,  setViewMonth]  = useState(today.getMonth());
  const [apiEvents,  setApiEvents]  = useState<CalendarEvent[]>([]);
  const [customEvs,  setCustomEvs]  = useState<CalendarEvent[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState<string>("all");
  const [selected,   setSelected]   = useState<CalendarEvent | null>(null);
  const [showAdd,    setShowAdd]    = useState(false);
  const [completed,  setCompleted]  = useState<Set<string>>(new Set());

  // Load custom events from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: CalendarEvent[] = JSON.parse(stored);
        // Recompute days_until / overdue / urgent on load
        setCustomEvs(parsed.map((ev) => ({
          ...ev,
          days_until: computeDaysUntil(ev.due_date),
          overdue: computeDaysUntil(ev.due_date) < 0,
          urgent: computeDaysUntil(ev.due_date) >= 0 && computeDaysUntil(ev.due_date) <= 7,
        })));
      }
    } catch { /* ignore */ }
  }, []);

  // Persist custom events
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(customEvs)); } catch { /* ignore */ }
  }, [customEvs]);

  useEffect(() => {
    setLoading(true);
    insights.calendar(6).then(({ data }) => {
      if (data?.events) setApiEvents(data.events);
    }).finally(() => setLoading(false));
  }, []);

  const events = [...apiEvents, ...customEvs];

  const monthEvents = events.filter((e) => {
    const d = new Date(e.due_date);
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
  });

  const filteredEvents = filter === "all" ? events : events.filter((e) => e.category === filter);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay    = getFirstDayOfMonth(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function getEventsForDay(day: number) {
    return monthEvents.filter((e) => new Date(e.due_date).getDate() === day);
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  const urgentCount   = events.filter((e) => e.urgent && !e.overdue).length;
  const overdueCount  = events.filter((e) => e.overdue).length;
  const upcomingCount = events.filter((e) => !e.overdue && !e.urgent && e.days_until <= 30).length;

  const categories = Array.from(new Set(events.map((e) => e.category)));

  const handleSaveEvent = (ev: CalendarEvent) => {
    setCustomEvs((prev) => [...prev, ev]);
  };

  const handleMarkComplete = (ev: CalendarEvent) => {
    setCompleted((prev) => new Set([...prev, ev.id]));
    if (ev.custom) {
      setCustomEvs((prev) => prev.filter((e) => e.id !== ev.id));
    }
    setSelected(null);
  };

  return (
    <div className="p-5 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-[0_0_16px_rgba(59,130,246,0.4)] flex-shrink-0">
            <Calendar size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-[var(--fg)] tracking-tight">Compliance Calendar</h1>
            <p className="text-[var(--fg-muted)] text-xs mt-0.5">Track upcoming deadlines and regulatory filings</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-xs font-bold transition-all shadow-[0_4px_12px_rgba(124,58,237,0.3)] active:scale-95"
          >
            <Plus size={12} /> Add Event
          </button>
          <button
            type="button"
            onClick={() => { setLoading(true); insights.calendar(6).then(({ data }) => { if (data?.events) setApiEvents(data.events); }).finally(() => setLoading(false)); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] text-xs transition-all"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Overdue",    count: overdueCount,  color: "#fb7185", icon: AlertTriangle, bg: "border-rose-500/20 bg-rose-500/5"   },
          { label: "Urgent",     count: urgentCount,   color: "#fbbf24", icon: Clock,         bg: "border-amber-500/20 bg-amber-500/5" },
          { label: "This Month", count: upcomingCount, color: "#60a5fa", icon: Calendar,      bg: "border-blue-500/20 bg-blue-500/5"   },
        ].map(({ label, count, color, icon: Icon, bg }) => (
          <div key={label} className={cn("p-4 rounded-2xl border", bg)}>
            <div className="flex items-center gap-2 mb-1">
              <Icon size={14} style={{ color }} />
              <span className="text-[var(--fg-muted)] text-xs font-medium">{label}</span>
            </div>
            <p className="text-2xl font-black text-[var(--fg)]">{count}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Calendar grid */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border)]">
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={prevMonth} title="Previous month" aria-label="Previous month"
              className="p-1.5 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] transition-all">
              <ChevronLeft size={16} />
            </button>
            <h2 className="text-[var(--fg)] font-semibold text-sm">
              {MONTHS[viewMonth]} {viewYear}
            </h2>
            <button type="button" onClick={nextMonth} title="Next month" aria-label="Next month"
              className="p-1.5 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] transition-all">
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold text-[var(--fg-muted)] uppercase tracking-wide py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} />;
              const dayEvents = getEventsForDay(day);
              const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
              return (
                <div
                  key={day}
                  className={cn(
                    "min-h-[56px] p-1.5 rounded-xl border text-xs transition-all cursor-default",
                    isToday
                      ? "border-violet-500/40 bg-violet-500/10"
                      : dayEvents.length
                        ? "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]"
                        : "border-transparent hover:bg-[var(--surface-hover)]"
                  )}
                >
                  <span className={cn("text-[10px] font-medium", isToday ? "text-violet-400" : "text-[var(--fg-muted)]")}>{day}</span>
                  {dayEvents.slice(0, 2).map((ev) => (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => setSelected(ev)}
                      className={cn(
                        "w-full mt-0.5 px-1 py-0.5 rounded text-[9px] font-medium truncate text-left transition-opacity hover:opacity-80",
                        completed.has(ev.id) && "line-through opacity-50"
                      )}
                      style={{ background: `${ev.color}25`, color: ev.color }}
                    >
                      {ev.title.split(" — ")[0]}
                    </button>
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="text-[9px] text-[var(--fg-muted)] mt-0.5 block">
                      +{dayEvents.length - 2} more
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-3">

          {/* Filter */}
          <div className="p-4 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border)]">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={13} className="text-[var(--fg-muted)]" />
              <span className="text-[var(--fg)] text-xs font-semibold">Filter</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["all", ...categories].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilter(cat)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all",
                    filter === cat
                      ? "bg-violet-500 text-white"
                      : "bg-[var(--surface)] text-[var(--fg-muted)] hover:text-[var(--fg)] border border-[var(--border)]"
                  )}
                >
                  {cat === "all" ? "All" : CATEGORY_LABELS[cat] ?? cat}
                </button>
              ))}
            </div>
          </div>

          {/* Upcoming deadlines */}
          <div className="flex-1 p-4 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border)] overflow-y-auto max-h-[460px]">
            <h3 className="text-[var(--fg)] text-xs font-semibold mb-3">Upcoming Deadlines</h3>
            <div className="flex flex-col gap-2">
              {filteredEvents.slice(0, 12).map((ev) => {
                const pConfig = PRIORITY_CONFIG[ev.priority] ?? PRIORITY_CONFIG.medium;
                const done = completed.has(ev.id);
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => !done && setSelected(ev)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl border transition-all",
                      done
                        ? "opacity-50 cursor-default border-[var(--border)] bg-[var(--surface)]"
                        : selected?.id === ev.id
                          ? "border-violet-500/40 bg-violet-500/8 hover:scale-[1.02] hover:shadow-md"
                          : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] hover:scale-[1.02] hover:shadow-md"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-[var(--fg-soft)] text-xs font-semibold truncate", done && "line-through")}>{ev.title}</p>
                        <p className="text-[var(--fg-muted)] text-[10px] mt-0.5">{ev.due_date}{ev.custom ? " · Custom" : ""}</p>
                      </div>
                      <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0", pConfig.bg, pConfig.text)}>
                        {done ? "Done" : pConfig.label}
                      </span>
                    </div>
                    {!done && (
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px]" style={{ color: ev.color }}>
                          {CATEGORY_LABELS[ev.category] ?? ev.category}
                        </span>
                        <span className={cn("text-[10px] font-semibold",
                          ev.overdue ? "text-rose-500" : ev.urgent ? "text-amber-500" : "text-[var(--fg-muted)]"
                        )}>
                          {ev.overdue ? `${Math.abs(ev.days_until)}d overdue` : `${ev.days_until}d left`}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Event detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-[var(--bg-soft)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: selected.color }}>
                  {CATEGORY_LABELS[selected.category] ?? selected.category}{selected.custom ? " · Custom event" : ""}
                </span>
                <h3 className="text-[var(--fg)] font-bold text-base mt-1">{selected.title}</h3>
              </div>
              <button type="button" onClick={() => setSelected(null)}
                className="text-[var(--fg-muted)] hover:text-[var(--fg)] p-1 rounded-lg hover:bg-[var(--surface-hover)] transition-all" title="Close" aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <p className="text-[var(--fg-soft)] text-sm mb-4">{selected.description}</p>

            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: "Due Date",  value: selected.due_date },
                { label: "Days Left", value: selected.overdue ? `${Math.abs(selected.days_until)}d overdue` : `${selected.days_until} days` },
                { label: "Priority",  value: PRIORITY_CONFIG[selected.priority]?.label ?? selected.priority },
                { label: "Status",    value: selected.overdue ? "Overdue" : selected.urgent ? "Urgent" : "Scheduled" },
              ].map(({ label, value }) => (
                <div key={label} className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                  <p className="text-[var(--fg-muted)] text-[10px] uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-[var(--fg)] text-sm font-semibold">{value}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button type="button"
                onClick={() => handleMarkComplete(selected)}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs font-bold transition-all hover:from-violet-500 hover:to-purple-500">
                <CheckCircle size={13} /> Mark Complete
              </button>
              {selected.custom && (
                <button type="button"
                  onClick={() => { setCustomEvs((p) => p.filter((e) => e.id !== selected.id)); setSelected(null); }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs transition-all">
                  <X size={11} /> Delete
                </button>
              )}
              {!selected.custom && (
                <button type="button"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] text-xs transition-all">
                  <ExternalLink size={11} /> Details
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Event modal */}
      {showAdd && <AddEventModal onClose={() => setShowAdd(false)} onSave={handleSaveEvent} />}
    </div>
  );
}
