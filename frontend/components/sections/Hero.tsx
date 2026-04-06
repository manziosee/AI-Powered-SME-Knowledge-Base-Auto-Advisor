"use client";

import React, { useRef } from "react";
import { ArrowRight, Sparkles, Shield, Brain, CheckCircle, Zap, Play, Globe, TrendingUp } from "lucide-react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";

const trust = [
  { icon: Shield,   label: "SOC 2 Ready"        },
  { icon: Brain,    label: "LangChain RAG"       },
  { icon: Sparkles, label: "Groq LLaMA 3.3 70B" },
  { icon: Zap,      label: "< 500 ms answers"   },
];

const kpis = [
  { label: "Documents",   value: "1,248", trend: "↑ 38 today",  color: "text-cyan-400",    bg: "bg-cyan-500/10",    border: "border-cyan-500/20"    },
  { label: "Compliance",  value: "94%",   trend: "↑ +2 pts",    color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  { label: "Risks Found", value: "3",     trend: "↓ −1 today",  color: "text-rose-400",    bg: "bg-rose-500/10",    border: "border-rose-500/20"    },
  { label: "AI Queries",  value: "876",   trend: "↑ +124%",     color: "text-violet-400",  bg: "bg-violet-500/10",  border: "border-violet-500/20"  },
];

/* Floating badge card */
function FloatingCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`absolute glass-card rounded-2xl px-4 py-3 shadow-2xl ${className}`}>
      {children}
    </div>
  );
}

/* Service feature card (from image 1) */
function ServiceCard({ icon: Icon, title, desc, color, bg, border }: {
  icon: React.ElementType; title: string; desc: string;
  color: string; bg: string; border: string;
}) {
  return (
    <div className={`group flex flex-col items-center text-center p-4 rounded-2xl border ${border} ${bg} hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-default`}>
      <div className={`w-10 h-10 rounded-xl ${bg} border ${border} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
        <Icon size={18} className={color} />
      </div>
      <p className="text-[var(--fg-soft)] text-xs font-bold mb-0.5">{title}</p>
      <p className="text-[var(--fg-muted)] text-[10px] leading-snug">{desc}</p>
    </div>
  );
}

const services = [
  { icon: Brain,     title: "Web Design",     desc: "Modern UI/UX",   color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  { icon: Zap,       title: "Development",    desc: "Fast & Secure",  color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20"   },
  { icon: Shield,    title: "Compliance",     desc: "7 Jurisdictions",color: "text-emerald-400",bg: "bg-emerald-500/10",border: "border-emerald-500/20"},
  { icon: TrendingUp,title: "Analytics",      desc: "Grow Smarter",   color: "text-cyan-400",   bg: "bg-cyan-500/10",   border: "border-cyan-500/20"   },
];

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const mockupY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const bgY     = useTransform(scrollYProgress, [0, 1], [0, 40]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-28 pb-20 bg-[var(--bg)]"
    >
      {/* ── Multi-layer mesh background ── */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 mesh-bg" />
        {/* Large violet radial */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[700px] rounded-full blur-[140px]"
          style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.14) 0%, transparent 70%)" }} />
        {/* Blue accent (image 1 inspired) */}
        <div className="absolute bottom-1/4 right-0 w-[700px] h-[500px] rounded-full blur-[120px]"
          style={{ background: "radial-gradient(ellipse, rgba(37,99,235,0.10) 0%, transparent 70%)" }} />
        {/* Teal bottom left (image 3 inspired) */}
        <div className="absolute bottom-0 left-0 w-[500px] h-[400px] rounded-full blur-[100px]"
          style={{ background: "radial-gradient(ellipse, rgba(13,148,136,0.08) 0%, transparent 70%)" }} />
        <div className="absolute inset-0 bg-dots opacity-25" />
      </motion.div>

      {/* ── Content ── */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center flex flex-col items-center gap-8">

        {/* Announcement badge */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="group inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-blue-500/30 bg-blue-500/8 text-xs font-semibold tracking-wide cursor-default hover:border-blue-500/60 hover:bg-blue-500/12 transition-all duration-300 shadow-[0_0_30px_rgba(37,99,235,0.15)]">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
            <Globe size={11} className="text-blue-500" />
            <span className="text-blue-600 dark:text-blue-300">Now powered by Groq · LangChain · pgvector</span>
            <ArrowRight size={11} className="text-blue-500 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </motion.div>

        {/* Headline — combining all 3 design inspirations */}
        <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, delay: 0.1 }}>
          <h1 className="text-5xl sm:text-6xl md:text-[5.5rem] lg:text-[6.5rem] font-black leading-[0.95] tracking-tight text-balance">
            <span className="block text-[var(--fg)]">Grow Your</span>
            <span className="block text-[var(--fg)]">Business with</span>
            <span className="block gradient-text-brand drop-shadow-2xl pb-2 mt-1">
              Smart AI.
            </span>
          </h1>

          {/* Social proof avatars */}
          <div className="mt-5 flex items-center justify-center gap-2.5 text-sm text-[var(--fg-muted)]">
            <div className="flex -space-x-2">
              {[
                { bg: "bg-gradient-to-br from-violet-500 to-purple-600", label: "A" },
                { bg: "bg-gradient-to-br from-blue-500 to-indigo-600",   label: "B" },
                { bg: "bg-gradient-to-br from-teal-500 to-emerald-600",  label: "C" },
                { bg: "bg-gradient-to-br from-amber-500 to-orange-500",  label: "D" },
                { bg: "bg-gradient-to-br from-rose-500 to-pink-600",     label: "E" },
              ].map(({ bg, label }, i) => (
                <div key={i} className={`w-7 h-7 rounded-full border-2 border-[var(--bg)] ${bg} flex items-center justify-center text-[9px] font-black text-white shadow-lg`}>
                  {label}
                </div>
              ))}
            </div>
            <span className="text-xs font-medium">
              <span className="text-[var(--fg)] font-bold">10,000+</span> SMEs already on board
            </span>
          </div>
        </motion.div>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.2 }}
          className="text-base md:text-xl text-[var(--fg-soft)] max-w-2xl leading-relaxed text-balance"
        >
          AI-powered document management, compliance monitoring, and instant business
          insights — built for small and medium enterprises across Africa and beyond.
        </motion.p>

        {/* CTA buttons — image 1 inspired (prominent blue + ghost) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <Link
            href="/register"
            className="group relative inline-flex items-center gap-3 px-10 py-4 rounded-full bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 text-white font-black text-sm tracking-wider transition-all duration-300 btn-glow-blue hover:-translate-y-1 active:scale-95 overflow-hidden shine-hover"
          >
            <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <span className="relative z-10">Get Started Free</span>
            <ArrowRight size={17} className="relative z-10 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/docs"
            className="group inline-flex items-center gap-2.5 px-7 py-4 rounded-full border border-[var(--border)] text-[var(--fg-soft)] font-semibold text-sm hover:text-[var(--fg)] hover:border-blue-500/30 hover:bg-blue-500/5 hover:-translate-y-0.5 transition-all duration-300"
          >
            <span className="w-7 h-7 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center group-hover:border-blue-500/30 transition-all">
              <Play size={10} className="text-blue-500 ml-0.5" fill="currentColor" />
            </span>
            Watch a demo
          </Link>
        </motion.div>

        {/* Trust signals */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.45 }}
          className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-[var(--fg-muted)] text-xs"
        >
          {trust.map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-1.5 hover:text-[var(--fg)] transition-colors">
              <Icon size={12} className="text-blue-500" />
              {label}
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <CheckCircle size={12} className="text-emerald-500" />
            No credit card required
          </span>
        </motion.div>

        {/* ── Dashboard Mockup ── */}
        <motion.div
          style={{ y: mockupY }}
          initial={{ opacity: 0, y: 48 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.55 }}
          className="relative w-full max-w-5xl mt-6"
        >
          {/* Floating stat badges — image 2 inspired glassmorphism */}
          <FloatingCard className="float-badge -left-4 top-16 z-20 hidden lg:block border border-blue-500/20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                <Brain size={14} className="text-blue-400" />
              </div>
              <div>
                <p className="text-[var(--fg)] text-sm font-black leading-none">876</p>
                <p className="text-[var(--fg-muted)] text-[10px]">AI queries today</p>
              </div>
            </div>
          </FloatingCard>

          <FloatingCard className="float-badge-2 -right-4 top-24 z-20 hidden lg:block border border-teal-500/20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
                <Shield size={14} className="text-teal-400" />
              </div>
              <div>
                <p className="text-[var(--fg)] text-sm font-black leading-none">94%</p>
                <p className="text-[var(--fg-muted)] text-[10px]">Compliance score</p>
              </div>
            </div>
          </FloatingCard>

          <FloatingCard className="float-badge-3 left-12 -bottom-4 z-20 hidden lg:block border border-emerald-500/20">
            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-emerald-400" />
              <span className="text-[var(--fg-soft)] text-xs font-medium">3 deadlines resolved today</span>
            </div>
          </FloatingCard>

          {/* Main mockup frame */}
          <div className="relative rounded-2xl overflow-hidden border border-[var(--border)] shadow-[0_50px_120px_rgba(37,99,235,0.2)] dark:shadow-[0_50px_120px_rgba(37,99,235,0.3)]">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-[var(--bg-muted)] border-b border-[var(--border)]">
              <span className="w-3 h-3 rounded-full bg-rose-500/70" />
              <span className="w-3 h-3 rounded-full bg-amber-400/70" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
              <div className="ml-4 flex-1 h-5 rounded-full bg-[var(--surface)] max-w-xs flex items-center px-3 gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <div className="flex-1 h-2 rounded-full bg-[var(--border)]" />
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <div className="w-16 h-4 rounded bg-[var(--surface)] border border-[var(--border)]" />
                <div className="w-20 h-4 rounded-full bg-blue-500/20 border border-blue-500/30" />
              </div>
            </div>

            {/* Dashboard content */}
            <div className="bg-[var(--bg-soft)] grid grid-cols-12 min-h-[360px]">
              {/* Sidebar */}
              <div className="col-span-2 border-r border-[var(--border)] p-3 flex flex-col gap-2 bg-[var(--bg)]">
                <div className="h-7 rounded-lg bg-gradient-to-r from-blue-500/20 to-violet-500/10 border border-blue-500/20 w-full mb-3 flex items-center px-2 gap-1.5">
                  <div className="w-3 h-3 rounded bg-blue-500/50" />
                  <div className="flex-1 h-1.5 rounded-full bg-blue-500/20" />
                </div>
                {["Dashboard","Documents","AI Advisor","Analytics","Compliance","Settings"].map((item, i) => (
                  <div key={item} className={`h-6 rounded-lg text-[8px] flex items-center px-2 gap-1.5 transition-colors ${
                    i === 0
                      ? "bg-gradient-to-r from-blue-500/15 to-violet-500/10 border border-blue-500/25 text-blue-400"
                      : "text-[var(--fg-muted)] hover:bg-[var(--surface)]"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-sm flex-shrink-0 ${i === 0 ? "bg-blue-400" : "bg-current opacity-40"}`} />
                    <span className="truncate opacity-80 hidden xl:block">{item}</span>
                  </div>
                ))}
              </div>

              {/* Main panel */}
              <div className="col-span-10 p-5 flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-4 w-32 rounded-md bg-[var(--fg)] opacity-80 mb-1.5" />
                    <div className="h-2 w-44 rounded bg-[var(--fg-muted)] opacity-30" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-28 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center px-2 gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-blue-500/50" />
                      <div className="flex-1 h-1.5 rounded-full bg-[var(--border)]" />
                    </div>
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500/30 to-violet-500/20 border border-blue-500/30" />
                  </div>
                </div>

                {/* KPI cards */}
                <div className="grid grid-cols-4 gap-3">
                  {kpis.map((kpi) => (
                    <div key={kpi.label} className={`p-3 rounded-xl ${kpi.bg} border ${kpi.border}`}>
                      <span className="text-[9px] text-[var(--fg-muted)] uppercase tracking-wide block mb-1">{kpi.label}</span>
                      <span className={`text-xl font-black ${kpi.color} block leading-none`}>{kpi.value}</span>
                      <span className={`text-[9px] ${kpi.color} opacity-80 mt-0.5 block`}>{kpi.trend}</span>
                    </div>
                  ))}
                </div>

                {/* Charts row */}
                <div className="grid grid-cols-3 gap-3 flex-1">
                  {/* Area chart */}
                  <div className="col-span-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] p-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-2.5 w-24 rounded bg-[var(--fg)] opacity-70" />
                      <div className="flex gap-1.5 items-center">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <div className="h-1.5 w-12 rounded-full bg-[var(--border)]" />
                        <span className="w-2 h-2 rounded-full bg-teal-500" />
                        <div className="h-1.5 w-12 rounded-full bg-[var(--border)]" />
                      </div>
                    </div>
                    <svg viewBox="0 0 240 80" className="w-full" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5"/>
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                        </linearGradient>
                        <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0d9488" stopOpacity="0.3"/>
                          <stop offset="100%" stopColor="#0d9488" stopOpacity="0"/>
                        </linearGradient>
                      </defs>
                      <path d="M0 60 C30 48,50 52,80 40 C110 28,130 22,160 26 C190 30,210 18,240 12" stroke="#3b82f6" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                      <path d="M0 60 C30 48,50 52,80 40 C110 28,130 22,160 26 C190 30,210 18,240 12 L240 80 L0 80Z" fill="url(#g1)"/>
                      <path d="M0 68 C30 62,50 66,80 58 C110 50,130 46,160 50 C190 54,210 44,240 42" stroke="#0d9488" strokeWidth="1.5" strokeDasharray="5 3" fill="none" opacity="0.8"/>
                      <path d="M0 68 C30 62,50 66,80 58 C110 50,130 46,160 50 C190 54,210 44,240 42 L240 80 L0 80Z" fill="url(#g2)"/>
                      {[40,80,120,160,200].map((x, i) => (
                        <circle key={i} cx={x} cy={[40,52,40,26,18][i]} r="3" fill="#3b82f6" opacity="0.8" />
                      ))}
                    </svg>
                  </div>

                  {/* AI chat */}
                  <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-3 flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-4 h-4 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                        <Brain size={8} className="text-blue-400" />
                      </div>
                      <div className="h-2 w-14 rounded bg-[var(--fg)] opacity-60" />
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-blue-500/12 border border-blue-500/20 text-[7px] text-blue-400 px-2 py-1.5 rounded-xl max-w-[85%] leading-relaxed">
                        What compliance deadlines are coming?
                      </div>
                    </div>
                    <div className="flex gap-1.5 items-start">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500/30 to-violet-500/20 border border-blue-500/25 flex-shrink-0 flex items-center justify-center">
                        <Sparkles size={8} className="text-blue-400" />
                      </div>
                      <div className="bg-[var(--bg)] border border-[var(--border)] text-[7px] text-[var(--fg-soft)] px-2 py-1.5 rounded-xl leading-relaxed">
                        3 deadlines upcoming: VAT Apr 15, PAYE Apr 30, Filing May 1...
                      </div>
                    </div>
                    <div className="flex gap-1 mt-auto">
                      <div className="flex-1 h-5 rounded-lg bg-[var(--bg)] border border-[var(--border)]" />
                      <div className="w-5 h-5 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                        <ArrowRight size={8} className="text-blue-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Services row — inspired by image 1 */}
                <div className="grid grid-cols-4 gap-2 mt-1">
                  {services.map((s) => (
                    <ServiceCard key={s.title} {...s} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Glow below mockup */}
          <div className="h-px w-3/4 mx-auto bg-gradient-to-r from-transparent via-blue-500/50 to-transparent mt-px" />
          <div className="h-12 w-1/2 mx-auto bg-blue-500/10 rounded-full blur-2xl -mt-1" />
        </motion.div>
      </div>
    </section>
  );
}
