"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye, EyeOff, ArrowRight, AlertCircle, ArrowLeft,
  Brain, ShieldCheck, FileText, Bell, Sparkles,
} from "lucide-react";
import Link from "next/link";
import { DEMO_USERS } from "@/lib/mock-data";
import { useTheme } from "@/contexts/ThemeContext";

const getInputClasses = (theme: string) => 
  `w-full px-4 py-3.5 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] text-[var(--fg)] placeholder-[var(--fg-muted)] focus:outline-none focus:border-violet-500/60 focus:bg-violet-500/5 transition-all text-sm hover:border-[var(--border-soft)]`;

const features = [
  { icon: Brain,       label: "AI Advisor",        desc: "Ask anything in plain English"  },
  { icon: ShieldCheck, label: "Compliance Engine",  desc: "7 jurisdictions covered"        },
  { icon: FileText,    label: "Document RAG",       desc: "Search across all your files"   },
  { icon: Bell,        label: "Smart Alerts",       desc: "Never miss a deadline"          },
];

const avatarColors = [
  "bg-violet-500/20 border-violet-500/40 text-violet-300",
  "bg-cyan-500/20   border-cyan-500/40   text-cyan-300",
  "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
  "bg-amber-500/20  border-amber-500/40  text-amber-300",
];

export default function LoginPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const user = DEMO_USERS.find((u) => u.email === email && u.password === password);
    if (user) {
      localStorage.setItem("auth_user", JSON.stringify(user));
      router.push("/dashboard");
    } else {
      setError("Invalid email or password. Try a demo account below.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070710] flex">

      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex w-[46%] relative flex-col p-10 overflow-hidden">

        {/* Layered backgrounds */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c0c1a] via-[#080812] to-[#060610]" />
        <div className="absolute inset-0 opacity-40 bg-dots" />

        {/* Glows */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
        <div className="absolute top-1/3 left-1/3 w-[480px] h-[480px] bg-violet-600/12 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-0 w-[280px] h-[280px] bg-cyan-500/8 rounded-full blur-[90px] pointer-events-none" />

        
        {/* Back link */}
        <div className="relative z-10">
          <Link href="/"
            className="inline-flex items-center gap-1.5 text-white/30 hover:text-white/70 text-xs transition-all group">
            <ArrowLeft size={13} className="group-hover:-translate-x-1 transition-transform" />
            Back to home
          </Link>
        </div>

        {/* Brand + features */}
        <div className="relative z-10 flex-1 flex flex-col justify-center gap-8">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.2)] hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] transition-all duration-300">
                <Brain size={20} className="text-violet-400" />
              </div>
              <span className="text-white font-bold text-lg tracking-tight">AdvisorAI</span>
            </div>
            <h2 className="text-3xl font-black text-white leading-[1.1] mb-3 tracking-tight">
              Your AI-powered<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400">
                business advisor.
              </span>
            </h2>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              Upload documents, ask questions, stay compliant. Built for SMEs across Africa and beyond.
            </p>
          </div>

          {/* Feature list */}
          <div className="flex flex-col gap-2.5">
            {features.map(({ icon: Icon, label, desc }, i) => (
              <div key={i}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/3 border border-white/6 hover:bg-white/5 hover:border-white/10 transition-all cursor-default group hover:scale-[1.02]">
                <div className="w-8 h-8 rounded-xl bg-violet-500/12 border border-violet-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-500/20 group-hover:border-violet-500/30 transition-all">
                  <Icon size={14} className="text-violet-400 group-hover:text-violet-300 transition-colors" />
                </div>
                <div>
                  <p className="text-white/80 text-xs font-semibold truncate group-hover:text-white transition-colors">{label}</p>
                  <p className="text-white/30 text-[11px]">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Testimonial card */}
          <div className="p-5 rounded-2xl bg-white/3 border border-white/8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
            <div className="flex gap-0.5 mb-3">
              {[...Array(5)].map((_, i) => <span key={i} className="text-amber-400 text-xs">★</span>)}
            </div>
            <p className="text-white/70 text-sm leading-relaxed mb-4 italic">
              &ldquo;Found a contract renewal we had missed. Saved us $24,000 in auto-renewal fees.&rdquo;
            </p>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300 font-bold text-xs">JM</div>
              <div>
                <p className="text-white/65 text-xs font-medium">James Mwangi</p>
                <p className="text-white/30 text-[10px]">Operations Manager, RetailPro Kenya</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom trust badges */}
        <div className="relative z-10 flex gap-2.5 flex-wrap">
          {["🔒 SOC 2 ready", "🌍 7 jurisdictions", "⚡ Groq-powered"].map((b) => (
            <span key={b} className="text-[10px] text-white/20 px-3 py-1.5 rounded-full border border-white/8">
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col justify-center px-6 lg:px-14 py-10 relative">
        {/* Subtle top border */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/15 to-transparent" />

        <div className="max-w-[400px] w-full mx-auto">

          {/* Mobile: back + logo */}
          <div className="lg:hidden flex items-center justify-between mb-10">
            <Link href="/" className="flex items-center gap-1.5 text-white/30 hover:text-white text-xs transition-all group">
              <ArrowLeft size={13} className="group-hover:-translate-x-1 transition-transform" /> Back
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
                <Brain size={14} className="text-violet-400" />
              </div>
              <span className="text-white font-bold text-sm">AdvisorAI</span>
            </div>
            <div className="w-12" />
          </div>

          {/* Desktop back */}
          <Link href="/"
            className="hidden lg:inline-flex items-center gap-1.5 text-white/25 hover:text-violet-400 text-xs transition-all mb-10 group">
            <ArrowLeft size={13} className="group-hover:-translate-x-1 transition-transform" /> Back to home
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-violet-400" />
              <span className="text-violet-400/70 text-xs tracking-wide">Welcome back</span>
            </div>
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Sign in</h1>
            <p className="text-white/35 text-sm">Access your AdvisorAI workspace.</p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2.5 p-4 mb-6 rounded-xl bg-rose-500/8 border border-rose-500/25 text-rose-400 text-sm">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-[var(--fg-muted)] text-[10px] font-semibold mb-2 tracking-widest uppercase">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className={getInputClasses(theme)}
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[var(--fg-muted)] text-[10px] font-semibold tracking-widest uppercase">
                  Password
                </label>
                <a href="#" className="text-violet-500/60 hover:text-violet-500 text-xs transition-colors">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={getInputClasses(theme) + " pr-12"}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit button — enhanced with gradient and effects */}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-black text-sm transition-all duration-300 disabled:opacity-50 shadow-[0_0_24px_rgba(124,58,237,0.35)] hover:shadow-[0_0_36px_rgba(124,58,237,0.55)] hover:-translate-y-0.5 active:scale-[0.98] mt-1 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              {loading ? (
                <>
                  <span className="relative z-10 w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="relative z-10">Signing in…</span>
                </>
              ) : (
                <>
                  <span className="relative z-10">Sign in</span>
                  <ArrowRight size={15} className="relative z-10 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/7" />
            <span className="text-white/20 text-xs">or try a demo account</span>
            <div className="flex-1 h-px bg-white/7" />
          </div>

          {/* Demo accounts */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            {DEMO_USERS.map((u, i) => (
              <button
                key={u.id}
                type="button"
                onClick={() => { setEmail(u.email); setPassword(u.password); }}
                className="flex items-center gap-2.5 p-3 rounded-xl border border-white/7 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all text-left group active:scale-[0.97]"
              >
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs flex-shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                  {u.avatar}
                </div>
                <div className="min-w-0">
                  <p className="text-white/70 text-xs font-semibold truncate group-hover:text-white transition-colors">
                    {u.name.split(" ")[0]}
                  </p>
                  <p className="text-white/25 text-[10px] truncate">{u.role}</p>
                </div>
              </button>
            ))}
          </div>

          <p className="text-center text-white/20 text-xs mb-6">
            Password for all demo accounts:{" "}
            <code className="text-violet-400/70 bg-violet-500/10 px-1.5 py-0.5 rounded text-[11px]">demo1234</code>
          </p>

          <p className="text-center text-white/30 text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
