"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye, EyeOff, ArrowRight, Check, ArrowLeft,
  Brain, ShieldCheck, FileText, Zap, Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";

const COUNTRIES = [
  "Rwanda", "Kenya", "Nigeria", "South Africa",
  "France", "United States", "Uganda", "Tanzania",
  "Ghana", "Ethiopia", "Other",
];

const INDUSTRIES = [
  "Professional Services", "Technology", "Healthcare",
  "Retail & E-commerce", "Logistics & Supply Chain",
  "Finance & Banking", "Agriculture", "Education",
  "Legal & Accounting", "Manufacturing", "Other",
];

const getInputClasses = (theme: string) => 
  `w-full px-4 py-3.5 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] text-[var(--fg)] placeholder-[var(--fg-muted)] focus:outline-none focus:border-violet-500/60 focus:bg-violet-500/5 transition-all text-sm hover:border-[var(--border-soft)]`;

const perks = [
  { icon: Brain,       text: "AI Advisor with RAG pipeline"    },
  { icon: ShieldCheck, text: "Compliance for 7 jurisdictions"  },
  { icon: FileText,    text: "Upload unlimited document types" },
  { icon: Zap,         text: "Answers in under 500 ms"         },
];

const steps = [
  { number: 1, label: "Your account" },
  { number: 2, label: "Your business" },
];

export default function RegisterPage() {
  const router  = useRouter();
  const { theme } = useTheme();
  const [step,    setStep]   = useState(1);
  const [showPw,  setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", password: "",
    company: "", country: "", industry: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    localStorage.setItem("auth_user", JSON.stringify({
      id: "new", name: form.name, email: form.email,
      role: "Admin", company: form.company,
      avatar: form.name.slice(0, 2).toUpperCase(),
      country: form.country,
    }));
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#070710] flex">

      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex w-[44%] relative flex-col p-10 overflow-hidden">

        <div className="absolute inset-0 bg-gradient-to-br from-[#0c0c1a] via-[#080812] to-[#060610]" />
        <div className="absolute inset-0 opacity-40 bg-dots" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
        <div className="absolute top-1/3 left-1/2 w-[450px] h-[450px] bg-violet-600/12 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-cyan-500/7 rounded-full blur-[90px] pointer-events-none" />

        
        {/* Back */}
        <div className="relative z-10">
          <Link href="/"
            className="inline-flex items-center gap-1.5 text-white/30 hover:text-white/70 text-xs transition-all group">
            <ArrowLeft size={13} className="group-hover:-translate-x-1 transition-transform" />
            Back to home
          </Link>
        </div>

        {/* Brand + perks */}
        <div className="relative z-10 flex-1 flex flex-col justify-center gap-9">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.2)] hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] transition-all duration-300">
                <Brain size={20} className="text-violet-400" />
              </div>
              <span className="text-white font-bold text-lg tracking-tight">AdvisorAI</span>
            </div>
            <h2 className="text-3xl font-black text-white leading-[1.1] mb-3 tracking-tight">
              Everything your business<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400">
                needs in one place.
              </span>
            </h2>
            <p className="text-white/35 text-sm leading-relaxed">
              Join hundreds of SMEs using AdvisorAI to stay compliant, manage documents, and get instant answers.
            </p>
          </div>

          {/* Perks */}
          <div className="flex flex-col gap-2.5">
            {perks.map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-500/15 transition-colors">
                  <Icon size={14} className="text-violet-400 group-hover:text-violet-300 transition-colors" />
                </div>
                <span className="text-white/55 text-sm group-hover:text-white/75 transition-colors">{text}</span>
              </div>
            ))}
          </div>

          {/* Social proof card */}
          <div className="p-5 rounded-2xl bg-white/3 border border-white/8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
            <div className="flex items-center gap-2 mb-3">
              <div className="flex -space-x-2">
                {["AU", "JM", "FO"].map((av, i) => (
                  <div key={i} className={`w-7 h-7 rounded-full border-2 border-[#080812] flex items-center justify-center text-[10px] font-bold ${
                    i === 0 ? "bg-violet-500/30 text-violet-300"
                    : i === 1 ? "bg-cyan-500/30 text-cyan-300"
                    : "bg-emerald-500/30 text-emerald-300"
                  }`}>{av}</div>
                ))}
              </div>
              <span className="text-white/40 text-xs">+200 companies joined this month</span>
            </div>
            <div className="flex gap-0.5 mb-2">
              {[...Array(5)].map((_, i) => <span key={i} className="text-amber-400 text-xs">★</span>)}
            </div>
            <p className="text-white/55 text-xs leading-relaxed">
              &ldquo;Setup took 10 minutes. We found 3 compliance gaps within the first hour.&rdquo;
            </p>
            <p className="text-white/25 text-[10px] mt-2">— Alice Uwimana, CEO · TechVentures RW</p>
          </div>
        </div>

        {/* Bottom trust */}
        <div className="relative z-10 flex gap-2.5 flex-wrap">
          {["🔒 Free forever plan", "✅ No credit card", "🌍 7 jurisdictions"].map((b) => (
            <span key={b} className="text-[10px] text-white/20 px-3 py-1.5 rounded-full border border-white/8">
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col justify-center px-6 lg:px-12 py-10 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/15 to-transparent" />

        <div className="max-w-[400px] w-full mx-auto">

          {/* Mobile: back + logo */}
          <div className="lg:hidden flex items-center justify-between mb-8">
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
            className="hidden lg:inline-flex items-center gap-1.5 text-white/25 hover:text-violet-400 text-xs transition-all mb-8 group">
            <ArrowLeft size={13} className="group-hover:-translate-x-1 transition-transform" /> Back to home
          </Link>

          {/* Header */}
          <div className="mb-7">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-violet-400" />
              <span className="text-violet-400/70 text-xs tracking-wide">Free forever — no credit card</span>
            </div>
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
              {step === 1 ? "Create account" : "About your business"}
            </h1>
            <p className="text-white/35 text-sm">
              {step === 1
                ? "Set up your AI workspace in under 2 minutes."
                : "Help us configure the right compliance rules for you."}
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-7">
            {steps.map((s, i) => (
              <React.Fragment key={s.number}>
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step > s.number
                      ? "bg-violet-500 text-white shadow-[0_0_12px_rgba(124,58,237,0.4)]"
                      : step === s.number
                      ? "bg-violet-500/15 border-2 border-violet-500 text-violet-300"
                      : "bg-white/6 border border-white/12 text-white/25"
                  }`}>
                    {step > s.number ? <Check size={13} /> : s.number}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${step === s.number ? "text-white/75" : "text-white/25"}`}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-px transition-all ${step > s.number ? "bg-violet-500/50" : "bg-white/10"}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step 1 — Account info */}
          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="flex flex-col gap-4">
              <div>
                <label className="block text-[var(--fg-muted)] text-[10px] font-semibold mb-2 tracking-widest uppercase">Full name</label>
                <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)}
                  placeholder="Alice Uwimana" required className={getInputClasses(theme)} />
              </div>
              <div>
                <label className="block text-[var(--fg-muted)] text-[10px] font-semibold mb-2 tracking-widest uppercase">Work email</label>
                <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                  placeholder="alice@company.com" required className={getInputClasses(theme)} autoComplete="email" />
              </div>
              <div>
                <label className="block text-[var(--fg-muted)] text-[10px] font-semibold mb-2 tracking-widest uppercase">Password</label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder="Minimum 8 characters" required minLength={8}
                    className={getInputClasses(theme) + " pr-12"} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit"
                className="group relative w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-black text-sm transition-all duration-300 shadow-[0_0_24px_rgba(124,58,237,0.35)] hover:shadow-[0_0_36px_rgba(124,58,237,0.55)] hover:-translate-y-0.5 active:scale-[0.98] mt-1 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10">Continue</span>
                <ArrowRight size={15} className="relative z-10 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </form>
          )}

          {/* Step 2 — Business info */}
          {step === 2 && (
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div>
                <label className="block text-[var(--fg-muted)] text-[10px] font-semibold mb-2 tracking-widest uppercase">Company name</label>
                <input type="text" value={form.company} onChange={(e) => set("company", e.target.value)}
                  placeholder="TechVentures Ltd" required className={getInputClasses(theme)} />
              </div>
              <div>
                <label className="block text-[var(--fg-muted)] text-[10px] font-semibold mb-2 tracking-widest uppercase">Country</label>
                <div className="relative">
                  <select value={form.country} onChange={(e) => set("country", e.target.value)} required
                    className={getInputClasses(theme) + " appearance-none cursor-pointer bg-[var(--bg-muted)]"} aria-label="Select your country">
                    <option value="" className="bg-[#0c0c1a]">Select your country…</option>
                    {COUNTRIES.map((c) => <option key={c} value={c} className="bg-[#0c0c1a]">{c}</option>)}
                  </select>
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]">▾</div>
                </div>
              </div>
              <div>
                <label className="block text-[var(--fg-muted)] text-[10px] font-semibold mb-2 tracking-widest uppercase">Industry</label>
                <div className="relative">
                  <select value={form.industry} onChange={(e) => set("industry", e.target.value)} required
                    className={getInputClasses(theme) + " appearance-none cursor-pointer bg-[var(--bg-muted)]"} aria-label="Select your industry">
                    <option value="" className="bg-[#0c0c1a]">Select your industry…</option>
                    {INDUSTRIES.map((i) => <option key={i} value={i} className="bg-[#0c0c1a]">{i}</option>)}
                  </select>
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]">▾</div>
                </div>
              </div>

              <div className="flex gap-2.5 mt-1">
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 py-3.5 rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-white/25 text-sm font-medium transition-all active:scale-[0.97]">
                  Back
                </button>
                <button type="submit" disabled={loading}
                  className="group relative flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-black text-sm transition-all duration-300 disabled:opacity-50 shadow-[0_0_24px_rgba(124,58,237,0.35)] hover:shadow-[0_0_36px_rgba(124,58,237,0.55)] active:scale-[0.98] overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  {loading ? (
                    <>
                      <span className="relative z-10 w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="relative z-10">Creating…</span>
                    </>
                  ) : (
                    <>
                      <span className="relative z-10">Create account</span>
                      <ArrowRight size={15} className="relative z-10 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Footer links */}
          <p className="text-center text-white/30 text-sm mt-8">
            Already have an account?{" "}
            <Link href="/login" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
          <p className="text-center text-white/15 text-xs mt-3">
            By creating an account you agree to our{" "}
            <a href="#" className="hover:text-white/35 transition-colors underline underline-offset-2">Terms</a> and{" "}
            <a href="#" className="hover:text-white/35 transition-colors underline underline-offset-2">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
