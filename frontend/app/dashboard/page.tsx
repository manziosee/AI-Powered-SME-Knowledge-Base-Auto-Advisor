"use client";

import React, { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ComposedChart, RadialBarChart, RadialBar,
} from "recharts";
import {
  FileText, Brain, ShieldCheck, AlertTriangle,
  Activity, TrendingUp, TrendingDown, Settings2, ChevronRight,
  Bell, Calendar, Clock, ArrowUpRight, Heart, LayoutDashboard, Sparkles,
} from "lucide-react";
import Link from "next/link";
import { analytics, notifications as notifApi, insights, auth as authApi } from "@/lib/api";
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
      {payload.map((p: any, idx: number) => (
        <div key={`${p.dataKey}-${idx}`} className="flex items-center gap-2 mb-0.5">
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


// ── Health score data types ───────────────────────────────────
interface HealthComponent { label: string; score: number; max: number; status: string; detail: string; }
interface HealthData {
  score: number; grade: string; trend: string; trend_direction: string;
  components: HealthComponent[]; recommendations: { priority: string; action: string }[];
}
interface ExpiryDoc {
  id: string; filename: string; document_type: string;
  expiry_date: string; days_until: number; overdue: boolean; status: string;
}


/* ── Page ─────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const [chartRange, setChartRange] = useState<"7d" | "14d" | "30d">("14d");
  const [showWidgetMenu, setShowWidgetMenu] = useState(false);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [expiring, setExpiring] = useState<ExpiryDoc[]>([]);
  const [kpi, setKpi] = useState({ totalDocuments: 0, processedDocs: 0, processingRate: 0, complianceScore: 0, criticalRisks: 0, upcomingDeadlines: 0, aiQueries: 0, knowledgeEntries: 0 });
  const [recentNotifs, setRecentNotifs] = useState<Array<{ id: string; title: string; message: string; notification_type: string; is_read: boolean; created_at: string }>>([]);
  const [user, setUser] = useState<{ name: string; avatar: string; company: string } | null>(null);
  const [riskDistData, setRiskDistData] = useState<{ month: string; critical: number; high: number; medium: number; low: number }[]>([]);
  const [complianceScore, setComplianceScore] = useState(0);
  const [activityData, setActivityData] = useState<{ date: string; uploaded: number; processed: number; queries: number }[]>([]);

  // Fetch activity data whenever the range changes
  useEffect(() => {
    analytics.activity(chartRange === "7d" ? 7 : chartRange === "14d" ? 14 : 30).then(({ data }) => {
      if (data?.series) {
        setActivityData(data.series.map((s) => ({
          date:      s.label,
          uploaded:  s.uploaded,
          processed: s.processed,
          queries:   s.entries,
        })));
      }
    });
  }, [chartRange]);

  useEffect(() => {
    // Fetch user info from API (not just localStorage) so avatar initial is correct
    authApi.me().then(({ data }) => {
      if (data) {
        const displayName = data.full_name ?? data.email ?? "User";
        setUser({
          name:    displayName,
          avatar:  displayName[0].toUpperCase(),
          company: data.company?.name ?? "",
        });
      } else {
        // Fallback to localStorage cache
        const stored = localStorage.getItem("auth_user");
        if (stored) {
          const u = JSON.parse(stored);
          const displayName = u.full_name ?? u.email ?? "User";
          setUser({ name: displayName, avatar: displayName[0].toUpperCase(), company: u.company?.name ?? "" });
        }
      }
    });

    insights.health().then(({ data }) => { if (data?.score) setHealth(data as HealthData); });
    insights.expiry(90).then(({ data }) => { if (data?.documents?.length) setExpiring(data.documents); });
    analytics.overview().then(({ data }) => {
      if (data) {
        setKpi((prev) => ({
          ...prev,
          totalDocuments:    data.documents.total,
          processedDocs:     data.documents.processed,
          processingRate:    data.documents.processing_rate_pct,
          criticalRisks:     data.alerts.critical_risks,
          upcomingDeadlines: data.alerts.upcoming_deadlines_30d,
          knowledgeEntries:  data.knowledge_entries.total,
        }));
      }
    });
    analytics.complianceScore().then(({ data }) => {
      if (data?.compliance_score != null) {
        const score = Math.round(data.compliance_score);
        setComplianceScore(score);
        setKpi((prev) => ({ ...prev, complianceScore: score }));
      }
    });
    analytics.riskDistribution().then(({ data }) => {
      if (data?.distribution) {
        const d = data.distribution;
        setRiskDistData([{
          month:    "Current",
          critical: (d.critical as number) || 0,
          high:     (d.high as number)     || 0,
          medium:   (d.medium as number)   || 0,
          low:      (d.low as number)      || 0,
        }]);
      }
    });
    notifApi.list(true, 4).then(({ data }) => {
      if (data?.items) setRecentNotifs(data.items);
    });
  }, []);

  const tickColor   = dark ? "rgba(255,255,255,0.3)"  : "rgba(0,0,0,0.45)";
  const gridColor   = dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";
  const refColor    = dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)";
  const legendColor = dark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";

  // activityData is populated from the /analytics/activity API (state above)

  const tooltip = <ChartTooltip dark={dark} />;

  return (
    <div className="p-5 max-w-[1400px] mx-auto">

      {/* ── Header row ── */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.35)] flex-shrink-0">
            <LayoutDashboard size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">
              <span className="gradient-text-brand">Dashboard</span>
            </h1>
            <p className="text-[var(--fg-muted)] text-xs mt-0.5">{new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}{user?.company ? ` · ${user.company}` : ""}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Live indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20">
            <Activity size={11} className="text-teal-500 animate-pulse-slow" />
            <span className="text-teal-500 text-xs font-medium">Live</span>
          </div>

          {/* Manage widgets */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowWidgetMenu(!showWidgetMenu)}
              className="group flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-blue-500/40 hover:bg-[var(--surface-hover)] text-xs font-medium transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-0.5"
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
          <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/35 flex items-center justify-center text-violet-400 font-bold text-xs" title={user?.name}>
            {user?.avatar ?? "?"}
          </div>
        </div>
      </div>

      {/* ── KPI grid — URBN-style with sparklines ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCard
          title="Total Documents"  value={kpi.totalDocuments.toLocaleString()}  sub={`${kpi.processingRate}% processed`}
          icon={FileText}      trend="up"   trendLabel={`${kpi.processedDocs} done`}
          accentColor="#22d3ee" borderColor="border-cyan-500/15"
        />
        <Link href="/dashboard/compliance" className="block hover:no-underline" title="View compliance details">
          <KpiCard
            title="Compliance Score" value={kpi.complianceScore ? `${kpi.complianceScore}%` : "—"}  sub="AI-powered analysis"
            icon={ShieldCheck}   trend="up"   trendLabel="Live"
            accentColor="#a78bfa" borderColor="border-violet-500/15"
          />
        </Link>
        <KpiCard
          title="Critical Risks"   value={kpi.criticalRisks}  sub={`${kpi.upcomingDeadlines} upcoming deadlines`}
          icon={AlertTriangle} trend="down" trendLabel="Active"
          accentColor="#fb7185" borderColor="border-rose-500/15"
        />
        <KpiCard
          title="Knowledge Entries" value={kpi.knowledgeEntries.toLocaleString()}  sub="Indexed from documents"
          icon={Brain}         trend="up"   trendLabel="Live"
          accentColor="#60a5fa" borderColor="border-blue-500/15"
        />
      </div>

      {/* ── Row: Business Health Score + Document Expiry ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

        {/* Business Health Score */}
        <div className="p-5 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Heart size={14} className="text-rose-400" />
              <h2 className="text-[var(--fg)] font-semibold text-sm">Business Health Score</h2>
            </div>
            <a href="/dashboard/analytics" className="text-[var(--fg-muted)] text-xs hover:text-violet-500 transition-colors flex items-center gap-0.5">
              Details <ArrowUpRight size={11} />
            </a>
          </div>

          {!health ? (
            <div className="flex items-center justify-center py-8 text-[var(--fg-muted)] text-xs">Loading health data…</div>
          ) : (
          <>
          <div className="flex items-center gap-5 mb-4">
            {/* Radial gauge */}
            <div className="relative w-24 h-24 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%"
                  startAngle={225} endAngle={-45} data={[{ value: health.score, fill: health.score >= 80 ? "#34d399" : health.score >= 60 ? "#fbbf24" : "#fb7185" }]}>
                  <RadialBar dataKey="value" cornerRadius={6} background={{ fill: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-[var(--fg)] leading-none">{health.score}</span>
                <span className="text-[10px] text-[var(--fg-muted)] font-bold">{health.grade}</span>
              </div>
            </div>

            {/* Components */}
            <div className="flex-1 flex flex-col gap-2">
              {health.components.slice(0, 3).map((c) => {
                const barW = (score: number) => {
                  const p = Math.round(score / 5) * 5;
                  const m: Record<number,string> = {0:"w-0",5:"w-[5%]",10:"w-[10%]",15:"w-[15%]",20:"w-1/5",25:"w-1/4",30:"w-[30%]",35:"w-[35%]",40:"w-2/5",45:"w-[45%]",50:"w-1/2",55:"w-[55%]",60:"w-3/5",65:"w-[65%]",70:"w-[70%]",75:"w-3/4",80:"w-4/5",85:"w-[85%]",90:"w-[90%]",95:"w-[95%]",100:"w-full"};
                  return m[p] ?? "w-1/2";
                };
                const barBg = c.status === "good" ? "bg-emerald-400" : c.status === "warning" ? "bg-amber-400" : "bg-rose-400";
                return (
                  <div key={c.label}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] text-[var(--fg-muted)]">{c.label}</span>
                      <span className="text-[10px] font-semibold text-[var(--fg)]">{c.score}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[var(--surface)]">
                      <div className={`h-full rounded-full transition-all duration-700 ${barW(c.score)} ${barBg}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommendations */}
          {health.recommendations.slice(0, 2).map((rec, i) => (
            <div key={i} className={`flex items-start gap-2 p-2.5 rounded-xl text-xs mb-1.5 ${rec.priority === "high" ? "bg-rose-500/8 border border-rose-500/20" : "bg-amber-500/8 border border-amber-500/20"}`}>
              <AlertTriangle size={11} className={rec.priority === "high" ? "text-rose-400 flex-shrink-0 mt-0.5" : "text-amber-400 flex-shrink-0 mt-0.5"} />
              <span className="text-[var(--fg-soft)]">{rec.action}</span>
            </div>
          ))}
          </>
          )}
        </div>

        {/* Document Expiry Tracker */}
        <div className="p-5 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-amber-400" />
              <h2 className="text-[var(--fg)] font-semibold text-sm">Document Expiry Tracker</h2>
            </div>
            <a href="/dashboard/documents" className="text-[var(--fg-muted)] text-xs hover:text-violet-500 transition-colors flex items-center gap-0.5">
              View all <ArrowUpRight size={11} />
            </a>
          </div>

          <div className="flex gap-3 mb-3">
            {[
              { label: "Overdue",  count: expiring.filter(d => d.overdue).length,              textCls: "text-rose-400"  },
              { label: "Urgent",   count: expiring.filter(d => d.status === "urgent").length,   textCls: "text-amber-400" },
              { label: "Upcoming", count: expiring.filter(d => d.status === "upcoming").length, textCls: "text-blue-400"  },
            ].map(({ label, count, textCls }) => (
              <div key={label} className="flex-1 p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-center">
                <p className={`text-lg font-black ${textCls}`}>{count}</p>
                <p className="text-[10px] text-[var(--fg-muted)]">{label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[168px]">
            {expiring.slice(0, 5).map((doc) => {
              const dotCls  = doc.overdue ? "bg-rose-400" : doc.status === "urgent" ? "bg-amber-400" : doc.status === "warning" ? "bg-orange-400" : "bg-blue-400";
              const textCls = doc.overdue ? "text-rose-400" : doc.status === "urgent" ? "text-amber-400" : doc.status === "warning" ? "text-orange-400" : "text-blue-400";
              return (
                <div key={doc.id} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-all">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotCls}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-[var(--fg-soft)] font-medium truncate">{doc.filename}</p>
                    <p className="text-[10px] text-[var(--fg-muted)]">{doc.document_type.replace("_", " ")}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-[10px] font-bold ${textCls}`}>
                      {doc.overdue ? `${Math.abs(doc.days_until)}d ago` : `${doc.days_until}d`}
                    </p>
                    <p className="text-[9px] text-[var(--fg-muted)]">{doc.expiry_date}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
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
        <Link href="/dashboard/compliance" className="block hover:no-underline group" title="View compliance details">
        <div className="p-5 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border)] group-hover:border-violet-500/30 group-hover:shadow-lg group-hover:shadow-violet-500/8 transition-all duration-300 cursor-pointer">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-[var(--fg)] font-semibold text-sm">Compliance Score</h2>
              <p className="text-[var(--fg-muted)] text-xs mt-0.5">Weekly candlestick view</p>
            </div>
            <ArrowUpRight size={14} className="text-[var(--fg-muted)] group-hover:text-violet-500 transition-colors" />
          </div>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-4xl font-black text-[var(--fg)]">{complianceScore || "—"}</span>
            <span className="text-[var(--fg-muted)] text-sm">/ 100</span>
            {complianceScore > 0 && (
              <div className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ml-1"
                style={{ background: "#34d39920", color: "#34d399" }}>
                <TrendingUp size={11} /> Live
              </div>
            )}
          </div>

          <ResponsiveContainer width="100%" height={155}>
            <ComposedChart data={riskDistData.length ? [{ date: "Now", close: complianceScore, open: Math.max(0, complianceScore - 5), high: Math.min(100, complianceScore + 3), low: Math.max(0, complianceScore - 8) }] : []} margin={{ top: 5, right: 0, left: -30, bottom: 0 }}>
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
        </Link>
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
            <BarChart data={riskDistData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
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
            {recentNotifs.length === 0 && (
              <p className="text-[var(--fg-muted)] text-xs text-center py-6">No unread alerts</p>
            )}
            {recentNotifs.map((n) => {
              const typeColor: Record<string, string> = { deadline: "#fbbf24", compliance: "#a78bfa", document: "#60a5fa" };
              const dotColor = typeColor[n.notification_type] || "#888";
              const typeBg: Record<string, string> = {
                deadline:   "border-amber-500/20 bg-amber-500/4",
                compliance: "border-violet-500/20 bg-violet-500/4",
                document:   "border-blue-500/20 bg-blue-500/4",
              };
              return (
                <div key={n.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all hover:scale-[1.02] cursor-default hover:shadow-md ${typeBg[n.notification_type] ?? "border-[var(--border)]"}`}>
                  <div className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0 animate-pulse-slow"
                    style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}70` }} />
                  <div className="min-w-0">
                    <p className="text-[var(--fg-soft)] text-xs font-medium leading-snug hover:text-[var(--fg)] transition-colors">{n.title}</p>
                    <p className="text-[var(--fg-muted)] text-[10px] mt-0.5 line-clamp-1 hover:text-[var(--fg-soft)] transition-colors">{n.message}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Knowledge entries summary */}
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <div className="flex items-center justify-between">
              <p className="text-[var(--fg-muted)] text-xs">Knowledge entries indexed</p>
              <span className="text-emerald-500 text-[10px] font-semibold">{kpi.knowledgeEntries} total</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
