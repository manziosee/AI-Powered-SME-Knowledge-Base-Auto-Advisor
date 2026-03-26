"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, AlertTriangle, Clock, CheckCircle, ChevronRight, Globe, RefreshCw } from "lucide-react";
import { analytics } from "@/lib/api";

type ComplianceRule = {
  id: string; title: string; category: string; severity: string;
  deadline?: string; action_required?: string; description?: string;
  status: string; jurisdiction?: string;
};

const severityConfig: Record<string, { dot: string; badge: string; label: string }> = {
  critical: { dot: "bg-rose-400 animate-pulse shadow-[0_0_6px_#fb7185]", badge: "border-rose-500/40 bg-rose-500/10 text-rose-500",        label: "Critical"  },
  high:     { dot: "bg-amber-400",                                         badge: "border-amber-500/30 bg-amber-500/8 text-amber-500",      label: "High"      },
  medium:   { dot: "bg-blue-400",                                          badge: "border-blue-500/30 bg-blue-500/8 text-blue-500",         label: "Medium"    },
  low:      { dot: "bg-emerald-400",                                       badge: "border-emerald-500/25 bg-emerald-500/6 text-emerald-500", label: "Low"       },
};

const statusConfig: Record<string, { icon: React.ReactNode; text: string; color: string }> = {
  overdue:  { icon: <AlertTriangle size={13} />, text: "Overdue",  color: "text-rose-500"    },
  upcoming: { icon: <Clock size={13} />,         text: "Upcoming", color: "text-amber-500"   },
  on_track: { icon: <CheckCircle size={13} />,   text: "On Track", color: "text-emerald-500" },
};

function deriveStatus(deadline?: string): string {
  if (!deadline) return "on_track";
  const days = Math.floor((new Date(deadline).getTime() - Date.now()) / 86400000);
  if (days < 0) return "overdue";
  if (days <= 30) return "upcoming";
  return "on_track";
}

export default function CompliancePage() {
  const [activeCategory, setCategory] = useState("all");
  const [rules, setRules] = useState<ComplianceRule[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    analytics.complianceScore().then(({ data }) => {
      if (data) {
        setScore(data.compliance_score);
        const mapped: ComplianceRule[] = data.gap_rules.map((r) => ({
          id: r.id,
          title: r.title,
          category: r.category,
          severity: r.severity,
          deadline: r.deadline,
          action_required: r.action_required,
          description: r.description,
          status: deriveStatus(r.deadline),
          jurisdiction: "—",
        }));
        setRules(mapped);
      }
      setLoading(false);
    });
  }, []);

  const categories = ["all", ...Array.from(new Set(rules.map((r) => r.category)))];
  const filtered = activeCategory === "all" ? rules : rules.filter((r) => r.category === activeCategory);

  const overdueCount  = rules.filter((r) => r.status === "overdue").length;
  const upcomingCount = rules.filter((r) => r.status === "upcoming").length;
  const onTrackCount  = rules.filter((r) => r.status === "on_track").length;

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-[var(--fg)] tracking-tight">Compliance</h1>
          <p className="text-[var(--fg-muted)] text-sm mt-0.5">Track obligations, deadlines and gaps</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-300">
          <ShieldCheck size={16} className="text-emerald-500 animate-pulse" />
          <span className="text-emerald-500 font-black text-lg">{score !== null ? `${Math.round(score)}%` : "—"}</span>
          <span className="text-[var(--fg-muted)] text-sm">compliance score</span>
        </div>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Overdue",  count: overdueCount,  color: "border-rose-500/30 bg-rose-500/5",       dot: "bg-rose-400 animate-pulse shadow-[0_0_6px_#fb7185]" },
          { label: "Upcoming", count: upcomingCount, color: "border-amber-500/25 bg-amber-500/4",     dot: "bg-amber-400" },
          { label: "On Track", count: onTrackCount,  color: "border-emerald-500/20 bg-emerald-500/4", dot: "bg-emerald-400" },
        ].map((s) => (
          <div key={s.label} className={`flex items-center justify-between p-4 rounded-2xl border ${s.color} hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer`}>
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
              <span className="text-[var(--fg-soft)] text-sm font-medium">{s.label}</span>
            </div>
            <span className="text-[var(--fg)] font-black text-2xl">{s.count}</span>
          </div>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {categories.map((c) => (
          <button key={c} type="button" onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-full text-xs transition-all duration-300 hover:scale-105 ${
              activeCategory === c
                ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold shadow-lg shadow-violet-500/25"
                : "bg-[var(--surface)] border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-violet-500/30"
            }`}>
            {c === "all" ? "All rules" : c}
          </button>
        ))}
      </div>

      {/* Rules list */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-[var(--fg-muted)]">
          <RefreshCw size={16} className="animate-spin" />
          <span className="text-sm">Loading compliance data…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <ShieldCheck size={40} className="text-emerald-500 opacity-30 mx-auto mb-3" />
          <p className="text-[var(--fg-muted)] text-sm">No compliance gaps found.</p>
          <p className="text-[var(--fg-muted)] text-xs mt-1">Upload more documents to improve analysis coverage.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((rule) => {
            const sev = severityConfig[rule.severity] || severityConfig.low;
            const st  = statusConfig[rule.status]     || statusConfig.on_track;
            const daysUntil = rule.deadline
              ? Math.floor((new Date(rule.deadline).getTime() - Date.now()) / 86400000)
              : null;

            return (
              <div key={rule.id}
                className="p-5 rounded-2xl border border-[var(--border)] hover:border-violet-500/25 bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-all duration-300 group cursor-pointer hover:shadow-lg hover:scale-[1.02]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${sev.dot}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-[var(--fg-soft)] font-semibold text-sm">{rule.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sev.badge}`}>
                          {sev.label}
                        </span>
                      </div>
                      <p className="text-[var(--fg-muted)] text-xs leading-relaxed">
                        {rule.action_required || rule.description || "Action required"}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 text-[var(--fg-muted)] text-xs">
                          <Globe size={11} /> {rule.jurisdiction || "—"}
                        </div>
                        <div className="flex items-center gap-1 text-[var(--fg-muted)] text-xs">
                          <span className="w-1 h-1 rounded-full bg-[var(--fg-muted)] opacity-40" />
                          {rule.category}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className={`flex items-center gap-1.5 text-xs ${st.color}`}>
                      {st.icon} {st.text}
                    </div>
                    {rule.deadline && (
                      <div className="text-right">
                        <p className="text-[var(--fg-soft)] text-xs font-medium">{rule.deadline}</p>
                        {daysUntil !== null && (
                          <p className={`text-[10px] mt-0.5 ${
                            daysUntil < 0 ? "text-rose-500" : daysUntil < 14 ? "text-amber-500" : "text-emerald-500 opacity-70"
                          }`}>
                            {daysUntil < 0 ? `${Math.abs(daysUntil)}d overdue` : `in ${daysUntil}d`}
                          </p>
                        )}
                      </div>
                    )}
                    <ChevronRight size={14} className="text-[var(--fg-muted)] group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
