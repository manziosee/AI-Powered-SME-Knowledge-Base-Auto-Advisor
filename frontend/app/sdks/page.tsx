"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  Github,
  ArrowRight,
  Copy,
  Check,
  ExternalLink,
  Terminal,
  Star,
} from "lucide-react";

const pythonInstall = "pip install advisorai";
const jsInstall = "npm install @advisorai/sdk";

const pythonExample = `from advisorai import AdvisorAI
import requests

BASE = "https://advisorai-backend.fly.dev/api/v1"

# Option A: API Key (sk_ prefix) — no expiry, great for CI/CD
headers = {"X-API-Key": "sk_your_api_key_here"}

# Option B: JWT login (with 2FA support)
res = requests.post(f"{BASE}/auth/login",
    json={"email": "you@co.com", "password": "••••"})
if res.status_code == 403:  # 2FA required
    user_id = res.json()["user_id"]
    code = input("TOTP code: ")
    res = requests.post(f"{BASE}/auth/2fa/validate",
        json={"user_id": user_id, "code": code})
headers = {"Authorization": f"Bearer {res.json()['access_token']}"}

# Upload a document
with open("./compliance_policy.pdf", "rb") as f:
    doc = requests.post(f"{BASE}/documents/upload",
        headers=headers, files={"file": f}).json()
print(f"Document ready: {doc['id']}")

# Ask a question (use 'query' not 'question')
answer = requests.post(f"{BASE}/advisor/ask",
    headers=headers,
    json={"query": "What are our VAT filing deadlines?"}
).json()
print(answer["answer"])
print("Sources:", answer["sources"])

# Check compliance score
score = requests.get(f"{BASE}/analytics/compliance-score",
    headers=headers).json()
print(f"Score: {score['compliance_score']}%")
print(f"Gaps: {len(score['gap_rules'])} rules not covered")`;

const jsExample = `import { AdvisorAI } from "@advisorai/sdk";

const client = new AdvisorAI({ apiKey: "your_api_key" });

// Upload a document
const doc = await client.documents.upload("./compliance_policy.pdf");
console.log("Document ready:", doc.id);

// Ask a question
const answer = await client.advisor.ask({
  question: "What are our VAT filing deadlines?",
});

console.log(answer.text);
console.log("Sources:", answer.sources);

// Stream a response
for await (const chunk of client.advisor.stream({
  question: "Summarise our employment policy",
})) {
  process.stdout.write(chunk.delta);
}`;

const restExample = `# No SDK needed — just curl or any HTTP client

BASE="https://advisorai-backend.fly.dev/api/v1"

# 1. Authenticate
TOKEN=$(curl -s -X POST $BASE/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"you@co.com","password":"••••"}' \\
  | jq -r '.access_token')

# 2. Ask a question
curl -s -X POST $BASE/advisor/ask \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"question":"What are my tax obligations?"}' \\
  | jq .answer`;

type SdkId = "python" | "js" | "rest";

const sdks: {
  id: SdkId;
  lang: string;
  badge: string;
  badgeColor: string;
  install: string | null;
  code: string;
  status: string;
  statusColor: string;
  desc: string;
  github: string | null;
}[] = [
  {
    id: "python",
    lang: "Python",
    badge: "Python 3.9+",
    badgeColor: "bg-blue-500/10 border-blue-500/20 text-blue-500",
    install: pythonInstall,
    code: pythonExample,
    status: "Official SDK",
    statusColor: "bg-violet-500/10 border-violet-500/20 text-violet-500",
    desc: "Full-featured Python SDK with sync and async support, type hints, and automatic retries.",
    github: "https://github.com/manziosee/AI-Powered-SME-Knowledge-Base-Auto-Advisor",
  },
  {
    id: "js",
    lang: "JavaScript / TypeScript",
    badge: "Node 18+ / Browser",
    badgeColor: "bg-amber-500/10 border-amber-500/20 text-amber-500",
    install: jsInstall,
    code: jsExample,
    status: "Official SDK",
    statusColor: "bg-violet-500/10 border-violet-500/20 text-violet-500",
    desc: "TypeScript-first SDK with full type safety, streaming support, and an isomorphic fetch client.",
    github: "https://github.com/manziosee/AI-Powered-SME-Knowledge-Base-Auto-Advisor",
  },
  {
    id: "rest",
    lang: "REST API",
    badge: "Any language",
    badgeColor: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
    install: null,
    code: restExample,
    status: "No SDK needed",
    statusColor: "bg-cyan-500/10 border-cyan-500/20 text-cyan-500",
    desc: "Use the REST API directly from any HTTP client. Works with curl, Go, Ruby, PHP, and more.",
    github: null,
  },
];

const community = [
  {
    title: "FastAPI middleware example",
    lang: "Python",
    desc: "Drop-in middleware to add AdvisorAI-powered search to any FastAPI app.",
    stars: "142",
    color: "text-blue-500",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    title: "Next.js starter template",
    lang: "TypeScript",
    desc: "Full-stack starter with AdvisorAI SDK, Tailwind, and shadcn/ui pre-wired.",
    stars: "89",
    color: "text-amber-500",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  {
    title: "Zapier integration template",
    lang: "No-code",
    desc: "Trigger AdvisorAI questions from any Zapier workflow using webhooks.",
    stars: "57",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-soft)] border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] text-xs font-medium transition-colors duration-200"
    >
      {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function SdksPage() {
  const [activeTab, setActiveTab] = useState<SdkId>("python");

  const active = sdks.find((s) => s.id === activeTab)!;

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <Navbar />

      {/* Hero */}
      <section className="pt-36 pb-20 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-violet-500 mb-4">
            SDKs & Examples
          </span>
          <h1 className="text-5xl md:text-6xl font-black text-[var(--fg)] mb-6 leading-tight">
            Official SDKs &{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-cyan-500">
              Code Examples
            </span>
          </h1>
          <p className="text-[var(--fg-soft)] text-lg leading-relaxed max-w-2xl mx-auto">
            Integrate AdvisorAI into your application in minutes. Pick the SDK
            for your language or talk directly to the REST API.
          </p>
          <div className="mt-8">
            <Link
              href="https://github.com/manziosee/AI-Powered-SME-Knowledge-Base-Auto-Advisor"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--bg-soft)] border border-[var(--border)] text-[var(--fg)] font-bold text-sm hover:border-violet-500/30 hover:shadow-lg transition-all duration-300"
            >
              <Github size={16} /> View on GitHub <ExternalLink size={12} className="text-[var(--fg-muted)]" />
            </Link>
          </div>
        </div>
      </section>

      {/* SDK Cards & Code Switcher */}
      <section className="py-8 px-6 border-t border-[var(--border)]">
        <div className="max-w-5xl mx-auto">
          {/* Tab buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            {sdks.map((sdk) => (
              <button
                key={sdk.id}
                onClick={() => setActiveTab(sdk.id)}
                className={`flex-1 p-5 rounded-2xl border text-left transition-all duration-200 ${
                  activeTab === sdk.id
                    ? "border-violet-500/40 bg-violet-500/5 shadow-lg shadow-violet-500/10"
                    : "border-[var(--border)] bg-[var(--bg-soft)] hover:border-violet-500/20"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`inline-block px-2.5 py-1 rounded-lg border text-xs font-semibold ${sdk.badgeColor}`}>
                    {sdk.badge}
                  </span>
                  <span className={`inline-block px-2.5 py-1 rounded-lg border text-xs font-semibold ${sdk.statusColor}`}>
                    {sdk.status}
                  </span>
                </div>
                <h3 className="text-[var(--fg)] font-black text-lg mb-1">{sdk.lang}</h3>
                <p className="text-[var(--fg-muted)] text-xs leading-relaxed">{sdk.desc}</p>
              </button>
            ))}
          </div>

          {/* Install command */}
          {active.install && (
            <div className="mb-4">
              <p className="text-xs uppercase tracking-widest text-[var(--fg-muted)] font-semibold mb-2">
                Install
              </p>
              <div className="relative flex items-center gap-3 px-5 py-4 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                <Terminal size={14} className="text-violet-500 flex-shrink-0" />
                <code className="font-mono text-sm flex-1 text-emerald-400">
                  {active.install}
                </code>
                <CopyButton text={active.install} />
              </div>
            </div>
          )}

          {/* Code example */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase tracking-widest text-[var(--fg-muted)] font-semibold">
                Example
              </p>
              <CopyButton text={active.code} />
            </div>
            <div className="rounded-xl bg-[var(--bg)] border border-[var(--border)] p-6">
              <pre className="font-mono text-sm text-emerald-400 overflow-x-auto leading-relaxed whitespace-pre">
                {active.code}
              </pre>
            </div>
          </div>

          {/* GitHub link */}
          {active.github && (
            <div className="mt-5 flex gap-4">
              <Link
                href={active.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[var(--fg-muted)] hover:text-violet-500 font-medium transition-colors duration-200"
              >
                <Github size={14} /> View source on GitHub <ExternalLink size={12} />
              </Link>
              <Link
                href="/api-reference"
                className="inline-flex items-center gap-2 text-sm text-[var(--fg-muted)] hover:text-violet-500 font-medium transition-colors duration-200"
              >
                Full API docs <ArrowRight size={12} />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Community Examples */}
      <section className="py-24 px-6 bg-[var(--bg-soft)] border-t border-[var(--border)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-[var(--fg)] mb-3 tracking-tight">
              Community examples
            </h2>
            <p className="text-[var(--fg-muted)]">
              Built by the AdvisorAI community. Open source, free to use.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {community.map(({ title, lang, desc, stars, color, bg }) => (
              <div
                key={title}
                className="group p-6 rounded-2xl bg-[var(--bg)] border border-[var(--border)] hover:border-violet-500/30 hover:shadow-xl hover:shadow-violet-500/10 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={`inline-block px-2.5 py-1 rounded-lg border text-xs font-semibold ${bg} ${color}`}>
                    {lang}
                  </span>
                  <span className="flex items-center gap-1 text-[var(--fg-muted)] text-xs">
                    <Star size={11} className="text-amber-400 fill-amber-400" />
                    {stars}
                  </span>
                </div>
                <h3 className="text-[var(--fg)] font-bold mb-2">{title}</h3>
                <p className="text-[var(--fg-muted)] text-sm leading-relaxed">{desc}</p>
                <div className="mt-4">
                  <Link
                    href="https://github.com/manziosee/AI-Powered-SME-Knowledge-Base-Auto-Advisor"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1 text-xs font-semibold ${color} hover:gap-2 transition-all duration-200`}
                  >
                    <Github size={12} /> View on GitHub
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="https://github.com/manziosee/AI-Powered-SME-Knowledge-Base-Auto-Advisor"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl border border-[var(--border)] text-[var(--fg)] font-bold hover:border-violet-500/30 hover:shadow-lg transition-all duration-300"
            >
              <Github size={16} /> Browse all examples on GitHub <ExternalLink size={14} className="text-[var(--fg-muted)]" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/5 to-transparent pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-4xl font-black text-[var(--fg)] mb-4 tracking-tight">
            Start building with AdvisorAI
          </h2>
          <p className="text-[var(--fg-muted)] mb-10 text-lg">
            Free API key included with every account. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-10 py-5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-black text-lg hover:from-violet-500 hover:to-purple-500 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/30 hover:-translate-y-1"
            >
              Get your free API key <ArrowRight size={20} />
            </Link>
            <Link
              href="/api-reference"
              className="inline-flex items-center gap-2 px-10 py-5 rounded-2xl border border-[var(--border)] text-[var(--fg)] font-bold text-lg hover:border-violet-500/40 hover:bg-[var(--bg-soft)] transition-all duration-300"
            >
              View API docs
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
