"use client";

import React from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  Brain,
  Search,
  ShieldCheck,
  BarChart2,
  Bell,
  Globe,
  Lock,
  Cpu,
  ArrowRight,
  Zap,
  Database,
  Layers,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Advisor",
    description:
      "Ask questions in plain English and get instant, cited answers drawn from your own uploaded documents. Powered by Groq Llama 3.3 for sub-500 ms responses.",
    href: "/how-it-works",
    color: "text-violet-500",
    bg: "bg-violet-500/10 border-violet-500/20",
  },
  {
    icon: Search,
    title: "Document Search",
    description:
      "Semantic vector search across all your PDFs, Word docs, and policies. Find exactly what you need even when you can't remember the exact wording.",
    href: "/quick-start",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10 border-cyan-500/20",
  },
  {
    icon: ShieldCheck,
    title: "Compliance Engine",
    description:
      "Automated compliance checks against 7+ African and international jurisdictions. Get a real-time compliance score and gap analysis for your business.",
    href: "/use-cases",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: BarChart2,
    title: "Analytics Dashboard",
    description:
      "Visual insights into your document library, query history, compliance trends, and team usage. Export reports in PDF or Excel with one click.",
    href: "/dashboard",
    color: "text-amber-500",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  {
    icon: Bell,
    title: "Deadline Alerts",
    description:
      "Never miss a filing deadline, license renewal, or regulatory report. AdvisorAI extracts dates from your documents and sends automated reminders.",
    href: "/how-it-works",
    color: "text-rose-500",
    bg: "bg-rose-500/10 border-rose-500/20",
  },
  {
    icon: Globe,
    title: "Multi-language Support",
    description:
      "Ask questions in English, French, Kinyarwanda, or Swahili. AdvisorAI understands and responds in the language your team works in.",
    href: "/use-cases",
    color: "text-blue-500",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    icon: Lock,
    title: "Data Security",
    description:
      "Multi-tenant isolation, AES-256 encryption at rest, TLS in transit, and GDPR-compliant processing. Your data never leaves your private namespace.",
    href: "/about",
    color: "text-orange-500",
    bg: "bg-orange-500/10 border-orange-500/20",
  },
  {
    icon: Cpu,
    title: "Custom ML Training",
    description:
      "Fine-tune AdvisorAI on your specific domain vocabulary, product catalogue, or internal policies. Upload a training dataset and deploy in hours.",
    href: "/quick-start",
    color: "text-pink-500",
    bg: "bg-pink-500/10 border-pink-500/20",
  },
];

const techPillars = [
  {
    icon: Zap,
    title: "Groq Llama 3.3",
    subtitle: "Inference engine",
    description:
      "Industry-leading language model running on Groq's LPU hardware for consistent sub-500 ms response times at any scale.",
    color: "from-violet-500 to-purple-600",
  },
  {
    icon: Database,
    title: "pgvector RAG",
    subtitle: "Retrieval-Augmented Generation",
    description:
      "All documents are chunked, embedded, and stored in a Postgres vector database. Every AI answer is grounded in your actual files — no hallucinations.",
    color: "from-cyan-500 to-blue-600",
  },
  {
    icon: Layers,
    title: "SentenceTransformers",
    subtitle: "Semantic embeddings",
    description:
      "State-of-the-art multilingual embedding models convert your documents into meaning-rich vectors, enabling semantic search across any language.",
    color: "from-emerald-500 to-teal-600",
  },
];

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <Navbar />

      {/* Hero */}
      <section className="pt-36 pb-24 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-violet-500 mb-4">
            Features
          </span>
          <h1 className="text-5xl md:text-6xl font-black text-[var(--fg)] mb-6 leading-tight">
            Everything your business needs to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-cyan-500">
              stay compliant and informed
            </span>
          </h1>
          <p className="text-[var(--fg-soft)] text-lg leading-relaxed max-w-2xl mx-auto mb-10">
            AdvisorAI packs AI-powered document intelligence, automated compliance
            monitoring, and real-time alerts into a single platform built for
            African and global SMEs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold hover:from-violet-500 hover:to-purple-500 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5"
            >
              Start free <ArrowRight size={16} />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-[var(--border)] text-[var(--fg)] font-bold hover:border-violet-500/40 hover:bg-[var(--bg-soft)] transition-all duration-300"
            >
              See how it works
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black text-[var(--fg)] tracking-tight mb-3">
              Every tool your team needs
            </h2>
            <p className="text-[var(--fg-muted)] max-w-xl mx-auto">
              Eight core capabilities, one unified platform. No switching between
              apps.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map(({ icon: Icon, title, description, href, color, bg }) => (
              <div
                key={title}
                className="group p-7 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border)] hover:border-violet-500/30 hover:shadow-xl hover:shadow-violet-500/10 hover:-translate-y-1 transition-all duration-300"
              >
                <div
                  className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-5 ${bg} group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon size={20} className={color} />
                </div>
                <h3 className="text-[var(--fg)] font-bold text-lg mb-2">{title}</h3>
                <p className="text-[var(--fg-muted)] text-sm leading-relaxed mb-4">
                  {description}
                </p>
                <Link
                  href={href}
                  className={`inline-flex items-center gap-1 text-sm font-semibold ${color} hover:gap-2 transition-all duration-200`}
                >
                  Learn more <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Pillars */}
      <section className="py-24 px-6 bg-[var(--bg-soft)] border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-violet-500 mb-4">
              Technology
            </span>
            <h2 className="text-3xl font-black text-[var(--fg)] tracking-tight mb-3">
              Built on cutting-edge AI
            </h2>
            <p className="text-[var(--fg-muted)] max-w-xl mx-auto">
              We chose best-in-class open components and assembled them into a
              production-grade platform you can trust.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {techPillars.map(({ icon: Icon, title, subtitle, description, color }) => (
              <div
                key={title}
                className="group relative p-8 rounded-2xl bg-[var(--bg)] border border-[var(--border)] hover:border-violet-500/30 hover:shadow-2xl hover:shadow-violet-500/10 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-2xl`}
                />
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                >
                  <Icon size={24} className="text-white" />
                </div>
                <p className="text-xs text-[var(--fg-muted)] uppercase tracking-widest mb-1 font-semibold">
                  {subtitle}
                </p>
                <h3 className="text-[var(--fg)] font-black text-xl mb-3">{title}</h3>
                <p className="text-[var(--fg-muted)] text-sm leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/5 to-transparent pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-4xl font-black text-[var(--fg)] mb-4 tracking-tight">
            Ready to put these features to work?
          </h2>
          <p className="text-[var(--fg-muted)] mb-10 text-lg">
            Create your free account in 60 seconds. No credit card required.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-10 py-5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-black text-lg hover:from-violet-500 hover:to-purple-500 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/30 hover:-translate-y-1"
          >
            Get started for free <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
