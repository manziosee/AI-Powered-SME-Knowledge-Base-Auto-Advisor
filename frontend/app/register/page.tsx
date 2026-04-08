"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye, EyeOff, ArrowRight, Check, Brain, ShieldCheck,
  FileText, Zap, Sparkles, Globe, Lock, Mail,
  Building2, User, Star, Users, CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { auth as authApi } from "@/lib/api";

const COUNTRIES = ["Rwanda","Kenya","Nigeria","South Africa","France","United States","Uganda","Tanzania","Ghana","Ethiopia","Other"];
const INDUSTRIES = ["Professional Services","Technology","Healthcare","Retail & E-commerce","Logistics & Supply Chain","Finance & Banking","Agriculture","Education","Legal & Accounting","Manufacturing","Other"];

type AccountType = "company" | "individual";

/* ── Visual Panel (same AI orb but different text) ──────────── */
function VisualPanel() {
  return (
    <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between overflow-hidden"
      style={{ background: "linear-gradient(145deg, #020510 0%, #050d20 40%, #030918 100%)" }}>

      {/* Grid */}
      <div className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "linear-gradient(rgba(99,102,241,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.15) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

      {/* Glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.16) 0%, rgba(37,99,235,0.07) 40%, transparent 70%)" }} />
        <div className="absolute top-0 right-0 w-[350px] h-[350px] rounded-full blur-[100px]"
          style={{ background: "radial-gradient(circle, rgba(6,182,212,0.10) 0%, transparent 70%)" }} />
      </div>

      {/* Logo */}
      <div className="relative z-10 p-8 lg:p-12">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Brain size={22} className="text-white" />
          </div>
          <span className="text-white font-black text-xl tracking-tight">AdvisorAI</span>
        </Link>
      </div>

      {/* Orb */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8">
        <div className="relative w-64 h-64 flex items-center justify-center mb-10">
          <div className="absolute inset-0 rounded-full border border-violet-500/15 animate-[spin_20s_linear_infinite]">
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.8)]" />
          </div>
          <div className="absolute inset-8 rounded-full border border-indigo-500/20 animate-[spin_13s_linear_infinite_reverse]">
            <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)]" />
          </div>
          <div className="absolute inset-16 rounded-full border border-cyan-500/20 animate-[spin_8s_linear_infinite]">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.9)]" />
          </div>
          <div className="absolute inset-4 rounded-full border border-dashed border-white/5" />
          <div className="relative flex items-center justify-center">
            <div className="absolute w-24 h-24 rounded-full bg-violet-600/10 animate-ping" style={{ animationDuration: "3.5s" }} />
            <div className="relative w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: "radial-gradient(circle at 35% 35%, #a78bfa, #7c3aed 50%, #4c1d95 100%)",
                boxShadow: "0 0 40px rgba(124,58,237,0.6), 0 0 80px rgba(124,58,237,0.25), inset 0 0 20px rgba(255,255,255,0.15)",
              }}>
              <Sparkles size={24} className="text-white" />
            </div>
          </div>
        </div>

        <div className="text-center mb-8 max-w-xs">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 mb-4">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-white/60 text-xs font-medium">Free forever — no credit card</span>
          </div>
          <h2 className="text-2xl font-black text-white leading-tight mb-3">
            Everything your{" "}
            <span style={{
              background: "linear-gradient(135deg, #818cf8, #a78bfa, #22d3ee)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>business needs</span>
          </h2>
          <p className="text-white/50 text-sm leading-relaxed">
            Join hundreds of SMEs using AdvisorAI to stay compliant and get instant answers.
          </p>
        </div>

        {/* Feature list */}
        <div className="flex flex-col gap-2.5 max-w-xs w-full">
          {[
            { icon: Brain,       text: "AI advisor with cited answers",     color: "text-violet-400" },
            { icon: ShieldCheck, text: "Compliance across 7 jurisdictions", color: "text-cyan-400"   },
            { icon: FileText,    text: "Upload any file type",              color: "text-indigo-400" },
            { icon: Zap,         text: "Answers under 500ms",               color: "text-teal-400"   },
          ].map(({ icon: Icon, text, color }) => (
            <div key={text} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-white/7 bg-white/3">
              <Icon size={13} className={color} />
              <span className="text-white/70 text-xs">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trust */}
      <div className="relative z-10 p-8 lg:p-12">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {[
                "from-violet-500 to-purple-600","from-blue-500 to-indigo-600","from-teal-500 to-emerald-600",
              ].map((g, i) => (
                <div key={i} className={`w-7 h-7 rounded-full bg-gradient-to-br ${g} border-2 border-[#030918] flex items-center justify-center text-[9px] font-black text-white`}>
                  {["A","B","C"][i]}
                </div>
              ))}
            </div>
            <div>
              <p className="text-white/80 text-xs font-bold">200+ companies joined</p>
              <div className="flex gap-0.5 mt-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} size={9} className="text-amber-400 fill-amber-400" />)}
              </div>
            </div>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {["🔒 Free", "🌍 7 regions"].map(t => (
              <span key={t} className="text-[10px] text-white/50 px-2.5 py-1 rounded-full border border-white/8 bg-white/4">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Input component ─────────────────────────────────────────── */
const INPUT_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1.5px solid rgba(255,255,255,0.08)",
};

function StyledInput({
  icon: Icon, type = "text", value, onChange, placeholder, required,
  autoComplete, minLength, children, className = "",
}: {
  icon: React.ElementType; type?: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string; required?: boolean; autoComplete?: string;
  minLength?: number; children?: React.ReactNode; className?: string;
}) {
  return (
    <div className="relative">
      <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-10" />
      <input
        type={type} value={value} onChange={onChange}
        placeholder={placeholder} required={required}
        autoComplete={autoComplete} minLength={minLength}
        className={`w-full pl-11 pr-4 py-4 rounded-2xl text-white placeholder-slate-600 outline-none transition-all ${className}`}
        style={INPUT_STYLE}
        onFocus={e => { e.target.style.borderColor = "rgba(124,58,237,0.55)"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.12)"; }}
        onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
      />
      {children}
    </div>
  );
}

/* ── Main Register Page ──────────────────────────────────────── */
export default function RegisterPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<AccountType>("company");
  const [step, setStep] = useState(1);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", company: "", country: "", industry: "" });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const [regError, setRegError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setLoading(true);
    const payload: Parameters<typeof authApi.register>[0] = {
      email: form.email, password: form.password, full_name: form.name,
      account_type: accountType,
      ...(accountType === "company" ? {
        company_name: form.company || undefined,
        country: form.country || undefined,
        industry: form.industry || undefined,
      } : {}),
    };
    const { data, error } = await authApi.register(payload);
    if (data) {
      const loginRes = await authApi.login(form.email, form.password);
      if (loginRes.data?.access_token) {
        const meRes = await authApi.me();
        const u = meRes.data;
        const initials = form.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
        localStorage.setItem("auth_user", JSON.stringify({
          id: u?.id ?? data.id, name: form.name, email: form.email,
          role: u?.role ?? (accountType === "company" ? "super_admin" : "individual"),
          account_type: accountType, company: form.company, avatar: initials,
        }));
        router.push("/dashboard");
        return;
      }
    }
    setRegError(error ?? "Registration failed. Please try again.");
    setLoading(false);
  };

  const SubmitBtn = ({ label }: { label: string }) => (
    <button
      type="submit" disabled={loading}
      className="relative w-full py-4 rounded-2xl font-black text-white text-sm tracking-wide transition-all duration-300 overflow-hidden disabled:opacity-60 hover:-translate-y-0.5 active:scale-[0.98]"
      style={{
        background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #2563eb 100%)",
        boxShadow: "0 4px 30px rgba(124,58,237,0.4), 0 1px 0 rgba(255,255,255,0.15) inset",
      }}
    >
      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      {loading ? (
        <span className="flex items-center justify-center gap-2.5">
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Creating account...
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2.5">
          {label} <ArrowRight size={16} />
        </span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen flex" style={{ background: "#030916" }}>
      <VisualPanel />

      {/* Form Panel */}
      <div className="flex-1 flex flex-col justify-center px-6 lg:px-12 py-10 relative overflow-y-auto"
        style={{ background: "linear-gradient(160deg, #060d1e 0%, #08101f 100%)" }}>

        {/* Glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[350px] h-[350px] rounded-full blur-[140px] opacity-25"
            style={{ background: "radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 left-0 w-[250px] h-[250px] rounded-full blur-[100px] opacity-15"
            style={{ background: "radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 70%)" }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-[420px] w-full mx-auto relative z-10"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Brain size={18} className="text-white" />
            </div>
            <span className="text-white font-black text-lg">AdvisorAI</span>
          </div>

          {/* Header */}
          <div className="mb-7">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 mb-5">
              <Sparkles size={11} className="text-violet-400" />
              <span className="text-violet-400 text-xs font-semibold">Free forever — no credit card</span>
            </div>
            <h1 className="text-4xl font-black leading-none tracking-tight mb-2" style={{ color: "#f0f4ff" }}>
              Create account
            </h1>
            <p className="text-slate-400 text-sm">Set up your AI workspace in under 2 minutes.</p>
          </div>

          {/* Account Type Toggle */}
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            {(["company", "individual"] as AccountType[]).map((type) => {
              const isCompany = type === "company";
              const selected = accountType === type;
              const Icon = isCompany ? Building2 : User;
              const accentSel = isCompany ? "border-violet-500/60 bg-violet-500/10" : "border-amber-500/50 bg-amber-500/8";
              const accentIcon = isCompany ? "bg-violet-600" : "bg-amber-500";
              const accentLabel = isCompany ? "text-violet-400" : "text-amber-400";
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => { setAccountType(type); setStep(1); }}
                  className={`flex items-center gap-2.5 p-3.5 rounded-2xl border-[1.5px] transition-all text-left ${selected ? accentSel : "border-white/8 bg-white/3 hover:border-white/15"}`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${selected ? accentIcon : "bg-white/8"}`}>
                    <Icon size={16} className={selected ? "text-white" : "text-slate-500"} />
                  </div>
                  <div>
                    <p className={`text-sm font-bold leading-none mb-0.5 ${selected ? accentLabel : "text-slate-400"}`}>
                      {isCompany ? "Company" : "Personal"}
                    </p>
                    <p className="text-slate-600 text-[10px]">
                      {isCompany ? "You become Super Admin" : "No company needed"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Context note */}
          <div className={`mb-5 px-3.5 py-3 rounded-xl text-xs border leading-relaxed ${
            accountType === "company"
              ? "border-violet-500/20 bg-violet-500/8 text-violet-300/80"
              : "border-amber-500/20 bg-amber-500/8 text-amber-300/80"
          }`}>
            {accountType === "company"
              ? "🏢 You'll be the Super Admin — create users, assign roles & manage your organization."
              : "👤 Personal account — limited to your own documents and AI queries."}
          </div>

          {/* Error */}
          {regError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 mb-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400"
            >
              <span className="text-sm">{regError}</span>
            </motion.div>
          )}

          {/* Step indicator */}
          {accountType === "company" && (
            <div className="flex items-center gap-3 mb-6">
              {[1, 2].map((s) => (
                <React.Fragment key={s}>
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step > s
                        ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white"
                        : step === s
                          ? "border-[1.5px] border-violet-500/60 text-violet-400 bg-violet-500/10"
                          : "border border-white/10 text-slate-600 bg-white/3"
                    }`}>
                      {step > s ? <Check size={12} /> : s}
                    </div>
                    <span className={`text-xs font-medium hidden sm:block ${step === s ? "text-slate-300" : "text-slate-600"}`}>
                      {s === 1 ? "Account" : "Business"}
                    </span>
                  </div>
                  {s < 2 && (
                    <div className={`flex-1 h-px rounded-full transition-all ${step > s ? "bg-gradient-to-r from-violet-600 to-indigo-600" : "bg-white/8"}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Step 1 */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={e => { e.preventDefault(); if (accountType === "company") setStep(2); else handleRegister(e); }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-slate-400 text-[10px] font-bold mb-2.5 tracking-[0.18em] uppercase">Full name</label>
                  <StyledInput icon={User} value={form.name} onChange={e => set("name", e.target.value)} placeholder="Alice Uwimana" required />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] font-bold mb-2.5 tracking-[0.18em] uppercase">Email</label>
                  <StyledInput icon={Mail} type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="you@company.com" required autoComplete="email" />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] font-bold mb-2.5 tracking-[0.18em] uppercase">Password</label>
                  <StyledInput icon={Lock} type={showPw ? "text" : "password"} value={form.password} onChange={e => set("password", e.target.value)} placeholder="Minimum 8 characters" required autoComplete="new-password" minLength={8} className="pr-12">
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors z-10"
                      aria-label={showPw ? "Hide password" : "Show password"}>
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </StyledInput>
                </div>
                <div className="pt-1">
                  <SubmitBtn label={accountType === "company" ? "Continue" : "Create account"} />
                </div>
              </motion.form>
            )}

            {/* Step 2 */}
            {step === 2 && accountType === "company" && (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleRegister}
                className="space-y-4"
              >
                <div>
                  <label className="block text-slate-400 text-[10px] font-bold mb-2.5 tracking-[0.18em] uppercase">Company name</label>
                  <StyledInput icon={Building2} value={form.company} onChange={e => set("company", e.target.value)} placeholder="TechVentures Ltd" required />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] font-bold mb-2.5 tracking-[0.18em] uppercase">Country</label>
                  <div className="relative">
                    <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-10" />
                    <select value={form.country} onChange={e => set("country", e.target.value)} required
                      className="w-full pl-11 pr-4 py-4 rounded-2xl text-white outline-none transition-all appearance-none cursor-pointer"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)", color: form.country ? "#f0f4ff" : "#475569" }}
                      onFocus={e => { (e.target as HTMLSelectElement).style.borderColor = "rgba(124,58,237,0.55)"; (e.target as HTMLSelectElement).style.boxShadow = "0 0 0 3px rgba(124,58,237,0.12)"; }}
                      onBlur={e => { (e.target as HTMLSelectElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.target as HTMLSelectElement).style.boxShadow = "none"; }}
                    >
                      <option value="" style={{ background: "#0a1228" }}>Select your country…</option>
                      {COUNTRIES.map(c => <option key={c} value={c} style={{ background: "#0a1228" }}>{c}</option>)}
                    </select>
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs">▾</div>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] font-bold mb-2.5 tracking-[0.18em] uppercase">Industry</label>
                  <div className="relative">
                    <FileText size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-10" />
                    <select value={form.industry} onChange={e => set("industry", e.target.value)} required
                      className="w-full pl-11 pr-4 py-4 rounded-2xl text-white outline-none transition-all appearance-none cursor-pointer"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)", color: form.industry ? "#f0f4ff" : "#475569" }}
                      onFocus={e => { (e.target as HTMLSelectElement).style.borderColor = "rgba(124,58,237,0.55)"; (e.target as HTMLSelectElement).style.boxShadow = "0 0 0 3px rgba(124,58,237,0.12)"; }}
                      onBlur={e => { (e.target as HTMLSelectElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.target as HTMLSelectElement).style.boxShadow = "none"; }}
                    >
                      <option value="" style={{ background: "#0a1228" }}>Select your industry…</option>
                      {INDUSTRIES.map(ind => <option key={ind} value={ind} style={{ background: "#0a1228" }}>{ind}</option>)}
                    </select>
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs">▾</div>
                  </div>
                </div>
                <div className="flex gap-2.5 pt-1">
                  <button type="button" onClick={() => setStep(1)}
                    className="flex-1 py-4 rounded-2xl text-sm font-semibold text-slate-400 hover:text-white transition-all"
                    style={{ border: "1.5px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
                    ← Back
                  </button>
                  <div className="flex-1">
                    <SubmitBtn label="Create account" />
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Footer */}
          <div className="mt-8 space-y-4">
            <p className="text-center text-slate-500 text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
                Sign in →
              </Link>
            </p>
            <div className="flex items-center justify-center gap-3">
              {["SOC 2 Ready", "GDPR", "TLS 1.3"].map((b) => (
                <span key={b} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono text-slate-500 border border-slate-700/60">
                  <CheckCircle size={9} className="text-teal-500" />
                  {b}
                </span>
              ))}
            </div>
            <p className="text-center text-slate-600 text-xs">
              By creating an account you agree to our{" "}
              <a href="#" className="text-violet-400/80 hover:text-violet-400">Terms</a> and{" "}
              <a href="#" className="text-violet-400/80 hover:text-violet-400">Privacy Policy</a>.
            </p>
            <div className="text-center">
              <Link href="/" className="text-slate-600 hover:text-slate-400 text-xs transition-colors">← Back to home</Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
