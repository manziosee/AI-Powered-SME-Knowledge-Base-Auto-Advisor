"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Send, Brain, Plus, Clock, Sparkles,
  FileText, Shield, Search, Zap, BookOpen, Trash2,
  ThumbsUp, ThumbsDown, Eraser, ChevronDown, ChevronUp, ExternalLink,
} from "lucide-react";
import { advisor as advisorApi, chatbot as chatbotApi, analytics } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Source { id?: string; title: string; documentId?: string }
interface Msg {
  role: "user" | "assistant";
  content: string;
  id?: string;
  sources?: Source[];
}
interface Session { id: string; title: string; updatedAt: string; messages: Msg[] }

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-emerald-500 text-white text-sm font-semibold shadow-xl shadow-emerald-500/30 animate-in slide-in-from-bottom-3 fade-in-50">
      {message}
    </div>
  );
}

// ── Message renderer ──────────────────────────────────────────────────────────
function Message({
  role, content, id, sources, sessionId, onRate,
}: Msg & { sessionId: string; onRate: (msgId: string, rating: number) => void }) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [rated, setRated] = useState<number | null>(null);

  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-violet-500 text-white text-sm px-4 py-3 rounded-2xl rounded-tr-sm max-w-lg leading-relaxed shadow-lg shadow-violet-500/20">
          {content}
        </div>
      </div>
    );
  }

  const formatted = content.split("\n").map((line, i) => {
    const bold = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    if (line.startsWith("- ")) {
      return (
        <li key={i} className="ml-4 list-none flex items-start gap-2 my-0.5">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
          <span dangerouslySetInnerHTML={{ __html: bold.slice(2) }} />
        </li>
      );
    }
    if (line.startsWith("**") && line.endsWith("**")) {
      return <p key={i} className="font-semibold text-[var(--fg)] mt-3 mb-1" dangerouslySetInnerHTML={{ __html: bold }} />;
    }
    if (line.startsWith("*") && line.endsWith("*")) {
      return <p key={i} className="text-[var(--fg-muted)] text-xs italic mt-2 pt-2 border-t border-[var(--border)]" dangerouslySetInnerHTML={{ __html: bold }} />;
    }
    if (line === "") return <div key={i} className="h-1" />;
    return <p key={i} dangerouslySetInnerHTML={{ __html: bold }} />;
  });

  const handleRate = (rating: number) => {
    if (!id || rated !== null) return;
    setRated(rating);
    onRate(id, rating);
  };

  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0 mt-1 shadow-[0_0_10px_rgba(167,139,250,0.15)]">
        <Brain size={14} className="text-violet-400" />
      </div>
      <div className="flex flex-col gap-1 max-w-2xl flex-1">
        <div className="bg-[var(--bg-soft)] border border-[var(--border)] text-[var(--fg-soft)] text-sm px-4 py-3 rounded-2xl rounded-tl-sm leading-relaxed flex flex-col gap-0.5 shadow-sm">
          {formatted}
        </div>

        {/* Sources */}
        {sources && sources.length > 0 && (
          <div className="ml-0.5">
            <button
              type="button"
              onClick={() => setSourcesOpen((v) => !v)}
              className="flex items-center gap-1.5 text-[10px] text-[var(--fg-muted)] hover:text-violet-500 transition-colors py-1"
            >
              {sourcesOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              {sources.length} source{sources.length !== 1 ? "s" : ""}
            </button>
            {sourcesOpen && (
              <div className="flex flex-col gap-1 mt-0.5">
                {sources.map((s, i) => (
                  <a
                    key={i}
                    href={s.documentId ? `/dashboard/documents?highlight=${s.documentId}` : "/dashboard/documents"}
                    className="flex items-center gap-1.5 text-[11px] text-violet-500 hover:text-violet-400 transition-colors px-2 py-1 rounded-lg hover:bg-violet-500/8"
                  >
                    <FileText size={11} />
                    {s.title}
                    <ExternalLink size={9} className="opacity-60" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Thumbs */}
        {id && (
          <div className="flex items-center gap-1 ml-0.5">
            <button
              type="button"
              title="Helpful"
              onClick={() => handleRate(1)}
              className={`p-1.5 rounded-lg transition-all ${rated === 1 ? "text-emerald-500 bg-emerald-500/10" : "text-[var(--fg-muted)] hover:text-emerald-500 hover:bg-emerald-500/8"}`}
            >
              <ThumbsUp size={12} />
            </button>
            <button
              type="button"
              title="Not helpful"
              onClick={() => handleRate(-1)}
              className={`p-1.5 rounded-lg transition-all ${rated === -1 ? "text-rose-500 bg-rose-500/10" : "text-[var(--fg-muted)] hover:text-rose-500 hover:bg-rose-500/8"}`}
            >
              <ThumbsDown size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Suggested prompt chips ────────────────────────────────────────────────────
const PROMPTS = [
  { icon: Clock,    text: "What deadlines are coming up?",      color: "text-amber-500",  bg: "bg-amber-500/8  border-amber-500/20"  },
  { icon: FileText, text: "Summarise the CloudFirst contract",   color: "text-blue-500",   bg: "bg-blue-500/8   border-blue-500/20"   },
  { icon: Shield,   text: "What are our GDPR obligations?",      color: "text-violet-500", bg: "bg-violet-500/8 border-violet-500/20" },
  { icon: Search,   text: "Check our tax compliance status",     color: "text-cyan-500",   bg: "bg-cyan-500/8   border-cyan-500/20"   },
  { icon: Zap,      text: "Identify top compliance gaps",        color: "text-rose-500",   bg: "bg-rose-500/8   border-rose-500/20"   },
  { icon: BookOpen, text: "Explain RDB licensing requirements",  color: "text-emerald-500",bg: "bg-emerald-500/8 border-emerald-500/20"},
];


// ── Streaming helper ──────────────────────────────────────────────────────────
async function streamAnswer(
  question: string,
  setMessages: React.Dispatch<React.SetStateAction<Msg[]>>,
): Promise<string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const url = `${baseUrl}/api/v1/advisor/stream?q=${encodeURIComponent(question)}`;

  let fullText = "";
  try {
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok || !response.body) throw new Error("stream failed");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
      for (const line of lines) {
        const data = line.slice(6);
        if (data === "[DONE]") break;
        try {
          const parsed = JSON.parse(data);
          if (parsed.token) {
            fullText += parsed.token;
            setMessages((prev) => {
              const updated = [...prev];
              const lastIdx = updated.length - 1;
              if (updated[lastIdx]?.role === "assistant") {
                updated[lastIdx] = { ...updated[lastIdx], content: fullText };
              }
              return updated;
            });
          }
        } catch { /* ignore parse errors */ }
      }
    }
  } catch {
    return ""; // signal fallback needed
  }
  return fullText;
}

// ── Page ──────────────────────────────────────────────────────────────────────
const INIT_SESSION: Session = { id: "init", title: "New chat", updatedAt: "now", messages: [] };

export default function AdvisorPage() {
  const [sessions,       setSessions]       = useState<Session[]>([INIT_SESSION]);
  const [activeSession,  setActiveSession]  = useState<Session>(INIT_SESSION);
  const [messages,       setMessages]       = useState<Msg[]>([]);
  const [input,          setInput]          = useState("");
  const [typing,         setTyping]         = useState(false);
  const [toast,          setToast]          = useState<string | null>(null);
  const [sidebarStats,   setSidebarStats]   = useState({ docs: 0, entries: 0 });
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // Load sessions + sidebar stats on mount
  useEffect(() => {
    chatbotApi.sessions().then(({ data }) => {
      if (data && data.length > 0) {
        const loaded: Session[] = data.map((s) => ({
          id: s.id,
          title: s.title,
          updatedAt: s.updated_at,
          messages: [],
        }));
        setSessions(loaded);
        setActiveSession(loaded[0]);
        chatbotApi.getSession(loaded[0].id).then(({ data: sd }) => {
          if (sd?.messages) setMessages(sd.messages as Msg[]);
        });
      }
    });

    analytics.overview().then(({ data }) => {
      if (data) {
        setSidebarStats({
          docs:    data.documents.total,
          entries: data.knowledge_entries.total,
        });
      }
    });
  }, []);

  const createNewSession = useCallback(async () => {
    const { data } = await chatbotApi.createSession();
    const newS: Session = data
      ? { id: data.id, title: "New chat", updatedAt: "now", messages: [] }
      : { id: `local-${Date.now()}`, title: "New chat", updatedAt: "now", messages: [] };
    setSessions((prev) => [newS, ...prev]);
    setActiveSession(newS);
    setMessages([]);
  }, []);

  const selectSession = useCallback(async (s: Session) => {
    setActiveSession(s);
    // Never call the API for synthetic/local sessions — "init" is not a real UUID
    if (s.id === "init" || s.id.startsWith("local-")) {
      setMessages([]);
      return;
    }
    if (s.messages.length > 0) {
      setMessages(s.messages);
      return;
    }
    const { data } = await chatbotApi.getSession(s.id);
    const msgs = (data?.messages ?? []) as Msg[];
    setMessages(msgs);
    setSessions((prev) => prev.map((p) => p.id === s.id ? { ...p, messages: msgs } : p));
  }, []);

  const deleteSession = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await chatbotApi.deleteSession(id);
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (activeSession.id === id) {
        const fallback = next[0] ?? INIT_SESSION;
        setActiveSession(fallback);
        setMessages(fallback.messages);
      }
      return next.length > 0 ? next : [INIT_SESSION];
    });
  }, [activeSession.id]);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setSessions((prev) =>
      prev.map((s) => s.id === activeSession.id ? { ...s, messages: [] } : s)
    );
  }, [activeSession.id]);

  const handleRate = useCallback(async (msgId: string, rating: number) => {
    await chatbotApi.rateMessage(activeSession.id, msgId, rating);
    setToast("Thanks for the feedback!");
  }, [activeSession.id]);

  const handleSend = useCallback(async () => {
    const q = input.trim();
    if (!q) return;

    const userMsg: Msg = { role: "user", content: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    // Update session title from first message
    if (messages.length === 0) {
      const title = q.length > 40 ? q.slice(0, 40) + "…" : q;
      setSessions((prev) => prev.map((s) => s.id === activeSession.id ? { ...s, title } : s));
      setActiveSession((prev) => ({ ...prev, title }));
    }

    let answer = "";
    let currentSessionId = activeSession.id;

    // Create session on backend if needed
    if (activeSession.id.startsWith("local-") || activeSession.id === "init") {
      const { data: newS } = await chatbotApi.createSession(activeSession.id === "init" ? q.slice(0, 40) : undefined);
      if (newS) {
        currentSessionId = newS.id;
        setActiveSession((prev) => ({ ...prev, id: newS.id }));
      }
    }

    // Try streaming first for real sessions
    if (!currentSessionId.startsWith("local-") && currentSessionId !== "init") {
      // Add empty assistant message placeholder for streaming
      const streamingMsg: Msg = { role: "assistant", content: "", id: `streaming-${Date.now()}` };
      setMessages((prev) => [...prev, streamingMsg]);
      setTyping(false);

      answer = await streamAnswer(q, setMessages);
    }

    // If streaming failed or session was local, fall back to chatbot API
    if (!answer) {
      // Remove streaming placeholder if it exists
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.content === "") {
          return prev.slice(0, -1);
        }
        return prev;
      });
      setTyping(true);

      const { data: resp } = await chatbotApi.sendMessage(currentSessionId, q);
      answer = resp?.message?.content ?? "";
    }

    // If chatbot failed, fall back to advisor ask endpoint
    if (!answer) {
      const { data: aResp, error: aErr } = await advisorApi.ask(q);
      answer = aResp?.answer ?? "";
      if (!answer && aErr) {
        answer = `Sorry, I couldn't process your request: ${aErr}`;
      }
    }

    if (!answer) {
      answer = "The AI service is temporarily unavailable. Please check your connection and try again. If documents are still processing, answers will improve once they are indexed.";
    }

    setTyping(false);

    // Only add a new message if streaming didn't already put it there
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      // If last message is assistant with content (from streaming), update it; otherwise add new
      if (last?.role === "assistant" && last.content && last.content === answer) {
        return prev; // streaming already finished with this content
      }
      if (last?.role === "assistant" && last.content === "") {
        // Replace empty placeholder
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: answer,
          id: `msg-${Date.now()}`,
        };
        return updated;
      }
      if (last?.role === "user") {
        // Normal fallback path — append assistant message
        return [...prev, { role: "assistant", content: answer, id: `msg-${Date.now()}` }];
      }
      return prev;
    });

    const aiMsg: Msg = { role: "assistant", content: answer };
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession.id
          ? { ...s, updatedAt: "just now", messages: [...s.messages, userMsg, aiMsg] }
          : s
      )
    );
  }, [input, messages, activeSession]);

  return (
    <div className="flex h-full overflow-hidden">
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      {/* ── Sidebar ── */}
      <div className="w-60 border-r border-[var(--border)] flex flex-col bg-[var(--bg-soft)] flex-shrink-0">
        <div className="p-4 border-b border-[var(--border)]">
          <div className="flex items-center justify-between mb-3">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-6 h-6 rounded-lg bg-violet-500/15 flex items-center justify-center">
                <Brain size={12} className="text-violet-500" />
              </div>
              <span className="text-[var(--fg)] font-semibold text-xs">AdvisorAI</span>
            </Link>
            <button
              type="button"
              title="New conversation"
              aria-label="New conversation"
              onClick={createNewSession}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-violet-500/10 text-[var(--fg-muted)] hover:text-violet-500 transition-all"
            >
              <Plus size={13} />
            </button>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/8 border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_#34d399]" />
            <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">RAG Pipeline Active</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          <p className="px-2 py-1 text-[var(--fg-muted)] text-[10px] uppercase tracking-widest font-semibold">Sessions</p>
          {sessions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => selectSession(s)}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition-all group relative ${
                activeSession.id === s.id
                  ? "bg-gradient-to-r from-violet-500/12 to-violet-500/5 border border-violet-500/25"
                  : "hover:bg-[var(--surface-hover)] border border-transparent"
              }`}
            >
              <p className={`text-xs font-medium truncate pr-5 ${
                activeSession.id === s.id ? "text-violet-600 dark:text-violet-300" : "text-[var(--fg-soft)]"
              }`}>{s.title}</p>
              <div className="flex items-center gap-1 mt-0.5 text-[var(--fg-muted)] text-[10px]">
                <Clock size={8} /> {s.updatedAt}
              </div>
              {s.id !== "init" && (
                <button
                  type="button"
                  title="Delete session"
                  aria-label="Delete session"
                  onClick={(e) => deleteSession(s.id, e)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-rose-500/10 text-[var(--fg-muted)] hover:text-rose-500 transition-all"
                >
                  <Trash2 size={11} />
                </button>
              )}
            </button>
          ))}
        </div>

        <div className="p-3 border-t border-[var(--border)]">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Docs",    value: sidebarStats.docs    > 0 ? sidebarStats.docs.toLocaleString()    : "—", color: "text-cyan-500"   },
              { label: "Entries", value: sidebarStats.entries > 0 ? sidebarStats.entries.toLocaleString() : "—", color: "text-violet-500" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-[var(--surface)] rounded-xl p-2.5 text-center border border-[var(--border)]">
                <p className={`text-sm font-black ${color}`}>{value}</p>
                <p className="text-[var(--fg-muted)] text-[10px]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main chat ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg)]">

        {/* Header */}
        <div className="px-6 py-3.5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-soft)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/15 to-cyan-500/10 border border-violet-500/25 flex items-center justify-center">
              <Brain size={15} className="text-violet-500" />
            </div>
            <div>
              <p className="text-[var(--fg)] text-sm font-semibold leading-none">{activeSession.title}</p>
              <p className="text-[var(--fg-muted)] text-[10px] mt-0.5">Powered by Groq Llama 3.3 · RAG</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Clear conversation */}
            {messages.length > 0 && (
              <button
                type="button"
                title="Clear conversation"
                aria-label="Clear conversation"
                onClick={clearConversation}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-[var(--fg-muted)] hover:text-rose-500 hover:border-rose-500/30 hover:bg-rose-500/5 text-xs transition-all"
              >
                <Eraser size={12} /> Clear
              </button>
            )}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-medium">AI Online</span>
            </div>
            <div className="flex items-center gap-1 text-[var(--fg-muted)] text-[10px]">
              <Sparkles size={10} className="text-violet-400" />
              <span>
                {sidebarStats.docs > 0
                  ? `${sidebarStats.docs.toLocaleString()} docs indexed`
                  : "Indexing your documents"}
              </span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center py-12">
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-[0_0_50px_rgba(124,58,237,0.35)]">
                  <Brain size={38} className="text-white" />
                </div>
                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_12px_#34d399] border-2 border-[var(--bg)]">
                  <span className="text-white text-[8px] font-black">ON</span>
                </div>
                {/* Orbit ring */}
                <div className="absolute inset-0 -m-4 rounded-full border border-violet-500/20 animate-ping opacity-30 pointer-events-none" />
              </div>
              <h3 className="text-[var(--fg)] font-black text-xl mb-2">Ask AdvisorAI anything</h3>
              <p className="text-[var(--fg-muted)] text-sm max-w-sm text-center mb-8 leading-relaxed">
                Search your documents, check compliance, score risks — all in plain English. Powered by Groq Llama 3.3 · RAG.
              </p>
              <div className="grid grid-cols-2 gap-2.5 w-full max-w-md">
                {PROMPTS.map(({ icon: Icon, text, color, bg }) => (
                  <button
                    key={text}
                    type="button"
                    onClick={() => setInput(text)}
                    className={`group text-left px-3.5 py-3 rounded-2xl border ${bg} hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 hover:shadow-md`}
                  >
                    <Icon size={14} className={`${color} mb-1.5 group-hover:scale-110 transition-transform`} />
                    <p className="text-[var(--fg-soft)] text-xs leading-snug group-hover:text-[var(--fg)] transition-colors">{text}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <Message
              key={m.id ?? i}
              role={m.role}
              content={m.content}
              id={m.id}
              sources={m.sources}
              sessionId={activeSession.id}
              onRate={handleRate}
            />
          ))}

          {typing && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                <Brain size={14} className="text-violet-400" />
              </div>
              <div className="bg-[var(--bg-soft)] border border-[var(--border)] px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5 shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse delay-dot-1" />
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse delay-dot-2" />
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400   animate-pulse delay-dot-3" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--bg-soft)]">
          <div className="flex items-end gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-3 focus-within:border-violet-500/50 focus-within:shadow-[0_0_0_3px_rgba(167,139,250,0.08)] transition-all">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Ask anything about your documents, deadlines, risks…"
              rows={1}
              className="flex-1 bg-transparent text-[var(--fg)] placeholder-[var(--fg-muted)] text-sm focus:outline-none resize-none"
            />
            <button
              type="button"
              title="Send message"
              aria-label="Send message"
              onClick={handleSend}
              disabled={!input.trim() || typing}
              className="p-2.5 rounded-xl bg-violet-500 text-white hover:bg-violet-400 active:scale-95 transition-all disabled:opacity-30 flex-shrink-0 shadow-[0_0_14px_rgba(167,139,250,0.35)]"
            >
              <Send size={14} />
            </button>
          </div>
          <p className="text-[var(--fg-muted)] text-[10px] text-center mt-2 opacity-50">
            Answers are grounded in your documents via RAG. Always verify important decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
