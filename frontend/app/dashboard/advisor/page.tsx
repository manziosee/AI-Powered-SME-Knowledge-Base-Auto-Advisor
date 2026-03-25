"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Brain, Plus, Clock, ChevronRight } from "lucide-react";
import { CHAT_SESSIONS } from "@/lib/mock-data";
// Simple markdown — inline render without extra dep
function Message({ role, content }: { role: string; content: string }) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-white/10 text-white/80 text-sm px-4 py-3 rounded-2xl rounded-tr-sm max-w-lg leading-relaxed">
          {content}
        </div>
      </div>
    );
  }
  // Format assistant message: bold **text**, bullet points
  const formatted = content
    .split("\n")
    .map((line, i) => {
      const boldLine = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      if (line.startsWith("- ")) {
        return <li key={i} className="ml-4 list-disc" dangerouslySetInnerHTML={{ __html: boldLine.slice(2) }} />;
      }
      if (line.startsWith("**") && line.endsWith("**")) {
        return <p key={i} className="font-semibold text-white/90 mt-2" dangerouslySetInnerHTML={{ __html: boldLine }} />;
      }
      if (line === "") return <div key={i} className="h-1" />;
      return <p key={i} dangerouslySetInnerHTML={{ __html: boldLine }} />;
    });

  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-violet-500/15 border border-violet-500/25 flex items-center justify-center flex-shrink-0 mt-1">
        <Brain size={14} className="text-violet-400" />
      </div>
      <div className="bg-violet-500/5 border border-violet-500/15 text-white/70 text-sm px-4 py-3 rounded-2xl rounded-tl-sm max-w-2xl leading-relaxed flex flex-col gap-1">
        {formatted}
      </div>
    </div>
  );
}

export default function AdvisorPage() {
  const [activeSession, setActiveSession] = useState(CHAT_SESSIONS[0]);
  const [messages, setMessages] = useState(CHAT_SESSIONS[0].messages);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const CANNED_RESPONSE = "I've searched through your documents and compliance database. Based on the information available, here's what I found:\n\n**Summary:**\nYour question relates to several documents in your knowledge base. The most relevant entries have been identified and cross-referenced with your compliance rules.\n\n- Relevant document found and indexed\n- Compliance rules checked for your jurisdiction\n- Risk level assessed: **Medium**\n\n**Recommendation:** Review the referenced documents and ensure all deadlines are tracked in your compliance calendar.\n\n*Source: AdvisorAI RAG Pipeline — 3 documents referenced*";

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000));
    setTyping(false);
    setMessages((prev) => [...prev, { role: "assistant", content: CANNED_RESPONSE }]);
  };

  const selectSession = (s: typeof CHAT_SESSIONS[0]) => {
    setActiveSession(s);
    setMessages(s.messages);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar — sessions */}
      <div className="w-64 border-r border-white/8 flex flex-col bg-ink-soft">
        <div className="p-4 border-b border-white/8 flex items-center justify-between">
          <h2 className="text-white/70 font-semibold text-sm">Conversations</h2>
          <button
            type="button"
            title="New conversation"
            aria-label="New conversation"
            onClick={() => { setMessages([]); setActiveSession({ id: "new", title: "New chat", updatedAt: "now", messages: [] }); }}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-all"
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          {CHAT_SESSIONS.map((s) => (
            <button key={s.id} type="button" onClick={() => selectSession(s)}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition-all group ${
                activeSession.id === s.id ? "bg-violet-500/12 border border-violet-500/25 text-violet-300" : "hover:bg-white/4"
              }`}>
              <p className="text-white/70 text-xs font-medium truncate">{s.title}</p>
              <div className="flex items-center gap-1 mt-0.5 text-white/25 text-[10px]">
                <Clock size={9} /> {s.updatedAt}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain size={16} className="text-violet-400" />
            <span className="text-white/70 text-sm font-medium">{activeSession.title}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400/70">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow shadow-[0_0_6px_#34d399]" />
            AI Online
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(167,139,250,0.1)]">
                <Brain size={28} className="text-violet-400" />
              </div>
              <h3 className="text-white/50 font-semibold mb-2">Ask anything about your business</h3>
              <p className="text-white/25 text-sm max-w-sm">
                I can search your documents, check compliance deadlines, score risks, and answer in plain English.
              </p>
              <div className="grid grid-cols-2 gap-2 mt-6 w-full max-w-sm">
                {[
                  "What deadlines are coming up?",
                  "Summarise the CloudFirst contract",
                  "What are our GDPR obligations?",
                  "Check our tax compliance status",
                ].map((s) => (
                  <button key={s} type="button" onClick={() => setInput(s)}
                    className="text-left px-3 py-2.5 rounded-xl bg-violet-500/5 border border-violet-500/15 hover:border-violet-500/35 hover:bg-violet-500/10 transition-all text-white/60 hover:text-white text-xs">
                    {s} <ChevronRight size={10} className="inline ml-1 opacity-50" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <Message key={i} role={m.role} content={m.content} />
          ))}

          {typing && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-500/15 border border-violet-500/25 flex items-center justify-center flex-shrink-0">
                <Brain size={14} className="text-violet-400" />
              </div>
              <div className="bg-violet-500/5 border border-violet-500/15 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse-slow [animation-delay:0ms]"   />
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse-slow [animation-delay:150ms]" />
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400   animate-pulse-slow [animation-delay:300ms]" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-white/8">
          <div className="flex items-end gap-3 bg-white/3 border border-white/10 rounded-2xl p-3 focus-within:border-violet-500/40 transition-all">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Ask anything about your documents, deadlines, risks…"
              rows={1}
              className="flex-1 bg-transparent text-white/80 placeholder-white/25 text-sm focus:outline-none resize-none"
            />
            <button
              type="button"
              title="Send message"
              aria-label="Send message"
              onClick={handleSend}
              disabled={!input.trim() || typing}
              className="p-2 rounded-xl bg-violet-500 text-white hover:bg-violet-400 transition-all disabled:opacity-30 flex-shrink-0 shadow-[0_0_12px_rgba(167,139,250,0.4)]"
            >
              <Send size={15} />
            </button>
          </div>
          <p className="text-white/15 text-[10px] text-center mt-2">
            AdvisorAI uses RAG — answers are grounded in your documents. Always verify important decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
