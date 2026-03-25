"use client";

import React, { useRef } from "react";
import { ArrowRight, Sparkles, Shield, Brain, CheckCircle, Zap, ChevronRight } from "lucide-react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";


/* ─── Mini dashboard KPI card (inside mockup) ────────────────────── */
function MockKpi({ label, value, trend, color }: {
  label: string; value: string; trend: string; color: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
      <span className="text-[9px] text-[var(--fg-muted)] uppercase tracking-wide">{label}</span>
      <span className="text-lg font-black text-[var(--fg)]">{value}</span>
      <span className={`text-[9px] ${color === "#22d3ee" ? "text-cyan-400" : color === "#34d399" ? "text-emerald-400" : color === "#fb7185" ? "text-rose-400" : color === "#a78bfa" ? "text-violet-400" : "text-white"}`}>{trend}</span>
    </div>
  );
}

const trust = [
  { icon: Shield,   label: "SOC 2 ready"        },
  { icon: Brain,    label: "LangChain RAG"       },
  { icon: Sparkles, label: "Groq Llama 3.1 70B" },
  { icon: Zap,      label: "< 500 ms answers"   },
];

const kpis = [
  { label: "Documents",   value: "1,248", trend: "↑ 38 today",  color: "#22d3ee" },
  { label: "Compliance",  value: "94%",   trend: "↑ +2 pts",    color: "#34d399" },
  { label: "Risks Found", value: "3",     trend: "↓ −1 today",  color: "#fb7185" },
  { label: "AI Queries",  value: "876",   trend: "↑ +124%",     color: "#a78bfa" },
];

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const mockupY = useTransform(scrollYProgress, [0, 1], [0, 60]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[var(--bg)] pt-24 pb-16"
    >
      {/* ── Layered backgrounds ── */}
      <div className="absolute inset-0 bg-dots opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-to-b from-violet-600/12 via-cyan-500/6 to-transparent rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[var(--bg)] to-transparent pointer-events-none" />

      {/* ── Content ── */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center flex flex-col items-center gap-7">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="group"
        >
          <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-violet-500/35 bg-violet-500/8 backdrop-blur-sm text-xs font-bold tracking-wide shadow-[0_0_20px_rgba(124,58,237,0.18)] hover:shadow-[0_0_30px_rgba(124,58,237,0.35)] hover:scale-105 transition-all duration-300">
            <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
            <Sparkles size={12} className="text-violet-500 group-hover:rotate-12 transition-transform" />
            <span className="text-violet-700 dark:text-violet-300">Powered by Groq · LangChain · pgvector</span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="flex flex-col items-center"
        >
          <h1 className="text-6xl sm:text-7xl md:text-[6.5rem] font-black leading-[1.0] tracking-tight text-balance">
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-purple-500 to-cyan-600 dark:from-violet-400 dark:via-purple-400 dark:to-cyan-400 drop-shadow-2xl mb-2">
              Your Business,
            </span>
            <span className="block text-[var(--fg)]">Always Compliant.</span>
          </h1>
          <div className="mt-4 flex items-center gap-2 text-sm text-[var(--fg-muted)]">
            <div className="flex -space-x-1">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`w-6 h-6 rounded-full border-2 border-[var(--bg)] flex items-center justify-center text-[8px] font-bold ${
                  i === 0 ? "bg-violet-500 text-white"
                  : i === 1 ? "bg-cyan-500 text-white"
                  : i === 2 ? "bg-emerald-500 text-white"
                  : "bg-amber-500 text-white"
                }`}>
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <span className="text-xs">Join 10,000+ users</span>
          </div>
        </motion.div>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base md:text-lg text-[var(--fg-soft)] max-w-2xl leading-relaxed text-balance"
        >
          Our platform provides seamless AI-powered document management, compliance
          monitoring, and instant business insights — built for small and medium enterprises.
        </motion.p>

        {/* CTAs — Enhanced PayView style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <Link
            href="/register"
            className="group relative inline-flex items-center gap-3 px-10 py-4.5 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-black text-sm tracking-wide transition-all duration-300 shadow-[0_10px_40px_rgba(124,58,237,0.4)] hover:shadow-[0_15px_50px_rgba(124,58,237,0.6)] hover:-translate-y-1 active:scale-95 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative z-10">GET STARTED</span>
            <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          {/* Enhanced circle arrow */}
          <Link
            href="/register"
            aria-label="Get started"
            className="group relative w-16 h-16 rounded-full border-2 border-violet-500/30 hover:border-violet-500/60 flex items-center justify-center text-violet-400 hover:text-violet-300 transition-all duration-300 hover:bg-violet-500/10 hover:-translate-y-1 active:scale-95 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <ArrowRight size={22} className="relative z-10 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <Link
            href="#how-it-works"
            className="hidden sm:inline-flex items-center gap-2.5 px-6 py-4 text-[var(--fg-muted)] hover:text-[var(--fg)] text-sm font-semibold transition-all duration-300 hover:bg-[var(--surface-hover)] rounded-full"
          >
            <span>See how it works</span>
            <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </motion.div>

        {/* Trust signals */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="flex flex-wrap justify-center items-center gap-5 text-[var(--fg-muted)] text-xs tracking-wide"
        >
          {trust.map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-1.5 hover:text-[var(--fg)] transition-colors cursor-default">
              <Icon size={13} className="text-violet-500" />
              {label}
            </span>
          ))}
          <span className="hidden sm:flex items-center gap-1.5">
            <CheckCircle size={12} className="text-emerald-500" /> No credit card required
          </span>
        </motion.div>

        {/* ── Dashboard Mockup ── */}
        <motion.div
          style={{ y: mockupY }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5 }}
          className="w-full max-w-4xl mt-4"
        >
          <div className="relative rounded-2xl overflow-hidden border border-[var(--border)] shadow-[0_40px_80px_rgba(0,0,0,0.4)]">

            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-[var(--bg-muted)] border-b border-[var(--border)]">
              <span className="w-3 h-3 rounded-full bg-rose-500/70" />
              <span className="w-3 h-3 rounded-full bg-amber-400/70" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
              <div className="ml-4 flex-1 h-5 rounded-full bg-[var(--surface)] max-w-xs flex items-center px-3 gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-slow" />
                <div className="flex-1 h-2 rounded-full bg-[var(--border)]" />
              </div>
            </div>

            {/* Dashboard content */}
            <div className="bg-[var(--bg-soft)] grid grid-cols-12 min-h-[340px]">
              {/* Sidebar */}
              <div className="col-span-2 border-r border-[var(--border)] p-3 flex flex-col gap-2">
                <div className="h-7 rounded-lg bg-violet-500/20 border border-violet-500/25 w-full mb-2" />
                {["Dashboard","Documents","AI Advisor","Analytics","Compliance"].map((item, i) => (
                  <div key={item} className={`h-5 rounded-md text-[8px] flex items-center px-2 gap-1.5 ${
                    i === 0 ? "bg-violet-500/15 border border-violet-500/25 text-violet-400" : "text-[var(--fg-muted)]"
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-sm bg-current opacity-60 flex-shrink-0" />
                    <span className="truncate opacity-80 hidden xl:block">{item}</span>
                  </div>
                ))}
              </div>

              {/* Main */}
              <div className="col-span-10 p-4 flex flex-col gap-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-4 w-24 rounded-md bg-[var(--fg)] opacity-80 mb-1" />
                    <div className="h-2.5 w-36 rounded bg-[var(--fg-muted)] opacity-30" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-24 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center gap-1 px-2">
                      <span className="text-[7px] text-[var(--fg-muted)]">⊞ Manage widgets</span>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500/30" />
                  </div>
                </div>

                {/* KPI cards */}
                <div className="grid grid-cols-4 gap-2">
                  {kpis.map((kpi) => (
                    <MockKpi key={kpi.label} {...kpi} />
                  ))}
                </div>

                {/* Charts row */}
                <div className="grid grid-cols-3 gap-2 flex-1">
                  {/* Chart 1 — area */}
                  <div className="col-span-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] p-2.5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="h-2 w-20 rounded bg-[var(--fg)] opacity-70" />
                      <div className="h-4 w-16 rounded-md bg-[var(--surface)] border border-[var(--border)]" />
                    </div>
                    {/* Fake SVG chart lines */}
                    <svg viewBox="0 0 200 70" className="w-full opacity-60">
                      <defs>
                        <linearGradient id="hGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.4"/>
                          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0"/>
                        </linearGradient>
                      </defs>
                      <path d="M0 55 Q25 40 50 45 Q75 50 100 30 Q125 20 150 25 Q175 30 200 15" stroke="#a78bfa" strokeWidth="2" fill="none"/>
                      <path d="M0 55 Q25 40 50 45 Q75 50 100 30 Q125 20 150 25 Q175 30 200 15 L200 70 L0 70Z" fill="url(#hGrad)"/>
                      <path d="M0 60 Q25 55 50 58 Q75 62 100 50 Q125 40 150 45 Q175 48 200 38" stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="4 3" fill="none" opacity="0.7"/>
                    </svg>
                  </div>

                  {/* AI chat snippet */}
                  <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-2.5 flex flex-col gap-1.5">
                    <div className="h-2 w-16 rounded bg-[var(--fg)] opacity-70" />
                    <div className="flex justify-end">
                      <div className="bg-violet-500/10 border border-violet-500/15 text-[7px] text-violet-400 px-2 py-1 rounded-xl max-w-[80%]">
                        What are our compliance deadlines?
                      </div>
                    </div>
                    <div className="flex gap-1 items-start">
                      <div className="w-4 h-4 rounded-full bg-violet-500/15 border border-violet-500/25 flex-shrink-0" />
                      <div className="bg-[var(--bg-muted)] border border-[var(--border)] text-[7px] text-[var(--fg-soft)] px-2 py-1 rounded-xl max-w-[80%]">
                        Based on your docs, 3 deadlines upcoming: VAT Apr 15, PAYE Apr 30...
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Glow under mockup */}
          <div className="h-px w-3/4 mx-auto bg-gradient-to-r from-transparent via-violet-500/40 to-transparent mt-px" />
          <div className="h-8 w-1/2 mx-auto bg-violet-500/8 rounded-full blur-xl" />
        </motion.div>
      </div>
    </section>
  );
}
