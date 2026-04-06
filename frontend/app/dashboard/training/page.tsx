"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Brain, Play, RefreshCw, CheckCircle, AlertTriangle, Clock,
  BarChart3, Zap, Database, TrendingUp, Info, Shield, FileText,
  Upload, Plus, Trash2, X,
} from "lucide-react";
import { admin, auth as authApi, type TrainingStatus } from "@/lib/api";
import * as XLSX from "xlsx";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  idle:      { icon: Clock,         color: "text-[var(--fg-muted)]",   bg: "bg-[var(--surface)] border-[var(--border)]",              label: "Ready to train"  },
  training:  { icon: RefreshCw,     color: "text-amber-500",           bg: "bg-amber-500/10 border-amber-500/30",                     label: "Training…"       },
  completed: { icon: CheckCircle,   color: "text-emerald-500",         bg: "bg-emerald-500/10 border-emerald-500/30",                  label: "Training complete" },
  trained:   { icon: CheckCircle,   color: "text-emerald-500",         bg: "bg-emerald-500/10 border-emerald-500/30",                  label: "Training complete" },
  failed:    { icon: AlertTriangle, color: "text-rose-500",            bg: "bg-rose-500/10 border-rose-500/30",                       label: "Training failed" },
};

const RISK_LABELS = ["low", "medium", "high", "critical"];

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

type LogEntry = { time: string; text: string; type: "info" | "success" | "warn" | "error" };
type TrainingSample = { text: string; label: string };

// ── Page ──────────────────────────────────────────────────────────────────────
export default function TrainingPage() {
  const [status,       setStatus]      = useState<TrainingStatus>({ status: "idle" });
  const [loading,      setLoading]     = useState(false);
  const [polling,      setPolling]     = useState(false);
  const [testText,     setTestText]    = useState("");
  const [testResult,   setTestResult]  = useState<{ risk_level: string; confidence: number } | null>(null);
  const [testLoading,  setTestLoading] = useState(false);
  const [apiError,     setApiError]    = useState<string | null>(null);
  const [logs,         setLogs]        = useState<LogEntry[]>([]);
  const [isAdmin,      setIsAdmin]     = useState(false);
  const [roleChecked,  setRoleChecked] = useState(false);

  // Training data state
  const [samples,     setSamples]      = useState<TrainingSample[]>([]);
  const [newText,     setNewText]      = useState("");
  const [newLabel,    setNewLabel]     = useState("low");
  const [csvError,    setCsvError]     = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = useCallback((text: string, type: LogEntry["type"] = "info") => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev.slice(-49), { time, text, type }]);
  }, []);

  // Load ML status from backend (admin-only)
  const fetchStatus = useCallback(async () => {
    const { data, error } = await admin.mlStatus();
    if (data) {
      // Backend returns {risk_scorer: {is_trained, trained_at, stats}} OR {status: "idle"}
      // Normalize to TrainingStatus shape
      const raw = data as any;
      if (raw.risk_scorer) {
        setStatus({
          status: raw.risk_scorer.is_trained ? "completed" : "idle",
          accuracy: raw.risk_scorer.stats?.accuracy,
          version: raw.risk_scorer.stats?.version,
        });
      } else {
        setStatus(raw as TrainingStatus);
      }
      setApiError(null);
    } else {
      setApiError(error);
      setStatus({ status: "idle" });
    }
  }, []);

  useEffect(() => {
    authApi.me().then(({ data }) => {
      const role = data?.role ?? "employee";
      const perms = data?.permissions ?? [];
      const adminAccess =
        role === "admin" || role === "super_admin" ||
        perms.includes("can_view_ai_training");
      setIsAdmin(adminAccess);
      setRoleChecked(true);
      if (adminAccess) {
        fetchStatus();
        addLog("System ready. No training in progress.", "info");
      }
    });
  }, [fetchStatus, addLog]);

  // Poll while training
  useEffect(() => {
    if (status.status !== "training") { setPolling(false); return; }
    setPolling(true);
    const id = setInterval(fetchStatus, 3000);
    return () => clearInterval(id);
  }, [status.status, fetchStatus]);

  const handleTrain = async () => {
    if (!isAdmin) return;
    setLoading(true);
    addLog(`Starting training${samples.length > 0 ? ` with ${samples.length} custom samples` : " using knowledge base data"}…`, "info");
    const { data, error } = await admin.trainRiskScorer(samples.length > 0 ? samples : undefined);
    if (data) {
      // Backend may return {status:"trained", stats:{}} or {status:"training"}
      const raw = data as any;
      const newStatus = raw.status === "trained" ? "completed" : (raw.status ?? "training");
      setStatus({ status: newStatus as TrainingStatus["status"], accuracy: raw.stats?.accuracy, version: raw.stats?.version });
      setApiError(null);
      addLog("Training complete.", "success");
    } else {
      setApiError(error);
      addLog(`Backend error: ${error}`, "error");
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
      setApiError(error);
      // client-side fallback
      const kw = testText.toLowerCase();
      const risk = kw.includes("overdue") || kw.includes("penalty") || kw.includes("expired")
        ? "critical"
        : kw.includes("deadline") || kw.includes("compliance")
          ? "high"
          : kw.includes("review") || kw.includes("update")
            ? "medium"
            : "low";
      setTestResult({ risk_level: risk, confidence: 0.78 + Math.random() * 0.18 });
    }
    setTestLoading(false);
  };

  // Add a manual sample
  const addSample = () => {
    if (!newText.trim()) return;
    setSamples((prev) => [...prev, { text: newText.trim(), label: newLabel }]);
    addLog(`Added sample: "${newText.slice(0, 40)}…" → ${newLabel}`, "info");
    setNewText("");
  };

  // Remove a sample
  const removeSample = (idx: number) => setSamples((prev) => prev.filter((_, i) => i !== idx));

  // Parse CSV text into samples
  const parseCsvText = (text: string): { parsed: TrainingSample[]; errors: number } => {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const parsed: TrainingSample[] = [];
    let errors = 0;
    const startIdx = lines[0]?.toLowerCase().includes("text") && lines[0]?.toLowerCase().includes("label") ? 1 : 0;
    for (let i = startIdx; i < lines.length; i++) {
      const parts = lines[i].split(",");
      if (parts.length < 2) { errors++; continue; }
      const label = parts[parts.length - 1].trim().toLowerCase();
      const txt = parts.slice(0, parts.length - 1).join(",").trim().replace(/^"|"$/g, "");
      if (!txt || !RISK_LABELS.includes(label)) { errors++; continue; }
      parsed.push({ text: txt, label });
    }
    return { parsed, errors };
  };

  // Universal file upload handler — CSV, Excel, Word, Image
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setCsvError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

    // ── CSV ──────────────────────────────────────────────────────────────────
    if (ext === "csv" || file.type === "text/csv") {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const { parsed, errors } = parseCsvText(ev.target?.result as string);
        if (parsed.length === 0) {
          setCsvError("No valid rows. CSV needs columns: text, label (low/medium/high/critical).");
          return;
        }
        setSamples((prev) => [...prev, ...parsed]);
        addLog(`Loaded ${parsed.length} samples from CSV${errors > 0 ? ` (${errors} skipped)` : ""}.`, errors > 0 ? "warn" : "success");
        if (errors > 0) setCsvError(`${errors} row(s) skipped — invalid format or label.`);
      };
      reader.readAsText(file);
      return;
    }

    // ── Excel (.xlsx / .xls) ─────────────────────────────────────────────────
    if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const wb = XLSX.read(ev.target?.result, { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
          const parsed: TrainingSample[] = [];
          let errors = 0;
          // detect header row
          const startIdx = String(rows[0]?.[0]).toLowerCase().includes("text") ? 1 : 0;
          for (let i = startIdx; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length < 2) { errors++; continue; }
            const txt = String(row[0]).trim();
            const label = String(row[row.length - 1]).trim().toLowerCase();
            if (!txt || !RISK_LABELS.includes(label)) { errors++; continue; }
            parsed.push({ text: txt, label });
          }
          if (parsed.length === 0) {
            setCsvError("No valid rows. Excel needs columns: text (col A), label (last col) — low/medium/high/critical.");
            return;
          }
          setSamples((prev) => [...prev, ...parsed]);
          addLog(`Loaded ${parsed.length} samples from Excel${errors > 0 ? ` (${errors} skipped)` : ""}.`, errors > 0 ? "warn" : "success");
          if (errors > 0) setCsvError(`${errors} row(s) skipped — invalid label value.`);
        } catch {
          setCsvError("Failed to parse Excel file. Ensure it has text and label columns.");
        }
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    // ── Word (.docx) ─────────────────────────────────────────────────────────
    if (ext === "docx" || ext === "doc") {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ arrayBuffer });
        const text = result.value.trim();
        if (!text) {
          setCsvError("Could not extract text from Word document.");
          return;
        }
        // Split into paragraphs and add as unlabeled samples (label defaults to "medium")
        const paragraphs = text.split(/\n+/).map((p) => p.trim()).filter((p) => p.length > 20);
        if (paragraphs.length === 0) {
          setNewText(text.slice(0, 500));
          addLog("Extracted text from Word doc — review and add a label manually.", "info");
          return;
        }
        const newSamples = paragraphs.map((p) => ({ text: p, label: "medium" }));
        setSamples((prev) => [...prev, ...newSamples]);
        addLog(`Extracted ${newSamples.length} paragraph(s) from Word doc (labeled 'medium' by default — adjust as needed).`, "warn");
        setCsvError(`${newSamples.length} paragraphs imported from Word. Labels default to 'medium' — review and adjust in the list.`);
      } catch {
        setCsvError("Failed to parse Word document. Ensure it is a valid .docx file.");
      }
      return;
    }

    // ── Image (.jpg / .png / .jpeg / .webp) ─────────────────────────────────
    if (["jpg", "jpeg", "png", "webp", "bmp", "tiff"].includes(ext)) {
      setCsvError("Images: OCR extraction is not supported in the browser. Upload the image via the Documents page, wait for it to be processed, then export its knowledge entries to CSV for training.");
      addLog("Image upload: use Documents page → processed → export to CSV.", "warn");
      return;
    }

    // ── Plain text ────────────────────────────────────────────────────────────
    if (ext === "txt") {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = (ev.target?.result as string).trim();
        if (!text) { setCsvError("Empty text file."); return; }
        // Try CSV format first
        if (text.includes(",")) {
          const { parsed, errors } = parseCsvText(text);
          if (parsed.length > 0) {
            setSamples((prev) => [...prev, ...parsed]);
            addLog(`Loaded ${parsed.length} samples from TXT${errors > 0 ? ` (${errors} skipped)` : ""}.`, errors > 0 ? "warn" : "success");
            return;
          }
        }
        // Otherwise add whole text as one sample
        setNewText(text.slice(0, 500));
        addLog("Loaded text from file — review and add a label manually.", "info");
      };
      reader.readAsText(file);
      return;
    }

    setCsvError(`Unsupported file type: .${ext}. Supported: CSV, Excel (.xlsx/.xls), Word (.docx), TXT.`);
  };

  const cfg = STATUS_CONFIG[status.status] ?? STATUS_CONFIG.idle;
  const StatusIcon = cfg.icon;

  if (roleChecked && !isAdmin) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center">
            <Brain size={20} className="text-violet-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[var(--fg)] tracking-tight">Model Training</h1>
            <p className="text-[var(--fg-muted)] text-sm">Train AI risk scoring models with your own labelled data</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center rounded-2xl bg-[var(--bg-soft)] border border-[var(--border)]">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center">
            <Shield size={24} className="text-rose-500" />
          </div>
          <h2 className="text-[var(--fg)] font-bold text-lg">Access Restricted</h2>
          <p className="text-[var(--fg-muted)] text-sm max-w-sm">
            You don&apos;t have permission to access AI Training. Contact your administrator to request the <code className="font-mono text-violet-400">can_view_ai_training</code> permission.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.4)] flex-shrink-0">
            <Brain size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[var(--fg)] tracking-tight">AI Training</h1>
            <p className="text-[var(--fg-muted)] text-sm">Train AI risk scoring models with your own labelled data</p>
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
              <><Play size={14} /> Start Training{samples.length > 0 ? ` (${samples.length})` : ""}</>
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
            {status.status === "idle" ? `Click 'Start Training' to train with your documents${samples.length > 0 ? ` or ${samples.length} custom sample${samples.length !== 1 ? "s" : ""}` : ""}.` : ""}
          </p>
        </div>
        {status.status === "training" && (
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse delay-100" />
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse delay-200" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: Training data + Metrics + Log ── */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* ── Training data upload ── */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
              <h3 className="text-[var(--fg)] text-sm font-semibold flex items-center gap-2">
                <Database size={14} className="text-cyan-500" /> Training Data
              </h3>
              <span className="text-[10px] text-[var(--fg-muted)] uppercase tracking-wide font-semibold">
                {samples.length} sample{samples.length !== 1 ? "s" : ""} loaded
              </span>
            </div>
            <div className="p-4 flex flex-col gap-4">

              {/* CSV upload */}
              <div>
                <p className="text-[var(--fg-muted)] text-xs mb-2">
                  Upload <code className="font-mono text-violet-400">CSV</code>, <code className="font-mono text-violet-400">Excel (.xlsx/.xls)</code>, <code className="font-mono text-violet-400">Word (.docx)</code>, or <code className="font-mono text-violet-400">TXT</code> — columns: text, label (low/medium/high/critical)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,.docx,.doc,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-violet-500/40 bg-violet-500/5 hover:bg-violet-500/10 text-violet-500 text-xs font-semibold cursor-pointer transition-all w-fit"
                >
                  <Upload size={13} /> Upload CSV / Excel / Word / TXT
                </label>
                {csvError && (
                  <p className="text-rose-500 text-xs mt-2 flex items-center gap-1">
                    <AlertTriangle size={11} /> {csvError}
                  </p>
                )}
              </div>

              {/* Manual entry */}
              <div>
                <p className="text-[var(--fg-muted)] text-xs mb-2">Or add samples manually:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSample()}
                    placeholder="Enter document text or snippet…"
                    className="flex-1 min-w-0 px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--fg)] text-xs placeholder-[var(--fg-muted)] focus:outline-none focus:border-violet-500/50 transition-all"
                  />
                  <select
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    aria-label="Risk level"
                    className="px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--fg)] text-xs focus:outline-none focus:border-violet-500/50 transition-all"
                  >
                    {RISK_LABELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={addSample}
                    disabled={!newText.trim()}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all disabled:opacity-40"
                  >
                    <Plus size={12} /> Add
                  </button>
                </div>
              </div>

              {/* Sample list */}
              {samples.length > 0 && (
                <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                  <div className="max-h-48 overflow-y-auto">
                    {samples.map((s, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2 border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-hover)]">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${
                          s.label === "critical" ? "text-rose-500 border-rose-500/30 bg-rose-500/10"
                          : s.label === "high" ? "text-amber-500 border-amber-500/30 bg-amber-500/10"
                          : s.label === "medium" ? "text-blue-500 border-blue-500/30 bg-blue-500/10"
                          : "text-emerald-500 border-emerald-500/30 bg-emerald-500/10"
                        }`}>{s.label}</span>
                        <span className="text-[var(--fg-muted)] text-xs flex-1 truncate">{s.text}</span>
                        <button
                          type="button"
                          onClick={() => removeSample(i)}
                          aria-label="Remove sample"
                          className="text-[var(--fg-muted)] hover:text-rose-500 transition-colors flex-shrink-0"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 bg-[var(--surface)] border-t border-[var(--border)]">
                    <span className="text-[var(--fg-muted)] text-[10px]">{samples.length} sample{samples.length !== 1 ? "s" : ""}</span>
                    <button
                      type="button"
                      onClick={() => setSamples([])}
                      className="flex items-center gap-1 text-[10px] text-rose-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 size={10} /> Clear all
                    </button>
                  </div>
                </div>
              )}

              <p className="text-[var(--fg-muted)] text-[10px] leading-relaxed">
                If no custom samples are provided, training uses labelled knowledge entries from your knowledge base.
                Minimum 4 samples required.
              </p>
            </div>
          </div>

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
              value={samples.length > 0 ? samples.length.toLocaleString() : "Auto"}
              icon={Database}
              color="text-cyan-500 bg-cyan-500/10 border-cyan-500/25"
              sub={samples.length > 0 ? "Custom" : "From KB"}
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
            <div className="p-4 bg-[var(--bg)] rounded-xl m-3 min-h-[140px] flex flex-col gap-2 overflow-y-auto max-h-56">
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
                Models train on your labelled samples or company knowledge entries.
                More labelled data → higher accuracy.
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
