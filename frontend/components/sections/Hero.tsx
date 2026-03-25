"use client";

import React from "react";
import { ArrowRight, Sparkles, Shield, Brain, CheckCircle } from "lucide-react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";

const kpiCards = [
  { label: "Documents",   val: "1,248", color: "text-cyan-500",    bg: "bg-cyan-500/10 border-cyan-500/20"       },
  { label: "Compliance",  val: "94%",   color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { label: "Risks Found", val: "3",     color: "text-rose-500",    bg: "bg-rose-500/10 border-rose-500/20"       },
  { label: "AI Queries",  val: "876",   color: "text-violet-500",  bg: "bg-violet-500/10 border-violet-500/20"   },
];

const trust = [
  { icon: Shield,   label: "SOC 2 ready"        },
  { icon: Brain,    label: "LangChain RAG"       },
  { icon: Sparkles, label: "Groq Llama 3.1 70B" },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[var(--bg)] pt-20">

      {/* Dot grid background */}
      <div className="absolute inset-0 bg-dots opacity-60 pointer-events-none" />

      {/* Glows */}
      <div className="glow-violet-radial absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-[120px] pointer-events-none opacity-60" />
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-cyan-500/8 rounded-full blur-[100px] pointer-events-none" />

      {/* Bottom fade into next section */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[var(--bg)] to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center flex flex-col items-center gap-8">

        {/* Badge */}
        <div className="animate-fade-up delay-0">
          <Badge dot className="gap-2">
            <Sparkles size={11} />
            Powered by Groq · LangChain · pgvector
          </Badge>
        </div>

        {/* Headline */}
        <div className="animate-fade-up delay-80">
          <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight text-balance">
            <span className="text-[var(--fg)]">Your Business,</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 via-cyan-400 to-blue-500">
              Always Compliant.
            </span>
            <br />
            <span className="text-[var(--fg)]">Always Advised.</span>
          </h1>
        </div>

        {/* Sub-headline */}
        <div className="animate-fade-up delay-160">
          <p className="text-lg md:text-xl text-[var(--fg-soft)] max-w-2xl leading-relaxed text-balance">
            AI-powered knowledge base and auto-advisor for small and medium
            enterprises. Upload your documents, ask questions in plain language,
            and stay ahead of compliance deadlines — automatically.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 animate-fade-up delay-240">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all shadow-[0_0_24px_rgba(124,58,237,0.35)] hover:shadow-[0_0_36px_rgba(124,58,237,0.5)] hover:-translate-y-0.5"
          >
            Start for free <ArrowRight size={16} />
          </Link>
          <Link
            href="#how-it-works"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-violet-500/30 transition-all text-sm font-medium hover:-translate-y-0.5"
          >
            See how it works
          </Link>
        </div>

        {/* Trust signals */}
        <div className="flex flex-wrap justify-center items-center gap-6 text-[var(--fg-muted)] text-xs tracking-wide animate-fade-up delay-320">
          {trust.map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-1.5">
              <Icon size={13} className="text-violet-500" />
              {label}
            </span>
          ))}
          <span className="hidden sm:block text-[var(--border)]">•</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle size={12} className="text-emerald-500" /> No credit card required
          </span>
          <span className="hidden sm:block text-[var(--border)]">•</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle size={12} className="text-emerald-500" /> Deploy in minutes
          </span>
        </div>

        {/* Dashboard mockup */}
        <div className="w-full max-w-4xl mt-4 animate-fade-up delay-400">
          <div className="relative rounded-2xl overflow-hidden border border-[var(--border)] shadow-2xl shadow-black/20">

            {/* macOS top bar */}
            <div className="flex items-center gap-2 px-4 py-3 bg-[var(--bg-muted)] border-b border-[var(--border)]">
              <span className="w-3 h-3 rounded-full bg-rose-500/70" />
              <span className="w-3 h-3 rounded-full bg-amber-500/70" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
              <span className="ml-4 flex-1 h-5 rounded-full bg-[var(--surface)] max-w-xs" />
            </div>

            {/* Fake dashboard body */}
            <div className="bg-[var(--bg-soft)] p-6 min-h-[320px] grid grid-cols-12 gap-4">
              {/* Sidebar */}
              <div className="col-span-2 flex flex-col gap-3">
                <div className="h-6 rounded-md bg-violet-500/20 border border-violet-500/20 w-full" />
                <div className="h-5 rounded-md bg-[var(--surface)] mock-bar-80" />
                <div className="h-5 rounded-md bg-[var(--surface)] mock-bar-55" />
                <div className="h-5 rounded-md bg-[var(--surface)] mock-bar-70" />
                <div className="h-5 rounded-md bg-[var(--surface)] mock-bar-45" />
              </div>

              {/* Main content */}
              <div className="col-span-10 flex flex-col gap-4">
                {/* KPI cards */}
                <div className="grid grid-cols-4 gap-3">
                  {kpiCards.map((card) => (
                    <div key={card.label} className={`rounded-xl p-3 border ${card.bg}`}>
                      <div className="h-2 w-12 rounded bg-[var(--surface)] mb-2" />
                      <div className={`text-lg font-bold ${card.color}`}>{card.val}</div>
                      <div className="text-[var(--fg-muted)] text-xs mt-0.5">{card.label}</div>
                    </div>
                  ))}
                </div>

                {/* AI chat area */}
                <div className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 flex flex-col gap-3 min-h-[160px]">
                  <div className="flex justify-end">
                    <div className="bg-violet-500/10 border border-violet-500/20 text-[var(--fg-soft)] text-xs px-3 py-2 rounded-2xl rounded-tr-sm max-w-xs">
                      What are our compliance deadlines for Q2?
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-violet-500/15 border border-violet-500/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Brain size={12} className="text-violet-500" />
                    </div>
                    <div className="bg-[var(--bg-muted)] border border-[var(--border)] text-[var(--fg-soft)] text-xs px-3 py-2 rounded-2xl rounded-tl-sm max-w-sm">
                      Based on your documents, you have 3 upcoming deadlines:
                      <br />• VAT return — <span className="text-amber-500 font-medium">April 15</span>
                      <br />• PAYE filing — <span className="text-amber-500 font-medium">April 30</span>
                      <br />• License renewal — <span className="text-rose-500 font-medium">May 1</span>
                    </div>
                  </div>
                  {/* Typing dots */}
                  <div className="flex gap-1 ml-8">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500/50 animate-pulse-slow delay-dot-1" />
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500/50 animate-pulse-slow delay-dot-2" />
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500/50 animate-pulse-slow delay-dot-3" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Glow under mockup */}
          <div className="h-px w-2/3 mx-auto bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
        </div>
      </div>
    </section>
  );
}
