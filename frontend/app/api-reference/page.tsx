"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  ChevronDown,
  ExternalLink,
  Copy,
  Check,
  Terminal,
  Key,
  FileText,
  Brain,
  BarChart2,
  Shield,
} from "lucide-react";

const BASE_URL = "https://advisorai-backend.fly.dev/api/v1";

const endpointGroups = [
  {
    icon: Key,
    name: "Authentication",
    color: "text-violet-500",
    bg: "bg-violet-500/10 border-violet-500/20",
    endpoints: [
      { method: "POST", path: "/auth/login",    desc: "Obtain a JWT access token with email and password." },
      { method: "POST", path: "/auth/register", desc: "Create a new user account." },
      { method: "GET",  path: "/auth/me",        desc: "Return the currently authenticated user profile." },
    ],
  },
  {
    icon: FileText,
    name: "Documents",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10 border-cyan-500/20",
    endpoints: [
      { method: "POST",   path: "/documents/upload",    desc: "Upload a document (PDF, DOCX, XLSX). Max 50 MB." },
      { method: "GET",    path: "/documents/",           desc: "List all documents in the authenticated namespace." },
      { method: "DELETE", path: "/documents/{id}",       desc: "Permanently delete a document and its vectors." },
    ],
  },
  {
    icon: Brain,
    name: "AI Advisor",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    endpoints: [
      { method: "POST", path: "/advisor/ask",    desc: "Ask a question. Returns a cited answer from your documents." },
      { method: "GET",  path: "/advisor/stream", desc: "Streaming version of /advisor/ask using Server-Sent Events." },
    ],
  },
  {
    icon: BarChart2,
    name: "Analytics",
    color: "text-amber-500",
    bg: "bg-amber-500/10 border-amber-500/20",
    endpoints: [
      { method: "GET", path: "/analytics/overview",          desc: "Query counts, document stats, top topics, and usage trends." },
      { method: "GET", path: "/analytics/compliance-score",  desc: "Current compliance score and gap analysis per jurisdiction." },
    ],
  },
  {
    icon: Shield,
    name: "Admin",
    color: "text-rose-500",
    bg: "bg-rose-500/10 border-rose-500/20",
    endpoints: [
      { method: "GET", path: "/admin/stats", desc: "Platform-wide statistics (admin role required)." },
      { method: "GET", path: "/admin/users", desc: "List all users in the organisation (admin role required)." },
    ],
  },
];

const methodColors: Record<string, string> = {
  GET:    "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
  POST:   "bg-violet-500/10 text-violet-600 border border-violet-500/20",
  DELETE: "bg-rose-500/10 text-rose-600 border border-rose-500/20",
  PATCH:  "bg-amber-500/10 text-amber-600 border border-amber-500/20",
};

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

function EndpointGroup({ group }: { group: typeof endpointGroups[0] }) {
  const [open, setOpen] = useState(false);
  const Icon = group.icon;
  return (
    <div className="rounded-2xl bg-[var(--bg-soft)] border border-[var(--border)] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 px-6 py-5 hover:bg-[var(--surface-hover)] transition-colors duration-200"
      >
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${group.bg}`}>
          <Icon size={18} className={group.color} />
        </div>
        <span className="text-[var(--fg)] font-bold text-lg flex-1 text-left">{group.name}</span>
        <span className="text-[var(--fg-muted)] text-sm mr-3">{group.endpoints.length} endpoints</span>
        <ChevronDown
          size={18}
          className={`text-[var(--fg-muted)] transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="border-t border-[var(--border)] divide-y divide-[var(--border)]">
          {group.endpoints.map((ep) => (
            <div key={ep.path} className="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-4 bg-[var(--bg)]">
              <span
                className={`inline-block px-3 py-1 rounded-lg text-xs font-black tracking-wide flex-shrink-0 ${methodColors[ep.method]}`}
              >
                {ep.method}
              </span>
              <code className="text-sm text-emerald-400 font-mono flex-1">{ep.path}</code>
              <span className="text-[var(--fg-muted)] text-sm">{ep.desc}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-soft)] border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] text-xs font-medium transition-colors duration-200"
    >
      {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function ApiReferencePage() {
  const [activeTab, setActiveTab] = useState<Tab>("curl");

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <Navbar />

      {/* Hero */}
      <section className="pt-36 pb-16 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-violet-500 mb-4">
            Developer docs
          </span>
          <h1 className="text-5xl md:text-6xl font-black text-[var(--fg)] mb-6 leading-tight">
            REST{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-cyan-500">
              API Reference
            </span>
          </h1>
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--bg-soft)] border border-[var(--border)] mb-6">
            <Terminal size={14} className="text-violet-500" />
            <code className="text-sm text-emerald-400 font-mono">{BASE_URL}</code>
          </div>
          <p className="text-[var(--fg-soft)] text-lg leading-relaxed max-w-2xl mx-auto">
            Programmatic access to all AdvisorAI features. Authenticate once,
            then query documents, ask the AI, and pull analytics from any
            language or platform.
          </p>
          <div className="mt-8">
            <Link
              href="https://advisorai-backend.fly.dev/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-sm hover:from-violet-500 hover:to-purple-500 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/30"
            >
              Open Swagger UI <ExternalLink size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Authentication */}
      <section className="py-16 px-6 border-t border-[var(--border)]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-[var(--fg)] mb-2 tracking-tight">Authentication</h2>
          <p className="text-[var(--fg-muted)] mb-6">
            All API requests require a Bearer token in the{" "}
            <code className="text-emerald-400 font-mono text-sm bg-[var(--bg-soft)] px-1.5 py-0.5 rounded">
              Authorization
            </code>{" "}
            header. Obtain a token via{" "}
            <code className="text-emerald-400 font-mono text-sm bg-[var(--bg-soft)] px-1.5 py-0.5 rounded">
              POST /auth/login
            </code>
            .
          </p>

          {/* Tab bar */}
          <div className="flex gap-2 mb-3">
            {(["curl", "python", "javascript"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab
                    ? "bg-violet-500/10 border border-violet-500/30 text-violet-500"
                    : "text-[var(--fg-muted)] hover:text-[var(--fg)] border border-transparent hover:border-[var(--border)]"
                }`}
              >
                {tab === "javascript" ? "JavaScript" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="relative rounded-xl bg-[var(--bg)] border border-[var(--border)] p-6">
            <div className="absolute top-4 right-4">
              <CopyButton text={codeExamples[activeTab]} />
            </div>
            <pre className="font-mono text-sm text-emerald-400 overflow-x-auto leading-relaxed whitespace-pre">
              {codeExamples[activeTab]}
            </pre>
          </div>
        </div>
      </section>

      {/* Endpoint Groups */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-[var(--fg)] mb-2 tracking-tight">Endpoints</h2>
          <p className="text-[var(--fg-muted)] mb-8">
            Click any group to expand and explore the available operations.
          </p>
          <div className="space-y-4">
            {endpointGroups.map((group) => (
              <EndpointGroup key={group.name} group={group} />
            ))}
          </div>
        </div>
      </section>

      {/* Swagger CTA */}
      <section className="py-16 px-6 bg-[var(--bg-soft)] border-t border-[var(--border)]">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-2xl border border-[var(--border)] bg-[var(--bg)]">
          <div>
            <h3 className="text-[var(--fg)] font-black text-xl mb-1">
              Full interactive API docs
            </h3>
            <p className="text-[var(--fg-muted)] text-sm">
              Try every endpoint directly in your browser with our hosted Swagger
              UI. No client needed.
            </p>
          </div>
          <Link
            href="https://advisorai-backend.fly.dev/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold hover:from-violet-500 hover:to-purple-500 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/30"
          >
            Open Swagger UI <ExternalLink size={16} />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
