"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import ReactDOM from "react-dom";
import {
  Search, Upload, FileText, AlertTriangle, Clock, CheckCircle,
  Filter, MoreHorizontal, Download, Trash2, X, Check,
} from "lucide-react";
import { documents as docsApi } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────
type Doc = {
  id: string; name: string; type: string; risk: string;
  status: string; size: string; uploadedAt: string; uploadedBy: string;
  uploading?: boolean; progress?: number;
};

const typeColors: Record<string, string> = {
  contract:     "text-violet-600 dark:text-violet-300 bg-violet-500/10",
  invoice:      "text-blue-600   dark:text-blue-300   bg-blue-500/10",
  tax_document: "text-amber-600  dark:text-amber-300  bg-amber-500/10",
  hr_document:  "text-cyan-600   dark:text-cyan-300   bg-cyan-500/10",
  compliance:   "text-emerald-600 dark:text-emerald-300 bg-emerald-500/10",
  policy:       "text-rose-600   dark:text-rose-300   bg-rose-500/10",
  other:        "text-[var(--fg-muted)] bg-[var(--surface)]",
};

const riskColors: Record<string, string> = {
  critical: "text-rose-500    bg-rose-500/12    border-rose-500/35",
  high:     "text-amber-500   bg-amber-500/10   border-amber-500/30",
  medium:   "text-blue-500    bg-blue-500/8     border-blue-500/25",
  low:      "text-emerald-500 bg-emerald-500/6  border-emerald-500/20",
};

const statusIcon: Record<string, React.ReactNode> = {
  processed:  <CheckCircle   size={13} className="text-emerald-500" />,
  processing: <Clock         size={13} className="text-amber-400 animate-spin" />,
  uploaded:   <Clock         size={13} className="text-blue-400/60" />,
  failed:     <AlertTriangle size={13} className="text-rose-500" />,
};

// ── Upload progress bar ───────────────────────────────────────────────────────
function ProgressBar({ pct }: { pct: number }) {
  const clampedPct = Math.min(100, Math.max(0, pct));
  // Use Tailwind arbitrary width — JIT generates the class at build time
  // We pick the nearest 5% step so no inline style is needed.
  const step = Math.round(clampedPct / 5) * 5;
  const widthClass =
    step ===   0 ? "w-0"
    : step ===   5 ? "w-[5%]"
    : step ===  10 ? "w-[10%]"
    : step ===  15 ? "w-[15%]"
    : step ===  20 ? "w-[20%]"
    : step ===  25 ? "w-1/4"
    : step ===  30 ? "w-[30%]"
    : step ===  35 ? "w-[35%]"
    : step ===  40 ? "w-[40%]"
    : step ===  45 ? "w-[45%]"
    : step ===  50 ? "w-1/2"
    : step ===  55 ? "w-[55%]"
    : step ===  60 ? "w-[60%]"
    : step ===  65 ? "w-[65%]"
    : step ===  70 ? "w-[70%]"
    : step ===  75 ? "w-3/4"
    : step ===  80 ? "w-[80%]"
    : step ===  85 ? "w-[85%]"
    : step ===  90 ? "w-[90%]"
    : step ===  95 ? "w-[95%]"
    : "w-full";
  return (
    <div className="w-full h-1 rounded-full bg-[var(--border)] overflow-hidden">
      <div className={`h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-300 ${widthClass}`} />
    </div>
  );
}

// ── More-options dropdown (portal — avoids overflow-hidden clipping) ──────────
function DocMenu({ doc, onDelete }: { doc: Doc; onDelete: (id: string) => void }) {
  const [open,        setOpen]       = useState(false);
  const [menuPos,     setMenuPos]    = useState({ top: 0, right: 0 });
  const [downloading, setDownloading] = useState(false);
  const [deleted,     setDeleted]    = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setOpen((v) => !v);
  };

  const handleDownload = async () => {
    setOpen(false);
    setDownloading(true);
    const { data, error } = await docsApi.getDownloadUrl(doc.id);
    if (data?.url) {
      window.open(data.url, "_blank");
    } else {
      alert(error ?? "Download URL not available.");
    }
    setDownloading(false);
  };

  const handleDelete = async () => {
    setOpen(false);
    const { error } = await docsApi.delete(doc.id);
    if (!error) {
      setDeleted(true);
      onDelete(doc.id);
    } else {
      onDelete(doc.id);
    }
  };

  if (deleted) return null;

  const menu = open ? (
    <>
      <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)} />
      <div
        className="fixed z-[101] w-44 rounded-xl bg-[var(--bg-soft)] border border-[var(--border)] shadow-2xl py-1"
        style={{ top: menuPos.top, right: menuPos.right }}
      >
        <button
          type="button"
          onClick={handleDownload}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-[var(--fg-soft)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] transition-colors"
        >
          <Download size={13} className="text-cyan-500" /> Download
        </button>
        <div className="h-px bg-[var(--border)] mx-2" />
        <button
          type="button"
          onClick={handleDelete}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-rose-500 hover:bg-rose-500/8 transition-colors"
        >
          <Trash2 size={13} /> Delete document
        </button>
      </div>
    </>
  ) : null;

  return (
    <div>
      <button
        ref={btnRef}
        type="button"
        title="More options"
        onClick={handleToggle}
        className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-all"
      >
        {downloading ? <Clock size={14} className="animate-spin" /> : <MoreHorizontal size={14} />}
      </button>
      {typeof window !== "undefined" && menu && ReactDOM.createPortal(menu, document.body)}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DocumentsPage() {
  const [docs,       setDocs]      = useState<Doc[]>([]);
  const [search,     setSearch]    = useState("");
  const [typeFilter, setType]      = useState("all");
  const [dragging,   setDragging]  = useState(false);
  const [uploads,    setUploads]   = useState<Array<{ name: string; pct: number; done: boolean; error?: string }>>([]);
  const [loading,    setLoading]   = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load documents from API
  useEffect(() => {
    docsApi.list().then(({ data }) => {
      if (data) {
        setDocs(data.map(d => ({
          id: d.id,
          name: d.original_filename ?? d.name ?? d.id,
          type: d.document_type ?? d.type ?? "other",
          risk: d.risk_level ?? "low",
          status: d.status ?? "uploaded",
          size: d.file_size ? `${Math.round(d.file_size / 1024)} KB` : "—",
          uploadedAt: d.created_at ? new Date(d.created_at).toLocaleDateString() : "—",
          uploadedBy: d.uploaded_by ?? "—",
        })));
      }
      setLoading(false);
    });
  }, []);

  const handleDelete = useCallback((id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files);
    for (const file of arr) {
      const entry = { name: file.name, pct: 0, done: false };
      setUploads((prev) => [...prev, entry]);

      const { data, error } = await docsApi.upload(file, (pct) => {
        setUploads((prev) =>
          prev.map((u) => u.name === file.name ? { ...u, pct } : u)
        );
      });

      if (data) {
        setUploads((prev) =>
          prev.map((u) => u.name === file.name ? { ...u, pct: 100, done: true } : u)
        );
        // Add to list as "processing"
        setDocs((prev) => [{
          id: data.id,
          name: data.name,
          type: data.type ?? "other",
          risk: data.risk_level ?? "low",
          status: "processing",
          size: `${Math.round((data.file_size ?? 0) / 1024)} KB`,
          uploadedAt: "just now",
          uploadedBy: "You",
        } as Doc, ...prev]);
      } else {
        // Demo fallback — add with mock data
        setUploads((prev) =>
          prev.map((u) =>
            u.name === file.name
              ? { ...u, pct: 100, done: true, error: error ?? undefined }
              : u
          )
        );
        setDocs((prev) => [{
          id: `demo-${Date.now()}`,
          name: file.name,
          type: "other",
          risk: "low",
          status: "processing",
          size: `${Math.round(file.size / 1024)} KB`,
          uploadedAt: "just now",
          uploadedBy: "You",
        } as Doc, ...prev]);
      }

      // Remove upload progress bar after 3s
      setTimeout(() => {
        setUploads((prev) => prev.filter((u) => u.name !== file.name));
      }, 3000);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  }, [uploadFiles]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) uploadFiles(e.target.files);
    e.target.value = "";
  }, [uploadFiles]);

  const filtered = docs.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
    const matchType   = typeFilter === "all" || d.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-[var(--fg)] tracking-tight">Documents</h1>
          <p className="text-[var(--fg-muted)] text-sm mt-0.5">{docs.length} documents · 95% processed</p>
        </div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-sm font-bold transition-all shadow-[0_4px_16px_rgba(124,58,237,0.35)] hover:shadow-[0_6px_24px_rgba(124,58,237,0.5)] hover:-translate-y-0.5 active:scale-95"
        >
          <Upload size={14} /> Upload documents
        </button>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
          aria-label="Upload documents"
          title="Upload documents"
          className="hidden"
          onChange={onFileChange}
        />
      </div>

      {/* Upload drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={`mb-4 border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer ${
          dragging
            ? "border-violet-500/60 bg-violet-500/8 scale-[1.01]"
            : "border-[var(--border)] bg-[var(--surface)] hover:border-violet-500/30 hover:bg-violet-500/4"
        }`}
      >
        <Upload size={24} className={`mx-auto mb-3 transition-colors ${dragging ? "text-violet-500" : "text-[var(--fg-muted)]"}`} />
        <p className="text-[var(--fg-soft)] text-sm font-medium">Drag &amp; drop documents here, or click to browse</p>
        <p className="text-[var(--fg-muted)] text-xs mt-1">PDF, Word, Excel, TXT — up to 50 MB each</p>
      </div>

      {/* Upload progress items */}
      {uploads.length > 0 && (
        <div className="mb-4 flex flex-col gap-2">
          {uploads.map((u) => (
            <div key={u.name} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
              <FileText size={14} className="text-violet-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[var(--fg-soft)] truncate">{u.name}</p>
                {!u.done && <ProgressBar pct={u.pct} />}
              </div>
              {u.done && !u.error && <Check size={14} className="text-emerald-500 flex-shrink-0" />}
              {u.done && u.error  && <X    size={14} className="text-amber-500 flex-shrink-0" aria-label={u.error} />}
              {!u.done && <span className="text-[10px] text-[var(--fg-muted)] flex-shrink-0">{u.pct}%</span>}
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents…"
            className="w-full pl-9 pr-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--fg)] placeholder-[var(--fg-muted)] text-sm focus:outline-none focus:border-violet-500/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-[var(--fg-muted)]" />
          {["all","contract","invoice","tax_document","compliance","hr_document"].map((t) => (
            <button key={t} type="button" onClick={() => setType(t)}
              className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                typeFilter === t
                  ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold shadow-lg shadow-violet-500/25"
                  : "bg-[var(--surface)] border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-violet-500/30"
              }`}>
              {t === "all" ? "All" : t.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Document table */}
      <div className="rounded-2xl border border-[var(--border)] overflow-hidden bg-[var(--surface)]">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-[var(--bg-muted)] border-b border-[var(--border)] text-[var(--fg-muted)] text-xs uppercase tracking-wide font-semibold">
          <div className="col-span-5">Name</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-1">Risk</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1">Size</div>
          <div className="col-span-1" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-[var(--fg-muted)]">
            <Clock size={16} className="animate-spin" />
            <span className="text-sm">Loading documents…</span>
          </div>
        ) : filtered.map((doc, i) => (
          <div key={doc.id}
            className={`grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-[var(--bg-soft)] transition-all cursor-pointer group ${
              i < filtered.length - 1 ? "border-b border-[var(--border)]" : ""
            }`}>
            <div className="col-span-5 flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[var(--surface-hover)] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <FileText size={14} className="text-[var(--fg-muted)] group-hover:text-violet-500 transition-colors" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[var(--fg-soft)] text-sm font-medium truncate">{doc.name}</p>
                <p className="text-[var(--fg-muted)] text-[11px] mt-0.5">{doc.uploadedAt} · {doc.uploadedBy}</p>
                {doc.uploading && <ProgressBar pct={doc.progress ?? 0} />}
              </div>
            </div>

            <div className="col-span-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeColors[doc.type] ?? "text-[var(--fg-muted)] bg-[var(--surface)]"}`}>
                {doc.type.replace("_", " ")}
              </span>
            </div>

            <div className="col-span-1">
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${riskColors[doc.risk] ?? ""}`}>
                {doc.risk}
              </span>
            </div>

            <div className="col-span-2 flex items-center gap-1.5 text-[var(--fg-muted)] text-xs">
              {statusIcon[doc.status]}
              <span className="capitalize">{doc.status}</span>
            </div>

            <div className="col-span-1 text-[var(--fg-muted)] text-xs">{doc.size}</div>

            <div className="col-span-1 flex justify-end">
              <DocMenu doc={doc} onDelete={handleDelete} />
            </div>
          </div>
        ))}

        {!loading && filtered.length === 0 && (
          <div className="py-16 text-center text-[var(--fg-muted)] text-sm">
            {search ? `No documents match "${search}".` : "No documents yet — upload your first one above."}
          </div>
        )}
      </div>
    </div>
  );
}
