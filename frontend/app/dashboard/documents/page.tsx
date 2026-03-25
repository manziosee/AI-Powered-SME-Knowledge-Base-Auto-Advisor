"use client";

import React, { useState } from "react";
import { Search, Upload, FileText, AlertTriangle, Clock, CheckCircle, Filter, MoreHorizontal } from "lucide-react";
import { DOCUMENTS } from "@/lib/mock-data";
import Button from "@/components/ui/Button";

const typeColors: Record<string, string> = {
  contract:     "text-violet-300 bg-violet-500/10",
  invoice:      "text-blue-300   bg-blue-500/10",
  tax_document: "text-amber-300  bg-amber-500/10",
  hr_document:  "text-cyan-300   bg-cyan-500/10",
  compliance:   "text-emerald-300 bg-emerald-500/10",
  policy:       "text-rose-300   bg-rose-500/10",
  other:        "text-white/40   bg-white/4",
};

const riskColors: Record<string, string> = {
  critical: "text-rose-300    bg-rose-500/12    border-rose-500/35",
  high:     "text-amber-300   bg-amber-500/10   border-amber-500/30",
  medium:   "text-blue-300    bg-blue-500/8     border-blue-500/25",
  low:      "text-emerald-400 bg-emerald-500/6  border-emerald-500/20",
};

const statusIcon: Record<string, React.ReactNode> = {
  processed:  <CheckCircle  size={13} className="text-emerald-400" />,
  processing: <Clock        size={13} className="text-amber-400 animate-spin-slow" />,
  uploaded:   <Clock        size={13} className="text-blue-400/60" />,
  failed:     <AlertTriangle size={13} className="text-rose-400" />,
};

export default function DocumentsPage() {
  const [search,  setSearch]  = useState("");
  const [typeFilter, setType] = useState("all");
  const [dragging, setDragging] = useState(false);

  const filtered = DOCUMENTS.filter((d) => {
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
          <p className="text-[var(--fg-muted)] text-sm mt-0.5">{DOCUMENTS.length} documents · 95% processed</p>
        </div>
        <Button variant="primary" size="sm" className="hover:scale-105 transition-transform duration-300">
          <Upload size={14} /> Upload documents
        </Button>
      </div>

      {/* Upload drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); }}
        className={`mb-6 border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer ${
          dragging ? "border-violet-500/60 bg-violet-500/8 scale-105" : "border-[var(--border)] bg-[var(--surface)] hover:border-violet-500/30 hover:bg-violet-500/4 hover:scale-[1.02]"
        }`}
      >
        <Upload size={24} className={`mx-auto mb-3 transition-colors duration-300 ${dragging ? "text-violet-400 scale-110" : "text-[var(--fg-muted)]"}`} />
        <p className="text-[var(--fg-soft)] text-sm font-medium">Drag &amp; drop documents here</p>
        <p className="text-[var(--fg-muted)] text-xs mt-1">PDF, Word, Excel, TXT — up to 50 MB each</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents…"
            className="w-full pl-9 pr-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--fg)] placeholder-[var(--fg-muted)] text-sm focus:outline-none focus:border-violet-500/50 focus:bg-violet-500/5 transition-all duration-300"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-[var(--fg-muted)]" />
          {["all","contract","invoice","tax_document","compliance","hr_document"].map((t) => (
            <button key={t} onClick={() => setType(t)}
              className={`px-3 py-1.5 rounded-full text-xs transition-all duration-300 hover:scale-105 ${
                typeFilter === t ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold shadow-lg shadow-violet-500/30" : "bg-[var(--surface)] border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-violet-500/30"
              }`}>
              {t === "all" ? "All" : t.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Document table */}
      <div className="rounded-2xl border border-[var(--border)] overflow-hidden bg-[var(--surface)]">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-[var(--bg-muted)] border-b border-[var(--border)] text-[var(--fg-muted)] text-xs uppercase tracking-wide font-semibold">
          <div className="col-span-5">Name</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-1">Risk</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1">Size</div>
          <div className="col-span-1" />
        </div>

        {filtered.map((doc, i) => (
          <div key={doc.id}
            className={`grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-[var(--bg-soft)] transition-all duration-300 cursor-pointer group hover:scale-[1.01] ${
              i < filtered.length - 1 ? "border-b border-[var(--border)]" : ""
            }`}>
            {/* Name */}
            <div className="col-span-5 flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[var(--surface-hover)] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <FileText size={14} className="text-[var(--fg-muted)] group-hover:text-violet-500 transition-colors" />
              </div>
              <div className="min-w-0">
                <p className="text-[var(--fg-soft)] text-sm font-medium truncate">{doc.name}</p>
                <p className="text-[var(--fg-muted)] text-[11px] mt-0.5">{doc.uploadedAt} · {doc.uploadedBy}</p>
              </div>
            </div>

            {/* Type */}
            <div className="col-span-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-300 hover:scale-105 ${typeColors[doc.type] || "text-[var(--fg-muted)] bg-[var(--surface)]"}`}>
                {doc.type.replace("_", " ")}
              </span>
            </div>

            {/* Risk */}
            <div className="col-span-1">
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-all duration-300 hover:scale-105 ${riskColors[doc.risk]}`}>
                {doc.risk}
              </span>
            </div>

            {/* Status */}
            <div className="col-span-2 flex items-center gap-1.5 text-[var(--fg-muted)] text-xs">
              <div className="transition-transform duration-300 group-hover:scale-110">{statusIcon[doc.status]}</div>
              <span className="capitalize group-hover:text-[var(--fg-soft)] transition-colors">{doc.status}</span>
            </div>

            {/* Size */}
            <div className="col-span-1 text-[var(--fg-muted)] text-xs group-hover:text-[var(--fg-soft)] transition-colors">{doc.size}</div>

            {/* Actions */}
            <div className="col-span-1 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-all duration-300 hover:scale-110" title="More options">
                <MoreHorizontal size={14} />
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-16 text-center text-[var(--fg-muted)] text-sm">
            No documents match your search.
          </div>
        )}
      </div>
    </div>
  );
}
