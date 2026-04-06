"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Check, Brain, ShieldCheck, FileText, Zap, Sparkles, Globe, TrendingUp, Lock, Mail, Building2, User } from "lucide-react";
import Link from "next/link";
import { auth as authApi } from "@/lib/api";

const COUNTRIES = ["Rwanda","Kenya","Nigeria","South Africa","France","United States","Uganda","Tanzania","Ghana","Ethiopia","Other"];
const INDUSTRIES = ["Professional Services","Technology","Healthcare","Retail & E-commerce","Logistics & Supply Chain","Finance & Banking","Agriculture","Education","Legal & Accounting","Manufacturing","Other"];

const perks = [
  { icon: Brain,       label: "AI Advisor",       desc: "RAG pipeline — cited answers",    color: "text-violet-400", bg: "from-violet-600 to-purple-600" },
  { icon: ShieldCheck, label: "Compliance",        desc: "7 jurisdictions covered",         color: "text-emerald-400",bg: "from-emerald-500 to-teal-500"  },
  { icon: FileText,    label: "Document Search",   desc: "Upload any file type",            color: "text-blue-400",   bg: "from-blue-600 to-cyan-500"     },
  { icon: Zap,         label: "Fast Answers",      desc: "Under 500ms response time",       color: "text-amber-400",  bg: "from-amber-500 to-orange-500"  },
];

const INPUT = "w-full px-4 py-4 pl-11 rounded-2xl bg-[var(--surface)] border-2 border-[var(--border)] text-[var(--fg)] placeholder-[var(--fg-muted)] focus:outline-none focus:border-violet-500 transition-all text-sm hover:border-violet-500/40";

type AccountType = "company" | "individual";

export default function RegisterPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<AccountType>("company");
  const [step, setStep] = useState(1);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", company: "", country: "", industry: "" });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const [regError, setRegError] = React.useState("");

  // Company flow has 2 steps; individual has 1
  const totalSteps = accountType === "company" ? 2 : 1;
  const steps = accountType === "company"
    ? [{ number: 1, label: "Your account" }, { number: 2, label: "Your business" }]
    : [{ number: 1, label: "Your account" }];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setRegError(""); setLoading(true);
    const payload: Parameters<typeof authApi.register>[0] = {
      email: form.email,
      password: form.password,
      full_name: form.name,
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
          id: u?.id ?? data.id,
          name: form.name,
          email: form.email,
          role: u?.role ?? (accountType === "company" ? "super_admin" : "individual"),
          account_type: accountType,
          company: form.company,
          avatar: initials,
        }));
        router.push("/dashboard"); return;
      }
    }
    setRegError(error ?? "Registration failed. Please try again.");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-[#050914]">

      {/* ── LEFT: Visual panel ── */}
      <div className="hidden lg:flex w-[48%] relative flex-col overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[#050914]" />
          <div className="absolute top-[-15%] right-[-15%] w-[80%] h-[80%] rounded-full blur-[130px] opacity-35"
            style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }} />
          <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[100px] opacity-25"
            style={{ background: "radial-gradient(circle, #0891b2 0%, transparent 70%)" }} />
          <div className="absolute top-[50%] left-[20%] w-[50%] h-[50%] rounded-full blur-[90px] opacity-20"
            style={{ background: "radial-gradient(circle, #059669 0%, transparent 70%)" }} />
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        </div>

        <div className="relative z-10 flex flex-col h-full p-12">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.5)]">
              <Brain size={20} className="text-white" />
            </div>
            <span className="text-white font-black text-lg tracking-tight">AdvisorAI</span>
          </Link>

          <div className="flex-1 flex flex-col justify-center">
            <div className="mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs font-medium mb-6">
                <Sparkles size={11} className="text-violet-400" />
                Free forever — no credit card
              </div>
              <h1 className="text-5xl font-black text-white leading-[1.05] tracking-tight mb-4">
                Everything your<br />business needs
                <span className="block bg-gradient-to-r from-violet-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
                  in one place.
                </span>
              </h1>
              <p className="text-white/40 text-base leading-relaxed max-w-sm">
                Join hundreds of SMEs using AdvisorAI to stay compliant, manage documents, and get instant answers.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-10">
              {perks.map(({ icon: Icon, label, desc, color, bg }) => (
                <div key={label} className="group p-4 rounded-2xl bg-white/4 border border-white/8 hover:bg-white/7 hover:border-white/15 transition-all duration-300">
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${bg} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon size={14} className="text-white" />
                  </div>
                  <p className="text-white/80 text-xs font-semibold mb-0.5">{label}</p>
                  <p className="text-white/30 text-[11px]">{desc}</p>
                </div>
              ))}
            </div>

            <div className="p-5 rounded-2xl bg-white/4 border border-white/8 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
              <div className="flex items-center gap-2 mb-3">
                <div className="flex -space-x-2">
                  {[["AU","from-violet-500 to-purple-600"],["JM","from-teal-500 to-emerald-600"],["FO","from-blue-500 to-indigo-600"]].map(([av, cls], i) => (
                    <div key={i} className={`w-7 h-7 rounded-full border-2 border-[#050914] bg-gradient-to-br ${cls} flex items-center justify-center text-[10px] font-bold text-white`}>{av}</div>
                  ))}
                </div>
                <span className="text-white/30 text-xs">+200 companies joined this month</span>
              </div>
              <div className="flex gap-0.5 mb-2">{[...Array(5)].map((_, i) => <span key={i} className="text-amber-400 text-xs">★</span>)}</div>
              <p className="text-white/55 text-xs leading-relaxed">&ldquo;Setup took 10 minutes. We found 3 compliance gaps within the first hour.&rdquo;</p>
              <p className="text-white/25 text-[10px] mt-2">— Alice Uwimana, CEO · TechVentures RW</p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {[["🔒","Free forever"],["✅","No credit card"],["🌍","7 jurisdictions"]].map(([icon, text]) => (
              <span key={text} className="text-[10px] text-white/25 px-3 py-1.5 rounded-full border border-white/8 flex items-center gap-1.5 hover:border-violet-500/30 hover:text-white/45 transition-all">
                {icon} {text}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT: Form ── */}
      <div className="flex-1 flex flex-col justify-center px-6 lg:px-14 py-10 relative bg-[var(--bg)]">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[160px] pointer-events-none opacity-20"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)" }} />

        <div className="max-w-[420px] w-full mx-auto relative z-10">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
                <Brain size={16} className="text-white" />
              </div>
              <span className="text-[var(--fg)] font-black text-base">AdvisorAI</span>
            </Link>
          </div>

          {/* Header */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 mb-5">
              <Sparkles size={11} className="text-violet-500" />
              <span className="text-violet-600 dark:text-violet-400 text-xs font-semibold">Free forever — no credit card</span>
            </div>
            <h2 className="text-4xl font-black text-[var(--fg)] tracking-tight mb-2">Create account</h2>
            <p className="text-[var(--fg-muted)] text-sm">Set up your AI workspace in under 2 minutes.</p>
          </div>

          {/* Account type toggle */}
          <div className="mb-6">
            <label className="block text-[var(--fg-muted)] text-[10px] font-bold mb-2 tracking-widest uppercase">Account type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setAccountType("company"); setStep(1); }}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                  accountType === "company"
                    ? "border-violet-500 bg-violet-500/10"
                    : "border-[var(--border)] bg-[var(--surface)] hover:border-violet-500/40"
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  accountType === "company" ? "bg-violet-500/20" : "bg-[var(--bg-soft)]"
                }`}>
                  <Building2 size={16} className={accountType === "company" ? "text-violet-500" : "text-[var(--fg-muted)]"} />
                </div>
                <div>
                  <p className={`text-xs font-bold ${accountType === "company" ? "text-violet-500" : "text-[var(--fg-soft)]"}`}>Company</p>
                  <p className="text-[10px] text-[var(--fg-muted)] leading-tight">You become Super Admin</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setAccountType("individual"); setStep(1); }}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                  accountType === "individual"
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-[var(--border)] bg-[var(--surface)] hover:border-amber-500/40"
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  accountType === "individual" ? "bg-amber-500/20" : "bg-[var(--bg-soft)]"
                }`}>
                  <User size={16} className={accountType === "individual" ? "text-amber-500" : "text-[var(--fg-muted)]"} />
                </div>
                <div>
                  <p className={`text-xs font-bold ${accountType === "individual" ? "text-amber-500" : "text-[var(--fg-soft)]"}`}>Personal</p>
                  <p className="text-[10px] text-[var(--fg-muted)] leading-tight">No company needed</p>
                </div>
              </button>
            </div>

            {/* Info banner */}
            <div className={`mt-2 px-3 py-2 rounded-xl text-[10px] leading-relaxed border ${
              accountType === "company"
                ? "bg-violet-500/5 border-violet-500/20 text-violet-600 dark:text-violet-400"
                : "bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400"
            }`}>
              {accountType === "company"
                ? "🏢 You'll be the Super Admin — create users, assign roles & permissions, and manage your organization."
                : "👤 Personal account — limited to your own documents and AI queries. No team management."}
            </div>
          </div>

          {/* Error */}
          {regError && (
            <div className="flex items-start gap-2.5 p-4 mb-5 rounded-2xl bg-rose-500/8 border border-rose-500/25 text-rose-500 text-sm">
              <span className="mt-0.5 flex-shrink-0">⚠</span><span>{regError}</span>
            </div>
          )}

          {/* Step indicator — only show for company (2 steps) */}
          {accountType === "company" && (
            <div className="flex items-center gap-2 mb-6">
              {steps.map((s, i) => (
                <React.Fragment key={s.number}>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step > s.number ? "bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-[0_0_16px_rgba(124,58,237,0.4)]"
                      : step === s.number ? "bg-violet-500/15 border-2 border-violet-500 text-violet-600 dark:text-violet-400"
                      : "bg-[var(--surface)] border border-[var(--border)] text-[var(--fg-muted)]"
                    }`}>
                      {step > s.number ? <Check size={13} /> : s.number}
                    </div>
                    <span className={`text-xs font-medium hidden sm:block ${step === s.number ? "text-[var(--fg-soft)]" : "text-[var(--fg-muted)]"}`}>{s.label}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 rounded-full transition-all ${step > s.number ? "bg-gradient-to-r from-violet-500 to-blue-500" : "bg-[var(--border)]"}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Step 1 — account details (both types) */}
          {step === 1 && (
            <form onSubmit={e => {
              e.preventDefault();
              if (accountType === "company") { setStep(2); }
              else { handleRegister(e); }
            }} className="space-y-4">
              <div>
                <label className="block text-[var(--fg-muted)] text-[10px] font-bold mb-2 tracking-widest uppercase">Full name</label>
                <div className="relative">
                  <input type="text" value={form.name} onChange={e => set("name", e.target.value)} placeholder="Alice Uwimana" required className={INPUT} />
                  <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
                </div>
              </div>
              <div>
                <label className="block text-[var(--fg-muted)] text-[10px] font-bold mb-2 tracking-widest uppercase">Email</label>
                <div className="relative">
                  <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder={accountType === "company" ? "alice@company.com" : "alice@gmail.com"} required className={INPUT} autoComplete="email" />
                  <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
                </div>
              </div>
              <div>
                <label className="block text-[var(--fg-muted)] text-[10px] font-bold mb-2 tracking-widest uppercase">Password</label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} value={form.password} onChange={e => set("password", e.target.value)} placeholder="Minimum 8 characters" required minLength={8} className={INPUT + " pr-12"} autoComplete="new-password" />
                  <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="group relative w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 hover:from-violet-500 hover:via-blue-500 hover:to-cyan-500 text-white font-black text-sm transition-all duration-300 shadow-[0_4px_30px_rgba(124,58,237,0.4)] hover:shadow-[0_8px_40px_rgba(124,58,237,0.6)] hover:-translate-y-0.5 active:scale-[0.98] mt-2 overflow-hidden disabled:opacity-50">
                <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Creating…</span></>
                ) : accountType === "company" ? (
                  <><span>Continue</span><ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>
                ) : (
                  <><span>Create account</span><ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>
            </form>
          )}

          {/* Step 2 — company details (company only) */}
          {step === 2 && accountType === "company" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-[var(--fg-muted)] text-[10px] font-bold mb-2 tracking-widest uppercase">Company name</label>
                <div className="relative">
                  <input type="text" value={form.company} onChange={e => set("company", e.target.value)} placeholder="TechVentures Ltd" required className={INPUT} />
                  <Building2 size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
                </div>
              </div>
              <div>
                <label className="block text-[var(--fg-muted)] text-[10px] font-bold mb-2 tracking-widest uppercase">Country</label>
                <div className="relative">
                  <select value={form.country} onChange={e => set("country", e.target.value)} required className={INPUT + " appearance-none cursor-pointer"} aria-label="Select your country">
                    <option value="">Select your country…</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <Globe size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] pointer-events-none" />
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]">▾</div>
                </div>
              </div>
              <div>
                <label className="block text-[var(--fg-muted)] text-[10px] font-bold mb-2 tracking-widest uppercase">Industry</label>
                <div className="relative">
                  <select value={form.industry} onChange={e => set("industry", e.target.value)} required className={INPUT + " appearance-none cursor-pointer"} aria-label="Select your industry">
                    <option value="">Select your industry…</option>
                    {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                  </select>
                  <TrendingUp size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] pointer-events-none" />
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]">▾</div>
                </div>
              </div>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 py-4 rounded-2xl border-2 border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-violet-500/40 text-sm font-semibold transition-all">
                  ← Back
                </button>
                <button type="submit" disabled={loading}
                  className="group relative flex-1 flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 hover:from-violet-500 hover:via-blue-500 hover:to-cyan-500 text-white font-black text-sm transition-all duration-300 disabled:opacity-50 shadow-[0_4px_30px_rgba(124,58,237,0.4)] hover:shadow-[0_8px_40px_rgba(124,58,237,0.6)] active:scale-[0.98] overflow-hidden">
                  <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Creating…</span></>
                  ) : (
                    <><span>Create account</span><ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>
                  )}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-[var(--fg-muted)] text-sm mt-7">
            Already have an account?{" "}
            <Link href="/login" className="text-violet-600 dark:text-violet-400 hover:text-violet-500 font-bold transition-colors">Sign in →</Link>
          </p>
          <p className="text-center text-[var(--fg-muted)] text-[11px] mt-2 opacity-60">
            By creating an account you agree to our{" "}
            <a href="#" className="underline underline-offset-2 hover:text-[var(--fg-soft)]">Terms</a> and{" "}
            <a href="#" className="underline underline-offset-2 hover:text-[var(--fg-soft)]">Privacy Policy</a>.
          </p>
          <div className="text-center mt-4">
            <Link href="/" className="text-[var(--fg-muted)] text-xs hover:text-[var(--fg)] transition-colors">← Back to home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
