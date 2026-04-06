"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import ReactDOM from "react-dom";
import {
  Search, Upload, FileText, AlertTriangle, Clock, CheckCircle,
  Filter, MoreHorizontal, Download, Trash2, X, Check,
  Share2, MessageSquare, Tag, Square, CheckSquare,
  Link2, Lock, Eye, Copy, Send, RefreshCw,
} from "lucide-react";
import { documents as docsApi, shareLinks as shareLinksApi, docComments as commentsApi, bulkDocuments as bulkApi } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────
type Doc = {
  id: string; name: string; type: string; risk: string;
  status: string; size: string; uploadedAt: string; uploadedBy: string;
  uploading?: boolean; progress?: number;
};

type Comment = {
  id: string; content: string; created_at: string;
  user?: { full_name: string };
  replies?: Comment[];
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

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="w-full h-1 rounded-full bg-[var(--border)] overflow-hidden">
      <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-300" style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  );
}

// ── Share Link Modal ──────────────────────────────────────────────────────────
function ShareModal({ doc, onClose }: { doc: Doc; onClose: () => void }) {
  const [password,  setPassword]  = useState("");
  const [days,      setDays]      = useState("7");
  const [maxViews,  setMaxViews]  = useState("");
  const [creating,  setCreating]  = useState(false);
  const [link,      setLink]      = useState<string | null>(null);
  const [copied,    setCopied]    = useState(false);
  const [links,     setLinks]     = useState<any[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(true);

  useEffect(() => {
    shareLinksApi.list().then(({ data }) => {
      const docLinks = (data || []).filter((l: any) => l.document_id === doc.id);
      setLinks(docLinks);
      setLoadingLinks(false);
    });
  }, [doc.id]);

  async function create() {
    setCreating(true);
    const { data, error } = await shareLinksApi.create({
      document_id: doc.id,
      password: password || undefined,
      expires_hours: parseInt(days || "7") * 24,
      max_views: maxViews ? parseInt(maxViews) : undefined,
    });
    setCreating(false);
    if (data?.share_url) {
      setLink(data.share_url);
      setLinks(prev => [data, ...prev]);
    }
  }

  function copyLink(url: string) {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function revoke(id: string) {
    await shareLinksApi.revoke(id);
    setLinks(prev => prev.filter(l => l.id !== id));
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <Share2 size={16} className="text-violet-400" />
            <h3 className="text-[var(--fg)] font-semibold text-sm">Share Document</h3>
          </div>
          <button onClick={onClose} className="text-[var(--fg-muted)] hover:text-[var(--fg)]"><X size={15} /></button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-[var(--fg-muted)] text-xs truncate">{doc.name}</p>

          {/* Create new link */}
          {!link ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[var(--fg-muted)] text-xs mb-1 block">Expires in (days)</label>
                  <select value={days} onChange={e => setDays(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--fg)] text-sm focus:outline-none">
                    {["1","3","7","14","30","90"].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[var(--fg-muted)] text-xs mb-1 block">Max views (optional)</label>
                  <input value={maxViews} onChange={e => setMaxViews(e.target.value)} type="number" min="1"
                    placeholder="Unlimited"
                    className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--fg)] text-sm focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-[var(--fg-muted)] text-xs mb-1 block flex items-center gap-1"><Lock size={10} /> Password protect (optional)</label>
                <input value={password} onChange={e => setPassword(e.target.value)} type="password"
                  placeholder="Leave blank for public link"
                  className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--fg)] text-sm focus:outline-none" />
              </div>
              <button onClick={create} disabled={creating}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                {creating ? <RefreshCw size={13} className="animate-spin" /> : <Link2 size={13} />}
                Create Share Link
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/30">
                <input readOnly value={link} className="flex-1 bg-transparent text-emerald-400 text-xs font-mono truncate" />
                <button onClick={() => copyLink(link)} className="flex-shrink-0 text-emerald-400 hover:text-emerald-300">
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                </button>
              </div>
              <button onClick={() => setLink(null)} className="text-[var(--fg-muted)] text-xs hover:text-[var(--fg)]">
                + Create another link
              </button>
            </div>
          )}

          {/* Existing links */}
          {links.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[var(--border)]">
              <p className="text-[var(--fg-muted)] text-xs font-medium uppercase tracking-wide">Active Links</p>
              {loadingLinks ? (
                <div className="flex items-center gap-2 text-[var(--fg-muted)] text-xs"><RefreshCw size={11} className="animate-spin" /> Loading…</div>
              ) : links.map(l => (
                <div key={l.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-[var(--border)]">
                  <Eye size={11} className="text-[var(--fg-muted)]" />
                  <span className="flex-1 text-xs text-[var(--fg-soft)] truncate font-mono">{l.token?.slice(0,16)}…</span>
                  <span className="text-[10px] text-[var(--fg-muted)]">{l.view_count ?? 0} views</span>
                  <button onClick={() => revoke(l.id)} className="text-rose-400 hover:text-rose-300"><X size={11} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Comments Panel ────────────────────────────────────────────────────────────
function CommentsPanel({ doc, onClose }: { doc: Doc; onClose: () => void }) {
  const [comments,  setComments]  = useState<Comment[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [newText,   setNewText]   = useState("");
  const [sending,   setSending]   = useState(false);
  const [replyTo,   setReplyTo]   = useState<string | null>(null);

  useEffect(() => {
    commentsApi.list(doc.id).then(({ data }) => {
      setComments(data || []);
      setLoading(false);
    });
  }, [doc.id]);

  async function send() {
    if (!newText.trim()) return;
    setSending(true);
    const { data } = await commentsApi.create(doc.id, newText.trim(), replyTo || undefined);
    if (data) {
      if (replyTo) {
        setComments(prev => prev.map(c => c.id === replyTo
          ? { ...c, replies: [...(c.replies || []), data] }
          : c
        ));
      } else {
        setComments(prev => [...prev, data]);
      }
      setNewText("");
      setReplyTo(null);
    }
    setSending(false);
  }

  async function deleteComment(id: string) {
    await commentsApi.remove(doc.id, id);
    setComments(prev => prev.filter(c => c.id !== id));
  }

  return (
    <div className="fixed inset-y-0 right-0 z-[150] w-80 border-l border-[var(--border)] bg-[var(--surface)] shadow-2xl flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <MessageSquare size={15} className="text-violet-400" />
          <h3 className="text-[var(--fg)] font-semibold text-sm">Comments</h3>
        </div>
        <button onClick={onClose} className="text-[var(--fg-muted)] hover:text-[var(--fg)]"><X size={15} /></button>
      </div>
      <p className="px-4 py-2 text-[var(--fg-muted)] text-xs border-b border-[var(--border)] truncate">{doc.name}</p>

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-[var(--fg-muted)]">
            <RefreshCw size={14} className="animate-spin" /> Loading…
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-[var(--fg-muted)] text-sm">No comments yet</div>
        ) : comments.map(c => (
          <div key={c.id} className="space-y-2">
            <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[var(--fg-soft)] text-xs font-semibold">{c.user?.full_name ?? "You"}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[var(--fg-muted)] text-[10px]">{new Date(c.created_at).toLocaleDateString()}</span>
                  <button onClick={() => deleteComment(c.id)} className="text-[var(--fg-muted)] hover:text-rose-400"><X size={11} /></button>
                </div>
              </div>
              <p className="text-[var(--fg-soft)] text-xs leading-relaxed">{c.content}</p>
              <button onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
                className="mt-1.5 text-[10px] text-violet-400 hover:text-violet-300">
                {replyTo === c.id ? "Cancel reply" : "Reply"}
              </button>
            </div>
            {/* Replies */}
            {c.replies?.map(r => (
              <div key={r.id} className="ml-4 p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] border-l-2 border-l-violet-500/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[var(--fg-soft)] text-xs font-semibold">{r.user?.full_name ?? "You"}</span>
                  <span className="text-[var(--fg-muted)] text-[10px]">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-[var(--fg-soft)] text-xs leading-relaxed">{r.content}</p>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[var(--border)] space-y-2">
        {replyTo && (
          <div className="flex items-center gap-1.5 text-[10px] text-violet-400">
            <span>Replying to comment</span>
            <button onClick={() => setReplyTo(null)} className="text-[var(--fg-muted)] hover:text-[var(--fg)]"><X size={10} /></button>
          </div>
        )}
        <div className="flex gap-2">
          <textarea value={newText} onChange={e => setNewText(e.target.value)}
            placeholder="Add a comment…" rows={2}
            onKeyDown={e => { if (e.key === "Enter" && e.metaKey) send(); }}
            className="flex-1 px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-[var(--fg)] text-xs resize-none focus:outline-none focus:border-violet-500/50" />
          <button onClick={send} disabled={sending || !newText.trim()}
            className="flex-shrink-0 self-end p-2.5 rounded-xl bg-violet-500 text-white hover:bg-violet-400 transition-all disabled:opacity-50">
            {sending ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
          </button>
        </div>
        <p className="text-[var(--fg-muted)] text-[10px]">⌘+Enter to send</p>
      </div>
    </div>
  );
}

// ── More-options dropdown ─────────────────────────────────────────────────────
function DocMenu({ doc, onDelete, onShare, onComment }: {
  doc: Doc; onDelete: (id: string) => void;
  onShare: (doc: Doc) => void; onComment: (doc: Doc) => void;
}) {
  const [open,        setOpen]       = useState(false);
  const [menuPos,     setMenuPos]    = useState({ top: 0, right: 0 });
  const [downloading, setDownloading] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setOpen(v => !v);
  };

  const handleDownload = async () => {
    setOpen(false); setDownloading(true);
    const { data } = await docsApi.getDownloadUrl(doc.id);
    if (data?.url) window.open(data.url, "_blank");
    setDownloading(false);
  };

  const handleDelete = async () => {
    setOpen(false);
    await docsApi.delete(doc.id);
    onDelete(doc.id);
  };

  const menu = open ? (
    <>
      <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)} />
      <div className="fixed z-[101] w-48 rounded-xl bg-[var(--bg-soft)] border border-[var(--border)] shadow-2xl py-1"
        style={{ top: menuPos.top, right: menuPos.right }}>
        <button onClick={handleDownload}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-[var(--fg-soft)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] transition-colors">
          <Download size={13} className="text-cyan-500" /> Download
        </button>
        <button onClick={() => { setOpen(false); onShare(doc); }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-[var(--fg-soft)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] transition-colors">
          <Share2 size={13} className="text-violet-400" /> Share link
        </button>
        <button onClick={() => { setOpen(false); onComment(doc); }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-[var(--fg-soft)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] transition-colors">
          <MessageSquare size={13} className="text-blue-400" /> Comments
        </button>
        <div className="h-px bg-[var(--border)] mx-2" />
        <button onClick={handleDelete}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-rose-500 hover:bg-rose-500/8 transition-colors">
          <Trash2 size={13} /> Delete document
        </button>
      </div>
    </>
  ) : null;

  return (
    <div>
      <button ref={btnRef} type="button" onClick={handleToggle}
        className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-all">
        {downloading ? <Clock size={14} className="animate-spin" /> : <MoreHorizontal size={14} />}
      </button>
      {typeof window !== "undefined" && menu && ReactDOM.createPortal(menu, document.body)}
    </div>
  );
}

// ── Bulk Action Bar ───────────────────────────────────────────────────────────
function BulkActionBar({ selected, onClear, onDelete, onTag }: {
  selected: Set<string>; onClear: () => void;
  onDelete: () => void; onTag: (tag: string) => void;
}) {
  const [tagInput, setTagInput] = useState("");
  const [showTag,  setShowTag]  = useState(false);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl bg-[var(--surface)] border border-violet-500/40 shadow-2xl shadow-violet-500/20">
      <span className="text-violet-400 text-sm font-semibold">{selected.size} selected</span>
      <div className="w-px h-5 bg-[var(--border)]" />

      {showTag ? (
        <div className="flex items-center gap-2">
          <input value={tagInput} onChange={e => setTagInput(e.target.value)}
            placeholder="Add tag…" autoFocus
            className="px-3 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--fg)] text-xs focus:outline-none focus:border-violet-500/50 w-32" />
          <button onClick={() => { onTag(tagInput); setTagInput(""); setShowTag(false); }}
            disabled={!tagInput.trim()}
            className="px-3 py-1.5 rounded-lg bg-violet-500 text-white text-xs font-semibold disabled:opacity-50">
            Apply
          </button>
          <button onClick={() => setShowTag(false)} className="text-[var(--fg-muted)] hover:text-[var(--fg)]"><X size={13} /></button>
        </div>
      ) : (
        <>
          <button onClick={() => setShowTag(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--fg-soft)] hover:text-violet-400 hover:border-violet-500/40 text-xs transition-all">
            <Tag size={12} /> Tag
          </button>
          <button onClick={onDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/8 text-xs transition-all">
            <Trash2 size={12} /> Delete ({selected.size})
          </button>
        </>
      )}

      <button onClick={onClear} className="text-[var(--fg-muted)] hover:text-[var(--fg)]"><X size={13} /></button>
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

  // Bulk selection
  const [selected,   setSelected]  = useState<Set<string>>(new Set());

  // Modals
  const [shareDoc,   setShareDoc]  = useState<Doc | null>(null);
  const [commentDoc, setCommentDoc] = useState<Doc | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    docsApi.list().then(({ data }) => {
      if (data) {
        setDocs(data.map((d: any) => ({
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
    setDocs(prev => prev.filter(d => d.id !== id));
    setSelected(prev => { const s = new Set(prev); s.delete(id); return s; });
  }, []);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(d => d.id)));
    }
  };

  const bulkDelete = async () => {
    const ids = Array.from(selected);
    await bulkApi.delete(ids);
    setDocs(prev => prev.filter(d => !selected.has(d.id)));
    setSelected(new Set());
  };

  const bulkTag = async (tag: string) => {
    const ids = Array.from(selected);
    await bulkApi.tag(ids, [tag]);
    setSelected(new Set());
  };

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files);
    for (const file of arr) {
      const entry = { name: file.name, pct: 0, done: false };
      setUploads(prev => [...prev, entry]);

      const { data, error } = await docsApi.upload(file, (pct) => {
        setUploads(prev => prev.map(u => u.name === file.name ? { ...u, pct } : u));
      });

      if (data) {
        setUploads(prev => prev.map(u => u.name === file.name ? { ...u, pct: 100, done: true } : u));
        setDocs(prev => [{
          id: data.id, name: data.name, type: data.type ?? "other",
          risk: data.risk_level ?? "low", status: "processing",
          size: `${Math.round((data.file_size ?? 0) / 1024)} KB`,
          uploadedAt: "just now", uploadedBy: "You",
        } as Doc, ...prev]);
      } else {
        setUploads(prev => prev.map(u => u.name === file.name ? { ...u, pct: 100, done: true, error: error ?? undefined } : u));
        setDocs(prev => [{
          id: `demo-${Date.now()}`, name: file.name, type: "other",
          risk: "low", status: "processing",
          size: `${Math.round(file.size / 1024)} KB`,
          uploadedAt: "just now", uploadedBy: "You",
        } as Doc, ...prev]);
      }
      setTimeout(() => setUploads(prev => prev.filter(u => u.name !== file.name)), 3000);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  }, [uploadFiles]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) uploadFiles(e.target.files);
    e.target.value = "";
  }, [uploadFiles]);

  const filtered = docs.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
    const matchType   = typeFilter === "all" || d.type === typeFilter;
    return matchSearch && matchType;
  });

  const allSelected = filtered.length > 0 && selected.size === filtered.length;

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)] flex-shrink-0">
            <FileText size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              <span className="gradient-text-brand">Documents</span>
            </h1>
            <p className="text-[var(--fg-muted)] text-sm mt-0.5">{docs.length} documents · AI-indexed & searchable</p>
          </div>
        </div>
        <button type="button" onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white text-sm font-bold transition-all shadow-[0_4px_16px_rgba(37,99,235,0.35)] hover:-translate-y-0.5 active:scale-95 btn-glow-blue relative overflow-hidden shine-hover">
          <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <Upload size={14} className="relative z-10" />
          <span className="relative z-10">Upload documents</span>
        </button>
        <input ref={fileRef} type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
          aria-label="Upload documents" title="Upload documents" className="hidden" onChange={onFileChange} />
      </div>

      {/* Drop zone */}
      <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
        onDrop={onDrop} onClick={() => fileRef.current?.click()}
        className={`mb-4 border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 cursor-pointer relative overflow-hidden group ${
          dragging ? "border-violet-500/60 bg-violet-500/8 scale-[1.01] shadow-[0_0_30px_rgba(124,58,237,0.15)]"
                   : "border-[var(--border)] bg-[var(--surface)] hover:border-violet-500/40 hover:bg-violet-500/4 hover:shadow-[0_0_20px_rgba(124,58,237,0.08)]"
        }`}>
        <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-all duration-300 ${dragging ? "bg-violet-500/20 border border-violet-500/40 scale-110" : "bg-[var(--surface-hover)] border border-[var(--border)] group-hover:bg-violet-500/10 group-hover:border-violet-500/30 group-hover:scale-105"}`}>
          <Upload size={28} className={`transition-colors ${dragging ? "text-violet-500" : "text-[var(--fg-muted)] group-hover:text-violet-400"}`} />
        </div>
        <p className={`text-sm font-semibold mb-1 transition-colors ${dragging ? "text-violet-400" : "text-[var(--fg-soft)] group-hover:text-[var(--fg)]"}`}>Drag &amp; drop documents here, or click to browse</p>
        <p className="text-[var(--fg-muted)] text-xs">PDF, Word, Excel, TXT — up to 50 MB each</p>
        {dragging && (
          <div className="absolute inset-0 border-2 border-violet-500/40 rounded-2xl animate-pulse pointer-events-none" />
        )}
      </div>

      {/* Upload progress */}
      {uploads.length > 0 && (
        <div className="mb-4 flex flex-col gap-2">
          {uploads.map(u => (
            <div key={u.name} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
              <FileText size={14} className="text-violet-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[var(--fg-soft)] truncate">{u.name}</p>
                {!u.done && <ProgressBar pct={u.pct} />}
              </div>
              {u.done && !u.error && <Check size={14} className="text-emerald-500 flex-shrink-0" />}
              {u.done && u.error  && <X size={14} className="text-amber-500 flex-shrink-0" />}
              {!u.done && <span className="text-[10px] text-[var(--fg-muted)] flex-shrink-0">{u.pct}%</span>}
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents…"
            className="w-full pl-9 pr-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--fg)] placeholder-[var(--fg-muted)] text-sm focus:outline-none focus:border-violet-500/50 transition-all" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-[var(--fg-muted)]" />
          {["all","contract","invoice","tax_document","compliance","hr_document"].map(t => (
            <button key={t} type="button" onClick={() => setType(t)}
              className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                typeFilter === t
                  ? "bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold shadow-lg shadow-blue-500/25"
                  : "bg-[var(--surface)] border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-blue-500/30"
              }`}>
              {t === "all" ? "All" : t.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Document table */}
      <div className="rounded-2xl border border-[var(--border)] overflow-hidden bg-[var(--surface)]">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-[var(--bg-muted)] border-b border-[var(--border)] text-[var(--fg-muted)] text-xs uppercase tracking-wide font-semibold">
          <div className="col-span-1 flex items-center">
            <button onClick={toggleAll} className="text-[var(--fg-muted)] hover:text-violet-400 transition-colors">
              {allSelected ? <CheckSquare size={14} className="text-violet-400" /> : <Square size={14} />}
            </button>
          </div>
          <div className="col-span-4">Name</div>
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
            className={`grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-[var(--bg-soft)] transition-all group ${
              selected.has(doc.id) ? "bg-violet-500/5" : ""
            } ${i < filtered.length - 1 ? "border-b border-[var(--border)]" : ""}`}>

            <div className="col-span-1">
              <button onClick={() => toggleSelect(doc.id)} className="text-[var(--fg-muted)] hover:text-violet-400 transition-colors">
                {selected.has(doc.id) ? <CheckSquare size={14} className="text-violet-400" /> : <Square size={14} />}
              </button>
            </div>

            <div className="col-span-4 flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[var(--surface-hover)] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <FileText size={14} className="text-[var(--fg-muted)] group-hover:text-violet-500 transition-colors" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[var(--fg-soft)] text-sm font-medium truncate">{doc.name}</p>
                <p className="text-[var(--fg-muted)] text-[11px] mt-0.5">{doc.uploadedAt} · {doc.uploadedBy}</p>
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
              <DocMenu doc={doc} onDelete={handleDelete} onShare={setShareDoc} onComment={setCommentDoc} />
            </div>
          </div>
        ))}

        {!loading && filtered.length === 0 && (
          <div className="py-16 text-center text-[var(--fg-muted)] text-sm">
            {search ? `No documents match "${search}".` : "No documents yet — upload your first one above."}
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <BulkActionBar
          selected={selected}
          onClear={() => setSelected(new Set())}
          onDelete={bulkDelete}
          onTag={bulkTag}
        />
      )}

      {/* Share modal */}
      {shareDoc && <ShareModal doc={shareDoc} onClose={() => setShareDoc(null)} />}

      {/* Comments panel */}
      {commentDoc && <CommentsPanel doc={commentDoc} onClose={() => setCommentDoc(null)} />}
    </div>
  );
}
