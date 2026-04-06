"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Github, ArrowRight, Copy, Check, ExternalLink, Terminal, Star, Code2, Zap } from "lucide-react";

const BASE = "https://advisorai-backend.fly.dev/api/v1";

const pythonExample = `import requests

BASE = "${BASE}"

# Option A: API Key (sk_ prefix) — no expiry, great for CI/CD
headers = {"X-API-Key": "sk_your_api_key_here"}

# Option B: JWT login
res = requests.post(f"{BASE}/auth/login",
    json={"email": "you@co.com", "password": "••••"})
headers = {"Authorization": f"Bearer {res.json()['access_token']}"}

# Upload a document
with open("./compliance_policy.pdf", "rb") as f:
    doc = requests.post(f"{BASE}/documents/upload",
        headers=headers, files={"file": f}).json()
print(f"Document ready: {doc['id']}")

# Ask a question
answer = requests.post(f"{BASE}/advisor/ask",
    headers=headers,
    json={"query": "What are our VAT filing deadlines?"}
).json()
print(answer["answer"])
print("Sources:", answer["sources"])

# Check compliance score
score = requests.get(f"{BASE}/analytics/compliance-score",
    headers=headers).json()
print(f"Score: {score['compliance_score']}%")`;

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

const sdks = [
  {
    id: "python" as SdkId,
    lang: "Python",
    badge: "Python 3.9+",
    install: "pip install advisorai",
    code: pythonExample,
    status: "Official SDK",
    desc: "Full-featured Python SDK with sync and async support, type hints, and automatic retries.",
    github: "https://github.com/manziosee/AI-Powered-SME-Knowledge-Base-Auto-Advisor",
    iconGrad: "from-blue-500 to-indigo-600",
    accentColor: "border-blue-500/25 bg-blue-500/5",
    badgeColor: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
    statusColor: "text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20",
  },
  {
    id: "js" as SdkId,
    lang: "JavaScript / TypeScript",
    badge: "Node 18+ / Browser",
    install: "npm install @advisorai/sdk",
    code: jsExample,
    status: "Official SDK",
    desc: "TypeScript-first SDK with full type safety, streaming support, and an isomorphic fetch client.",
    github: "https://github.com/manziosee/AI-Powered-SME-Knowledge-Base-Auto-Advisor",
    iconGrad: "from-amber-500 to-orange-500",
    accentColor: "border-amber-500/25 bg-amber-500/5",
    badgeColor: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
    statusColor: "text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20",
  },
  {
    id: "rest" as SdkId,
    lang: "REST API",
    badge: "Any language",
    install: null,
    code: restExample,
    status: "No SDK needed",
    desc: "Use the REST API directly from any HTTP client. Works with curl, Go, Ruby, PHP, and more.",
    github: null,
    iconGrad: "from-emerald-500 to-teal-500",
    accentColor: "border-emerald-500/25 bg-emerald-500/5",
    badgeColor: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    statusColor: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  },
];

const community = [
  { title: "FastAPI middleware example", lang: "Python",     desc: "Drop-in middleware to add AdvisorAI-powered search to any FastAPI app.", stars: "142", color: "text-blue-500",    bg: "bg-blue-500/10 border-blue-500/20",    iconGrad: "from-blue-500 to-indigo-600"   },
  { title: "Next.js starter template",   lang: "TypeScript", desc: "Full-stack starter with AdvisorAI SDK, Tailwind, and shadcn/ui pre-wired.", stars: "89",  color: "text-amber-500",   bg: "bg-amber-500/10 border-amber-500/20",   iconGrad: "from-amber-500 to-orange-500"  },
  { title: "Zapier integration template",lang: "No-code",    desc: "Trigger AdvisorAI questions from any Zapier workflow using webhooks.", stars: "57",  color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20", iconGrad: "from-emerald-500 to-teal-500" },
];

function CopyButton({ text, dark = false }: { text: string; dark?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button type="button"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        dark
          ? "bg-white/8 border border-white/10 text-white/40 hover:text-white/80"
          : "bg-[var(--surface)] border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)]"
      }`}>
      {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/8">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/60" />
            <div className="w-3 h-3 rounded-full bg-amber-400/60" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
          </div>
          <span className="text-white/30 text-[11px] font-mono">{lang}</span>
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

export default function SdksPage() {
  const [activeTab, setActiveTab] = useState<SdkId>("python");
  const active = sdks.find((s) => s.id === activeTab)!;

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <Navbar />

      {/* ── Hero ── */}
      <section className="pt-36 pb-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-[160px]"
            style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.10) 0%, transparent 70%)" }} />
          <div className="absolute inset-0 bg-dots opacity-20" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/25 bg-violet-500/8 text-xs font-bold tracking-widest text-violet-600 dark:text-violet-400 uppercase mb-6">
            <Code2 size={11} />
            SDKs & Examples
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-[var(--fg)] mb-6 leading-[1.0] tracking-tight">
            Official SDKs &{" "}
            <span className="gradient-text-brand">Code Examples</span>
          </h1>
          <p className="text-[var(--fg-muted)] text-xl leading-relaxed max-w-2xl mx-auto mb-8">
            Integrate AdvisorAI into your application in minutes. Pick the SDK for your language or talk directly to the REST API.
          </p>
          <Link href="https://github.com/manziosee/AI-Powered-SME-Knowledge-Base-Auto-Advisor" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[var(--border)] text-[var(--fg)] font-bold text-sm hover:border-violet-500/30 hover:shadow-lg hover:bg-[var(--surface)] transition-all">
            <Github size={16} /> View on GitHub <ExternalLink size={12} className="text-[var(--fg-muted)]" />
          </Link>
        </div>
      </section>

      {/* ── SDK Switcher ── */}
      <section className="py-8 px-6 border-t border-[var(--border)]">
        <div className="max-w-5xl mx-auto">
          {/* Tab cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {sdks.map((sdk) => (
              <button key={sdk.id} type="button" onClick={() => setActiveTab(sdk.id)}
                className={`p-5 rounded-2xl border text-left transition-all duration-200 ${
                  activeTab === sdk.id
                    ? `${sdk.accentColor} border-opacity-100 shadow-lg`
                    : "border-[var(--border)] bg-[var(--bg-soft)] hover:border-violet-500/20"
                }`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[10px] font-bold ${sdk.badgeColor}`}>
                    {sdk.badge}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[10px] font-bold ${sdk.statusColor}`}>
                    {sdk.status}
                  </span>
                </div>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${sdk.iconGrad} flex items-center justify-center mb-3 shadow-md`}>
                  <Code2 size={15} className="text-white" />
                </div>
                <h3 className="text-[var(--fg)] font-black text-base mb-1">{sdk.lang}</h3>
                <p className="text-[var(--fg-muted)] text-xs leading-relaxed">{sdk.desc}</p>
              </button>
            ))}
          </div>

          {/* Install command */}
          {active.install && (
            <div className="mb-5">
              <p className="text-[10px] uppercase tracking-widest text-[var(--fg-muted)] font-bold mb-2">Install</p>
              <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border)]">
                <Terminal size={14} className="text-violet-500 flex-shrink-0" />
                <code className="font-mono text-sm flex-1 text-violet-600 dark:text-violet-400">{active.install}</code>
                <CopyButton text={active.install} />
              </div>
            </div>
          )}

          {/* Code example */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[var(--fg-muted)] font-bold mb-3">Example</p>
            <CodeBlock code={active.code} lang={active.lang} />
          </div>

          {/* GitHub link */}
          {active.github && (
            <div className="mt-5 flex gap-5">
              <Link href={active.github} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[var(--fg-muted)] hover:text-violet-500 font-medium transition-colors">
                <Github size={14} /> View source on GitHub <ExternalLink size={12} />
              </Link>
              <Link href="/api-reference"
                className="inline-flex items-center gap-2 text-sm text-[var(--fg-muted)] hover:text-violet-500 font-medium transition-colors">
                Full API docs <ArrowRight size={12} />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Community Examples ── */}
      <section className="py-24 px-6 bg-[var(--bg-soft)] border-t border-[var(--border)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-[var(--fg)] mb-3 tracking-tight">Community examples</h2>
            <p className="text-[var(--fg-muted)] text-base">Built by the AdvisorAI community. Open source, free to use.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {community.map(({ title, lang, desc, stars, color, bg, iconGrad }) => (
              <div key={title}
                className="group p-6 rounded-3xl bg-[var(--bg)] border border-[var(--border)] hover:border-violet-500/25 hover:shadow-xl hover:shadow-violet-500/8 hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-bold ${bg} ${color}`}>{lang}</span>
                  <span className="flex items-center gap-1 text-[var(--fg-muted)] text-xs">
                    <Star size={11} className="text-amber-400 fill-amber-400" />{stars}
                  </span>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${iconGrad} flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                  <Code2 size={16} className="text-white" />
                </div>
                <h3 className="text-[var(--fg)] font-bold text-base mb-2">{title}</h3>
                <p className="text-[var(--fg-muted)] text-sm leading-relaxed">{desc}</p>
                <div className="mt-4">
                  <Link href="https://github.com/manziosee/AI-Powered-SME-Knowledge-Base-Auto-Advisor" target="_blank" rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 text-xs font-bold ${color} hover:gap-2.5 transition-all`}>
                    <Github size={12} /> View on GitHub
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="https://github.com/manziosee/AI-Powered-SME-Knowledge-Base-Auto-Advisor" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl border border-[var(--border)] text-[var(--fg)] font-bold hover:border-violet-500/30 hover:shadow-lg hover:bg-[var(--surface)] transition-all">
              <Github size={16} /> Browse all examples on GitHub <ExternalLink size={14} className="text-[var(--fg-muted)]" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-28 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(124,58,237,0.06) 0%, transparent 70%)" }} />
        <div className="relative max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/25 bg-violet-500/8 text-xs font-bold tracking-widest text-violet-600 dark:text-violet-400 uppercase mb-6">
            <Zap size={11} />
            Start building
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-[var(--fg)] mb-4 tracking-tight">
            Start building with <span className="gradient-text-brand">AdvisorAI</span>
          </h2>
          <p className="text-[var(--fg-muted)] mb-10 text-lg">Free API key included with every account. No credit card required.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-black text-base hover:from-violet-500 hover:to-purple-500 transition-all shadow-[0_4px_24px_rgba(124,58,237,0.4)] hover:shadow-[0_8px_40px_rgba(124,58,237,0.55)] hover:-translate-y-0.5">
              Get your free API key <ArrowRight size={18} />
            </Link>
            <Link href="/api-reference"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl border border-[var(--border)] text-[var(--fg)] font-bold text-base hover:border-violet-500/30 hover:bg-[var(--surface)] transition-all">
              View API docs
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
