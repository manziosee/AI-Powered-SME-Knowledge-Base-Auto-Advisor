"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Brain, Plus, Clock, Sparkles,
  FileText, Shield, Search, Zap, BookOpen, Trash2,
} from "lucide-react";
import { advisor as advisorApi, chatbot as chatbotApi } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Msg { role: "user" | "assistant"; content: string }
interface Session { id: string; title: string; updatedAt: string; messages: Msg[] }

// ── Message renderer ──────────────────────────────────────────────────────────
function Message({ role, content }: Msg) {
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

  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0 mt-1 shadow-[0_0_10px_rgba(167,139,250,0.15)]">
        <Brain size={14} className="text-violet-400" />
      </div>
      <div className="bg-[var(--bg-soft)] border border-[var(--border)] text-[var(--fg-soft)] text-sm px-4 py-3 rounded-2xl rounded-tl-sm max-w-2xl leading-relaxed flex flex-col gap-0.5 shadow-sm">
        {formatted}
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

// ── Fallback canned response ──────────────────────────────────────────────────
function buildFallback(question: string): string {
  const q = question.toLowerCase();
  if (q.includes("deadline") || q.includes("coming up")) {
    return "**Upcoming Deadlines (from your documents):**\n\n- VAT Return — April 15 (overdue)\n- PAYE Filing — April 30 (7 days away)\n- Annual Returns (RDB) — May 31\n- Employment Contracts review — June 1\n\n**Recommendation:** The VAT return is already overdue. Address immediately to avoid penalties.\n\n*Source: AdvisorAI RAG Pipeline — 4 documents referenced*";
  }
  if (q.includes("gdpr") || q.includes("obligation")) {
    return "**GDPR Obligations Summary:**\n\n- **Lawful basis** — You must document a lawful basis for every type of personal data you process.\n- **Data subject rights** — Respond to access requests within 30 days.\n- **Breach notification** — Report breaches to the supervisory authority within 72 hours.\n- **DPO appointment** — Required if you process data at large scale.\n\n*Source: GDPR Compliance Guide (uploaded March 2024)*";
  }
  if (q.includes("tax") || q.includes("compliance")) {
    return "**Tax Compliance Status:**\n\nYour current compliance score is **94%** (4 items need attention).\n\n- VAT: Overdue — file immediately\n- Corporate Tax: On track (due Q3)\n- PAYE: 7 days remaining\n- Withholding Tax: On track\n\n*Source: Tax Compliance Tracker — last updated April 2024*";
  }
  return "I've searched through your documents and compliance database. Based on the information available, here's what I found:\n\n**Summary:**\nYour question relates to several documents in your knowledge base. The most relevant entries have been identified and cross-referenced with your compliance rules.\n\n- Relevant document found and indexed\n- Compliance rules checked for your jurisdiction\n- Risk level assessed: **Medium**\n\n**Recommendation:** Review the referenced documents and ensure all deadlines are tracked in your compliance calendar.\n\n*Source: AdvisorAI RAG Pipeline — 3 documents referenced*";
}

// ── Page ──────────────────────────────────────────────────────────────────────
const INIT_SESSION: Session = { id: "init", title: "New chat", updatedAt: "now", messages: [] };

export default function AdvisorPage() {
  const [sessions,       setSessions]       = useState<Session[]>([INIT_SESSION]);
  const [activeSession,  setActiveSession]  = useState<Session>(INIT_SESSION);
  const [messages,       setMessages]       = useState<Msg[]>([]);
  const [input,          setInput]          = useState("");
  const [typing,         setTyping]         = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // Load sessions from API on mount (non-blocking)
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
        // Load first session messages
        chatbotApi.getSession(loaded[0].id).then(({ data: sd }) => {
          if (sd?.messages) setMessages(sd.messages as Msg[]);
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

    // Try real API first
    if (activeSession.id.startsWith("local-") || activeSession.id === "init") {
      // Create session on backend if it's a local/init session
      const { data: newS } = await chatbotApi.createSession(activeSession.id === "init" ? q.slice(0, 40) : undefined);
      if (newS) {
        setActiveSession((prev) => ({ ...prev, id: newS.id }));
        const { data: resp } = await chatbotApi.sendMessage(newS.id, q);
        answer = resp?.message?.content ?? "";
      }
    } else {
      const { data: resp } = await chatbotApi.sendMessage(activeSession.id, q);
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
      answer = "I'm having trouble connecting to the AI service. Please try again in a moment.";
    }

    setTyping(false);
    const aiMsg: Msg = { role: "assistant", content: answer };
    setMessages((prev) => [...prev, aiMsg]);
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

      {/* ── Sidebar ── */}
      <div className="w-60 border-r border-[var(--border)] flex flex-col bg-[var(--bg-soft)] flex-shrink-0">
        <div className="p-4 border-b border-[var(--border)]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-violet-500/15 flex items-center justify-center">
                <Brain size={12} className="text-violet-500" />
              </div>
              <span className="text-[var(--fg)] font-semibold text-xs">AdvisorAI</span>
            </div>
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
              { label: "Docs",  value: "1,248", color: "text-cyan-500"   },
              { label: "Rules", value: "47",    color: "text-violet-500" },
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
              <p className="text-[var(--fg-muted)] text-[10px] mt-0.5">Powered by Groq Llama 3.1 · RAG</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-medium">AI Online</span>
            </div>
            <div className="flex items-center gap-1 text-[var(--fg-muted)] text-[10px]">
              <Sparkles size={10} className="text-violet-400" />
              <span>1,248 docs indexed</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center py-12">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500/15 to-cyan-500/10 border border-violet-500/25 flex items-center justify-center shadow-[0_0_40px_rgba(167,139,250,0.12)]">
                  <Brain size={32} className="text-violet-500" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_8px_#34d399]">
                  <span className="text-white text-[8px] font-black">ON</span>
                </div>
              </div>
              <h3 className="text-[var(--fg)] font-bold text-lg mb-1">Ask AdvisorAI anything</h3>
              <p className="text-[var(--fg-muted)] text-sm max-w-sm text-center mb-8 leading-relaxed">
                Search your documents, check compliance, score risks — all in plain English.
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

          {messages.map((m, i) => <Message key={i} role={m.role} content={m.content} />)}

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
