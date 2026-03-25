"use client";

import React, { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ComposedChart,
} from "recharts";
import {
  FileText, Brain, ShieldCheck, AlertTriangle,
  Activity, TrendingUp, TrendingDown, Settings2, ChevronRight,
  Bell, Search,
} from "lucide-react";
import {
  KPI_STATS, DOCUMENT_ACTIVITY, COMPLIANCE_CANDLES,
  RISK_DISTRIBUTION, QUERY_VOLUME, NOTIFICATIONS,
} from "@/lib/mock-data";
import { useTheme } from "@/contexts/ThemeContext";

/* ── Colours ─────────────────────────────────────────────────── */
const C = {
  queries:    "#a78bfa",
  uploaded:   "#22d3ee",
  processed:  "#34d399",
  compliance: "#60a5fa",
  critical:   "#fb7185",
  high:       "#fbbf24",
  medium:     "#60a5fa",
  low:        "#34d399",
  rag:        "#a78bfa",
};

/* ── Tooltip ─────────────────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label, dark }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={`${dark ? "bg-[#0f0f0f] border-white/15 text-white/50" : "bg-white border-black/10 text-black/50"} border rounded-xl px-3 py-2.5 text-xs shadow-2xl`}>
      <p className="mb-1.5 font-medium">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color || "#888" }} />
          <span className="capitalize">{p.dataKey}:</span>
          <span className={`font-semibold ${dark ? "text-white" : "text-black"}`}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ── Candlestick ─────────────────────────────────────────────── */
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

/* ── Inline mini sparkline ───────────────────────────────────── */
function Sparkline({ data, color, dataKey = "v" }: {
  data: { [k: string]: number }[];
  color: string;
  dataKey?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <defs>
          <linearGradient id={`sg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.35} />
            <stop offset="95%" stopColor={color} stopOpacity={0}    />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#sg-${color.replace("#","")})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ── URBN-style KPI card with inline sparkline ───────────────── */
function KpiCard({
  title, value, sub, icon: Icon, trend, trendLabel, accentColor, borderColor, sparkData, sparkKey,
}: {
  title: string; value: string | number; sub?: string;
  icon: React.ElementType; trend?: "up" | "down" | "neutral";
  trendLabel?: string; accentColor: string; borderColor: string;
  sparkData?: { [k: string]: number }[];
  sparkKey?: string;
}) {
  return (
    <div
      className={`relative p-4 rounded-2xl bg-[var(--bg-soft)] border overflow-hidden transition-all group cursor-default hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1 ${borderColor}`}
      style={{ boxShadow: `inset 0 0 0 1px transparent` }}
    >
      {/* Background glow blob */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-8 blur-2xl pointer-events-none group-hover:opacity-12 transition-opacity"
        style={{ background: accentColor }}
      />

      <div className="flex items-start justify-between gap-2 relative">
        {/* Left: meta + value */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
              style={{ background: `${accentColor}22` }}
            >
              <Icon size={15} style={{ color: accentColor }} className="group-hover:rotate-12 transition-transform" />
            </div>
            <p className="text-[var(--fg-muted)] text-xs font-medium truncate group-hover:text-[var(--fg)] transition-colors">{title}</p>
          </div>

          <p className="text-3xl font-black text-[var(--fg)] tracking-tight leading-none group-hover:scale-105 transition-transform">
            {value}
          </p>

          {sub && (
            <p className="text-[var(--fg-muted)] text-[10px] mt-1 truncate group-hover:text-[var(--fg-soft)] transition-colors">{sub}</p>
          )}

          {trend && trendLabel && (
            <div className="flex items-center gap-1.5 mt-2">
              <div
                className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full group-hover:scale-105 transition-transform"
                style={{ background: `${accentColor}18`, color: accentColor }}
              >
                {trend === "up"   && <TrendingUp size={9} />}
                {trend === "down" && <TrendingDown size={9} />}
                {trendLabel}
              </div>
              <span className="text-[var(--fg-muted)] text-[10px] group-hover:text-[var(--fg-soft)] transition-colors">vs last week</span>
            </div>
          )}
        </div>

        {/* Right: sparkline */}
        {sparkData && (
          <div className="w-20 h-14 flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-110">
            <Sparkline data={sparkData} color={accentColor} dataKey={sparkKey ?? "v"} />
          </div>
        )}
      </div>

      {/* Show more link */}
      <div className="flex items-center gap-1 mt-3 pt-2.5 border-t border-[var(--border)]">
        <span className="text-[var(--fg-muted)] text-[10px] hover:text-[var(--fg)] transition-colors cursor-pointer flex items-center gap-0.5 group-hover:translate-x-1">
          Show more <ChevronRight size={9} className="group-hover:translate-x-0.5" />
        </span>
      </div>
    </div>
  );
}

/* ── Generate simple spark data from existing series ─────────── */
const docSpark    = DOCUMENT_ACTIVITY.slice(-8).map((d) => ({ v: d.queries }));
const uploadSpark = DOCUMENT_ACTIVITY.slice(-8).map((d) => ({ v: d.uploaded }));
const riskSpark   = COMPLIANCE_CANDLES.slice(-8).map((d) => ({ v: d.close }));
const qSpark      = QUERY_VOLUME.slice(-8).map((d) => ({ v: d.rag }));

/* ── Page ─────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const [chartRange, setChartRange] = useState<"7d" | "14d" | "30d">("14d");
  const [showWidgetMenu, setShowWidgetMenu] = useState(false);

  const tickColor   = dark ? "rgba(255,255,255,0.3)"  : "rgba(0,0,0,0.45)";
  const gridColor   = dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";
  const refColor    = dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)";
  const legendColor = dark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";

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

  const tooltip = <ChartTooltip dark={dark} />;

  return (
    <div className="p-5 max-w-[1400px] mx-auto">

      {/* ── Header row (URBN-inspired) ── */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--fg)] tracking-tight">Dashboard</h1>
          <p className="text-[var(--fg-muted)] text-xs mt-0.5">March 25, 2026 · TechVentures RW</p>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Live indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Activity size={11} className="text-emerald-500 animate-pulse-slow" />
            <span className="text-emerald-500 text-xs font-medium">Live</span>
          </div>

          {/* Manage widgets — URBN signature button enhanced */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowWidgetMenu(!showWidgetMenu)}
              className="group flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-violet-500/40 hover:bg-[var(--surface-hover)] text-xs font-medium transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10 hover:-translate-y-0.5"
            >
              <Settings2 size={13} className="group-hover:rotate-90 transition-transform duration-300" />
              Manage widgets
            </button>
            {showWidgetMenu && (
              <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] shadow-xl p-2 z-20 animate-in slide-in-from-top-2 fade-in-50">
                {["Document Activity","Compliance Score","Risk Distribution","AI Query Trends","Active Alerts"].map((w) => (
                  <label key={w} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[var(--surface-hover)] cursor-pointer transition-all duration-200 hover:scale-[1.02]">
                    <input type="checkbox" defaultChecked className="rounded accent-violet-500" />
                    <span className="text-[var(--fg-soft)] text-xs hover:text-[var(--fg)] transition-colors">{w}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* User avatar */}
          <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/35 flex items-center justify-center text-violet-400 font-bold text-xs">
            AU
          </div>
        </div>
      </div>

      {/* ── KPI grid — URBN-style with sparklines ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCard
          title="Total Documents"  value="1,248"  sub="95% processed"
          icon={FileText}      trend="up"   trendLabel="+38 today"
          accentColor="#22d3ee" borderColor="border-cyan-500/15"
          sparkData={uploadSpark}
        />
        <KpiCard
          title="Compliance Score" value="94%"    sub="2 gaps detected"
          icon={ShieldCheck}   trend="up"   trendLabel="+2 pts"
          accentColor="#a78bfa" borderColor="border-violet-500/15"
          sparkData={riskSpark}
        />
        <KpiCard
          title="Critical Risks"   value="2"      sub="8 high priority"
          icon={AlertTriangle} trend="down" trendLabel="−1 today"
          accentColor="#fb7185" borderColor="border-rose-500/15"
          sparkData={COMPLIANCE_CANDLES.slice(-8).map((d) => ({ v: 10 - d.close % 8 }))}
        />
        <KpiCard
          title="AI Queries"       value="876"    sub="This month"
          icon={Brain}         trend="up"   trendLabel="+124%"
          accentColor="#60a5fa" borderColor="border-blue-500/15"
          sparkData={qSpark}
        />
      </div>

      {/* ── Row 1: activity + compliance candlestick ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* Document activity chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[var(--fg)] font-semibold text-sm">Document Activity</h2>
              <p className="text-[var(--fg-muted)] text-xs mt-0.5">Uploads · Processed · AI Queries</p>
            </div>
            <div className="flex items-center gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg p-1">
              {(["7d", "14d", "30d"] as const).map((r) => (
                <button key={r} type="button" onClick={() => setChartRange(r)}
                  className={`px-2.5 py-1 rounded-md text-xs transition-all ${
                    chartRange === r
                      ? "bg-violet-500 text-white font-semibold shadow-lg shadow-violet-500/30"
                      : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
                  }`}>{r}</button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={210}>
            <ComposedChart data={activityData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gQueries"  x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.queries}  stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.queries}  stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="gUploaded" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.uploaded} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={C.uploaded} stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="date"  tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis                 tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={tooltip} />
              <Area type="monotone" dataKey="queries"   stroke={C.queries}   strokeWidth={2}   fill="url(#gQueries)"  dot={false} />
              <Area type="monotone" dataKey="uploaded"  stroke={C.uploaded}  strokeWidth={1.5} fill="url(#gUploaded)" dot={false} />
              <Line type="monotone" dataKey="processed" stroke={C.processed} strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
            </ComposedChart>
          </ResponsiveContainer>

          <div className="flex items-center gap-6 mt-3 pt-3 border-t border-[var(--border)]">
            {[
              { color: C.queries,   label: "AI Queries",  dashed: false },
              { color: C.uploaded,  label: "Uploaded",    dashed: false },
              { color: C.processed, label: "Processed",   dashed: true  },
            ].map(({ color, label, dashed }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs" style={{ color: legendColor }}>
                <div className="w-5 h-0.5 rounded" style={{
                  background: color, opacity: dashed ? 0.7 : 1,
                  backgroundImage: dashed ? `repeating-linear-gradient(90deg,${color} 0,${color} 4px,transparent 4px,transparent 7px)` : "none"
                }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Compliance score candlestick */}
        <div className="p-5 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border)]">
          <div className="mb-3">
            <h2 className="text-[var(--fg)] font-semibold text-sm">Compliance Score</h2>
            <p className="text-[var(--fg-muted)] text-xs mt-0.5">Weekly candlestick view</p>
          </div>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-4xl font-black text-[var(--fg)]">94</span>
            <span className="text-[var(--fg-muted)] text-sm">/ 100</span>
            <div className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ml-1"
              style={{ background: "#34d39920", color: "#34d399" }}>
              <TrendingUp size={11} /> +2 pts
            </div>
          </div>

          <ResponsiveContainer width="100%" height={155}>
            <ComposedChart data={COMPLIANCE_CANDLES} margin={{ top: 5, right: 0, left: -30, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="date" tick={{ fill: tickColor, fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis domain={[55, 100]} tick={{ fill: tickColor, fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip content={tooltip} />
              <ReferenceLine y={80} stroke={refColor} strokeDasharray="4 4" />
              <Bar dataKey="close" shape={<CandlestickBar />} />
              <Line type="monotone" dataKey="close" stroke={C.compliance} strokeWidth={1.5} dot={false} strokeOpacity={0.6} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Row 2: risk distribution + alerts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Risk distribution */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[var(--fg)] font-semibold text-sm">Risk Distribution</h2>
              <p className="text-[var(--fg-muted)] text-xs">Last 6 months — stacked by severity</p>
            </div>
            <div className="flex items-center gap-4 text-xs" style={{ color: legendColor }}>
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
          <ResponsiveContainer width="100%" height={175}>
            <BarChart data={RISK_DISTRIBUTION} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="month" tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis                 tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={tooltip} />
              <Bar dataKey="low"      stackId="a" fill={C.low}      fillOpacity={0.85} radius={[0,0,0,0]} />
              <Bar dataKey="medium"   stackId="a" fill={C.medium}   fillOpacity={0.85} />
              <Bar dataKey="high"     stackId="a" fill={C.high}     fillOpacity={0.90} />
              <Bar dataKey="critical" stackId="a" fill={C.critical} fillOpacity={0.95} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Active alerts — URBN-style "Realtor efficiency" panel */}
        <div className="p-5 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border)] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-[var(--fg-muted)]" />
              <h2 className="text-[var(--fg)] font-semibold text-sm">Active Alerts</h2>
            </div>
            <a href="/dashboard/notifications" className="text-[var(--fg-muted)] text-xs hover:text-violet-500 transition-colors flex items-center gap-0.5">
              View all <ChevronRight size={11} />
            </a>
          </div>

          <div className="flex flex-col gap-2 flex-1">
            {recentNotifs.map((n) => {
              const dotColor = notifDot[n.severity] || "#888";
              const severityBg: Record<string, string> = {
                critical: "border-rose-500/20 bg-rose-500/4",
                high:     "border-amber-500/20 bg-amber-500/4",
                medium:   "border-blue-500/20 bg-blue-500/4",
                info:     "border-violet-500/20 bg-violet-500/4",
              };
              return (
                <div key={n.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all hover:scale-[1.02] cursor-default hover:shadow-md ${severityBg[n.severity] ?? "border-[var(--border)]"}`}>
                  <div className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0 animate-pulse-slow"
                    style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}70` }} />
                  <div className="min-w-0">
                    <p className="text-[var(--fg-soft)] text-xs font-medium leading-snug hover:text-[var(--fg)] transition-colors">{n.title}</p>
                    <p className="text-[var(--fg-muted)] text-[10px] mt-0.5 line-clamp-1 hover:text-[var(--fg-soft)] transition-colors">{n.body}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI query sparkline — URBN style bottom widget */}
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[var(--fg-muted)] text-xs">AI Queries — 15 day trend</p>
              <span className="text-emerald-500 text-[10px] font-semibold">+124% ↑</span>
            </div>
            <ResponsiveContainer width="100%" height={52}>
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
