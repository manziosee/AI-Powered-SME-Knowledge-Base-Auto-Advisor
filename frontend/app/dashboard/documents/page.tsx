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
          <h1 className="text-2xl font-bold text-white">Documents</h1>
          <p className="text-white/40 text-sm mt-0.5">{DOCUMENTS.length} documents · 95% processed</p>
        </div>
        <Button variant="primary" size="sm">
          <Upload size={14} /> Upload documents
        </Button>
      </div>

      {/* Upload drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); }}
        className={`mb-6 border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
          dragging ? "border-violet-500/60 bg-violet-500/8" : "border-white/10 bg-white/2 hover:border-violet-500/30 hover:bg-violet-500/4"
        }`}
      >
        <Upload size={24} className={`mx-auto mb-3 transition-colors ${dragging ? "text-violet-400" : "text-white/30"}`} />
        <p className="text-white/50 text-sm font-medium">Drag &amp; drop documents here</p>
        <p className="text-white/25 text-xs mt-1">PDF, Word, Excel, TXT — up to 50 MB each</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents…"
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white/80 placeholder-white/25 text-sm focus:outline-none focus:border-white/25 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-white/30" />
          {["all","contract","invoice","tax_document","compliance","hr_document"].map((t) => (
            <button key={t} onClick={() => setType(t)}
              className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                typeFilter === t ? "bg-white text-black font-semibold" : "bg-white/5 border border-white/10 text-white/40 hover:text-white hover:border-white/25"
              }`}>
              {t === "all" ? "All" : t.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Document table */}
      <div className="rounded-2xl border border-white/8 overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-white/3 border-b border-white/8 text-white/35 text-xs uppercase tracking-wide">
          <div className="col-span-5">Name</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-1">Risk</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1">Size</div>
          <div className="col-span-1" />
        </div>

        {filtered.map((doc, i) => (
          <div key={doc.id}
            className={`grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-white/3 transition-all cursor-pointer group ${
              i < filtered.length - 1 ? "border-b border-white/5" : ""
            }`}>
            {/* Name */}
            <div className="col-span-5 flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white/6 flex items-center justify-center flex-shrink-0">
                <FileText size={14} className="text-white/50" />
              </div>
              <div className="min-w-0">
                <p className="text-white/80 text-sm font-medium truncate">{doc.name}</p>
                <p className="text-white/25 text-[11px] mt-0.5">{doc.uploadedAt} · {doc.uploadedBy}</p>
              </div>
            </div>

            {/* Type */}
            <div className="col-span-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeColors[doc.type] || "text-white/40 bg-white/4"}`}>
                {doc.type.replace("_", " ")}
              </span>
            </div>

            {/* Risk */}
            <div className="col-span-1">
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${riskColors[doc.risk]}`}>
                {doc.risk}
              </span>
            </div>

            {/* Status */}
            <div className="col-span-2 flex items-center gap-1.5 text-white/50 text-xs">
              {statusIcon[doc.status]}
              <span className="capitalize">{doc.status}</span>
            </div>

            {/* Size */}
            <div className="col-span-1 text-white/30 text-xs">{doc.size}</div>

            {/* Actions */}
            <div className="col-span-1 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all">
                <MoreHorizontal size={14} />
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-16 text-center text-white/25 text-sm">
            No documents match your search.
          </div>
        )}
      </div>
    </div>
  );
}
