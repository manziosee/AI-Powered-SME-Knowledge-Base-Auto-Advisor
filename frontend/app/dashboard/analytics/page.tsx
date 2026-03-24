"use client";

import React, { useState } from "react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { Download, TrendingUp } from "lucide-react";
import {
  DOCUMENT_ACTIVITY, QUERY_VOLUME, DOC_TYPE_BREAKDOWN,
  RISK_DISTRIBUTION, COMPLIANCE_CANDLES, KPI_STATS,
} from "@/lib/mock-data";
import Button from "@/components/ui/Button";

const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-ink-muted border border-white/15 rounded-xl px-3 py-2.5 text-xs shadow-2xl">
      <p className="text-white/50 mb-1.5 font-medium">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white/60 capitalize">{p.dataKey}:</span>
          <span className="text-white font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const radarData = [
  { subject: "Tax",         score: 88 },
  { subject: "HR",          score: 95 },
  { subject: "GDPR",        score: 82 },
  { subject: "Licensing",   score: 90 },
  { subject: "AML/KYC",     score: 78 },
  { subject: "Safety",      score: 96 },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<"7d"|"30d"|"90d">("30d");

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-white/40 text-sm mt-0.5">Performance insights and trends</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
            {(["7d","30d","90d"] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-xs transition-all ${
                  period === p ? "bg-white text-black font-semibold" : "text-white/40 hover:text-white"
                }`}>{p}</button>
            ))}
          </div>
          <Button variant="outline" size="sm">
            <Download size={13} /> Export PDF
          </Button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Documents", value: "1,248", delta: "+38",       accent: "text-cyan-400",    border: "hover:border-cyan-500/30",    bg: "hover:bg-cyan-500/4"    },
          { label: "Compliance Score", value: "94%",  delta: "+2pt",      accent: "text-emerald-400", border: "hover:border-emerald-500/30", bg: "hover:bg-emerald-500/4" },
          { label: "AI Queries",       value: "876",  delta: "+124%",     accent: "text-violet-400",  border: "hover:border-violet-500/30",  bg: "hover:bg-violet-500/4"  },
          { label: "Risks Resolved",   value: "14",   delta: "this month", accent: "text-blue-400",   border: "hover:border-blue-500/30",    bg: "hover:bg-blue-500/4"    },
        ].map((s) => (
          <div key={s.label} className={`p-5 rounded-2xl bg-white/3 border border-white/8 transition-all ${s.border} ${s.bg}`}>
            <p className="text-white/40 text-xs uppercase tracking-wide mb-2">{s.label}</p>
            <p className="text-3xl font-black text-white">{s.value}</p>
            <div className={`flex items-center gap-1 mt-1 text-xs ${s.accent}`}>
              <TrendingUp size={11} /> {s.delta}
            </div>
          </div>
        ))}
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Query volume */}
        <div className="p-5 rounded-2xl bg-white/3 border border-white/8">
          <h3 className="text-white font-semibold text-sm mb-1">AI Query Volume</h3>
          <p className="text-white/35 text-xs mb-4">RAG · Agent · Stream — last 30 days</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={QUERY_VOLUME} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => v.replace("Day ", "")} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<DarkTooltip />} />
              <Line type="monotone" dataKey="rag"    stroke="#a78bfa" strokeWidth={2}   dot={false} />
              <Line type="monotone" dataKey="agent"  stroke="#22d3ee" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="stream" stroke="#34d399" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Document type pie */}
        <div className="p-5 rounded-2xl bg-white/3 border border-white/8">
          <h3 className="text-white font-semibold text-sm mb-1">Document Type Breakdown</h3>
          <p className="text-white/35 text-xs mb-4">Distribution across {KPI_STATS.totalDocuments} documents</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={DOC_TYPE_BREAKDOWN} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                  paddingAngle={2} dataKey="value">
                  {DOC_TYPE_BREAKDOWN.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="rgba(255,255,255,0.05)" />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any, n: any) => [v, n]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1.5 flex-1">
              {DOC_TYPE_BREAKDOWN.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: d.color }} />
                    <span className="text-white/50">{d.name}</span>
                  </div>
                  <span className="text-white/70 font-medium">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Compliance radar */}
        <div className="p-5 rounded-2xl bg-white/3 border border-white/8">
          <h3 className="text-white font-semibold text-sm mb-1">Compliance by Category</h3>
          <p className="text-white/35 text-xs mb-3">Radar — 6 domains</p>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
              <Radar dataKey="score" stroke="#22d3ee" fill="rgba(34,211,238,0.12)" strokeWidth={2} />
              <Tooltip content={<DarkTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly compliance trend */}
        <div className="p-5 rounded-2xl bg-white/3 border border-white/8">
          <h3 className="text-white font-semibold text-sm mb-1">Compliance Trend</h3>
          <p className="text-white/35 text-xs mb-3">Score over 12 weeks</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={COMPLIANCE_CANDLES} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#34d399" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[60, 100]} tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<DarkTooltip />} />
              <Area type="monotone" dataKey="close" stroke="#34d399" strokeWidth={2} fill="url(#compGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Risk by month */}
        <div className="p-5 rounded-2xl bg-white/3 border border-white/8">
          <h3 className="text-white font-semibold text-sm mb-1">Risk Items by Month</h3>
          <p className="text-white/35 text-xs mb-3">Critical + High risks identified</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={RISK_DISTRIBUTION} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<DarkTooltip />} />
              <Bar dataKey="critical" fill="#fb7185" radius={[2,2,0,0]} />
              <Bar dataKey="high"     fill="#fbbf24" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
