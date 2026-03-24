"use client";

import React, { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ComposedChart,
} from "recharts";
import {
  FileText, Brain, ShieldCheck, AlertTriangle,
  Activity, TrendingUp, TrendingDown,
} from "lucide-react";
import {
  KPI_STATS, DOCUMENT_ACTIVITY, COMPLIANCE_CANDLES,
  RISK_DISTRIBUTION, QUERY_VOLUME, NOTIFICATIONS,
} from "@/lib/mock-data";

/* ── Colours shared across charts ─────────────────────────────────── */
const C = {
  queries:    "#a78bfa",   // violet
  uploaded:   "#22d3ee",   // cyan
  processed:  "#34d399",   // green
  compliance: "#60a5fa",   // blue
  critical:   "#fb7185",   // rose
  high:       "#fbbf24",   // amber
  medium:     "#60a5fa",   // blue
  low:        "#34d399",   // green
  rag:        "#a78bfa",
  agent:      "#22d3ee",
  stream:     "#34d399",
};

/* ── Custom tooltip ─────────────────────────────────────────────── */
const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f0f0f] border border-white/15 rounded-xl px-3 py-2.5 text-xs shadow-2xl">
      <p className="text-white/50 mb-1.5 font-medium">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color || "#fff" }} />
          <span className="text-white/50 capitalize">{p.dataKey}:</span>
          <span className="text-white font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ── Candlestick body ───────────────────────────────────────────── */
const CandlestickBar = (props: any) => {
  const { x, y, width, height, payload } = props;
  if (!payload) return null;
  const { open, close, high, low } = payload;
  const bullish = close >= open;
  const color   = bullish ? "#34d399" : "#fb7185";

  const toPixel = (val: number) => y + ((97 - val) / 40) * height;

  return (
    <g>
      <line x1={x + width / 2} y1={toPixel(high)} x2={x + width / 2} y2={toPixel(low)}
        stroke={color} strokeWidth={1.5} strokeOpacity={0.8} />
      <rect
        x={x + 2} y={toPixel(Math.max(open, close))}
        width={width - 4}
        height={Math.max(Math.abs(toPixel(open) - toPixel(close)), 2)}
        fill={bullish ? "rgba(52,211,153,0.25)" : "rgba(251,113,133,0.2)"}
        stroke={color} strokeWidth={1}
      />
    </g>
  );
};

/* ── KPI card ───────────────────────────────────────────────────── */
function KpiCard({
  title, value, sub, icon: Icon, trend, trendLabel, accentColor, borderColor,
}: {
  title: string; value: string | number; sub?: string;
  icon: React.ElementType; trend?: "up" | "down" | "neutral";
  trendLabel?: string; accentColor: string; borderColor: string;
}) {
  return (
    <div className={`relative p-5 rounded-2xl bg-white/3 border overflow-hidden hover:bg-white/5 transition-all group ${borderColor}`}>
      {/* Subtle glow blob */}
      <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-10 blur-2xl"
        style={{ background: accentColor }} />

      <div className="flex items-start justify-between mb-3 relative">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${accentColor}22` }}>
          <Icon size={16} style={{ color: accentColor }} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full`}
            style={{ background: `${accentColor}18`, color: accentColor }}>
            {trend === "up" && <TrendingUp size={10} />}
            {trend === "down" && <TrendingDown size={10} />}
            {trendLabel}
          </div>
        )}
      </div>
      <p className="text-3xl font-black text-white tracking-tight relative">{value}</p>
      <p className="text-white/50 text-sm mt-0.5 font-medium relative">{title}</p>
      {sub && <p className="text-white/25 text-xs mt-1 relative">{sub}</p>}
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const [chartRange, setChartRange] = useState<"7d" | "14d" | "30d">("14d");

  const activityData =
    chartRange === "7d"  ? DOCUMENT_ACTIVITY.slice(-7) :
    chartRange === "14d" ? DOCUMENT_ACTIVITY.slice(-10) :
    DOCUMENT_ACTIVITY;

  const recentNotifs = NOTIFICATIONS.filter((n) => !n.read).slice(0, 4);

  const notifDot: Record<string, string> = {
    critical: "#fb7185",
    high:     "#fbbf24",
    medium:   "#60a5fa",
    info:     "#a78bfa",
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-white/40 text-sm mt-0.5">March 24, 2026 · TechVentures RW</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-green/10 border border-accent-greenL/20">
          <Activity size={12} className="text-accent-greenL animate-pulse-slow" />
          <span className="text-accent-greenL text-xs font-medium">Live</span>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard title="Total Documents"  value="1,248"  sub="95% processed"   icon={FileText}     trend="up"   trendLabel="+38 today"  accentColor="#22d3ee" borderColor="border-accent-cyan/20"   />
        <KpiCard title="Compliance Score" value="94%"    sub="2 gaps detected" icon={ShieldCheck}  trend="up"   trendLabel="+2 pts"     accentColor="#a78bfa" borderColor="border-accent-violet/20" />
        <KpiCard title="Critical Risks"   value="2"      sub="8 high priority" icon={AlertTriangle} trend="down" trendLabel="−1 today"  accentColor="#fb7185" borderColor="border-accent-rose/20"   />
        <KpiCard title="AI Queries"       value="876"    sub="This month"      icon={Brain}        trend="up"   trendLabel="+124%"      accentColor="#60a5fa" borderColor="border-accent-blue/20"   />
      </div>

      {/* Row 1: activity + compliance candlestick */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* Document activity — area chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white/3 border border-white/8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-white font-semibold text-sm">Document Activity</h2>
              <p className="text-white/35 text-xs mt-0.5">Uploads · Processed · AI Queries</p>
            </div>
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              {(["7d", "14d", "30d"] as const).map((r) => (
                <button key={r} type="button" onClick={() => setChartRange(r)}
                  className={`px-2.5 py-1 rounded-md text-xs transition-all ${
                    chartRange === r
                      ? "bg-accent-violet text-white font-semibold shadow-lg shadow-accent-violet/30"
                      : "text-white/40 hover:text-white"
                  }`}>{r}</button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={activityData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gQueries"   x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.queries}   stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.queries}   stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="gUploaded"  x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.uploaded}  stopOpacity={0.2} />
                  <stop offset="95%" stopColor={C.uploaded}  stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date"  tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis                 tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<DarkTooltip />} />
              <Area type="monotone" dataKey="queries"   stroke={C.queries}   strokeWidth={2}   fill="url(#gQueries)"  dot={false} />
              <Area type="monotone" dataKey="uploaded"  stroke={C.uploaded}  strokeWidth={1.5} fill="url(#gUploaded)" dot={false} />
              <Line type="monotone" dataKey="processed" stroke={C.processed} strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
            </ComposedChart>
          </ResponsiveContainer>

          <div className="flex items-center gap-6 mt-3 pt-3 border-t border-white/5">
            {[
              { color: C.queries,   label: "AI Queries",  dashed: false },
              { color: C.uploaded,  label: "Uploaded",    dashed: false },
              { color: C.processed, label: "Processed",   dashed: true  },
            ].map(({ color, label, dashed }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                <div className="w-5 h-0.5 rounded" style={{ background: color, opacity: dashed ? 0.7 : 1,
                  backgroundImage: dashed ? `repeating-linear-gradient(90deg,${color} 0,${color} 4px,transparent 4px,transparent 7px)` : "none" }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Compliance score candlestick */}
        <div className="p-5 rounded-2xl bg-white/3 border border-white/8">
          <div className="mb-4">
            <h2 className="text-white font-semibold text-sm">Compliance Score</h2>
            <p className="text-white/35 text-xs mt-0.5">Weekly candlestick view</p>
          </div>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-4xl font-black text-white">94</span>
            <span className="text-white/30 text-sm">/ 100</span>
            <div className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ml-1"
              style={{ background: "#34d39920", color: "#34d399" }}>
              <TrendingUp size={11} /> +2 pts
            </div>
          </div>

          <ResponsiveContainer width="100%" height={160}>
            <ComposedChart data={COMPLIANCE_CANDLES} margin={{ top: 5, right: 0, left: -30, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis domain={[55, 100]} tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip content={<DarkTooltip />} />
              <ReferenceLine y={80} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
              <Bar dataKey="close" shape={<CandlestickBar />} />
              <Line type="monotone" dataKey="close" stroke={C.compliance} strokeWidth={1.5} dot={false} strokeOpacity={0.6} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: risk distribution + alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Risk distribution — stacked bar with color */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white/3 border border-white/8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-white font-semibold text-sm">Risk Distribution</h2>
              <p className="text-white/35 text-xs">Last 6 months — stacked by severity</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-white/45">
              {[
                { color: C.low,      label: "Low"      },
                { color: C.medium,   label: "Medium"   },
                { color: C.high,     label: "High"     },
                { color: C.critical, label: "Critical" },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                  {label}
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={RISK_DISTRIBUTION} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis                 tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<DarkTooltip />} />
              <Bar dataKey="low"      stackId="a" fill={C.low}      fillOpacity={0.85} radius={[0,0,0,0]} />
              <Bar dataKey="medium"   stackId="a" fill={C.medium}   fillOpacity={0.85} />
              <Bar dataKey="high"     stackId="a" fill={C.high}     fillOpacity={0.90} />
              <Bar dataKey="critical" stackId="a" fill={C.critical} fillOpacity={0.95} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Alerts panel */}
        <div className="p-5 rounded-2xl bg-white/3 border border-white/8 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-sm">Active Alerts</h2>
            <a href="/dashboard/notifications" className="text-white/30 text-xs hover:text-white transition-colors">View all</a>
          </div>

          <div className="flex flex-col gap-2 flex-1">
            {recentNotifs.map((n) => {
              const dotColor = notifDot[n.severity] || "#fff";
              return (
                <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl border border-white/8 bg-white/2 hover:bg-white/4 transition-all">
                  <div className="mt-1 w-2 h-2 rounded-full flex-shrink-0 animate-pulse-slow"
                    style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}60` }} />
                  <div className="min-w-0">
                    <p className="text-white/80 text-xs font-medium leading-snug">{n.title}</p>
                    <p className="text-white/35 text-[10px] mt-0.5 line-clamp-1">{n.body}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mini AI query sparkline */}
          <div className="mt-4 pt-4 border-t border-white/8">
            <p className="text-white/30 text-xs mb-2">AI Queries — 15 day trend</p>
            <ResponsiveContainer width="100%" height={55}>
              <AreaChart data={QUERY_VOLUME.slice(-15)} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.rag} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={C.rag} stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="rag" stroke={C.rag} strokeWidth={1.5} fill="url(#sparkGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
