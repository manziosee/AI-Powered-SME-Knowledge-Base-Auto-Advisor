"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  ArrowRight, Copy, Check, Terminal, Key, FileText, Brain,
  BarChart2, Shield, ChevronDown, ExternalLink, Zap, Lock,
} from "lucide-react";

const BASE_URL = "https://advisorai-backend.fly.dev/api/v1";

const methodColors: Record<string, string> = {
  GET:    "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  POST:   "bg-violet-500/15 text-violet-400 border border-violet-500/30",
  PUT:    "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  PATCH:  "bg-orange-500/15 text-orange-400 border border-orange-500/30",
  DELETE: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
};

const endpointGroups = [
  {
    icon: Lock, name: "Authentication", color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20", count: 9,
    endpoints: [
      { method: "POST", path: "/auth/register",       desc: "Create a new user account." },
      { method: "POST", path: "/auth/login",           desc: "Obtain JWT tokens." },
      { method: "POST", path: "/auth/refresh",         desc: "Rotate refresh token." },
      { method: "POST", path: "/auth/logout",          desc: "Blacklist the refresh token." },
      { method: "GET",  path: "/auth/me",              desc: "Return the authenticated user profile." },
      { method: "PUT",  path: "/auth/me",              desc: "Update name or email." },
      { method: "PUT",  path: "/auth/me/password",     desc: "Change password." },
      { method: "POST", path: "/auth/forgot-password", desc: "Request a password reset link." },
      { method: "POST", path: "/auth/reset-password",  desc: "Set new password using reset token." },
    ],
  },
  {
    icon: Shield, name: "Two-Factor Auth", color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20", count: 5,
    endpoints: [
      { method: "GET",  path: "/auth/2fa/status",   desc: "Check whether 2FA is enabled." },
      { method: "POST", path: "/auth/2fa/setup",    desc: "Generate TOTP secret and QR code." },
      { method: "POST", path: "/auth/2fa/verify",   desc: "Verify 6-digit code and enable 2FA." },
      { method: "POST", path: "/auth/2fa/disable",  desc: "Disable 2FA." },
      { method: "POST", path: "/auth/2fa/validate", desc: "Complete login after 2fa_required." },
    ],
  },
  {
    icon: FileText, name: "Documents", color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20", count: 11,
    endpoints: [
      { method: "POST",   path: "/documents/upload",        desc: "Upload a document (PDF, DOCX, XLSX, TXT)." },
      { method: "POST",   path: "/documents/bulk-upload",   desc: "Upload up to 20 files in one request." },
      { method: "GET",    path: "/documents/",              desc: "List company documents." },
      { method: "GET",    path: "/documents/{id}",          desc: "Get a single document by ID." },
      { method: "PATCH",  path: "/documents/{id}",          desc: "Update document metadata or tags." },
      { method: "DELETE", path: "/documents/{id}",          desc: "Delete document and its S3 file." },
      { method: "GET",    path: "/documents/{id}/download", desc: "Get a presigned S3 download URL." },
      { method: "GET",    path: "/documents/{id}/knowledge",desc: "Get extracted knowledge entries." },
      { method: "POST",   path: "/documents/bulk-delete",   desc: "Delete up to 50 documents at once." },
      { method: "PATCH",  path: "/documents/bulk-tag",      desc: "Apply tags to multiple documents." },
      { method: "PATCH",  path: "/documents/bulk-signature",desc: "Set e-signature status on multiple docs." },
    ],
  },
  {
    icon: Brain, name: "AI Advisor", color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20", count: 3,
    endpoints: [
      { method: "POST", path: "/advisor/ask",       desc: "RAG query — returns cited answer from your documents." },
      { method: "POST", path: "/advisor/ask-agent", desc: "Agent mode with tools (DeadlineLookup, ComplianceCheck)." },
      { method: "GET",  path: "/advisor/stream",    desc: "Server-Sent Events streaming." },
    ],
  },
  {
    icon: Brain, name: "Chatbot", color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20", count: 6,
    endpoints: [
      { method: "GET",    path: "/chatbot/sessions",                                 desc: "List all chat sessions." },
      { method: "POST",   path: "/chatbot/sessions",                                 desc: "Create a new chat session." },
      { method: "GET",    path: "/chatbot/sessions/{id}",                            desc: "Get session with full message history." },
      { method: "DELETE", path: "/chatbot/sessions/{id}",                            desc: "Delete a chat session." },
      { method: "POST",   path: "/chatbot/sessions/{id}/messages",                   desc: "Send a message and get an AI reply." },
      { method: "POST",   path: "/chatbot/sessions/{id}/messages/{msg_id}/feedback", desc: "Rate a message thumbs up/down." },
    ],
  },
  {
    icon: BarChart2, name: "Analytics", color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20", count: 9,
    endpoints: [
      { method: "GET",    path: "/analytics/overview",          desc: "Dashboard KPIs: document counts, alerts." },
      { method: "GET",    path: "/analytics/compliance-score",  desc: "Compliance score and gap analysis." },
      { method: "GET",    path: "/analytics/risk-distribution", desc: "Knowledge entries by risk level." },
      { method: "GET",    path: "/analytics/document-types",    desc: "Document count by type." },
      { method: "POST",   path: "/analytics/export",            desc: "Stream a PDF or Excel report." },
      { method: "GET",    path: "/analytics/export-knowledge",  desc: "Download knowledge entries as CSV." },
      { method: "POST",   path: "/analytics/schedule",          desc: "Schedule a recurring report." },
      { method: "GET",    path: "/analytics/schedules",         desc: "List all scheduled reports." },
      { method: "DELETE", path: "/analytics/schedules/{id}",    desc: "Delete a scheduled report." },
    ],
  },
  {
    icon: Shield, name: "Admin", color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20", count: 19,
    endpoints: [
      { method: "GET",    path: "/admin/stats",                    desc: "System-wide stats (admin role required)." },
      { method: "GET",    path: "/admin/users",                    desc: "List all users across companies." },
      { method: "POST",   path: "/admin/users",                    desc: "Create a user (super_admin)." },
      { method: "PUT",    path: "/admin/users/{id}/role",          desc: "Change a user's role." },
      { method: "PUT",    path: "/admin/users/{id}/status",        desc: "Activate or deactivate a user." },
      { method: "DELETE", path: "/admin/users/{id}",               desc: "Delete a user." },
      { method: "GET",    path: "/admin/companies",                desc: "List all companies." },
      { method: "GET",    path: "/admin/audit-logs",               desc: "Filterable audit trail." },
      { method: "GET",    path: "/admin/health-alerts",            desc: "Companies with low compliance." },
      { method: "GET",    path: "/admin/compliance-rules",         desc: "List compliance rules." },
      { method: "POST",   path: "/admin/compliance-rules",         desc: "Create a compliance rule." },
      { method: "PUT",    path: "/admin/compliance-rules/{id}",    desc: "Update a compliance rule." },
      { method: "DELETE", path: "/admin/compliance-rules/{id}",    desc: "Deactivate a compliance rule." },
    ],
  },
];

const codeExamples = {
  curl: `curl -X POST ${BASE_URL}/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"you@example.com","password":"••••••••"}'

# Use the returned token
curl ${BASE_URL}/advisor/ask \\
  -H "Authorization: Bearer <YOUR_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{"question":"What are my VAT filing deadlines?"}'`,
  python: `import requests

BASE = "${BASE_URL}"

# Authenticate
res = requests.post(f"{BASE}/auth/login", json={
    "email": "you@example.com",
    "password": "••••••••"
})
token = res.json()["access_token"]

# Ask the AI Advisor
headers = {"Authorization": f"Bearer {token}"}
answer = requests.post(f"{BASE}/advisor/ask",
    headers=headers,
    json={"question": "What are my VAT filing deadlines?"}
)
print(answer.json()["answer"])`,
  javascript: `const BASE = "${BASE_URL}";

// Authenticate
const { access_token } = await fetch(\`\${BASE}/auth/login\`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "you@example.com", password: "••••••••" }),
}).then(r => r.json());

// Ask the AI Advisor
const { answer } = await fetch(\`\${BASE}/advisor/ask\`, {
  method: "POST",
  headers: {
    Authorization: \`Bearer \${access_token}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ question: "What are my VAT filing deadlines?" }),
}).then(r => r.json());

console.log(answer);`,
};

type Tab = "curl" | "python" | "javascript";

function CopyButton({ text, dark = false }: { text: string; dark?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        dark
          ? "bg-white/8 border border-white/10 text-white/40 hover:text-white/80 hover:bg-white/12"
          : "bg-[var(--surface)] border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)]"
      }`}
    >
      {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/8">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/60" />
            <div className="w-3 h-3 rounded-full bg-amber-400/60" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
          </div>
          <span className="text-white/30 text-[11px] font-mono ml-2">{lang}</span>
        </div>
        <CopyButton text={code} dark />
      </div>
      <div className="bg-[#0d1117] overflow-x-auto">
        <pre className="p-5 text-[13px] leading-[1.75] font-mono text-[#c9d1d9] whitespace-pre">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

function EndpointGroup({ group }: { group: typeof endpointGroups[0] }) {
  const [open, setOpen] = useState(false);
  const Icon = group.icon;
  return (
    <div className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
      open ? "border-violet-500/25 shadow-lg shadow-violet-500/5" : "border-[var(--border)]"
    } bg-[var(--bg-soft)]`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 px-6 py-5 hover:bg-[var(--surface-hover)] transition-colors"
      >
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${group.bg}`}>
          <Icon size={17} className={group.color} />
        </div>
        <span className="text-[var(--fg)] font-bold text-base flex-1 text-left">{group.name}</span>
        <span className="text-[var(--fg-muted)] text-xs font-mono mr-3 px-2.5 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)]">
          {group.count} endpoints
        </span>
        <ChevronDown size={16} className={`text-[var(--fg-muted)] transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-[var(--border)]">
          {group.endpoints.map((ep, i) => (
            <div key={ep.path} className={`flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-3.5 ${
              i % 2 === 0 ? "bg-[var(--bg)]" : "bg-[var(--surface)]"
            } hover:bg-[var(--surface-hover)] transition-colors`}>
              <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wide flex-shrink-0 w-16 ${methodColors[ep.method]}`}>
                {ep.method}
              </span>
              <code className="text-sm text-violet-400 dark:text-violet-300 font-mono flex-shrink-0 min-w-[220px]">{ep.path}</code>
              <span className="text-[var(--fg-muted)] text-sm">{ep.desc}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ApiReferencePage() {
  const [activeTab, setActiveTab] = useState<Tab>("curl");

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <Navbar />

      {/* ── Hero ── */}
      <section className="pt-36 pb-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[160px]"
            style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 70%)" }} />
          <div className="absolute inset-0 bg-dots opacity-20" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/25 bg-violet-500/8 text-xs font-bold tracking-widest text-violet-600 dark:text-violet-400 uppercase mb-6">
                <Terminal size={11} />
                Developer docs
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-[var(--fg)] mb-6 leading-[1.0] tracking-tight">
                REST{" "}
                <span className="gradient-text-brand">API Reference</span>
              </h1>
              <p className="text-[var(--fg-muted)] text-lg leading-relaxed mb-8 max-w-xl">
                Programmatic access to all AdvisorAI features. Authenticate once, then query documents, ask the AI, and pull analytics from any language or platform.
              </p>
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <Link href="https://advisorai-backend.fly.dev/docs" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-sm hover:from-violet-500 hover:to-purple-500 transition-all shadow-[0_4px_20px_rgba(124,58,237,0.35)] hover:shadow-[0_8px_30px_rgba(124,58,237,0.5)] hover:-translate-y-0.5">
                  Open Swagger UI <ExternalLink size={13} />
                </Link>
                <Link href="/quick-start"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[var(--border)] text-[var(--fg-soft)] font-semibold text-sm hover:border-violet-500/30 hover:text-[var(--fg)] hover:bg-[var(--surface)] transition-all">
                  Quick Start <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {/* Info cards */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-xs flex-shrink-0">
              {[
                { label: "Base URL",     value: "fly.dev/api/v1", mono: true,  color: "text-violet-500" },
                { label: "Auth",         value: "Bearer JWT",     mono: false, color: "text-blue-500"   },
                { label: "Content-Type", value: "application/json", mono: true, color: "text-emerald-500" },
                { label: "Rate Limit",   value: "200 req / 60s",  mono: false, color: "text-amber-500"  },
              ].map(({ label, value, mono, color }) => (
                <div key={label} className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] hover:border-violet-500/20 transition-all">
                  <p className="text-[10px] text-[var(--fg-muted)] font-bold uppercase tracking-widest mb-1.5">{label}</p>
                  <p className={`text-sm font-bold ${color} ${mono ? "font-mono" : ""}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Authentication ── */}
      <section className="py-20 px-6 border-t border-[var(--border)] bg-[var(--bg-soft)]">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Lock size={16} className="text-violet-500" />
            </div>
            <h2 className="text-2xl font-black text-[var(--fg)] tracking-tight">Authentication</h2>
          </div>
          <p className="text-[var(--fg-muted)] mb-8 max-w-2xl">
            All API requests require a Bearer token in the{" "}
            <code className="text-violet-500 font-mono text-sm bg-[var(--surface)] px-2 py-0.5 rounded-lg border border-[var(--border)]">Authorization</code>{" "}
            header. Obtain a token via{" "}
            <code className="text-emerald-600 dark:text-emerald-400 font-mono text-sm bg-[var(--surface)] px-2 py-0.5 rounded-lg border border-[var(--border)]">POST /auth/login</code>.
          </p>

          {/* Tab bar */}
          <div className="flex gap-1 mb-4 p-1 rounded-xl bg-[var(--surface)] border border-[var(--border)] w-fit">
            {(["curl", "python", "javascript"] as Tab[]).map((tab) => (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab
                    ? "bg-violet-600 text-white shadow-md"
                    : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
                }`}>
                {tab === "javascript" ? "JavaScript" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <CodeBlock code={codeExamples[activeTab]} lang={activeTab === "javascript" ? "JavaScript" : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} />
        </div>
      </section>

      {/* ── Endpoints ── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Zap size={16} className="text-blue-500" />
            </div>
            <h2 className="text-2xl font-black text-[var(--fg)] tracking-tight">Endpoints</h2>
          </div>
          <p className="text-[var(--fg-muted)] mb-8">Click any group to expand and explore the available operations.</p>
          <div className="space-y-3">
            {endpointGroups.map((group) => (
              <EndpointGroup key={group.name} group={group} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Swagger CTA ── */}
      <section className="py-20 px-6 bg-[var(--bg-soft)] border-t border-[var(--border)]">
        <div className="max-w-5xl mx-auto">
          <div className="relative p-8 rounded-3xl border border-violet-500/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-blue-500/5 pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-[var(--fg)] font-black text-2xl mb-2">Full interactive API docs</h3>
                <p className="text-[var(--fg-muted)] text-sm max-w-md">Try every endpoint directly in your browser with our hosted Swagger UI. No client needed.</p>
              </div>
              <Link href="https://advisorai-backend.fly.dev/docs" target="_blank" rel="noopener noreferrer"
                className="flex-shrink-0 inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold hover:from-violet-500 hover:to-purple-500 transition-all shadow-[0_4px_20px_rgba(124,58,237,0.35)] hover:shadow-[0_8px_30px_rgba(124,58,237,0.5)] hover:-translate-y-0.5">
                Open Swagger UI <ExternalLink size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
