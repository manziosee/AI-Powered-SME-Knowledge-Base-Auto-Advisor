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
      { method: "POST", path: "/auth/register",        desc: "Create a new user account." },
      { method: "POST", path: "/auth/login",            desc: "Obtain JWT tokens. Returns 403 with 2fa_required if 2FA is enabled." },
      { method: "POST", path: "/auth/refresh",          desc: "Rotate refresh token (old token blacklisted in Redis)." },
      { method: "POST", path: "/auth/logout",           desc: "Blacklist the refresh token." },
      { method: "GET",  path: "/auth/me",               desc: "Return the currently authenticated user profile." },
      { method: "PUT",  path: "/auth/me",               desc: "Update name or email." },
      { method: "PUT",  path: "/auth/me/password",      desc: "Change password (requires current password)." },
      { method: "POST", path: "/auth/forgot-password",  desc: "Request a password reset link (always 200, no email leak)." },
      { method: "POST", path: "/auth/reset-password",   desc: "Set new password using the reset token." },
    ],
  },
  {
    icon: Shield,
    name: "Two-Factor Auth (2FA)",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    endpoints: [
      { method: "GET",  path: "/auth/2fa/status",   desc: "Check whether 2FA is enabled for the current user." },
      { method: "POST", path: "/auth/2fa/setup",    desc: "Generate TOTP secret and QR code PNG (base64). Scan with Google Authenticator." },
      { method: "POST", path: "/auth/2fa/verify",   desc: "Verify 6-digit code and permanently enable 2FA." },
      { method: "POST", path: "/auth/2fa/disable",  desc: "Disable 2FA (requires current TOTP code)." },
      { method: "POST", path: "/auth/2fa/validate", desc: "Complete login after 2fa_required — returns JWT tokens." },
    ],
  },
  {
    icon: Key,
    name: "API Keys",
    color: "text-amber-500",
    bg: "bg-amber-500/10 border-amber-500/20",
    endpoints: [
      { method: "GET",    path: "/auth/api-keys",       desc: "List all API keys for the current user." },
      { method: "POST",   path: "/auth/api-keys",       desc: "Create a new API key (sk_ prefix). Raw key shown once." },
      { method: "DELETE", path: "/auth/api-keys/{id}",  desc: "Revoke an API key immediately." },
    ],
  },
  {
    icon: Shield,
    name: "Session Management",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10 border-cyan-500/20",
    endpoints: [
      { method: "GET",    path: "/auth/sessions",       desc: "List all active login sessions across devices." },
      { method: "DELETE", path: "/auth/sessions/{id}",  desc: "Revoke a specific session (force logout that device)." },
      { method: "DELETE", path: "/auth/sessions",       desc: "Revoke all sessions except the current one." },
    ],
  },
  {
    icon: FileText,
    name: "Documents",
    color: "text-blue-500",
    bg: "bg-blue-500/10 border-blue-500/20",
    endpoints: [
      { method: "POST",   path: "/documents/upload",              desc: "Upload a document (PDF, DOCX, XLSX, TXT). Max 50 MB. Triggers async processing." },
      { method: "POST",   path: "/documents/bulk-upload",         desc: "Upload up to 20 files in one request." },
      { method: "GET",    path: "/documents/",                    desc: "List company documents with optional status/type/search filters." },
      { method: "GET",    path: "/documents/{id}",                desc: "Get a single document by ID." },
      { method: "PATCH",  path: "/documents/{id}",                desc: "Update document metadata or tags." },
      { method: "DELETE", path: "/documents/{id}",                desc: "Delete document and its S3 file." },
      { method: "GET",    path: "/documents/{id}/download",       desc: "Get a presigned S3 download URL (returns both url and download_url keys)." },
      { method: "GET",    path: "/documents/{id}/knowledge",      desc: "Get all extracted knowledge entries for a document." },
      { method: "POST",   path: "/documents/bulk-delete",         desc: "Delete up to 50 documents at once." },
      { method: "PATCH",  path: "/documents/bulk-tag",            desc: "Apply tags to multiple documents at once." },
      { method: "PATCH",  path: "/documents/bulk-signature",      desc: "Set e-signature status on multiple documents." },
    ],
  },
  {
    icon: FileText,
    name: "Document Sharing",
    color: "text-rose-500",
    bg: "bg-rose-500/10 border-rose-500/20",
    endpoints: [
      { method: "POST",   path: "/share-links/",          desc: "Create a time-limited share link (optional password + max views)." },
      { method: "GET",    path: "/share-links/",          desc: "List share links created by the current user." },
      { method: "GET",    path: "/share-links/{token}",   desc: "Resolve a share link (public, no auth required)." },
      { method: "POST",   path: "/share-links/{token}/view", desc: "Unlock a password-protected share link." },
      { method: "DELETE", path: "/share-links/{id}",      desc: "Revoke a share link immediately." },
    ],
  },
  {
    icon: FileText,
    name: "Document Comments",
    color: "text-indigo-500",
    bg: "bg-indigo-500/10 border-indigo-500/20",
    endpoints: [
      { method: "GET",    path: "/documents/{id}/comments",             desc: "List all comments on a document (threaded)." },
      { method: "POST",   path: "/documents/{id}/comments",             desc: "Add a comment or reply (parent_id for threading)." },
      { method: "PUT",    path: "/documents/{id}/comments/{comment_id}", desc: "Edit a comment (author only)." },
      { method: "DELETE", path: "/documents/{id}/comments/{comment_id}", desc: "Delete a comment (author or admin)." },
    ],
  },
  {
    icon: FileText,
    name: "Document Templates",
    color: "text-teal-500",
    bg: "bg-teal-500/10 border-teal-500/20",
    endpoints: [
      { method: "GET",    path: "/templates/",          desc: "List templates (filter by category, country, industry, search)." },
      { method: "POST",   path: "/templates/",          desc: "Create a new template (admins can make it public)." },
      { method: "GET",    path: "/templates/{id}",      desc: "Get template detail including fields and content." },
      { method: "PUT",    path: "/templates/{id}",      desc: "Update a template (creator or admin)." },
      { method: "DELETE", path: "/templates/{id}",      desc: "Soft-delete a template." },
      { method: "POST",   path: "/templates/{id}/use",  desc: "Fill {{placeholders}} and return rendered document content." },
    ],
  },
  {
    icon: Brain,
    name: "AI Advisor",
    color: "text-violet-500",
    bg: "bg-violet-500/10 border-violet-500/20",
    endpoints: [
      { method: "POST", path: "/advisor/ask",        desc: "RAG query — returns cited answer from your documents." },
      { method: "POST", path: "/advisor/ask-agent",  desc: "Agent mode with tools (DeadlineLookup, ComplianceCheck, Calculator)." },
      { method: "GET",  path: "/advisor/stream",     desc: "Server-Sent Events streaming — tokens arrive one-by-one." },
    ],
  },
  {
    icon: Brain,
    name: "Chatbot",
    color: "text-purple-500",
    bg: "bg-purple-500/10 border-purple-500/20",
    endpoints: [
      { method: "GET",    path: "/chatbot/sessions",                                  desc: "List all chat sessions for the current user." },
      { method: "POST",   path: "/chatbot/sessions",                                  desc: "Create a new chat session." },
      { method: "GET",    path: "/chatbot/sessions/{id}",                             desc: "Get session with full message history." },
      { method: "DELETE", path: "/chatbot/sessions/{id}",                             desc: "Delete a chat session." },
      { method: "POST",   path: "/chatbot/sessions/{id}/messages",                    desc: "Send a message and get an AI reply." },
      { method: "POST",   path: "/chatbot/sessions/{id}/messages/{msg_id}/feedback",  desc: "Rate a message thumbs up (+1) or down (-1)." },
    ],
  },
  {
    icon: BarChart2,
    name: "Analytics",
    color: "text-amber-500",
    bg: "bg-amber-500/10 border-amber-500/20",
    endpoints: [
      { method: "GET",  path: "/analytics/overview",          desc: "Dashboard KPIs: document counts, knowledge entries, alerts." },
      { method: "GET",  path: "/analytics/compliance-score",  desc: "Compliance score and gap analysis vs country-specific rules." },
      { method: "GET",  path: "/analytics/risk-distribution", desc: "Knowledge entries broken down by risk level." },
      { method: "GET",  path: "/analytics/document-types",    desc: "Document count by type (contract, invoice, etc.)." },
      { method: "POST", path: "/analytics/export",            desc: "Stream a PDF or Excel report." },
      { method: "GET",  path: "/analytics/export-knowledge",  desc: "Download all knowledge entries as CSV or Excel." },
      { method: "POST", path: "/analytics/schedule",          desc: "Schedule a recurring report (cron expression + email recipients)." },
      { method: "GET",  path: "/analytics/schedules",         desc: "List all scheduled reports for the company." },
      { method: "DELETE", path: "/analytics/schedules/{id}",  desc: "Delete a scheduled report." },
    ],
  },
  {
    icon: Shield,
    name: "Compliance & Insights",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    endpoints: [
      { method: "GET", path: "/insights/health",    desc: "Business health score (0–100) with component breakdown and recommendations." },
      { method: "GET", path: "/insights/calendar",  desc: "Upcoming compliance deadlines (statutory + document-specific)." },
      { method: "GET", path: "/insights/expiry",    desc: "Documents expiring within N days." },
    ],
  },
  {
    icon: Shield,
    name: "Subscriptions",
    color: "text-pink-500",
    bg: "bg-pink-500/10 border-pink-500/20",
    endpoints: [
      { method: "GET",  path: "/subscriptions/plans",      desc: "List all available plans with pricing and features." },
      { method: "GET",  path: "/subscriptions/me",         desc: "Get the current company's subscription details." },
      { method: "POST", path: "/subscriptions/checkout",   desc: "Create a Stripe Checkout session to upgrade." },
      { method: "POST", path: "/subscriptions/portal",     desc: "Create a Stripe billing portal session." },
      { method: "PUT",  path: "/subscriptions/me/cancel",  desc: "Cancel subscription at period end." },
    ],
  },
  {
    icon: BarChart2,
    name: "Connectors",
    color: "text-orange-500",
    bg: "bg-orange-500/10 border-orange-500/20",
    endpoints: [
      { method: "GET",  path: "/connectors/",                    desc: "List all configured connectors for the company." },
      { method: "POST", path: "/connectors/quickbooks/connect",  desc: "Connect QuickBooks Online (OAuth2 tokens)." },
      { method: "GET",  path: "/connectors/quickbooks/invoices", desc: "Fetch recent invoices from QuickBooks." },
      { method: "POST", path: "/connectors/xero/connect",        desc: "Connect Xero (OAuth2 tokens)." },
      { method: "GET",  path: "/connectors/xero/contacts",       desc: "Fetch contacts from Xero." },
      { method: "POST", path: "/connectors/mtn-momo/webhook",    desc: "Receive MTN MoMo payment callbacks (public)." },
      { method: "POST", path: "/connectors/airtel-money/webhook",desc: "Receive Airtel Money payment callbacks (public)." },
    ],
  },
  {
    icon: Shield,
    name: "Admin",
    color: "text-rose-500",
    bg: "bg-rose-500/10 border-rose-500/20",
    endpoints: [
      { method: "GET",    path: "/admin/stats",                      desc: "System-wide stats (admin role required)." },
      { method: "GET",    path: "/admin/users",                      desc: "List all users across companies (super_admin)." },
      { method: "POST",   path: "/admin/users",                      desc: "Create a user (super_admin)." },
      { method: "PUT",    path: "/admin/users/{id}/role",            desc: "Change a user's role (super_admin)." },
      { method: "PUT",    path: "/admin/users/{id}/status",          desc: "Activate or deactivate a user (super_admin)." },
      { method: "DELETE", path: "/admin/users/{id}",                 desc: "Delete a user (super_admin)." },
      { method: "GET",    path: "/admin/companies",                  desc: "List all companies (super_admin)." },
      { method: "GET",    path: "/admin/audit-logs",                 desc: "Filterable audit trail (admin+)." },
      { method: "GET",    path: "/admin/health-alerts",              desc: "Companies with low compliance or no documents." },
      { method: "GET",    path: "/admin/llm/status",                 desc: "Which LLM backend is active (Groq vs OpenAI)." },
      { method: "GET",    path: "/admin/ml/status",                  desc: "ML model training status." },
      { method: "POST",   path: "/admin/ml/train-risk-scorer",       desc: "Trigger risk scorer retraining." },
      { method: "POST",   path: "/admin/ml/predict-risk",            desc: "Predict risk level for a text snippet." },
      { method: "GET",    path: "/admin/compliance-rules",           desc: "List compliance rules (admin+)." },
      { method: "POST",   path: "/admin/compliance-rules",           desc: "Create a compliance rule (super_admin)." },
      { method: "PUT",    path: "/admin/compliance-rules/{id}",      desc: "Update a compliance rule (super_admin)." },
      { method: "DELETE", path: "/admin/compliance-rules/{id}",      desc: "Deactivate a compliance rule (super_admin)." },
      { method: "POST",   path: "/admin/compliance-rules/seed",      desc: "Seed default country rules (super_admin)." },
    ],
  },
];

const methodColors: Record<string, string> = {
  GET:    "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
  POST:   "bg-violet-500/10 text-violet-600 border border-violet-500/20",
  PUT:    "bg-amber-500/10 text-amber-600 border border-amber-500/20",
  PATCH:  "bg-orange-500/10 text-orange-600 border border-orange-500/20",
  DELETE: "bg-rose-500/10 text-rose-600 border border-rose-500/20",
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
