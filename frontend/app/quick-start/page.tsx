"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  UserPlus,
  Upload,
  MessageSquare,
  ArrowRight,
  Copy,
  Check,
  BookOpen,
  Terminal,
  Zap,
  Play,
} from "lucide-react";

const quickSteps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Create your account",
    description:
      "Sign up at advisorai.app/register with your email. The Starter plan is free forever — no credit card required. Your private document namespace is created instantly.",
    tip: "Use your work email to later invite team members to the same namespace.",
    color: "text-violet-500",
    bg: "bg-violet-500/10 border-violet-500/20",
    href: "/register",
    cta: "Create account",
  },
  {
    number: "02",
    icon: Upload,
    title: "Upload your first document",
    description:
      "Drag and drop any PDF, DOCX, or Excel file into the dashboard. AdvisorAI will split it into semantic chunks and build vector embeddings — the whole process takes about 8 seconds per document.",
    tip: "Start with a high-value document like your tax filing guide or employment policy.",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10 border-cyan-500/20",
    href: "/dashboard",
    cta: "Go to dashboard",
  },
  {
    number: "03",
    icon: MessageSquare,
    title: "Ask your first question",
    description:
      "Type any question in plain English (or French, Swahili, Kinyarwanda). AdvisorAI finds the most relevant passages and produces a cited answer in under 500 ms. Every answer shows which document and page it came from.",
    tip: "Try: \"What are the penalties for late VAT filing?\" or \"Summarise the leave policy.\"",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    href: "/dashboard",
    cta: "Open AI Advisor",
  },
];

const apiExamples = {
  curl: `# 1. Get a token
TOKEN=$(curl -s -X POST https://advisorai-backend.fly.dev/api/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"you@company.com","password":"your_password"}' \\
  | jq -r '.access_token')

# If 2FA is enabled, login returns 403 {"code":"2fa_required","user_id":"..."}
# Complete with:
# TOKEN=$(curl -s -X POST .../auth/2fa/validate \\
#   -H "Content-Type: application/json" \\
#   -d '{"user_id":"<id>","code":"123456"}' | jq -r '.access_token')

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

# Handle 2FA if enabled
if res.status_code == 403 and res.json().get("code") == "2fa_required":
    user_id = res.json()["user_id"]
    code = input("Enter your 6-digit TOTP code: ")
    res = requests.post(f"{BASE}/auth/2fa/validate",
        json={"user_id": user_id, "code": code})

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
  {
    icon: Terminal,
    title: "API Reference",
    desc: "Explore all 20+ REST endpoints with interactive examples.",
    href: "/api-reference",
    color: "text-violet-500",
    bg: "bg-violet-500/10 border-violet-500/20",
  },
  {
    icon: BookOpen,
    title: "Documentation",
    desc: "Full guides on compliance setup, ML training, and team management.",
    href: "/docs",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10 border-cyan-500/20",
  },
  {
    icon: Zap,
    title: "All Features",
    desc: "See everything AdvisorAI can do for your business.",
    href: "/features",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
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

export default function QuickStartPage() {
  const [activeTab, setActiveTab] = useState<Tab>("curl");

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <Navbar />

      {/* Hero */}
      <section className="pt-36 pb-20 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-violet-500 mb-4">
            Quick start
          </span>
          <h1 className="text-5xl md:text-6xl font-black text-[var(--fg)] mb-6 leading-tight">
            Get started in{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-cyan-500">
              5 minutes
            </span>
          </h1>
          <p className="text-[var(--fg-soft)] text-lg leading-relaxed max-w-xl mx-auto">
            Three steps and you&apos;ll have a working AI knowledge base built from
            your own documents. No configuration, no installation required.
          </p>
        </div>
      </section>

      {/* 3 Steps */}
      <section className="py-8 px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {quickSteps.map(({ number, icon: Icon, title, description, tip, color, bg, href, cta }) => (
            <div
              key={number}
              className="group flex flex-col md:flex-row gap-6 p-8 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border)] hover:border-violet-500/30 hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300"
            >
              <div className="flex-shrink-0">
                <span className={`text-6xl font-black leading-none ${color} opacity-20 group-hover:opacity-40 transition-opacity select-none`}>
                  {number}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${bg} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={18} className={color} />
                  </div>
                  <h3 className="text-[var(--fg)] font-black text-xl">{title}</h3>
                </div>
                <p className="text-[var(--fg-muted)] leading-relaxed mb-4">{description}</p>
                <div className={`inline-block px-4 py-2 rounded-xl border text-sm mb-5 ${bg} ${color}`}>
                  <span className="font-semibold">Tip: </span>{tip}
                </div>
                <div>
                  <Link
                    href={href}
                    className={`inline-flex items-center gap-2 text-sm font-bold ${color} hover:gap-3 transition-all duration-200`}
                  >
                    {cta} <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* API Code Examples */}
      <section className="py-20 px-6 border-t border-[var(--border)]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-[var(--fg)] mb-3 tracking-tight">
            API integration
          </h2>
          <p className="text-[var(--fg-muted)] mb-8">
            Already have an app? Integrate AdvisorAI into your existing workflow
            in minutes using the REST API.
          </p>

          <div className="flex gap-2 mb-3">
            {(["curl", "python"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab
                    ? "bg-violet-500/10 border border-violet-500/30 text-violet-500"
                    : "text-[var(--fg-muted)] hover:text-[var(--fg)] border border-transparent hover:border-[var(--border)]"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="relative rounded-xl bg-[var(--bg)] border border-[var(--border)] p-6">
            <div className="absolute top-4 right-4">
              <CopyButton text={apiExamples[activeTab]} />
            </div>
            <pre className="font-mono text-sm text-emerald-400 overflow-x-auto leading-relaxed whitespace-pre">
              {apiExamples[activeTab]}
            </pre>
          </div>
        </div>
      </section>

      {/* Demo Placeholder */}
      <section className="py-20 px-6 bg-[var(--bg-soft)] border-t border-[var(--border)]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-black text-[var(--fg)] mb-3 tracking-tight">
            Watch the 5-minute walkthrough
          </h2>
          <p className="text-[var(--fg-muted)] mb-10">
            See all three steps in action with a real document.
          </p>
          <div className="relative rounded-3xl bg-[var(--bg)] border border-[var(--border)] overflow-hidden aspect-video flex items-center justify-center group cursor-pointer hover:border-violet-500/30 transition-colors duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/10" />
            <div className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-violet-500/40 group-hover:scale-110 transition-transform duration-300">
              <Play size={32} className="text-white ml-1" fill="white" />
            </div>
            <div className="absolute bottom-6 text-[var(--fg-muted)] text-sm font-medium">
              Quick-start walkthrough — 5 min
            </div>
          </div>
        </div>
      </section>

      {/* What's Next */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-[var(--fg)] mb-3 tracking-tight">
              What&apos;s next?
            </h2>
            <p className="text-[var(--fg-muted)]">
              Once your first document is live, explore these resources.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {nextSteps.map(({ icon: Icon, title, desc, href, color, bg }) => (
              <Link
                key={title}
                href={href}
                className="group p-7 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border)] hover:border-violet-500/30 hover:shadow-xl hover:shadow-violet-500/10 hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-5 ${bg} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={22} className={color} />
                </div>
                <h3 className="text-[var(--fg)] font-bold text-lg mb-2">{title}</h3>
                <p className="text-[var(--fg-muted)] text-sm leading-relaxed">{desc}</p>
                <div className={`mt-4 flex items-center gap-1 text-sm font-semibold ${color} group-hover:gap-2 transition-all duration-200`}>
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
