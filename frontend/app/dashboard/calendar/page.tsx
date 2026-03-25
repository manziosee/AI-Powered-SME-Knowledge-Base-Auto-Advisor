"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar, ChevronLeft, ChevronRight, AlertTriangle,
  CheckCircle, Clock, Filter, RefreshCw, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
}

// ── Demo data (used when backend is unreachable) ─────────────────
const DEMO_EVENTS: CalendarEvent[] = [
  { id: "vat-q1", title: "VAT Return — Q1", category: "tax", color: "#fb7185", priority: "high",
    description: "Quarterly VAT filing deadline", due_date: "2026-04-15", due_month: "April 2026",
    days_until: 21, overdue: false, urgent: false },
  { id: "payroll-mar", title: "Payroll Tax Filing", category: "payroll", color: "#fbbf24", priority: "high",
    description: "Monthly PAYE / social security filing", due_date: "2026-03-28", due_month: "March 2026",
    days_until: 3, overdue: false, urgent: true },
  { id: "corp-tax", title: "Corporate Tax Return", category: "tax", color: "#fb7185", priority: "critical",
    description: "Annual corporate income tax filing", due_date: "2026-03-31", due_month: "March 2026",
    days_until: 6, overdue: false, urgent: true },
  { id: "gdpr-rev", title: "GDPR Policy Review", category: "compliance", color: "#a78bfa", priority: "medium",
    description: "Annual review of data protection policies", due_date: "2026-05-25", due_month: "May 2026",
    days_until: 61, overdue: false, urgent: false },
  { id: "audit-prep", title: "Annual Audit Preparation", category: "finance", color: "#60a5fa", priority: "high",
    description: "Prepare financial statements for external audit", due_date: "2026-06-01", due_month: "June 2026",
    days_until: 68, overdue: false, urgent: false },
  { id: "payroll-apr", title: "Payroll Tax Filing", category: "payroll", color: "#fbbf24", priority: "high",
    description: "Monthly PAYE / social security filing", due_date: "2026-04-28", due_month: "April 2026",
    days_until: 34, overdue: false, urgent: false },
  { id: "vat-q2", title: "VAT Return — Q2", category: "tax", color: "#fb7185", priority: "high",
    description: "Quarterly VAT filing deadline", due_date: "2026-07-15", due_month: "July 2026",
    days_until: 112, overdue: false, urgent: false },
  { id: "insurance", title: "Business Insurance Renewal", category: "finance", color: "#60a5fa", priority: "high",
    description: "Review and renew business insurance policies", due_date: "2026-06-01", due_month: "June 2026",
    days_until: 68, overdue: false, urgent: false },
  { id: "hr-review", title: "HR Policy Review", category: "hr", color: "#34d399", priority: "medium",
    description: "Annual review of employment contracts", due_date: "2026-06-15", due_month: "June 2026",
    days_until: 82, overdue: false, urgent: false },
  { id: "payroll-may", title: "Payroll Tax Filing", category: "payroll", color: "#fbbf24", priority: "high",
    description: "Monthly PAYE / social security filing", due_date: "2026-05-28", due_month: "May 2026",
    days_until: 64, overdue: false, urgent: false },
];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const CATEGORY_LABELS: Record<string, string> = {
  tax: "Tax", payroll: "Payroll", compliance: "Compliance",
  finance: "Finance", hr: "HR",
};

const PRIORITY_CONFIG = {
  critical: { label: "Critical", bg: "bg-rose-500/15 border-rose-500/30",   text: "text-rose-500"   },
  high:     { label: "High",     bg: "bg-amber-500/15 border-amber-500/30", text: "text-amber-500"  },
  medium:   { label: "Medium",   bg: "bg-blue-500/15  border-blue-500/30",  text: "text-blue-500"   },
  low:      { label: "Low",      bg: "bg-green-500/15 border-green-500/30", text: "text-green-500"  },
};

// ── Calendar grid helpers ────────────────────────────────────────
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function ComplianceCalendarPage() {
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [events,    setEvents]    = useState<CalendarEvent[]>(DEMO_EVENTS);
  const [loading,   setLoading]   = useState(false);
  const [filter,    setFilter]    = useState<string>("all");
  const [selected,  setSelected]  = useState<CalendarEvent | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/v1/insights/calendar?months_ahead=6", {
      headers: { Authorization: `Bearer ${localStorage.getItem("access_token") ?? ""}` },
    })
      .then((r) => r.json())
      .then((data) => { if (data.events?.length) setEvents(data.events); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Events for current month view
  const monthEvents = events.filter((e) => {
    const d = new Date(e.due_date);
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
  });

  const filteredEvents = filter === "all" ? events : events.filter((e) => e.category === filter);

  // Build calendar grid
  const daysInMonth  = getDaysInMonth(viewYear, viewMonth);
  const firstDay     = getFirstDayOfMonth(viewYear, viewMonth);
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

  return (
    <div className="p-5 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--fg)] tracking-tight">Compliance Calendar</h1>
          <p className="text-[var(--fg-muted)] text-xs mt-0.5">Track upcoming deadlines and regulatory filings</p>
        </div>
        <button
          type="button"
          onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 800); }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] text-xs transition-all"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Overdue",   count: overdueCount,  color: "#fb7185", icon: AlertTriangle, bg: "border-rose-500/20 bg-rose-500/5"   },
          { label: "Urgent",    count: urgentCount,   color: "#fbbf24", icon: Clock,         bg: "border-amber-500/20 bg-amber-500/5" },
          { label: "This Month",count: upcomingCount, color: "#60a5fa", icon: Calendar,      bg: "border-blue-500/20 bg-blue-500/5"   },
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
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={prevMonth}
              className="p-1.5 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] transition-all">
              <ChevronLeft size={16} />
            </button>
            <h2 className="text-[var(--fg)] font-semibold text-sm">
              {MONTHS[viewMonth]} {viewYear}
            </h2>
            <button type="button" onClick={nextMonth}
              className="p-1.5 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] transition-all">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold text-[var(--fg-muted)] uppercase tracking-wide py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} />;
              const dayEvents = getEventsForDay(day);
              const isToday   = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
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
                  <span className={cn(
                    "text-[10px] font-medium",
                    isToday ? "text-violet-400" : "text-[var(--fg-muted)]"
                  )}>{day}</span>

                  {dayEvents.slice(0, 2).map((ev) => (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => setSelected(ev)}
                      className="w-full mt-0.5 px-1 py-0.5 rounded text-[9px] font-medium truncate text-left transition-opacity hover:opacity-80"
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

        {/* Sidebar: upcoming list */}
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
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => setSelected(ev)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl border transition-all hover:scale-[1.02] hover:shadow-md",
                      selected?.id === ev.id ? "border-violet-500/40 bg-violet-500/8" : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[var(--fg-soft)] text-xs font-semibold truncate">{ev.title}</p>
                        <p className="text-[var(--fg-muted)] text-[10px] mt-0.5">{ev.due_date}</p>
                      </div>
                      <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0", pConfig.bg, pConfig.text)}>
                        {pConfig.label}
                      </span>
                    </div>
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
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Event detail modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-[var(--bg-soft)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: selected.color }}>
                  {CATEGORY_LABELS[selected.category] ?? selected.category}
                </span>
                <h3 className="text-[var(--fg)] font-bold text-base mt-1">{selected.title}</h3>
              </div>
              <button type="button" onClick={() => setSelected(null)}
                className="text-[var(--fg-muted)] hover:text-[var(--fg)] p-1 rounded-lg hover:bg-[var(--surface-hover)] transition-all"
                title="Close" aria-label="Close">
                ✕
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
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs font-bold transition-all hover:from-violet-500 hover:to-purple-500">
                Mark Complete
              </button>
              <button type="button"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] text-xs transition-all">
                <ExternalLink size={11} /> Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
