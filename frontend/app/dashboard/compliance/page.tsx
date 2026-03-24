"use client";

import React, { useState } from "react";
import { ShieldCheck, AlertTriangle, Clock, CheckCircle, ChevronRight, Globe } from "lucide-react";
import { COMPLIANCE_RULES } from "@/lib/mock-data";

const severityConfig: Record<string, { dot: string; badge: string; label: string }> = {
  critical: { dot: "bg-rose-400 animate-pulse shadow-[0_0_6px_#fb7185]", badge: "border-rose-500/40 bg-rose-500/10 text-rose-300",       label: "Critical"  },
  high:     { dot: "bg-amber-400",                                         badge: "border-amber-500/30 bg-amber-500/8 text-amber-300",      label: "High"      },
  medium:   { dot: "bg-blue-400",                                          badge: "border-blue-500/30 bg-blue-500/8 text-blue-300",         label: "Medium"    },
  low:      { dot: "bg-emerald-400",                                       badge: "border-emerald-500/25 bg-emerald-500/6 text-emerald-400", label: "Low"       },
};

const statusConfig: Record<string, { icon: React.ReactNode; text: string; color: string }> = {
  overdue:    { icon: <AlertTriangle size={13} />, text: "Overdue",   color: "text-rose-400"    },
  upcoming:   { icon: <Clock size={13} />,         text: "Upcoming",  color: "text-amber-400"   },
  on_track:   { icon: <CheckCircle size={13} />,   text: "On Track",  color: "text-emerald-400" },
};

export default function CompliancePage() {
  const [activeCategory, setCategory] = useState("all");
  const categories = ["all", ...Array.from(new Set(COMPLIANCE_RULES.map((r) => r.category)))];

  const filtered = activeCategory === "all"
    ? COMPLIANCE_RULES
    : COMPLIANCE_RULES.filter((r) => r.category === activeCategory);

  const overdueCount  = COMPLIANCE_RULES.filter((r) => r.status === "overdue").length;
  const upcomingCount = COMPLIANCE_RULES.filter((r) => r.status === "upcoming").length;
  const onTrackCount  = COMPLIANCE_RULES.filter((r) => r.status === "on_track").length;

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Compliance</h1>
          <p className="text-white/40 text-sm mt-0.5">Track obligations, deadlines and gaps</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
          <ShieldCheck size={16} className="text-emerald-400" />
          <span className="text-emerald-300 font-bold text-lg">94%</span>
          <span className="text-white/40 text-sm">compliance score</span>
        </div>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Overdue",   count: overdueCount,  color: "border-rose-500/30 bg-rose-500/6",      dot: "bg-rose-400 animate-pulse shadow-[0_0_6px_#fb7185]" },
          { label: "Upcoming",  count: upcomingCount, color: "border-amber-500/25 bg-amber-500/5",    dot: "bg-amber-400" },
          { label: "On Track",  count: onTrackCount,  color: "border-emerald-500/20 bg-emerald-500/4", dot: "bg-emerald-400" },
        ].map((s) => (
          <div key={s.label} className={`flex items-center justify-between p-4 rounded-2xl border ${s.color}`}>
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
              <span className="text-white/60 text-sm font-medium">{s.label}</span>
            </div>
            <span className="text-white font-black text-2xl">{s.count}</span>
          </div>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {categories.map((c) => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-full text-xs transition-all ${
              activeCategory === c ? "bg-white text-black font-semibold" : "bg-white/5 border border-white/10 text-white/40 hover:text-white hover:border-white/25"
            }`}>
            {c === "all" ? "All rules" : c}
          </button>
        ))}
      </div>

      {/* Rules list */}
      <div className="flex flex-col gap-3">
        {filtered.map((rule) => {
          const sev = severityConfig[rule.severity] || severityConfig.low;
          const st  = statusConfig[rule.status]     || statusConfig.on_track;

          const daysUntil = Math.floor(
            (new Date(rule.deadline).getTime() - Date.now()) / 86400000
          );

          return (
            <div key={rule.id}
              className="p-5 rounded-2xl border border-white/8 hover:border-white/18 bg-white/2 hover:bg-white/4 transition-all group cursor-pointer">
              <div className="flex items-start justify-between gap-4">
                {/* Left */}
                <div className="flex items-start gap-4 min-w-0">
                  <div className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${sev.dot}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-white/90 font-semibold text-sm">{rule.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sev.badge}`}>
                        {sev.label}
                      </span>
                    </div>
                    <p className="text-white/40 text-xs leading-relaxed">{rule.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1 text-white/30 text-xs">
                        <Globe size={11} /> {rule.jurisdiction}
                      </div>
                      <div className="flex items-center gap-1 text-white/30 text-xs">
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        {rule.category}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className={`flex items-center gap-1.5 text-xs ${st.color}`}>
                    {st.icon} {st.text}
                  </div>
                  <div className="text-right">
                    <p className="text-white/60 text-xs font-medium">
                      {rule.deadline}
                    </p>
                    <p className={`text-[10px] mt-0.5 ${
                      daysUntil < 0 ? "text-rose-400" : daysUntil < 14 ? "text-amber-400" : "text-emerald-400/60"
                    }`}>
                      {daysUntil < 0 ? `${Math.abs(daysUntil)}d overdue` : `in ${daysUntil}d`}
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-white/20 group-hover:text-white/50 transition-colors" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
