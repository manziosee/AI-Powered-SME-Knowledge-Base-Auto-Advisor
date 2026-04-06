"use client";

import React, { useState } from "react";
import {
  HelpCircle, Search, BookOpen, MessageSquare, FileText, Shield,
  Brain, Zap, ChevronDown, ChevronRight, ExternalLink, Mail,
  CheckCircle, AlertTriangle, Clock, ArrowRight,
} from "lucide-react";

// ── FAQ data ──────────────────────────────────────────────────────────────────
const FAQ_CATEGORIES = [
  {
    id: "getting-started",
    icon: Zap,
    color: "text-amber-500",
    bg: "bg-amber-500/10 border-amber-500/25",
    label: "Getting Started",
    faqs: [
      {
        q: "How do I upload my first document?",
        a: "Go to the Documents page from the sidebar. You can either click the 'Upload documents' button to pick files from your computer, or simply drag and drop files onto the drop zone. We support PDF, Word (.docx), Excel (.xlsx), and plain text files up to 50 MB each.",
      },
      {
        q: "What file formats does AdvisorAI support?",
        a: "AdvisorAI supports PDF, Microsoft Word (.doc, .docx), Microsoft Excel (.xls, .xlsx), plain text (.txt), and CSV files. We automatically extract text content and index it for AI search.",
      },
      {
        q: "How long does document processing take?",
        a: "Most documents are processed within 30–90 seconds. Large documents (50+ pages) may take up to 3 minutes. You can track the processing status on the Documents page — it will show 'Processing', then 'Processed' when ready.",
      },
      {
        q: "How do I ask the AI Advisor a question?",
        a: "Navigate to the AI Advisor page. Type your question in plain English in the input box at the bottom. You can ask things like 'What are our GDPR obligations?', 'What deadlines are coming up this month?', or 'Summarise our employment contract'. The AI searches your documents to give cited answers.",
      },
    ],
  },
  {
    id: "ai-advisor",
    icon: Brain,
    color: "text-violet-500",
    bg: "bg-violet-500/10 border-violet-500/25",
    label: "AI Advisor",
    faqs: [
      {
        q: "How accurate are the AI answers?",
        a: "AdvisorAI uses Retrieval-Augmented Generation (RAG) — it only answers based on your actual uploaded documents, not general knowledge. Each answer includes source citations so you can verify the information. For critical legal or financial decisions, always consult a qualified professional.",
      },
      {
        q: "Why isn't the AI finding information I know is in a document?",
        a: "Make sure the document has finished processing (status should be 'Processed'). If the document is in an image-only PDF (scanned), text extraction may be limited. Try asking the question differently, or check the document appears in your Documents list.",
      },
      {
        q: "Can I have multiple AI chat sessions?",
        a: "Yes. Click the '+' button at the top of the AI Advisor sidebar to start a new session. Previous sessions are saved and you can switch between them. Each session maintains its own context and history.",
      },
      {
        q: "What is the RAG Pipeline?",
        a: "RAG stands for Retrieval-Augmented Generation. When you ask a question, AdvisorAI searches your document knowledge base for relevant chunks, then feeds them to the AI model (Groq Llama 3.1 70B) along with your question. This ensures answers are grounded in your specific documents.",
      },
    ],
  },
  {
    id: "compliance",
    icon: Shield,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10 border-emerald-500/25",
    label: "Compliance",
    faqs: [
      {
        q: "How is the compliance score calculated?",
        a: "The compliance score reflects how many of your tracked compliance rules are currently on-track vs. overdue or at risk. It considers deadline proximity, document coverage, and risk level of each obligation. A score above 80% is considered healthy.",
      },
      {
        q: "How do I add a new compliance rule?",
        a: "Contact your company admin or go to the Compliance page and use the 'Add Rule' button (admin accounts only). Rules can be seeded automatically for your jurisdiction — go to Company settings and select your country to import default compliance rules.",
      },
      {
        q: "What does 'critical' risk mean?",
        a: "A 'Critical' risk means the compliance rule is overdue or has less than 7 days until its deadline. These should be addressed immediately. 'High' means 7–14 days. 'Medium' means 14–30 days. 'Low' means more than 30 days away.",
      },
    ],
  },
  {
    id: "documents",
    icon: FileText,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10 border-cyan-500/25",
    label: "Documents",
    faqs: [
      {
        q: "Can I delete a document?",
        a: "Yes. Hover over any document in the Documents list and click the '⋯' menu on the right. Select 'Delete' to permanently remove the document. Note: deleting a document also removes it from the AI knowledge base.",
      },
      {
        q: "How do I download a document?",
        a: "Hover over the document row and click the '⋯' menu, then select 'Download'. This generates a temporary secure download link valid for 15 minutes.",
      },
      {
        q: "Is there a limit on how many documents I can upload?",
        a: "Free plan: up to 50 documents. Growth plan: up to 500 documents. Enterprise: unlimited. You can see your current usage on the Dashboard overview.",
      },
    ],
  },
];

// ── Quick actions ─────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { icon: FileText,    label: "Upload a document",        href: "/dashboard/documents",    color: "text-cyan-500",    bg: "bg-cyan-500/10 border-cyan-500/20"    },
  { icon: Brain,       label: "Ask the AI Advisor",       href: "/dashboard/advisor",      color: "text-violet-500",  bg: "bg-violet-500/10 border-violet-500/20" },
  { icon: Shield,      label: "Check compliance status",  href: "/dashboard/compliance",   color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { icon: BookOpen,    label: "View the documentation",   href: "#docs",                   color: "text-blue-500",    bg: "bg-blue-500/10 border-blue-500/20"    },
];

// ── Status indicators ─────────────────────────────────────────────────────────
const SYSTEM_STATUS = [
  { service: "AI Advisor (RAG)",     status: "operational", note: "Response time < 500ms"    },
  { service: "Document Processing",  status: "operational", note: "Avg 45s processing time"  },
  { service: "Compliance Engine",    status: "operational", note: "Rules updated daily"       },
  { service: "Notifications",        status: "operational", note: "Real-time delivery"        },
];

const statusIcon = {
  operational: <CheckCircle size={14} className="text-emerald-500" />,
  degraded:    <AlertTriangle size={14} className="text-amber-500" />,
  outage:      <AlertTriangle size={14} className="text-rose-500"  />,
};

// ── FAQ accordion item ────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[var(--border)] last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left gap-4 hover:text-[var(--fg)] text-[var(--fg-soft)] transition-colors group"
      >
        <span className="text-sm font-medium group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors">{q}</span>
        <div className="flex-shrink-0">
          {open ? <ChevronDown size={16} className="text-violet-500" /> : <ChevronRight size={16} className="text-[var(--fg-muted)]" />}
        </div>
      </button>
      {open && (
        <p className="pb-4 text-sm text-[var(--fg-muted)] leading-relaxed pr-8">{a}</p>
      )}
    </div>
  );
}

// ── Contact form ──────────────────────────────────────────────────────────────
function ContactForm() {
  const [subject, setSubject]   = useState("");
  const [message, setMessage]   = useState("");
  const [sending, setSending]   = useState(false);
  const [sent,    setSent]      = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    const mailto = `mailto:support@advisorai.app?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.location.href = mailto;
    setSending(false);
    setSent(true);
    setSubject("");
    setMessage("");
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wide mb-1.5">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Describe your issue briefly…"
          className="w-full px-3.5 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--fg)] text-sm placeholder-[var(--fg-muted)] focus:outline-none focus:border-violet-500/50 transition-all"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wide mb-1.5">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe the issue in detail, including any steps to reproduce it…"
          rows={5}
          className="w-full px-3.5 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--fg)] text-sm placeholder-[var(--fg-muted)] focus:outline-none focus:border-violet-500/50 transition-all resize-none"
        />
      </div>
      {sent ? (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
          <CheckCircle size={16} />
          Message sent! Our support team will get back to you within 24 hours.
        </div>
      ) : (
        <button
          type="submit"
          disabled={sending || !subject.trim() || !message.trim()}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_16px_rgba(124,58,237,0.3)] hover:shadow-[0_6px_24px_rgba(124,58,237,0.5)] hover:-translate-y-0.5 active:scale-95"
        >
          {sending ? <><Clock size={14} className="animate-spin" /> Sending…</> : <><Mail size={14} /> Send message</>}
        </button>
      )}
    </form>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function HelpPage() {
  const [search,   setSearch]   = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const filtered = search.trim()
    ? FAQ_CATEGORIES.map((cat) => ({
        ...cat,
        faqs: cat.faqs.filter(
          (f) =>
            f.q.toLowerCase().includes(search.toLowerCase()) ||
            f.a.toLowerCase().includes(search.toLowerCase()),
        ),
      })).filter((cat) => cat.faqs.length > 0)
    : FAQ_CATEGORIES;

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.4)] flex-shrink-0">
            <HelpCircle size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[var(--fg)] tracking-tight">Help &amp; Support</h1>
            <p className="text-[var(--fg-muted)] text-sm">Find answers, contact support, or check system status.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left column (FAQ + search) ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search help articles…"
              className="w-full pl-11 pr-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-2xl text-[var(--fg)] placeholder-[var(--fg-muted)] text-sm focus:outline-none focus:border-violet-500/50 transition-all"
            />
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map(({ icon: Icon, label, href, color, bg }) => (
              <a
                key={label}
                href={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${bg} hover:scale-[1.02] transition-all duration-200 group`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${bg}`}>
                  <Icon size={15} className={color} />
                </div>
                <span className="text-sm font-medium text-[var(--fg-soft)] group-hover:text-[var(--fg)] transition-colors flex-1">{label}</span>
                <ArrowRight size={13} className={`${color} opacity-0 group-hover:opacity-100 transition-opacity`} />
              </a>
            ))}
          </div>

          {/* FAQ categories */}
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-[var(--fg-muted)] text-sm">
              No results for &quot;{search}&quot;. Try a different search term.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filtered.map((cat) => {
                const Icon = cat.icon;
                const isOpen = activeId === cat.id || search.trim() !== "";
                return (
                  <div key={cat.id} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setActiveId(isOpen && !search.trim() ? null : cat.id)}
                      className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-[var(--surface-hover)] transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0 ${cat.bg}`}>
                        <Icon size={15} className={cat.color} />
                      </div>
                      <span className="text-[var(--fg)] font-semibold text-sm flex-1">{cat.label}</span>
                      <span className="text-[var(--fg-muted)] text-xs mr-2">{cat.faqs.length} articles</span>
                      {isOpen ? <ChevronDown size={14} className="text-[var(--fg-muted)]" /> : <ChevronRight size={14} className="text-[var(--fg-muted)]" />}
                    </button>
                    {isOpen && (
                      <div className="px-5 border-t border-[var(--border)]">
                        {cat.faqs.map((faq) => (
                          <FaqItem key={faq.q} q={faq.q} a={faq.a} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right column ── */}
        <div className="flex flex-col gap-5">

          {/* System status */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] p-5">
            <h3 className="text-[var(--fg)] font-bold text-sm mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              System Status
            </h3>
            <div className="flex flex-col gap-3">
              {SYSTEM_STATUS.map(({ service, status, note }) => (
                <div key={service} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[var(--fg-soft)] truncate">{service}</p>
                    <p className="text-[10px] text-[var(--fg-muted)]">{note}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {statusIcon[status as keyof typeof statusIcon]}
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 capitalize font-medium">{status}</span>
                  </div>
                </div>
              ))}
            </div>
            <a
              href="#"
              className="mt-4 flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-500 transition-colors"
            >
              <ExternalLink size={11} /> View full status page
            </a>
          </div>

          {/* Contact support */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] p-5">
            <h3 className="text-[var(--fg)] font-bold text-sm mb-1 flex items-center gap-2">
              <MessageSquare size={15} className="text-violet-500" />
              Contact Support
            </h3>
            <p className="text-[var(--fg-muted)] text-xs mb-4 leading-relaxed">
              Can&apos;t find the answer? Our team responds within 24 hours on weekdays.
            </p>
            <ContactForm />
          </div>

          {/* Useful links */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] p-5">
            <h3 className="text-[var(--fg)] font-bold text-sm mb-3">Useful Links</h3>
            <div className="flex flex-col gap-2">
              {[
                { label: "API Documentation",    href: "#" },
                { label: "Changelog & Updates",  href: "#" },
                { label: "Privacy Policy",        href: "/privacy" },
                { label: "Terms of Service",      href: "/terms" },
              ].map(({ label, href }) => (
                <a key={label} href={href} className="flex items-center gap-2 text-xs text-[var(--fg-soft)] hover:text-violet-600 dark:hover:text-violet-300 transition-colors group">
                  <ChevronRight size={12} className="text-[var(--fg-muted)] group-hover:text-violet-500 transition-colors" />
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
