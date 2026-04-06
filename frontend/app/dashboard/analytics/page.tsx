"use client";

import React, { useState, useEffect } from "react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Download, TrendingUp, RefreshCw, Calendar, Mail, X } from "lucide-react";
import Button from "@/components/ui/Button";
import { useTheme } from "@/contexts/ThemeContext";
import { analytics } from "@/lib/api";

const PIE_COLORS = ["#a78bfa","#22d3ee","#34d399","#fbbf24","#fb7185","#60a5fa","#f472b6"];

export default function AnalyticsPage() {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const [period, setPeriod] = useState<"7d"|"30d"|"90d">("30d");
  const [exporting, setExporting] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleEmail, setScheduleEmail] = useState("");
  const [scheduleCron, setScheduleCron] = useState("0 8 * * 1");
  const [scheduling, setScheduling] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState<string | null>(null);

  const [kpi, setKpi] = useState({ totalDocuments: 0, complianceScore: 0, aiQueries: 0, risksResolved: 0 });
  const [riskDist, setRiskDist] = useState<Record<string, number>>({});
  const [docTypes, setDocTypes] = useState<{ name: string; value: number }[]>([]);
  const [radarData, setRadarData] = useState<{ subject: string; score: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      analytics.overview(),
      analytics.riskDistribution(),
      analytics.documentTypes(),
      analytics.complianceScore(),
    ]).then(([overviewRes, riskRes, docTypesRes, complianceRes]) => {
      if (overviewRes.data) {
        const d = overviewRes.data;
        setKpi({
          totalDocuments: d.documents.total,
          complianceScore: 0,
          aiQueries: 0,
          risksResolved: d.alerts.critical_risks,
        });
      }
      if (riskRes.data?.distribution) {
        setRiskDist(riskRes.data.distribution);
      }
      if (docTypesRes.data?.breakdown) {
        const breakdown = docTypesRes.data.breakdown;
        setDocTypes(Object.entries(breakdown).map(([name, value]) => ({ name, value: value as number })));
      }
      if (complianceRes.data) {
        const d = complianceRes.data;
        setKpi(prev => ({ ...prev, complianceScore: Math.round(d.compliance_score) }));
        // Build radar from gap_rules categories
        const catMap: Record<string, { covered: number; total: number }> = {};
        d.gap_rules.forEach(r => {
          if (!catMap[r.category]) catMap[r.category] = { covered: 0, total: 0 };
          catMap[r.category].total++;
        });
        const radar = Object.entries(catMap).slice(0, 6).map(([subject, v]) => ({
          subject,
          score: v.total > 0 ? Math.round((1 - v.covered / v.total) * 100) : 80,
        }));
        if (radar.length) setRadarData(radar);
      }
      setLoading(false);
    });
  }, []);

  const handleExport = async (reportFormat: "pdf" | "excel") => {
    setExporting(true);
    const { data } = await analytics.exportReport("compliance", reportFormat);
    if (data?.url) {
      const a = document.createElement("a");
      a.href = data.url;
      a.download = `compliance-report.${reportFormat === "pdf" ? "pdf" : "xlsx"}`;
      a.click();
    }
    setExporting(false);
  };

  const handleSchedule = async () => {
    if (!scheduleEmail.trim()) return;
    setScheduling(true);
    setScheduleMsg(null);
    const { data, error } = await analytics.scheduleReport({
      report_type: "compliance",
      report_format: "pdf",
      schedule: scheduleCron,
      schedule_email: scheduleEmail.trim(),
    });
    setScheduling(false);
    if (error) { setScheduleMsg(`Error: ${error}`); return; }
    setScheduleMsg(`Scheduled! Next run: ${data?.next_run_at ? new Date(data.next_run_at).toLocaleString() : "soon"}`);
    setShowSchedule(false);
  };

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

  // Build risk bar data from distribution
  const riskBarData = [{ month: "Current", ...riskDist }];

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
                    ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold shadow-lg shadow-violet-500/30"
                    : "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)]"
                }`}>{p}</button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => handleExport("pdf")} className="hover:scale-105 transition-transform duration-300">
            {exporting ? <RefreshCw size={13} className="animate-spin" /> : <Download size={13} />} Export PDF
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleExport("excel")} className="hover:scale-105 transition-transform duration-300">
            <Download size={13} /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowSchedule(v => !v)} className="hover:scale-105 transition-transform duration-300">
            <Calendar size={13} /> Schedule
          </Button>
        </div>
      </div>

      {/* Schedule modal */}
      {showSchedule && (
        <div className="mb-6 p-5 rounded-2xl border border-violet-500/30 bg-violet-500/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[var(--fg)] font-semibold text-sm flex items-center gap-2"><Calendar size={14} className="text-violet-500" /> Schedule Report</h3>
            <button type="button" onClick={() => setShowSchedule(false)} className="text-[var(--fg-muted)] hover:text-[var(--fg)]"><X size={14} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[var(--fg-muted)] text-xs mb-1 block">Email recipients</label>
              <input value={scheduleEmail} onChange={e => setScheduleEmail(e.target.value)}
                placeholder="you@company.com" type="email"
                className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--fg)] text-sm focus:outline-none focus:border-violet-500/50" />
            </div>
            <div>
              <label className="text-[var(--fg-muted)] text-xs mb-1 block">Cron schedule</label>
              <select value={scheduleCron} onChange={e => setScheduleCron(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--fg)] text-sm focus:outline-none focus:border-violet-500/50">
                <option value="0 8 * * 1">Every Monday 8am</option>
                <option value="0 8 1 * *">1st of every month</option>
                <option value="0 8 * * *">Daily 8am</option>
                <option value="0 8 1 */3 *">Quarterly</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={handleSchedule} disabled={scheduling || !scheduleEmail.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all disabled:opacity-50">
                {scheduling ? <RefreshCw size={13} className="animate-spin" /> : <Mail size={13} />}
                {scheduling ? "Scheduling…" : "Schedule"}
              </button>
            </div>
          </div>
          {scheduleMsg && <p className="text-xs mt-3 text-emerald-500">{scheduleMsg}</p>}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-[var(--fg-muted)]">
          <RefreshCw size={16} className="animate-spin" />
          <span className="text-sm">Loading analytics…</span>
        </div>
      ) : (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Documents", value: kpi.totalDocuments.toLocaleString(), delta: "from DB",    accent: "text-cyan-500",    border: "hover:border-cyan-500/30",    bg: "hover:bg-cyan-500/5"    },
              { label: "Compliance Score", value: kpi.complianceScore ? `${kpi.complianceScore}%` : "—", delta: "live",       accent: "text-emerald-500", border: "hover:border-emerald-500/30", bg: "hover:bg-emerald-500/5" },
              { label: "Critical Risks",   value: kpi.risksResolved,  delta: "active",     accent: "text-rose-500",    border: "hover:border-rose-500/30",    bg: "hover:bg-rose-500/5"    },
              { label: "Doc Types",        value: docTypes.length,    delta: "categories", accent: "text-violet-500",  border: "hover:border-violet-500/30",  bg: "hover:bg-violet-500/5"  },
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
            {/* Risk distribution */}
            <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:shadow-lg transition-all duration-300">
              <h3 className="text-[var(--fg)] font-semibold text-sm mb-1">Risk Distribution</h3>
              <p className="text-[var(--fg-muted)] text-xs mb-4">Current knowledge base risk levels</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={riskBarData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: tickColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: tickColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<Tooltip_ />} />
                  <Bar dataKey="critical" fill="#fb7185" radius={[2,2,0,0]} />
                  <Bar dataKey="high"     fill="#fbbf24" />
                  <Bar dataKey="medium"   fill="#60a5fa" />
                  <Bar dataKey="low"      fill="#34d399" />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--border)]">
                {[{ color: "#fb7185", label: "Critical" }, { color: "#fbbf24", label: "High" }, { color: "#60a5fa", label: "Medium" }, { color: "#34d399", label: "Low" }].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-1.5 text-[var(--fg-muted)] text-xs">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} /> {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Document type pie */}
            <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:shadow-lg transition-all duration-300">
              <h3 className="text-[var(--fg)] font-semibold text-sm mb-1">Document Type Breakdown</h3>
              <p className="text-[var(--fg-muted)] text-xs mb-4">Distribution across {kpi.totalDocuments} documents</p>
              {docTypes.length > 0 ? (
                <div className="flex items-center gap-4">
                  <PieChart width={160} height={160}>
                    <Pie data={docTypes} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                      paddingAngle={2} dataKey="value">
                      {docTypes.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke={pieStroke} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any, n: any) => [v, n]} />
                  </PieChart>
                  <div className="flex flex-col gap-1.5 flex-1">
                    {docTypes.map((d, i) => (
                      <div key={d.name} className="flex items-center justify-between text-xs hover:bg-[var(--surface-hover)] px-2 py-1 rounded cursor-pointer transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span className="text-[var(--fg-muted)] capitalize">{d.name.replace("_", " ")}</span>
                        </div>
                        <span className="text-[var(--fg-soft)] font-semibold">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 text-[var(--fg-muted)] text-sm">No documents yet</div>
              )}
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Compliance radar */}
            <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
              <h3 className="text-[var(--fg)] font-semibold text-sm mb-1">Compliance by Category</h3>
              <p className="text-[var(--fg-muted)] text-xs mb-3">Gap analysis radar</p>
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                    <PolarGrid stroke={radarGrid} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: radarTick, fontSize: 10 }} />
                    <Radar dataKey="score" stroke="#22d3ee" fill="rgba(34,211,238,0.12)" strokeWidth={2} />
                    <Tooltip content={<Tooltip_ />} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-40 text-[var(--fg-muted)] text-sm">Upload documents to see compliance radar</div>
              )}
            </div>

            {/* Risk counts summary */}
            <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
              <h3 className="text-[var(--fg)] font-semibold text-sm mb-1">Risk Summary</h3>
              <p className="text-[var(--fg-muted)] text-xs mb-4">Knowledge base risk breakdown</p>
              <div className="flex flex-col gap-3">
                {Object.entries(riskDist).map(([level, count]) => {
                  const colors: Record<string, string> = { critical: "#fb7185", high: "#fbbf24", medium: "#60a5fa", low: "#34d399" };
                  const total = Object.values(riskDist).reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={level}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[var(--fg-muted)] capitalize">{level}</span>
                        <span className="text-xs font-semibold text-[var(--fg)]">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[var(--surface-hover)]">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: colors[level] ?? "#888" }} />
                      </div>
                    </div>
                  );
                })}
                {Object.keys(riskDist).length === 0 && (
                  <p className="text-[var(--fg-muted)] text-sm text-center py-8">No risk data yet — upload documents first</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
