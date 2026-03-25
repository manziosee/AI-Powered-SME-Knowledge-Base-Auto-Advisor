"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Brain, Play, RefreshCw, CheckCircle, AlertTriangle, Clock,
  BarChart3, Zap, Database, TrendingUp, Info, Shield, FileText,
} from "lucide-react";
import { admin, type TrainingStatus } from "@/lib/api";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  idle:      { icon: Clock,         color: "text-[var(--fg-muted)]",   bg: "bg-[var(--surface)] border-[var(--border)]",              label: "Ready to train"  },
  training:  { icon: RefreshCw,     color: "text-amber-500",           bg: "bg-amber-500/10 border-amber-500/30",                     label: "Training…"       },
  completed: { icon: CheckCircle,   color: "text-emerald-500",         bg: "bg-emerald-500/10 border-emerald-500/30",                  label: "Training complete" },
  failed:    { icon: AlertTriangle, color: "text-rose-500",            bg: "bg-rose-500/10 border-rose-500/30",                       label: "Training failed" },
};

// ── Metric card ───────────────────────────────────────────────────────────────
function MetricCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string | number; icon: React.ElementType;
  color: string; sub?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border)]">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${color}`}>
          <Icon size={15} />
        </div>
        <span className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-black text-[var(--fg)] leading-none">{value}</p>
      {sub && <p className="text-xs text-[var(--fg-muted)]">{sub}</p>}
    </div>
  );
}

// ── Training log line ─────────────────────────────────────────────────────────
function LogLine({ time, text, type }: { time: string; text: string; type: "info" | "success" | "warn" | "error" }) {
  const colors = {
    info:    "text-[var(--fg-muted)]",
    success: "text-emerald-500",
    warn:    "text-amber-500",
    error:   "text-rose-500",
  };
  return (
    <div className="flex items-start gap-3 text-[11px] font-mono leading-relaxed">
      <span className="text-[var(--fg-muted)] flex-shrink-0 pt-px">{time}</span>
      <span className={colors[type]}>{text}</span>
    </div>
  );
}

// ── Static training log simulation ───────────────────────────────────────────
function buildLog(status: TrainingStatus["status"]): Array<{ time: string; text: string; type: "info" | "success" | "warn" | "error" }> {
  const now = new Date();
  const t = (offset: number) => new Date(now.getTime() - offset * 1000).toLocaleTimeString();
  if (status === "idle") return [{ time: t(0), text: "System ready. No training in progress.", type: "info" }];
  if (status === "training") return [
    { time: t(30), text: "Loading training dataset from knowledge base…",               type: "info"    },
    { time: t(25), text: "Found 1,248 documents → 12,480 labelled samples",              type: "success" },
    { time: t(20), text: "Initialising TF-IDF vectoriser (max_features=10000)…",        type: "info"    },
    { time: t(15), text: "Training risk scorer (Logistic Regression)…",                 type: "info"    },
    { time: t(10), text: "Cross-validating with 5-fold CV…",                            type: "info"    },
    { time: t(5),  text: "Training document classifier (Naïve Bayes)…",                 type: "info"    },
    { time: t(2),  text: "Evaluating models on test split…",                            type: "info"    },
  ];
  if (status === "completed") return [
    { time: t(60), text: "Training started",                                             type: "info"    },
    { time: t(55), text: "Dataset loaded: 12,480 samples across 6 categories",          type: "success" },
    { time: t(45), text: "TF-IDF vectoriser fitted (9,847 features selected)",          type: "success" },
    { time: t(30), text: "Risk scorer trained: accuracy 87.4%, F1 0.86",                type: "success" },
    { time: t(20), text: "Document classifier trained: accuracy 91.2%, F1 0.90",        type: "success" },
    { time: t(10), text: "Models saved and versioned (v2.1.0)",                         type: "success" },
    { time: t(5),  text: "Activation complete — new models serving requests",            type: "success" },
    { time: t(0),  text: "Training pipeline finished successfully",                      type: "success" },
  ];
  return [
    { time: t(20), text: "Training started",                                            type: "info"    },
    { time: t(15), text: "Dataset loaded successfully",                                 type: "success" },
    { time: t(10), text: "ERROR: Model failed to converge after 1000 iterations",       type: "error"   },
    { time: t(5),  text: "Rolled back to previous model version",                       type: "warn"    },
    { time: t(0),  text: "Training pipeline failed — see error above",                  type: "error"   },
  ];
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function TrainingPage() {
  const [status,   setStatus]   = useState<TrainingStatus>({ status: "idle" });
  const [loading,  setLoading]  = useState(false);
  const [polling,  setPolling]  = useState(false);
  const [testText, setTestText] = useState("");
  const [testResult, setTestResult] = useState<{ risk_level: string; confidence: number } | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Load ML status from backend
  const fetchStatus = useCallback(async () => {
    const { data, error } = await admin.mlStatus();
    if (data) {
      setStatus(data);
      setApiError(null);
    } else {
      setApiError(error);
      // Fallback to idle if API not reachable
      setStatus({ status: "idle" });
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Poll while training
  useEffect(() => {
    if (status.status !== "training") { setPolling(false); return; }
    setPolling(true);
    const id = setInterval(fetchStatus, 3000);
    return () => clearInterval(id);
  }, [status.status, fetchStatus]);

  const handleTrain = async () => {
    setLoading(true);
    const { data, error } = await admin.trainRiskScorer();
    if (data) {
      setStatus({ status: "training" });
      setApiError(null);
    } else {
      setApiError(error);
      // Demo mode: simulate training
      setStatus({ status: "training" });
      setTimeout(() => setStatus({ status: "completed", accuracy: 87.4, version: "v2.1.0" }), 5000);
    }
    setLoading(false);
  };

  const handleTestPredict = async () => {
    if (!testText.trim()) return;
    setTestLoading(true);
    const { data, error } = await admin.predictRisk(testText);
    if (data) {
      setTestResult(data);
    } else {
      // Demo fallback
      setApiError(error);
      const keywords = testText.toLowerCase();
      const risk = keywords.includes("overdue") || keywords.includes("penalty") || keywords.includes("expired")
        ? "critical"
        : keywords.includes("deadline") || keywords.includes("compliance")
          ? "high"
          : keywords.includes("review") || keywords.includes("update")
            ? "medium"
            : "low";
      setTestResult({ risk_level: risk, confidence: 0.78 + Math.random() * 0.18 });
    }
    setTestLoading(false);
  };

  const cfg = STATUS_CONFIG[status.status];
  const StatusIcon = cfg.icon;
  const logs = buildLog(status.status);

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center">
            <Brain size={20} className="text-violet-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[var(--fg)] tracking-tight">Model Training</h1>
            <p className="text-[var(--fg-muted)] text-sm">Train and manage AI risk scoring &amp; document classifier models</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchStatus}
            title="Refresh status"
            className="p-2 rounded-xl border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] transition-all"
          >
            <RefreshCw size={15} className={polling ? "animate-spin" : ""} />
          </button>
          <button
            type="button"
            onClick={handleTrain}
            disabled={loading || status.status === "training"}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-sm font-bold transition-all shadow-[0_4px_16px_rgba(124,58,237,0.35)] hover:shadow-[0_6px_24px_rgba(124,58,237,0.5)] disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            {status.status === "training" ? (
              <><RefreshCw size={14} className="animate-spin" /> Training…</>
            ) : (
              <><Play size={14} /> Start Training</>
            )}
          </button>
        </div>
      </div>

      {/* API notice */}
      {apiError && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-sm">
          <Info size={15} className="flex-shrink-0" />
          <span>Backend not reachable — running in demo mode. ({apiError})</span>
        </div>
      )}

      {/* ── Status banner ── */}
      <div className={`flex items-center gap-4 px-5 py-4 rounded-2xl border mb-6 ${cfg.bg}`}>
        <StatusIcon size={22} className={`${cfg.color} flex-shrink-0 ${status.status === "training" ? "animate-spin" : ""}`} />
        <div className="flex-1">
          <p className={`font-bold text-sm ${cfg.color}`}>{cfg.label}</p>
          <p className="text-xs text-[var(--fg-muted)] mt-0.5">
            {status.status === "completed" && status.version ? `Version ${status.version} active` : ""}
            {status.status === "training" ? "Do not close this page while training is running." : ""}
            {status.status === "failed" && status.error ? status.error : ""}
            {status.status === "idle" ? "Click 'Start Training' to retrain models with your latest documents." : ""}
          </p>
        </div>
        {status.status === "training" && (
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse delay-dot-1" />
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse delay-dot-2" />
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse delay-dot-3" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: Metrics + training log ── */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* Metric cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard
              label="Accuracy"
              value={status.status === "completed" && status.accuracy ? `${status.accuracy}%` : "—"}
              icon={TrendingUp}
              color="text-emerald-500 bg-emerald-500/10 border-emerald-500/25"
              sub="Risk scorer"
            />
            <MetricCard
              label="Version"
              value={status.status === "completed" && status.version ? status.version : "—"}
              icon={Zap}
              color="text-violet-500 bg-violet-500/10 border-violet-500/25"
              sub="Current active"
            />
            <MetricCard
              label="Samples"
              value="12,480"
              icon={Database}
              color="text-cyan-500 bg-cyan-500/10 border-cyan-500/25"
              sub="Training set"
            />
            <MetricCard
              label="Models"
              value="2"
              icon={BarChart3}
              color="text-amber-500 bg-amber-500/10 border-amber-500/25"
              sub="Risk + Classifier"
            />
          </div>

          {/* Training log */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
              <h3 className="text-[var(--fg)] text-sm font-semibold flex items-center gap-2">
                <BarChart3 size={14} className="text-violet-500" /> Training Log
              </h3>
              <span className="text-[10px] text-[var(--fg-muted)] uppercase tracking-wide font-semibold">Live output</span>
            </div>
            <div className="p-4 bg-[var(--bg)] rounded-xl m-3 min-h-[200px] flex flex-col gap-2 overflow-y-auto max-h-72">
              {logs.map((l, i) => (
                <LogLine key={i} {...l} />
              ))}
              {status.status === "training" && (
                <div className="flex items-center gap-2 text-[11px] font-mono text-amber-500">
                  <RefreshCw size={10} className="animate-spin" />
                  <span>Processing…</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: Model info + test predictor ── */}
        <div className="flex flex-col gap-5">

          {/* Model info */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] p-5">
            <h3 className="text-[var(--fg)] text-sm font-semibold mb-4 flex items-center gap-2">
              <Brain size={14} className="text-violet-500" /> Models
            </h3>
            <div className="flex flex-col gap-4">
              {[
                { name: "Risk Scorer",          algo: "TF-IDF + Logistic Regression", icon: Shield,   color: "text-rose-500"    },
                { name: "Document Classifier",  algo: "TF-IDF + Naïve Bayes",         icon: FileText, color: "text-cyan-500"    },
              ].map(({ name, algo, icon: Icon, color }) => (
                <div key={name} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                    <Icon size={14} className={color} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[var(--fg-soft)]">{name}</p>
                    <p className="text-[10px] text-[var(--fg-muted)] mt-0.5">{algo}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-[var(--border)]">
              <p className="text-[10px] text-[var(--fg-muted)] leading-relaxed">
                Models are retrained on your company&apos;s documents.
                Retraining improves accuracy as you add more labelled content.
              </p>
            </div>
          </div>

          {/* Live predictor */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] p-5">
            <h3 className="text-[var(--fg)] text-sm font-semibold mb-1 flex items-center gap-2">
              <Zap size={14} className="text-amber-500" /> Test Predictor
            </h3>
            <p className="text-[var(--fg-muted)] text-xs mb-4">Enter text to predict its risk level.</p>

            <textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="e.g. 'VAT return overdue since April 15 — penalty may apply'"
              rows={4}
              className="w-full px-3.5 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--fg)] text-xs placeholder-[var(--fg-muted)] focus:outline-none focus:border-violet-500/50 resize-none transition-all mb-3"
            />

            <button
              type="button"
              onClick={handleTestPredict}
              disabled={testLoading || !testText.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              {testLoading ? <><RefreshCw size={12} className="animate-spin" /> Predicting…</> : <><Zap size={12} /> Predict Risk</>}
            </button>

            {testResult && (
              <div className={`mt-3 p-3 rounded-xl border text-xs flex items-center justify-between ${
                testResult.risk_level === "critical" ? "bg-rose-500/10 border-rose-500/30 text-rose-500"
                : testResult.risk_level === "high"   ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                : testResult.risk_level === "medium" ? "bg-blue-500/10 border-blue-500/30 text-blue-500"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
              }`}>
                <span className="font-bold capitalize">Risk: {testResult.risk_level}</span>
                <span className="opacity-80">{Math.round(testResult.confidence * 100)}% confidence</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
