"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Check, ArrowLeft, Brain, ShieldCheck, FileText, Zap } from "lucide-react";
import Link from "next/link";

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

const INPUT = "w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/12 text-white placeholder-white/30 focus:outline-none focus:border-violet-500/60 focus:bg-violet-500/5 transition-all text-sm";

const perks = [
  { icon: Brain,       text: "AI Advisor with RAG pipeline"           },
  { icon: ShieldCheck, text: "Compliance for 7 jurisdictions"          },
  { icon: FileText,    text: "Upload unlimited document types"         },
  { icon: Zap,         text: "Answers in under 500 ms"                 },
];

const steps = [
  { number: 1, label: "Your account" },
  { number: 2, label: "Your company" },
];

export default function RegisterPage() {
  const router = useRouter();
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
    <div className="min-h-screen bg-[#080808] flex">

      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex w-[42%] relative flex-col p-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d0d0d] via-[#0a0a12] to-[#080810]" />
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(167,139,250,0.07) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="absolute top-1/3 left-1/2 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-cyan-500/6 rounded-full blur-[90px] pointer-events-none" />

        {/* Back */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-1.5 text-white/35 hover:text-white text-xs transition-all group">
            <ArrowLeft size={13} className="group-hover:-translate-x-1 transition-transform" />
            Back to home
          </Link>
        </div>

        {/* Brand + perks */}
        <div className="relative z-10 flex-1 flex flex-col justify-center gap-10">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
                <Brain size={20} className="text-violet-400" />
              </div>
              <span className="text-white font-bold text-lg tracking-tight">AdvisorAI</span>
            </div>
            <h2 className="text-3xl font-bold text-white leading-tight mb-3">
              Everything your business<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
                needs in one place
              </span>
            </h2>
            <p className="text-white/45 text-sm leading-relaxed">
              Join hundreds of SMEs using AdvisorAI to stay compliant, manage documents, and get instant answers.
            </p>
          </div>

          {/* Perks */}
          <div className="flex flex-col gap-3">
            {perks.map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-violet-500/12 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon size={13} className="text-violet-400" />
                </div>
                <span className="text-white/65 text-sm">{text}</span>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div className="p-5 rounded-2xl bg-white/3 border border-white/8">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex -space-x-2">
                {["AU", "JM", "FO"].map((av, i) => (
                  <div key={i} className={`w-7 h-7 rounded-full border-2 border-[#080810] flex items-center justify-center text-[10px] font-bold ${
                    i === 0 ? "bg-violet-500/30 text-violet-300" : i === 1 ? "bg-cyan-500/30 text-cyan-300" : "bg-emerald-500/30 text-emerald-300"
                  }`}>{av}</div>
                ))}
              </div>
              <span className="text-white/50 text-xs">+200 companies joined this month</span>
            </div>
            <div className="flex gap-0.5 mb-2">
              {[...Array(5)].map((_, i) => <span key={i} className="text-amber-400 text-xs">★</span>)}
            </div>
            <p className="text-white/60 text-xs leading-relaxed">
              &ldquo;Setup took 10 minutes. We found 3 compliance gaps within the first hour.&rdquo;
            </p>
            <p className="text-white/30 text-[10px] mt-2">— Alice Uwimana, CEO · TechVentures RW</p>
          </div>
        </div>

        {/* Bottom trust */}
        <div className="relative z-10 flex gap-3 flex-wrap">
          {["🔒 Free forever plan", "✅ No credit card", "🌍 7 jurisdictions"].map((b) => (
            <span key={b} className="text-[10px] text-white/25 px-2.5 py-1 rounded-full border border-white/8">{b}</span>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col justify-center px-6 lg:px-12 py-10">
        <div className="max-w-[420px] w-full mx-auto">

          {/* Mobile: back + logo */}
          <div className="lg:hidden flex items-center justify-between mb-8">
            <Link href="/" className="flex items-center gap-1.5 text-white/35 hover:text-white text-xs transition-all group">
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
          <Link href="/" className="hidden lg:inline-flex items-center gap-1.5 text-white/30 hover:text-violet-400 text-xs transition-all mb-8 group">
            <ArrowLeft size={13} className="group-hover:-translate-x-1 transition-transform" /> Back to home
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
              {step === 1 ? "Create your account" : "About your business"}
            </h1>
            <p className="text-white/45 text-sm">
              {step === 1 ? "Free forever — no credit card required." : "Help us set up the right compliance rules for you."}
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-8">
            {steps.map((s, i) => (
              <React.Fragment key={s.number}>
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step > s.number
                      ? "bg-violet-500 text-white shadow-[0_0_10px_rgba(124,58,237,0.4)]"
                      : step === s.number
                      ? "bg-violet-500/20 border-2 border-violet-500 text-violet-300"
                      : "bg-white/6 border border-white/12 text-white/30"
                  }`}>
                    {step > s.number ? <Check size={13} /> : s.number}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${step === s.number ? "text-white/80" : "text-white/30"}`}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-px transition-all ${step > s.number ? "bg-violet-500/50" : "bg-white/10"}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="flex flex-col gap-5">
              <div>
                <label className="block text-white/55 text-xs font-semibold mb-2 tracking-wide">FULL NAME</label>
                <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)}
                  placeholder="Alice Uwimana" required className={INPUT} />
              </div>
              <div>
                <label className="block text-white/55 text-xs font-semibold mb-2 tracking-wide">WORK EMAIL</label>
                <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                  placeholder="alice@company.com" required className={INPUT} />
              </div>
              <div>
                <label className="block text-white/55 text-xs font-semibold mb-2 tracking-wide">PASSWORD</label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder="Minimum 8 characters" required minLength={8}
                    className={INPUT + " pr-12"} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit"
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all shadow-[0_0_20px_rgba(124,58,237,0.35)] hover:shadow-[0_0_28px_rgba(124,58,237,0.5)] mt-1">
                Continue <ArrowRight size={15} />
              </button>
            </form>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <form onSubmit={handleRegister} className="flex flex-col gap-5">
              <div>
                <label className="block text-white/55 text-xs font-semibold mb-2 tracking-wide">COMPANY NAME</label>
                <input type="text" value={form.company} onChange={(e) => set("company", e.target.value)}
                  placeholder="TechVentures Ltd" required className={INPUT} />
              </div>
              <div>
                <label className="block text-white/55 text-xs font-semibold mb-2 tracking-wide">COUNTRY</label>
                <div className="relative">
                  <select value={form.country} onChange={(e) => set("country", e.target.value)} required
                    className={INPUT + " appearance-none cursor-pointer"} style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                    <option value="" className="bg-[#0d0d0d]">Select your country…</option>
                    {COUNTRIES.map((c) => <option key={c} value={c} className="bg-[#0d0d0d]">{c}</option>)}
                  </select>
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/30">▾</div>
                </div>
              </div>
              <div>
                <label className="block text-white/55 text-xs font-semibold mb-2 tracking-wide">INDUSTRY</label>
                <div className="relative">
                  <select value={form.industry} onChange={(e) => set("industry", e.target.value)} required
                    className={INPUT + " appearance-none cursor-pointer"} style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                    <option value="" className="bg-[#0d0d0d]">Select your industry…</option>
                    {INDUSTRIES.map((i) => <option key={i} value={i} className="bg-[#0d0d0d]">{i}</option>)}
                  </select>
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/30">▾</div>
                </div>
              </div>
              <div className="flex gap-3 mt-1">
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 py-3.5 rounded-xl border border-white/12 text-white/60 hover:text-white hover:border-white/25 text-sm font-medium transition-all">
                  Back
                </button>
                <button type="submit" disabled={loading}
                  className="flex-2 flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(124,58,237,0.35)]">
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating…
                    </>
                  ) : (
                    <>Create account <ArrowRight size={15} /></>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Footer links */}
          <p className="text-center text-white/35 text-sm mt-8">
            Already have an account?{" "}
            <Link href="/login" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
          <p className="text-center text-white/20 text-xs mt-3">
            By creating an account you agree to our{" "}
            <a href="#" className="hover:text-white/40 transition-colors underline">Terms</a> and{" "}
            <a href="#" className="hover:text-white/40 transition-colors underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
