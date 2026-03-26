"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye, EyeOff, ArrowRight, Check, ArrowLeft,
  Brain, ShieldCheck, FileText, Zap, Sparkles,
} from "lucide-react";
import Link from "next/link";
import { auth as authApi } from "@/lib/api";

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

const INPUT = "w-full px-4 py-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)] placeholder-[var(--fg-muted)] focus:outline-none focus:border-violet-500/60 focus:bg-violet-500/5 transition-all text-sm hover:border-violet-500/30";
const SELECT_OPTION = "bg-[var(--bg-muted)]";

const perks = [
  { icon: Brain,       text: "AI Advisor with RAG pipeline"    },
  { icon: ShieldCheck, text: "Compliance for 7 jurisdictions"  },
  { icon: FileText,    text: "Upload unlimited document types" },
  { icon: Zap,         text: "Answers in under 500 ms"         },
];

const steps = [
  { number: 1, label: "Your account"  },
  { number: 2, label: "Your business" },
];

export default function RegisterPage() {
  const router  = useRouter();
  const [step,    setStep]   = useState(1);
  const [showPw,  setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", password: "",
    company: "", country: "", industry: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const [regError, setRegError] = React.useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setLoading(true);
    const { data, error } = await authApi.register({
      email: form.email,
      password: form.password,
      full_name: form.name,
      company_name: form.company || undefined,
      country: form.country || undefined,
      industry: form.industry || undefined,
    });
    if (data) {
      const loginRes = await authApi.login(form.email, form.password);
      if (loginRes.data?.access_token) {
        const meRes = await authApi.me();
        const u = meRes.data;
        const initials = form.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
        localStorage.setItem("auth_user", JSON.stringify({
          id: u?.id ?? data.id,
          name: form.name,
          email: form.email,
          role: u?.role ?? "admin",
          company: form.company,
          avatar: initials,
        }));
        router.push("/dashboard");
        return;
      }
    }
    setRegError(error ?? "Registration failed. Please try again.");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex transition-colors duration-300">

      {/* ── Left branding panel ──────────────────────────────────── */}
      <div className="hidden lg:flex w-[44%] relative flex-col p-10 overflow-hidden border-r border-[var(--border)]">

        {/* Theme-aware panel background */}
        <div className="absolute inset-0 bg-[var(--bg-soft)]" />
        <div className="absolute inset-0 opacity-30 bg-dots" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
        <div className="absolute top-1/3 left-1/2 w-[380px] h-[380px] rounded-full blur-[130px] pointer-events-none bg-violet-500/10 dark:bg-violet-600/14" />
        <div className="absolute bottom-0 left-0 w-[260px] h-[260px] rounded-full blur-[90px] pointer-events-none bg-cyan-500/8" />

        {/* Back */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[var(--fg-muted)] hover:text-[var(--fg)] text-xs transition-all group">
            <ArrowLeft size={13} className="group-hover:-translate-x-1 transition-transform" />
            Back to home
          </Link>
        </div>

        {/* Brand + perks */}
        <div className="relative z-10 flex-1 flex flex-col justify-center gap-9">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.15)] hover:shadow-[0_0_30px_rgba(124,58,237,0.3)] transition-all duration-300">
                <Brain size={20} className="text-violet-500" />
              </div>
              <span className="text-[var(--fg)] font-bold text-lg tracking-tight">AdvisorAI</span>
            </div>
            <h2 className="text-3xl font-black text-[var(--fg)] leading-[1.1] mb-3 tracking-tight">
              Everything your business<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 via-purple-500 to-cyan-500">
                needs in one place.
              </span>
            </h2>
            <p className="text-[var(--fg-muted)] text-sm leading-relaxed">
              Join hundreds of SMEs using AdvisorAI to stay compliant, manage documents, and get instant answers.
            </p>
          </div>

          {/* Perks */}
          <div className="flex flex-col gap-2.5">
            {perks.map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-3 group p-3 rounded-xl hover:bg-[var(--surface)] transition-all">
                <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-500/15 transition-colors">
                  <Icon size={14} className="text-violet-500 group-hover:text-violet-400 transition-colors" />
                </div>
                <span className="text-[var(--fg-muted)] text-sm group-hover:text-[var(--fg-soft)] transition-colors">{text}</span>
              </div>
            ))}
          </div>

          {/* Social proof card */}
          <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
            <div className="flex items-center gap-2 mb-3">
              <div className="flex -space-x-2">
                {[
                  { av: "AU", cls: "bg-violet-500/20 text-violet-500"  },
                  { av: "JM", cls: "bg-cyan-500/20    text-cyan-500"   },
                  { av: "FO", cls: "bg-emerald-500/20 text-emerald-500"},
                ].map(({ av, cls }, i) => (
                  <div key={i} className={`w-7 h-7 rounded-full border-2 border-[var(--bg-soft)] flex items-center justify-center text-[10px] font-bold ${cls}`}>{av}</div>
                ))}
              </div>
              <span className="text-[var(--fg-muted)] text-xs">+200 companies joined this month</span>
            </div>
            <div className="flex gap-0.5 mb-2">
              {[...Array(5)].map((_, i) => <span key={i} className="text-amber-500 text-xs">★</span>)}
            </div>
            <p className="text-[var(--fg-soft)] text-xs leading-relaxed">
              &ldquo;Setup took 10 minutes. We found 3 compliance gaps within the first hour.&rdquo;
            </p>
            <p className="text-[var(--fg-muted)] text-[10px] mt-2">— Alice Uwimana, CEO · TechVentures RW</p>
          </div>
        </div>

        {/* Bottom trust */}
        <div className="relative z-10 flex gap-2.5 flex-wrap">
          {["🔒 Free forever plan", "✅ No credit card", "🌍 7 jurisdictions"].map((b) => (
            <span key={b} className="text-[10px] text-[var(--fg-muted)] px-3 py-1.5 rounded-full border border-[var(--border)]">
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center px-6 lg:px-12 py-10 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/15 to-transparent" />

        <div className="max-w-[400px] w-full mx-auto">

          {/* Mobile: back + logo */}
          <div className="lg:hidden flex items-center justify-between mb-8">
            <Link href="/" className="flex items-center gap-1.5 text-[var(--fg-muted)] hover:text-[var(--fg)] text-xs transition-all group">
              <ArrowLeft size={13} className="group-hover:-translate-x-1 transition-transform" /> Back
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
                <Brain size={14} className="text-violet-500" />
              </div>
              <span className="text-[var(--fg)] font-bold text-sm">AdvisorAI</span>
            </div>
            <div className="w-12" />
          </div>

          {/* Desktop back */}
          <Link href="/"
            className="hidden lg:inline-flex items-center gap-1.5 text-[var(--fg-muted)] hover:text-violet-500 text-xs transition-all mb-8 group">
            <ArrowLeft size={13} className="group-hover:-translate-x-1 transition-transform" /> Back to home
          </Link>

          {/* Header */}
          <div className="mb-7">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-violet-500" />
              <span className="text-violet-500/70 text-xs tracking-wide">Free forever — no credit card</span>
            </div>
            <h1 className="text-3xl font-black text-[var(--fg)] mb-2 tracking-tight">
              {step === 1 ? "Create account" : "About your business"}
            </h1>
            <p className="text-[var(--fg-muted)] text-sm">
              {step === 1
                ? "Set up your AI workspace in under 2 minutes."
                : "Help us configure the right compliance rules for you."}
            </p>
          </div>

          {/* Error banner */}
          {regError && (
            <div className="flex items-start gap-2.5 p-4 mb-5 rounded-xl bg-rose-500/8 border border-rose-500/25 text-rose-500 text-sm">
              <span className="mt-0.5 flex-shrink-0">⚠</span>
              <span>{regError}</span>
            </div>
          )}

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-7">
            {steps.map((s, i) => (
              <React.Fragment key={s.number}>
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step > s.number
                      ? "bg-violet-500 text-white shadow-[0_0_12px_rgba(124,58,237,0.4)]"
                      : step === s.number
                      ? "bg-violet-500/15 border-2 border-violet-500 text-violet-500"
                      : "bg-[var(--surface)] border border-[var(--border)] text-[var(--fg-muted)]"
                  }`}>
                    {step > s.number ? <Check size={13} /> : s.number}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block transition-colors ${
                    step === s.number ? "text-[var(--fg-soft)]" : "text-[var(--fg-muted)]"
                  }`}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-px transition-all ${step > s.number ? "bg-violet-500/50" : "bg-[var(--border)]"}`} />
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
                  placeholder="Alice Uwimana" required className={INPUT} />
              </div>
              <div>
                <label className="block text-[var(--fg-muted)] text-[10px] font-semibold mb-2 tracking-widest uppercase">Work email</label>
                <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                  placeholder="alice@company.com" required className={INPUT} autoComplete="email" />
              </div>
              <div>
                <label className="block text-[var(--fg-muted)] text-[10px] font-semibold mb-2 tracking-widest uppercase">Password</label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder="Minimum 8 characters" required minLength={8}
                    className={INPUT + " pr-12"} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit"
                className="group relative w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-black text-sm transition-all duration-300 shadow-[0_0_24px_rgba(124,58,237,0.3)] hover:shadow-[0_0_36px_rgba(124,58,237,0.5)] hover:-translate-y-0.5 active:scale-[0.98] mt-1 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
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
                  placeholder="TechVentures Ltd" required className={INPUT} />
              </div>
              <div>
                <label className="block text-[var(--fg-muted)] text-[10px] font-semibold mb-2 tracking-widest uppercase">Country</label>
                <div className="relative">
                  <select value={form.country} onChange={(e) => set("country", e.target.value)} required
                    className={INPUT + " appearance-none cursor-pointer"} aria-label="Select your country">
                    <option value="" className={SELECT_OPTION}>Select your country…</option>
                    {COUNTRIES.map((c) => <option key={c} value={c} className={SELECT_OPTION}>{c}</option>)}
                  </select>
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]">▾</div>
                </div>
              </div>
              <div>
                <label className="block text-[var(--fg-muted)] text-[10px] font-semibold mb-2 tracking-widest uppercase">Industry</label>
                <div className="relative">
                  <select value={form.industry} onChange={(e) => set("industry", e.target.value)} required
                    className={INPUT + " appearance-none cursor-pointer"} aria-label="Select your industry">
                    <option value="" className={SELECT_OPTION}>Select your industry…</option>
                    {INDUSTRIES.map((ind) => <option key={ind} value={ind} className={SELECT_OPTION}>{ind}</option>)}
                  </select>
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]">▾</div>
                </div>
              </div>

              <div className="flex gap-2.5 mt-1">
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 py-3.5 rounded-xl border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-violet-500/30 hover:bg-[var(--surface)] text-sm font-medium transition-all active:scale-[0.97]">
                  Back
                </button>
                <button type="submit" disabled={loading}
                  className="group relative flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-black text-sm transition-all duration-300 disabled:opacity-50 shadow-[0_0_24px_rgba(124,58,237,0.3)] hover:shadow-[0_0_36px_rgba(124,58,237,0.5)] active:scale-[0.98] overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
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

          {/* Footer */}
          <p className="text-center text-[var(--fg-muted)] text-sm mt-8">
            Already have an account?{" "}
            <Link href="/login" className="text-violet-500 hover:text-violet-400 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
          <p className="text-center text-[var(--fg-muted)] text-xs mt-3 opacity-60">
            By creating an account you agree to our{" "}
            <a href="#" className="hover:text-[var(--fg-soft)] transition-colors underline underline-offset-2">Terms</a> and{" "}
            <a href="#" className="hover:text-[var(--fg-soft)] transition-colors underline underline-offset-2">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
