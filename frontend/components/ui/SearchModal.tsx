"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, FileText, Brain, X, ArrowRight, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { search as searchApi } from "@/lib/api";

interface SearchResult {
  id: string;
  type: "document" | "query" | "page";
  title: string;
  subtitle: string;
  href: string;
  icon: React.ElementType;
}

const STATIC_PAGES: SearchResult[] = [
  { id: "dash",        type: "page", title: "Dashboard",           subtitle: "Overview and analytics",        href: "/dashboard",              icon: ArrowRight },
  { id: "docs",        type: "page", title: "Documents",           subtitle: "Manage uploaded files",         href: "/dashboard/documents",    icon: FileText   },
  { id: "advisor",     type: "page", title: "AI Advisor",          subtitle: "Ask questions about your docs", href: "/dashboard/advisor",      icon: Brain      },
  { id: "calendar",    type: "page", title: "Compliance Calendar", subtitle: "Upcoming deadlines",            href: "/dashboard/calendar",     icon: ArrowRight },
  { id: "api-docs",    type: "page", title: "API Documentation",   subtitle: "REST API reference",            href: "/docs",                   icon: ArrowRight },
  { id: "changelog",   type: "page", title: "Changelog",           subtitle: "What's new",                    href: "/changelog",              icon: ArrowRight },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SearchModal({ open, onClose }: Props) {
  const [query,    setQuery]    = useState("");
  const [results,  setResults]  = useState<SearchResult[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef   = useRef<HTMLInputElement>(null);
  const listRef    = useRef<HTMLUListElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults(STATIC_PAGES);
      setSelected(0);
    }
  }, [open]);

  // Search
  useEffect(() => {
    if (!query.trim()) {
      setResults(STATIC_PAGES);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      const q = query.toLowerCase();

      // Filter static pages
      const pageMatches = STATIC_PAGES.filter(p =>
        p.title.toLowerCase().includes(q) || p.subtitle.toLowerCase().includes(q)
      );

      // Try API search
      try {
        const { data } = await searchApi.query(query, 5);
        if (data?.results) {
          const docResults: SearchResult[] = data.results.map(r => ({
            id:       r.id,
            type:     r.type === "knowledge" ? "document" as const : "document" as const,
            title:    r.filename ?? r.title ?? "Document",
            subtitle: r.excerpt ?? r.document_type ?? "",
            href:     `/dashboard/documents`,
            icon:     r.type === "knowledge" ? Brain : FileText,
          }));
          setResults([...pageMatches, ...docResults]);
        } else {
          setResults(pageMatches);
        }
      } catch {
        setResults(pageMatches);
      }

      setLoading(false);
      setSelected(0);
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard navigation
  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown")  { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
    if (e.key === "ArrowUp")    { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === "Escape")     { onClose(); }
    if (e.key === "Enter" && results[selected]) {
      window.location.href = results[selected].href;
      onClose();
    }
  }, [results, selected, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.children[selected] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  if (!open) return null;

  const TYPE_LABEL: Record<SearchResult["type"], string> = {
    document: "Document", query: "Recent query", page: "Page",
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-xl bg-[var(--bg-soft)] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)]">
          {loading
            ? <Loader2 size={16} className="text-violet-400 flex-shrink-0 animate-spin" />
            : <Search size={16} className="text-[var(--fg-muted)] flex-shrink-0" />
          }
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search documents, pages, features..."
            className="flex-1 bg-transparent text-[var(--fg)] placeholder:text-[var(--fg-muted)] text-sm focus:outline-none"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} className="text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors" aria-label="Clear search" title="Clear search">
              <X size={14} />
            </button>
          )}
          <kbd className="hidden sm:block text-[10px] font-mono text-[var(--fg-muted)] bg-[var(--surface)] border border-[var(--border)] px-1.5 py-0.5 rounded">ESC</kbd>
        </div>

        {/* Results */}
        <ul ref={listRef} className="max-h-72 overflow-y-auto py-2">
          {results.length === 0 && !loading && (
            <li className="px-4 py-8 text-center text-[var(--fg-muted)] text-sm">
              No results for &ldquo;{query}&rdquo;
            </li>
          )}
          {results.map((r, i) => {
            const Icon = r.icon;
            return (
              <li key={r.id}>
                <Link
                  href={r.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 transition-all",
                    selected === i
                      ? "bg-violet-500/10 text-[var(--fg)]"
                      : "text-[var(--fg-soft)] hover:bg-[var(--surface-hover)]"
                  )}
                  onMouseEnter={() => setSelected(i)}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    selected === i ? "bg-violet-500/20" : "bg-[var(--surface)]"
                  )}>
                    <Icon size={14} className={selected === i ? "text-violet-400" : "text-[var(--fg-muted)]"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    <p className="text-[10px] text-[var(--fg-muted)] truncate">{r.subtitle}</p>
                  </div>
                  <span className="text-[10px] text-[var(--fg-muted)] bg-[var(--surface)] border border-[var(--border)] px-2 py-0.5 rounded-full flex-shrink-0">
                    {TYPE_LABEL[r.type]}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Footer hint */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-[var(--border)] bg-[var(--surface)]">
          {[
            { key: "↑↓",    label: "navigate" },
            { key: "↵",     label: "open"     },
            { key: "ESC",   label: "close"    },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center gap-1.5">
              <kbd className="text-[10px] font-mono text-[var(--fg-muted)] bg-[var(--bg-soft)] border border-[var(--border)] px-1.5 py-0.5 rounded">{key}</kbd>
              <span className="text-[10px] text-[var(--fg-muted)]">{label}</span>
            </div>
          ))}
          <div className="ml-auto flex items-center gap-1.5">
            <Clock size={10} className="text-[var(--fg-muted)]" />
            <span className="text-[10px] text-[var(--fg-muted)]">Powered by AdvisorAI</span>
          </div>
        </div>
      </div>
    </div>
  );
}
