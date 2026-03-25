"use client";

import React, { useState } from "react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Download, TrendingUp } from "lucide-react";
import {
  DOCUMENT_ACTIVITY, QUERY_VOLUME, DOC_TYPE_BREAKDOWN,
  RISK_DISTRIBUTION, COMPLIANCE_CANDLES, KPI_STATS,
} from "@/lib/mock-data";
import Button from "@/components/ui/Button";
import { useTheme } from "@/contexts/ThemeContext";

const radarData = [
  { subject: "Tax",         score: 88 },
  { subject: "HR",          score: 95 },
  { subject: "GDPR",        score: 82 },
  { subject: "Licensing",   score: 90 },
  { subject: "AML/KYC",     score: 78 },
  { subject: "Safety",      score: 96 },
];

export default function AnalyticsPage() {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const [period, setPeriod] = useState<"7d"|"30d"|"90d">("30d");

  const tickColor  = dark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.45)";
  const gridColor  = dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.07)";
  const radarGrid  = dark ? "rgba(255,255,255,0.1)"  : "rgba(0,0,0,0.1)";
  const radarTick  = dark ? "rgba(255,255,255,0.4)"  : "rgba(0,0,0,0.5)";
  const pieStroke  = dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";

  const Tooltip_ = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className={`${dark ? "bg-[#0f0f0f] border-white/15" : "bg-white border-black/10"} border rounded-xl px-3 py-2.5 text-xs shadow-2xl`}>
        <p className="text-[var(--fg-muted)] mb-1.5 font-medium">{label}</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-[var(--fg-muted)] capitalize">{p.dataKey}:</span>
            <span className="text-[var(--fg)] font-semibold">{p.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-[var(--fg)] tracking-tight">Analytics</h1>
          <p className="text-[var(--fg-muted)] text-sm mt-0.5">Performance insights and trends</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg p-1">
            {(["7d","30d","90d"] as const).map((p) => (
              <button key={p} type="button" onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-xs transition-all duration-300 ${
                  period === p
                    ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40"
                    : "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)]"
                }`}>{p}</button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="hover:scale-105 transition-transform duration-300">
            <Download size={13} /> Export PDF
          </Button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Documents", value: "1,248", delta: "+38",        accent: "text-cyan-500",    border: "hover:border-cyan-500/30",    bg: "hover:bg-cyan-500/5"    },
          { label: "Compliance Score", value: "94%",  delta: "+2pt",       accent: "text-emerald-500", border: "hover:border-emerald-500/30", bg: "hover:bg-emerald-500/5" },
          { label: "AI Queries",       value: "876",  delta: "+124%",      accent: "text-violet-500",  border: "hover:border-violet-500/30",  bg: "hover:bg-violet-500/5"  },
          { label: "Risks Resolved",   value: "14",   delta: "this month", accent: "text-blue-500",    border: "hover:border-blue-500/30",    bg: "hover:bg-blue-500/5"    },
        ].map((s) => (
          <div key={s.label} className={`p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer ${s.border} ${s.bg}`}>
            <p className="text-[var(--fg-muted)] text-xs uppercase tracking-wide mb-2 font-semibold">{s.label}</p>
            <p className="text-3xl font-black text-[var(--fg)] tracking-tight">{s.value}</p>
            <div className={`flex items-center gap-1 mt-2 text-xs ${s.accent} font-medium`}>
              <TrendingUp size={11} className="animate-pulse" /> {s.delta}
            </div>
          </div>
        ))}
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Query volume */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:shadow-lg transition-all duration-300">
          <h3 className="text-[var(--fg)] font-semibold text-sm mb-1">AI Query Volume</h3>
          <p className="text-[var(--fg-muted)] text-xs mb-4">RAG · Agent · Stream — last 30 days</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={QUERY_VOLUME} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="day" tick={{ fill: tickColor, fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => v.replace("Day ", "")} />
              <YAxis tick={{ fill: tickColor, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tooltip_ />} />
              <Line type="monotone" dataKey="rag"    stroke="#a78bfa" strokeWidth={2}   dot={false} />
              <Line type="monotone" dataKey="agent"  stroke="#22d3ee" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="stream" stroke="#34d399" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--border)]">
            {[{ color: "#a78bfa", label: "RAG" }, { color: "#22d3ee", label: "Agent" }, { color: "#34d399", label: "Stream" }].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-[var(--fg-muted)] text-xs hover:text-[var(--fg)] transition-colors cursor-pointer">
                <div className="w-3 h-0.5 rounded" style={{ background: color }} /> {label}
              </div>
            ))}
          </div>
        </div>

        {/* Document type pie */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:shadow-lg transition-all duration-300">
          <h3 className="text-[var(--fg)] font-semibold text-sm mb-1">Document Type Breakdown</h3>
          <p className="text-[var(--fg-muted)] text-xs mb-4">Distribution across {KPI_STATS.totalDocuments} documents</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={DOC_TYPE_BREAKDOWN} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                  paddingAngle={2} dataKey="value">
                  {DOC_TYPE_BREAKDOWN.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke={pieStroke} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any, n: any) => [v, n]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1.5 flex-1">
              {DOC_TYPE_BREAKDOWN.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-xs hover:bg-[var(--surface-hover)] px-2 py-1 rounded cursor-pointer transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: d.color }} />
                    <span className="text-[var(--fg-muted)]">{d.name}</span>
                  </div>
                  <span className="text-[var(--fg-soft)] font-semibold">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Compliance radar */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
          <h3 className="text-[var(--fg)] font-semibold text-sm mb-1">Compliance by Category</h3>
          <p className="text-[var(--fg-muted)] text-xs mb-3">Radar — 6 domains</p>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke={radarGrid} />
              <PolarAngleAxis dataKey="subject" tick={{ fill: radarTick, fontSize: 10 }} />
              <Radar dataKey="score" stroke="#22d3ee" fill="rgba(34,211,238,0.12)" strokeWidth={2} />
              <Tooltip content={<Tooltip_ />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly compliance trend */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
          <h3 className="text-[var(--fg)] font-semibold text-sm mb-1">Compliance Trend</h3>
          <p className="text-[var(--fg-muted)] text-xs mb-3">Score over 12 weeks</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={COMPLIANCE_CANDLES} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#34d399" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="date" tick={{ fill: tickColor, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[60, 100]} tick={{ fill: tickColor, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tooltip_ />} />
              <Area type="monotone" dataKey="close" stroke="#34d399" strokeWidth={2} fill="url(#compGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Risk by month */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
          <h3 className="text-[var(--fg)] font-semibold text-sm mb-1">Risk Items by Month</h3>
          <p className="text-[var(--fg-muted)] text-xs mb-3">Critical + High risks identified</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={RISK_DISTRIBUTION} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="month" tick={{ fill: tickColor, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: tickColor, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tooltip_ />} />
              <Bar dataKey="critical" fill="#fb7185" radius={[2,2,0,0]} />
              <Bar dataKey="high"     fill="#fbbf24" />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--border)]">
            {[{ color: "#fb7185", label: "Critical" }, { color: "#fbbf24", label: "High" }].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-[var(--fg-muted)] text-xs">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} /> {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
