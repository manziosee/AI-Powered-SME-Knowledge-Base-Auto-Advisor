"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ShieldCheck, AlertTriangle, Clock, CheckCircle, ChevronRight, Globe, RefreshCw, ChevronLeft, CheckSquare, X } from "lucide-react";
import { analytics } from "@/lib/api";

const RESOLVED_KEY = "advisorai_resolved_rules";
const PAGE_SIZE = 10;

type ResolvedMap = Record<string, { note: string; resolvedAt: string }>;

function loadResolved(): ResolvedMap {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(RESOLVED_KEY) : null;
    return raw ? (JSON.parse(raw) as ResolvedMap) : {};
  } catch { return {}; }
}

function saveResolved(map: ResolvedMap) {
  try { localStorage.setItem(RESOLVED_KEY, JSON.stringify(map)); } catch { /* ignore */ }
}

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
  const [country, setCountry] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [resolved, setResolved] = useState<ResolvedMap>(loadResolved);
  const [resolveOpen, setResolveOpen] = useState<string | null>(null);
  const [resolveNote, setResolveNote] = useState("");

  const handleResolve = useCallback((ruleId: string) => {
    if (!resolveNote.trim()) return;
    const updated: ResolvedMap = {
      ...resolved,
      [ruleId]: { note: resolveNote.trim(), resolvedAt: new Date().toISOString() },
    };
    setResolved(updated);
    saveResolved(updated);
    setResolveOpen(null);
    setResolveNote("");
  }, [resolved, resolveNote]);

  const handleUnresolve = useCallback((ruleId: string) => {
    const updated = { ...resolved };
    delete updated[ruleId];
    setResolved(updated);
    saveResolved(updated);
  }, [resolved]);

  useEffect(() => {
    setLoading(true);
    analytics.complianceScore().then(({ data }) => {
      if (data) {
        setScore(data.compliance_score);
        setCountry(data.country ?? null);
        const seen = new Set<string>();
        const mapped: ComplianceRule[] = data.gap_rules
          .filter((r) => {
            if (seen.has(r.id)) return false;
            seen.add(r.id);
            return true;
          })
          .map((r) => ({
            id: r.id,
            title: r.title,
            category: r.category,
            severity: r.severity,
            deadline: r.deadline,
            action_required: r.action_required,
            description: r.description,
            status: deriveStatus(r.deadline),
            jurisdiction: data.country ?? null,
          }));
        setRules(mapped);
      }
      setLoading(false);
    });
  }, []);

  const categories = ["all", ...Array.from(new Set(rules.map((r) => r.category)))];
  const filtered = activeCategory === "all" ? rules : rules.filter((r) => r.category === activeCategory);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
          <span className="text-[var(--fg-muted)] text-sm">compliance score{country ? ` · ${country}` : ""}</span>
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
          <button key={c} type="button" onClick={() => { setCategory(c); setPage(1); }}
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
        <>
          <div className="flex flex-col gap-3">
            {paginated.map((rule, ruleIdx) => {
              const sev = severityConfig[rule.severity] || severityConfig.low;
              const st  = statusConfig[rule.status]     || statusConfig.on_track;
              const daysUntil = rule.deadline
                ? Math.floor((new Date(rule.deadline).getTime() - Date.now()) / 86400000)
                : null;
              const isResolved = !!resolved[rule.id];
              const isResolving = resolveOpen === rule.id;

              return (
                <div key={rule.id ?? ruleIdx}
                  className={`rounded-2xl border bg-[var(--surface)] transition-all duration-300 group hover:shadow-lg ${
                    isResolved
                      ? "border-emerald-500/20 opacity-60"
                      : "border-[var(--border)] hover:border-violet-500/25 hover:bg-[var(--surface-hover)] hover:scale-[1.02] cursor-pointer"
                  }`}>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 min-w-0">
                        <div className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${sev.dot}`} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="text-[var(--fg-soft)] font-semibold text-sm">{rule.title}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sev.badge}`}>
                              {sev.label}
                            </span>
                            {isResolved && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
                                <CheckSquare size={9} /> Resolved
                              </span>
                            )}
                          </div>
                          <p className="text-[var(--fg-muted)] text-xs leading-relaxed">
                            {rule.action_required || rule.description || "Action required"}
                          </p>
                          {isResolved && resolved[rule.id]?.note && (
                            <p className="text-emerald-600 dark:text-emerald-400 text-xs mt-1 italic">
                              Note: {resolved[rule.id].note}
                            </p>
                          )}
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
                        {/* Resolve / unresolve button */}
                        {isResolved ? (
                          <button
                            type="button"
                            onClick={() => handleUnresolve(rule.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium border border-[var(--border)] text-[var(--fg-muted)] hover:text-rose-500 hover:border-rose-500/30 transition-all"
                          >
                            <X size={10} /> Unresolve
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => { setResolveOpen(isResolving ? null : rule.id); setResolveNote(""); }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/8 transition-all"
                          >
                            <CheckSquare size={10} /> Resolve
                          </button>
                        )}
                        <ChevronRight size={14} className="text-[var(--fg-muted)] group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                    </div>
                  </div>

                  {/* Inline resolve form */}
                  {isResolving && (
                    <div className="px-5 pb-5 border-t border-[var(--border)] pt-4 flex flex-col gap-2">
                      <label className="text-[var(--fg-muted)] text-xs uppercase tracking-wide font-semibold">
                        Resolution note
                      </label>
                      <textarea
                        value={resolveNote}
                        onChange={(e) => setResolveNote(e.target.value)}
                        placeholder="Describe how this was resolved…"
                        rows={2}
                        className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--fg)] text-xs focus:outline-none focus:border-emerald-500/50 resize-none placeholder-[var(--fg-muted)]"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleResolve(rule.id)}
                          disabled={!resolveNote.trim()}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all disabled:opacity-40"
                        >
                          <CheckSquare size={11} /> Mark Resolved
                        </button>
                        <button
                          type="button"
                          onClick={() => { setResolveOpen(null); setResolveNote(""); }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--fg-muted)] text-xs transition-all hover:text-[var(--fg)]"
                        >
                          <X size={11} /> Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-[var(--border)]">
              <p className="text-[var(--fg-muted)] text-xs">
                Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} rules
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-violet-500/30 text-xs transition-all disabled:opacity-30"
                >
                  <ChevronLeft size={13} /> Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
                        p === page
                          ? "bg-violet-500 text-white shadow-lg shadow-violet-500/25"
                          : "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)]"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-violet-500/30 text-xs transition-all disabled:opacity-30"
                >
                  Next <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
