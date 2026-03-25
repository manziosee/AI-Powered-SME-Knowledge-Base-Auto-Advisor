"use client";

import React from "react";
import { ArrowRight, CheckCircle, Clock, CreditCard, Infinity, RotateCcw, FileText, Brain, ShieldCheck, TrendingUp } from "lucide-react";
import Link from "next/link";

const perks = [
  { icon: Clock,       text: "Set up in under 5 minutes" },
  { icon: CreditCard,  text: "No credit card required"   },
  { icon: Infinity,    text: "Free plan — no expiry"     },
  { icon: RotateCcw,   text: "Cancel anytime"            },
];

export default function CTA() {
  return (
    <section className="py-28 px-6 relative overflow-hidden bg-[var(--bg-soft)]">

      {/* ── Background only — no overlapping shapes ── */}
      <div className="absolute inset-0 bg-dots opacity-25 pointer-events-none" />
      {/* Soft glow behind center */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[360px] rounded-full bg-violet-600/8 blur-[120px] pointer-events-none" />
      {/* Corner accents */}
      <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-violet-500/5 blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-cyan-500/5 blur-[80px] pointer-events-none" />

      {/* ── Side floating stat cards — LEFT ── */}
      <div className="hidden xl:flex flex-col gap-3 absolute left-[calc(50%-580px)] top-1/2 -translate-y-1/2 w-48">
        {/* Documents card */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-lg">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/12 border border-cyan-500/25 flex items-center justify-center flex-shrink-0">
            <FileText size={16} className="text-cyan-500" />
          </div>
          <div>
            <p className="text-[var(--fg)] text-sm font-black leading-none">1,248</p>
            <p className="text-[var(--fg-muted)] text-[10px] mt-0.5">Documents indexed</p>
          </div>
        </div>
        {/* Compliance card */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-lg">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/12 border border-emerald-500/25 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={16} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-[var(--fg)] text-sm font-black leading-none">94%</p>
            <p className="text-[var(--fg-muted)] text-[10px] mt-0.5">Compliance score</p>
          </div>
        </div>
      </div>

      {/* ── Side floating stat cards — RIGHT ── */}
      <div className="hidden xl:flex flex-col gap-3 absolute right-[calc(50%-580px)] top-1/2 -translate-y-1/2 w-48">
        {/* AI Queries */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-lg">
          <div className="w-9 h-9 rounded-xl bg-violet-500/12 border border-violet-500/25 flex items-center justify-center flex-shrink-0">
            <Brain size={16} className="text-violet-500" />
          </div>
          <div>
            <p className="text-[var(--fg)] text-sm font-black leading-none">876</p>
            <p className="text-[var(--fg-muted)] text-[10px] mt-0.5">AI queries today</p>
          </div>
        </div>
        {/* Response time */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-lg">
          <div className="w-9 h-9 rounded-xl bg-amber-500/12 border border-amber-500/25 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={16} className="text-amber-500" />
          </div>
          <div>
            <p className="text-[var(--fg)] text-sm font-black leading-none">&lt; 500ms</p>
            <p className="text-[var(--fg-muted)] text-[10px] mt-0.5">Avg answer time</p>
          </div>
        </div>
      </div>

      {/* ── Main content — center column only ── */}
      <div className="relative z-10 max-w-2xl mx-auto text-center flex flex-col items-center">

        {/* Eyebrow */}
        <p className="text-xs text-violet-600 dark:text-violet-400 tracking-[0.28em] uppercase font-bold mb-5">
          Get started today
        </p>

        {/* Headline */}
        <h2 className="text-4xl md:text-[3.4rem] font-black tracking-tight leading-[1.08] text-[var(--fg)] mb-5">
          Your documents are
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-purple-500 to-cyan-600 dark:from-violet-400 dark:via-purple-400 dark:to-cyan-400">
            waiting to be useful.
          </span>
        </h2>

        {/* Sub-copy */}
        <p className="text-[var(--fg-muted)] text-lg mb-10 max-w-lg leading-relaxed">
          Stop searching. Stop missing deadlines. Start asking.{" "}
          Get your first AI answer in under 2 minutes — completely free.
        </p>

        {/* Perks — 2×2 card grid */}
        <div className="grid grid-cols-2 gap-3 mb-10 w-full max-w-sm">
          {perks.map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-2.5 px-3.5 py-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-left"
            >
              <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <Icon size={13} className="text-emerald-500" />
              </div>
              <span className="text-xs text-[var(--fg-soft)] font-medium leading-tight">{text}</span>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 w-full">
          <Link
            href="/register"
            className="group relative inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-sm tracking-wide transition-all duration-200 shadow-[0_8px_32px_rgba(124,58,237,0.4)] hover:shadow-[0_12px_40px_rgba(124,58,237,0.6)] hover:-translate-y-0.5 active:scale-95 overflow-hidden w-full sm:w-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative z-10">Start for free</span>
            <ArrowRight size={16} className="relative z-10 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full border border-violet-500/35 text-violet-600 dark:text-violet-300 hover:bg-violet-500/8 hover:border-violet-500/60 font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-95 w-full sm:w-auto"
          >
            Sign in to your account
          </Link>
        </div>

        {/* Social proof */}
        <p className="mt-8 text-xs text-[var(--fg-muted)] flex items-center gap-1.5">
          <CheckCircle size={12} className="text-emerald-500" />
          Trusted by 10,000+ SMEs across Africa &amp; beyond
        </p>
      </div>
    </section>
  );
}
