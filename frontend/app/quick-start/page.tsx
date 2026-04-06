"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { UserPlus, Upload, MessageSquare, ArrowRight, Copy, Check, Terminal, BookOpen, Zap, Play } from "lucide-react";

const quickSteps = [
  {
    number: "01", icon: UserPlus, title: "Create your account",
    description: "Sign up at advisorai.app/register with your email. The Starter plan is free forever — no credit card required. Your private document namespace is created instantly.",
    tip: "Use your work email to later invite team members to the same namespace.",
    color: "text-violet-500", iconGrad: "from-violet-600 to-purple-600",
    glow: "shadow-[0_0_20px_rgba(124,58,237,0.3)]",
    href: "/register", cta: "Create account",
  },
  {
    number: "02", icon: Upload, title: "Upload your first document",
    description: "Drag and drop any PDF, DOCX, or Excel file into the dashboard. AdvisorAI will split it into semantic chunks and build vector embeddings — the whole process takes about 8 seconds per document.",
    tip: "Start with a high-value document like your tax filing guide or employment policy.",
    color: "text-cyan-500", iconGrad: "from-cyan-500 to-teal-500",
    glow: "shadow-[0_0_20px_rgba(6,182,212,0.3)]",
    href: "/dashboard", cta: "Go to dashboard",
  },
  {
    number: "03", icon: MessageSquare, title: "Ask your first question",
    description: "Type any question in plain English. AdvisorAI finds the most relevant passages and produces a cited answer in under 500 ms. Every answer shows which document and page it came from.",
    tip: "Try: \"What are the penalties for late VAT filing?\" or \"Summarise the leave policy.\"",
    color: "text-emerald-500", iconGrad: "from-emerald-500 to-teal-500",
    glow: "shadow-[0_0_20px_rgba(52,211,153,0.3)]",
    href: "/dashboard", cta: "Open AI Advisor",
  },
];

const apiExamples = {
  curl: `# 1. Get a token
TOKEN=$(curl -s -X POST https://advisorai-backend.fly.dev/api/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"you@company.com","password":"your_password"}' \\
  | jq -r '.access_token')

# 2. Upload a document
curl -X POST https://advisorai-backend.fly.dev/api/v1/documents/upload \\
  -H "Authorization: Bearer $TOKEN" \\
  -F "file=@./compliance_policy.pdf"

# 3. Ask a question
curl -X POST https://advisorai-backend.fly.dev/api/v1/advisor/ask \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "What are our data retention obligations?"}'`,
  python: `import requests

BASE = "https://advisorai-backend.fly.dev/api/v1"

# 1. Authenticate
res = requests.post(f"{BASE}/auth/login", json={
    "email": "you@company.com",
    "password": "your_password"
})
token = res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 2. Upload a document
with open("compliance_policy.pdf", "rb") as f:
    doc = requests.post(f"{BASE}/documents/upload",
        headers=headers, files={"file": f}).json()
print(f"Uploaded: {doc['id']}")

# 3. Ask a question
answer = requests.post(f"{BASE}/advisor/ask",
    headers=headers,
    json={"query": "What are our data retention obligations?"}
).json()

print(answer["answer"])
print("Sources:", answer["sources"])`,
};

type Tab = "curl" | "python";

const nextSteps = [
  { icon: Terminal, title: "API Reference",   desc: "Explore all REST endpoints with interactive examples.", href: "/api-reference", color: "text-violet-500", iconGrad: "from-violet-600 to-purple-600" },
  { icon: BookOpen, title: "Documentation",   desc: "Full guides on compliance setup, ML training, and team management.", href: "/docs", color: "text-cyan-500", iconGrad: "from-cyan-500 to-teal-500" },
  { icon: Zap,      title: "All Features",    desc: "See everything AdvisorAI can do for your business.", href: "/features", color: "text-emerald-500", iconGrad: "from-emerald-500 to-teal-500" },
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

export default function QuickStartPage() {
  const [activeTab, setActiveTab] = useState<Tab>("curl");

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
            <Zap size={11} />
            Quick start
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-[var(--fg)] mb-6 leading-[1.0] tracking-tight">
            Get started in{" "}
            <span className="gradient-text-brand">5 minutes</span>
          </h1>
          <p className="text-[var(--fg-muted)] text-xl leading-relaxed max-w-2xl mx-auto">
            Three steps and you&apos;ll have a working AI knowledge base built from your own documents. No configuration, no installation required.
          </p>
        </div>
      </section>

      {/* ── 3 Steps ── */}
      <section className="py-8 px-6 border-t border-[var(--border)]">
        <div className="max-w-4xl mx-auto space-y-5">
          {quickSteps.map(({ number, icon: Icon, title, description, tip, color, iconGrad, glow, href, cta }, i) => (
            <div key={number}
              className="group relative flex flex-col md:flex-row gap-8 p-8 rounded-3xl bg-[var(--bg-soft)] border border-[var(--border)] hover:border-violet-500/25 hover:shadow-xl hover:shadow-violet-500/8 transition-all duration-300">
              {/* Step number watermark */}
              <div className={`absolute top-6 right-8 text-8xl font-black leading-none select-none pointer-events-none ${color} opacity-5 group-hover:opacity-10 transition-opacity`}>
                {number}
              </div>
              {/* Icon */}
              <div className="flex-shrink-0 flex flex-col items-center gap-3">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${iconGrad} flex items-center justify-center ${glow} group-hover:scale-110 transition-transform`}>
                  <Icon size={24} className="text-white" />
                </div>
                {i < quickSteps.length - 1 && (
                  <div className="hidden md:block w-px h-8 bg-gradient-to-b from-[var(--border)] to-transparent" />
                )}
              </div>
              {/* Content */}
              <div className="flex-1 relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-xs font-black ${color} opacity-60`}>STEP {number}</span>
                </div>
                <h3 className="text-[var(--fg)] font-black text-2xl mb-3 tracking-tight">{title}</h3>
                <p className="text-[var(--fg-muted)] leading-relaxed mb-4 text-base">{description}</p>
                <div className={`inline-flex items-start gap-2 px-4 py-3 rounded-xl border text-sm mb-5 bg-[var(--surface)] border-[var(--border)]`}>
                  <span className={`font-bold ${color} flex-shrink-0`}>💡 Tip:</span>
                  <span className="text-[var(--fg-soft)]">{tip}</span>
                </div>
                <div>
                  <Link href={href}
                    className={`inline-flex items-center gap-2 text-sm font-bold ${color} hover:gap-3 transition-all duration-200`}>
                    {cta} <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── API Code Examples ── */}
      <section className="py-24 px-6 border-t border-[var(--border)] bg-[var(--bg-soft)]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Terminal size={16} className="text-violet-500" />
            </div>
            <h2 className="text-3xl font-black text-[var(--fg)] tracking-tight">API integration</h2>
          </div>
          <p className="text-[var(--fg-muted)] mb-8 text-base">
            Already have an app? Integrate AdvisorAI into your existing workflow in minutes using the REST API.
          </p>
          <div className="flex gap-1 mb-5 p-1 rounded-xl bg-[var(--surface)] border border-[var(--border)] w-fit">
            {(["curl", "python"] as Tab[]).map((tab) => (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab ? "bg-violet-600 text-white shadow-md" : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
                }`}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <CodeBlock code={apiExamples[activeTab]} lang={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} />
        </div>
      </section>

      {/* ── Demo ── */}
      <section className="py-24 px-6 border-t border-[var(--border)]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-black text-[var(--fg)] mb-3 tracking-tight">Watch the 5-minute walkthrough</h2>
          <p className="text-[var(--fg-muted)] mb-10 text-base">See all three steps in action with a real document.</p>
          <div className="relative rounded-3xl border border-[var(--border)] overflow-hidden aspect-video flex items-center justify-center group cursor-pointer hover:border-violet-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/8 via-transparent to-cyan-500/8" />
            <div className="absolute inset-0 bg-dots opacity-15" />
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 flex items-center justify-center shadow-[0_0_40px_rgba(124,58,237,0.4)] group-hover:scale-110 transition-transform duration-300">
                <Play size={32} className="text-white ml-1" fill="white" />
              </div>
              <span className="text-[var(--fg-muted)] text-sm font-medium">Quick-start walkthrough — 5 min</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── What's Next ── */}
      <section className="py-24 px-6 bg-[var(--bg-soft)] border-t border-[var(--border)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-[var(--fg)] mb-3 tracking-tight">What&apos;s next?</h2>
            <p className="text-[var(--fg-muted)] text-base">Once your first document is live, explore these resources.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {nextSteps.map(({ icon: Icon, title, desc, href, color, iconGrad }) => (
              <Link key={title} href={href}
                className="group p-7 rounded-3xl bg-[var(--bg)] border border-[var(--border)] hover:border-violet-500/25 hover:shadow-xl hover:shadow-violet-500/8 hover:-translate-y-1 transition-all duration-300">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${iconGrad} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={20} className="text-white" />
                </div>
                <h3 className="text-[var(--fg)] font-black text-lg mb-2">{title}</h3>
                <p className="text-[var(--fg-muted)] text-sm leading-relaxed">{desc}</p>
                <div className={`mt-4 flex items-center gap-1.5 text-sm font-bold ${color} group-hover:gap-2.5 transition-all duration-200`}>
                  Explore <ArrowRight size={14} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
