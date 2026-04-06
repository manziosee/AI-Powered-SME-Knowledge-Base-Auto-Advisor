"use client";

import React, { useState, useEffect } from "react";
import { FileText, Search, Plus, Globe, Tag, ChevronRight, RefreshCw, X, Copy, Check } from "lucide-react";
import { templates as templatesApi } from "@/lib/api";

const CATEGORIES = ["all", "contract", "hr", "tax", "compliance", "financial", "legal", "other"];

export default function TemplatesPage() {
  const [items, setItems]           = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [category, setCategory]     = useState("all");
  const [selected, setSelected]     = useState<any | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [rendered, setRendered]     = useState<string | null>(null);
  const [using, setUsing]           = useState(false);
  const [copied, setCopied]         = useState(false);

  useEffect(() => {
    load();
  }, [category, search]);

  async function load() {
    setLoading(true);
    const { data } = await templatesApi.list({
      category: category !== "all" ? category : undefined,
      search: search || undefined,
    });
    setItems(data || []);
    setLoading(false);
  }

  async function handleUse() {
    if (!selected) return;
    setUsing(true);
    const { data } = await templatesApi.use(selected.id, fieldValues);
    setRendered(data?.rendered_content || null);
    setUsing(false);
  }

  function handleCopy() {
    if (!rendered) return;
    navigator.clipboard.writeText(rendered);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-[var(--fg)] tracking-tight">Document Templates</h1>
          <p className="text-[var(--fg-muted)] text-sm mt-0.5">Pre-built templates for common SME documents</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white text-sm font-semibold hover:opacity-90 transition-all">
          <Plus size={16} /> New Template
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar: filters + list */}
        <div className="lg:col-span-1 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search templates…"
              className="w-full pl-9 pr-3 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--fg)] text-sm focus:outline-none focus:border-violet-500/50"
            />
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  category === c
                    ? "bg-violet-500 text-white"
                    : "bg-[var(--surface)] border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)]"
                }`}
              >
                {c === "all" ? "All" : c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>

          {/* Template list */}
          {loading ? (
            <div className="flex items-center gap-2 text-[var(--fg-muted)] py-10 justify-center">
              <RefreshCw size={14} className="animate-spin" /> Loading…
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-10 text-[var(--fg-muted)] text-sm">No templates found</div>
          ) : (
            <div className="flex flex-col gap-2">
              {items.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setSelected(t); setRendered(null); setFieldValues({}); }}
                  className={`text-left p-4 rounded-2xl border transition-all hover:scale-[1.01] ${
                    selected?.id === t.id
                      ? "border-violet-500/40 bg-violet-500/8"
                      : "border-[var(--border)] bg-[var(--surface)] hover:border-violet-500/25"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[var(--fg-soft)] font-semibold text-sm">{t.name}</p>
                      <p className="text-[var(--fg-muted)] text-xs mt-0.5 line-clamp-2">{t.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
                          {t.category}
                        </span>
                        {t.country_code && (
                          <span className="flex items-center gap-1 text-[10px] text-[var(--fg-muted)]">
                            <Globe size={9} /> {t.country_code}
                          </span>
                        )}
                        <span className="text-[10px] text-[var(--fg-muted)]">{t.usage_count} uses</span>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-[var(--fg-muted)] flex-shrink-0 mt-1" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main panel: template detail + fill */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="h-full flex items-center justify-center rounded-2xl border border-dashed border-[var(--border)] p-12 text-center">
              <div>
                <FileText size={40} className="text-violet-500 opacity-30 mx-auto mb-3" />
                <p className="text-[var(--fg-muted)] text-sm">Select a template to preview and use it</p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-[var(--fg)] font-black text-lg">{selected.name}</h2>
                  <p className="text-[var(--fg-muted)] text-sm mt-1">{selected.description}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-[var(--fg-muted)] hover:text-[var(--fg)]">
                  <X size={16} />
                </button>
              </div>

              {/* Fields to fill */}
              {selected.fields && selected.fields.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[var(--fg-soft)] text-sm font-semibold">Fill in the fields</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selected.fields.map((f: any) => (
                      <div key={f.key}>
                        <label className="text-[var(--fg-muted)] text-xs mb-1 block">{f.label || f.key}</label>
                        <input
                          value={fieldValues[f.key] || ""}
                          onChange={e => setFieldValues(v => ({ ...v, [f.key]: e.target.value }))}
                          placeholder={f.placeholder || f.key}
                          className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--fg)] text-sm focus:outline-none focus:border-violet-500/50"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleUse}
                disabled={using}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
              >
                {using ? <RefreshCw size={14} className="animate-spin" /> : <FileText size={14} />}
                Generate Document
              </button>

              {/* Rendered output */}
              {rendered && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[var(--fg-soft)] text-sm font-semibold">Generated Content</p>
                    <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300">
                      {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                    </button>
                  </div>
                  <pre className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-4 text-[var(--fg-soft)] text-xs whitespace-pre-wrap max-h-96 overflow-y-auto font-mono leading-relaxed">
                    {rendered}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
