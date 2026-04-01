"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Clock, AlertTriangle, RefreshCw, FileText, Info } from "lucide-react";
import { insights } from "@/lib/api";

interface ExpiryDocument {
  id: string;
  filename: string;
  document_type: string;
  expiry_date: string;
  days_until: number;
  overdue: boolean;
  urgent: boolean;
  status: "overdue" | "urgent" | "warning" | "upcoming";
  uploaded_at?: string;
}

interface ExpiryData {
  documents: ExpiryDocument[];
  total: number;
  overdue: number;
  urgent: number;
  checked_at?: string;
}

const STATUS_CONFIG: Record<string, { label: string; badge: string; dot: string }> = {
  overdue:  { label: "Overdue",  badge: "bg-rose-500/10 border-rose-500/30 text-rose-500",          dot: "bg-rose-400 animate-pulse shadow-[0_0_6px_#fb7185]" },
  urgent:   { label: "Urgent",   badge: "bg-amber-500/10 border-amber-500/30 text-amber-500",        dot: "bg-amber-400" },
  warning:  { label: "Warning",  badge: "bg-blue-500/10 border-blue-500/30 text-blue-500",           dot: "bg-blue-400" },
  upcoming: { label: "Upcoming", badge: "bg-emerald-500/10 border-emerald-500/30 text-emerald-500",  dot: "bg-emerald-400" },
};

const DAYS_OPTIONS = [30, 60, 90, 180];

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] animate-pulse">
      <div className="w-2.5 h-2.5 rounded-full bg-[var(--border)] flex-shrink-0" />
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="h-3 bg-[var(--border)] rounded w-2/5" />
        <div className="h-2.5 bg-[var(--border)] rounded w-1/5" />
      </div>
      <div className="h-3 bg-[var(--border)] rounded w-20" />
      <div className="h-3 bg-[var(--border)] rounded w-16" />
      <div className="h-5 bg-[var(--border)] rounded-full w-16" />
    </div>
  );
}

export default function ExpiryPage() {
  const [data,       setData]       = useState<ExpiryData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [daysAhead,  setDaysAhead]  = useState(90);

  const fetchExpiry = useCallback(async (days: number) => {
    setLoading(true);
    const { data: res } = await insights.expiry(days);
    if (res) setData(res as ExpiryData);
    setLoading(false);
  }, []);

  useEffect(() => { fetchExpiry(daysAhead); }, [daysAhead, fetchExpiry]);

  const docs = data?.documents ?? [];
  const overdueCount  = data?.overdue ?? 0;
  const urgentCount   = data?.urgent  ?? 0;
  const upcomingCount = docs.filter((d) => d.status === "upcoming").length;

  return (
    <div className="p-6 max-w-[1200px] mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center">
            <Clock size={18} className="text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[var(--fg)] tracking-tight">Expiring Documents</h1>
            <p className="text-[var(--fg-muted)] text-sm mt-0.5">Track documents approaching their expiry dates</p>
          </div>
        </div>

        {/* Days ahead selector */}
        <div className="flex items-center gap-2">
          <span className="text-[var(--fg-muted)] text-xs">Show next</span>
          <div className="flex items-center gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1">
            {DAYS_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDaysAhead(d)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                  daysAhead === d
                    ? "bg-amber-500 text-white font-semibold shadow-lg shadow-amber-500/25"
                    : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
          <button
            type="button"
            title="Refresh"
            onClick={() => fetchExpiry(daysAhead)}
            className="p-2 rounded-xl border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] transition-all"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          {
            label: "Overdue",
            count: overdueCount,
            desc: "Past expiry date",
            icon: AlertTriangle,
            iconCls: "text-rose-500",
            bgCls: "bg-rose-500/5 border-rose-500/20",
            valueCls: "text-rose-500",
          },
          {
            label: "Urgent",
            count: urgentCount,
            desc: "Expiring within 14 days",
            icon: Clock,
            iconCls: "text-amber-500",
            bgCls: "bg-amber-500/5 border-amber-500/20",
            valueCls: "text-amber-500",
          },
          {
            label: "Upcoming",
            count: upcomingCount,
            desc: "Expiring in 15–90 days",
            icon: FileText,
            iconCls: "text-emerald-500",
            bgCls: "bg-emerald-500/5 border-emerald-500/20",
            valueCls: "text-emerald-500",
          },
        ].map(({ label, count, desc, icon: Icon, iconCls, bgCls, valueCls }) => (
          <div key={label} className={`p-5 rounded-2xl border ${bgCls} flex items-center gap-4`}>
            <div className={`w-10 h-10 rounded-xl ${bgCls} border flex items-center justify-center flex-shrink-0`}>
              <Icon size={18} className={iconCls} />
            </div>
            <div>
              <p className={`text-3xl font-black ${valueCls}`}>{count}</p>
              <p className="text-[var(--fg-soft)] text-sm font-medium">{label}</p>
              <p className="text-[var(--fg-muted)] text-xs">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-soft)] border border-[var(--border)] rounded-2xl overflow-hidden">

        {/* Table header */}
        <div className="grid grid-cols-[1fr_120px_130px_100px_110px] gap-4 px-5 py-3 border-b border-[var(--border)] bg-[var(--bg-muted)]">
          {["Document Name", "Type", "Expiry Date", "Days Until", "Status"].map((h) => (
            <p key={h} className="text-[var(--fg-muted)] text-[10px] uppercase tracking-widest font-semibold">{h}</p>
          ))}
        </div>

        {/* Rows */}
        <div className="flex flex-col divide-y divide-[var(--border)]">
          {loading ? (
            <div className="flex flex-col gap-3 p-4">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center">
                <Clock size={24} className="text-[var(--fg-muted)]" />
              </div>
              <p className="text-[var(--fg-muted)] text-sm">No expiring documents in the next {daysAhead} days</p>
              <p className="text-[var(--fg-muted)] text-xs">Try increasing the time range above</p>
            </div>
          ) : (
            docs.map((doc) => {
              const cfg = STATUS_CONFIG[doc.status] ?? STATUS_CONFIG.upcoming;
              return (
                <div
                  key={doc.id}
                  className="grid grid-cols-[1fr_120px_130px_100px_110px] gap-4 px-5 py-4 hover:bg-[var(--surface-hover)] transition-colors items-center"
                >
                  {/* Name */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                    <p className="text-[var(--fg-soft)] text-sm font-medium truncate">{doc.filename}</p>
                  </div>

                  {/* Type */}
                  <p className="text-[var(--fg-muted)] text-xs capitalize truncate">
                    {doc.document_type.replace(/_/g, " ")}
                  </p>

                  {/* Expiry date */}
                  <p className="text-[var(--fg-soft)] text-xs font-mono">{doc.expiry_date}</p>

                  {/* Days until */}
                  <p className={`text-xs font-bold ${
                    doc.overdue ? "text-rose-500" : doc.status === "urgent" ? "text-amber-500" : "text-[var(--fg-muted)]"
                  }`}>
                    {doc.overdue
                      ? `${Math.abs(doc.days_until)}d ago`
                      : `in ${doc.days_until}d`}
                  </p>

                  {/* Status badge */}
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold border ${cfg.badge}`}>
                    {cfg.label}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Renewal reminder tip */}
      {overdueCount > 0 && (
        <div className="mt-5 flex items-start gap-3 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20">
          <Info size={16} className="text-rose-500 flex-shrink-0 mt-0.5" />
          <p className="text-[var(--fg-soft)] text-sm">
            <span className="font-semibold text-rose-500">Renewal reminder:</span>{" "}
            Contact your document owner to renew documents marked as overdue. Delays may result in compliance penalties.
          </p>
        </div>
      )}
    </div>
  );
}
