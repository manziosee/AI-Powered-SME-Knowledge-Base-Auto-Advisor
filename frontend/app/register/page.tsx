"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Check, Brain, ShieldCheck, FileText, Zap, Sparkles, Globe, TrendingUp, Lock, Mail, Building2, User, Star, Users } from "lucide-react";
import Link from "next/link";
import { auth as authApi } from "@/lib/api";

const COUNTRIES = ["Rwanda","Kenya","Nigeria","South Africa","France","United States","Uganda","Tanzania","Ghana","Ethiopia","Other"];
const INDUSTRIES = ["Professional Services","Technology","Healthcare","Retail & E-commerce","Logistics & Supply Chain","Finance & Banking","Agriculture","Education","Legal & Accounting","Manufacturing","Other"];

const features = [
  { icon: Brain, label: "AI Advisor", desc: "RAG pipeline — cited answers" },
  { icon: ShieldCheck, label: "Compliance", desc: "7 jurisdictions covered" },
  { icon: FileText, label: "Document Search", desc: "Upload any file type" },
  { icon: Zap, label: "Fast Answers", desc: "Under 500ms response time" },
];

const testimonials = [
  { quote: "Found a contract renewal we had missed. Saved us $24,000 in auto-renewal fees.", name: "James Mwangi", role: "Operations Manager", company: "RetailPro Kenya", initials: "JM" },
  { quote: "Setup took 10 minutes. We found 3 compliance gaps within the first hour.", name: "Alice Uwimana", role: "CEO", company: "TechVentures RW", initials: "AU" },
];

const socialProof = [
  { value: "200+", label: "companies joined", icon: Users },
  { value: "4.9/5", label: "rating", icon: Star },
];

const INPUT = "w-full px-4 py-4 pl-12 rounded-2xl bg-[var(--surface)] border-2 border-[var(--border)] text-[var(--fg)] placeholder-[var(--fg-muted)] focus:outline-none focus:border-[var(--primary)] transition-all";

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setRegError(""); 
    setLoading(true);
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
        router.push("/dashboard"); 
        return;
      }
    }
    setRegError(error ?? "Registration failed. Please try again.");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT - Brand Panel - always dark background */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-8 lg:p-12 overflow-hidden bg-[#040816]">
        
        {/* Animated Background */}
        <div className="absolute inset-0 bg-dots opacity-30" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[700px] rounded-full blur-[140px]"
            style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.18) 0%, transparent 70%)" }} />
          <div className="absolute bottom-1/4 right-0 w-[600px] h-[500px] rounded-full blur-[120px]"
            style={{ background: "radial-gradient(ellipse, rgba(37,99,235,0.12) 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 left-0 w-[500px] h-[400px] rounded-full blur-[100px]"
            style={{ background: "radial-gradient(ellipse, rgba(13,148,136,0.10) 0%, transparent 70%)" }} />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Brain size={24} className="text-white" />
            </div>
            <span className="text-white font-black text-xl tracking-tight">AdvisorAI</span>
          </Link>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center py-8">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white/90 text-xs font-medium mb-4">
              <Sparkles size={12} className="text-white/80" />
              Free forever — no credit card
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white leading-[1.2] mb-3">
              Everything your<br />
              <span className="text-white/90">business needs</span>
            </h1>
            <p className="text-white/70 text-base leading-relaxed max-w-md">
              Join hundreds of SMEs using AdvisorAI to stay compliant, manage documents, and get instant answers.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-all">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mb-2">
                  <Icon size={14} className="text-white" />
                </div>
                <p className="text-white font-medium text-xs mb-0.5">{label}</p>
                <p className="text-white/50 text-[10px]">{desc}</p>
              </div>
            ))}
          </div>

          {/* Social Proof */}
          <div className="flex gap-4 mb-6">
            {socialProof.map(({ value, label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-1.5">
                <Icon size={14} className="text-white/50" />
                <span className="text-white font-semibold text-sm">{value}</span>
                <span className="text-white/50 text-xs">{label}</span>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
            <div className="flex gap-1 mb-2">
              {[...Array(5)].map((_, i) => <Star key={i} size={12} className="text-amber-300 fill-amber-300" />)}
            </div>
            <p className="text-white/80 text-xs leading-relaxed mb-3">&ldquo;{testimonials[1].quote}&rdquo;</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs">
                {testimonials[1].initials}
              </div>
              <div>
                <p className="text-white font-medium text-xs">{testimonials[1].name}</p>
                <p className="text-white/50 text-[10px]">{testimonials[1].role} · {testimonials[1].company}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="relative z-10 flex gap-3 flex-wrap">
          {["🔒 Free forever", "✅ No credit card", "🌍 7 jurisdictions"].map((item) => (
            <span key={item} className="text-[10px] text-white/60 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* RIGHT - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 lg:px-16 py-10 relative bg-[var(--bg)]">
        <div className="absolute top-20 right-20 w-[400px] h-[400px] rounded-full blur-[150px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--primary-muted) 0%, transparent 70%)' }} />
        <div className="absolute bottom-20 left-20 w-[300px] h-[300px] rounded-full blur-[120px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--secondary-muted) 0%, transparent 70%)' }} />

        <div className="max-w-[440px] w-full mx-auto relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
              <Brain size={18} className="text-white" />
            </div>
            <span className="text-[var(--fg)] font-black text-lg">AdvisorAI</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--primary-muted)] mb-5">
              <Sparkles size={12} className="text-[var(--primary)]" />
              <span className="text-[var(--primary)] text-xs font-semibold">Free forever — no credit card</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-[var(--fg)] tracking-tight mb-2">Create account</h1>
            <p className="text-[var(--fg-muted)] text-base">Set up your AI workspace in under 2 minutes.</p>
          </div>

          {/* Account Type Toggle */}
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { setAccountType("company"); setStep(1); }}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                  accountType === "company"
                    ? "border-[var(--primary)] bg-[var(--primary-muted)]"
                    : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/40"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  accountType === "company" ? "bg-[var(--primary)]" : "bg-[var(--bg-soft)]"
                }`}>
                  <Building2 size={18} className={accountType === "company" ? "text-white" : "text-[var(--fg-muted)]"} />
                </div>
                <div>
                  <p className={`text-sm font-bold ${accountType === "company" ? "text-[var(--primary)]" : "text-[var(--fg-soft)]"}`}>Company</p>
                  <p className="text-xs text-[var(--fg-muted)]">You become Super Admin</p>
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
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  accountType === "individual" ? "bg-amber-500" : "bg-[var(--bg-soft)]"
                }`}>
                  <User size={18} className={accountType === "individual" ? "text-white" : "text-[var(--fg-muted)]"} />
                </div>
                <div>
                  <p className={`text-sm font-bold ${accountType === "individual" ? "text-amber-500" : "text-[var(--fg-soft)]"}`}>Personal</p>
                  <p className="text-xs text-[var(--fg-muted)]">No company needed</p>
                </div>
              </button>
            </div>

            <div className={`mt-3 px-4 py-3 rounded-xl text-sm border ${
              accountType === "company"
                ? "bg-[var(--primary-muted)] border-[var(--primary)]/20 text-[var(--fg-soft)]"
                : "bg-amber-500/10 border-amber-500/20 text-amber-600"
            }`}>
              {accountType === "company"
                ? "🏢 You'll be the Super Admin — create users, assign roles & manage your organization."
                : "👤 Personal account — limited to your own documents and AI queries."}
            </div>
          </div>

          {/* Error */}
          {regError && (
            <div className="flex items-start gap-3 p-4 mb-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500">
              <span className="text-sm">{regError}</span>
            </div>
          )}

          {/* Step Indicator */}
          {accountType === "company" && (
            <div className="flex items-center gap-3 mb-6">
              {[1, 2].map((s) => (
                <React.Fragment key={s}>
                  <div className={`flex items-center gap-2`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      step > s ? "bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-white"
                      : step === s ? "bg-[var(--primary-muted)] border-2 border-[var(--primary)] text-[var(--primary)]"
                      : "bg-[var(--surface)] border border-[var(--border)] text-[var(--fg-muted)]"
                    }`}>
                      {step > s ? <Check size={14} /> : s}
                    </div>
                    <span className={`text-sm font-medium hidden sm:block ${step === s ? "text-[var(--fg-soft)]" : "text-[var(--fg-muted)]"}`}>
                      {s === 1 ? "Account" : "Business"}
                    </span>
                  </div>
                  {s < 2 && (
                    <div className={`flex-1 h-0.5 rounded-full ${step > s ? "bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]" : "bg-[var(--border)]"}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Step 1 - Account */}
          {step === 1 && (
            <form onSubmit={e => {
              e.preventDefault();
              if (accountType === "company") { setStep(2); }
              else { handleRegister(e); }
            }} className="space-y-5">
              <div>
                <label className="block text-[var(--fg-muted)] text-xs font-bold mb-3 tracking-widest uppercase">Full name</label>
                <div className="relative">
                  <input type="text" value={form.name} onChange={e => set("name", e.target.value)} placeholder="Alice Uwimana" required className={INPUT} />
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
                </div>
              </div>
              <div>
                <label className="block text-[var(--fg-muted)] text-xs font-bold mb-3 tracking-widest uppercase">Email</label>
                <div className="relative">
                  <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="you@company.com" required className={INPUT} autoComplete="email" />
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
                </div>
              </div>
              <div>
                <label className="block text-[var(--fg-muted)] text-xs font-bold mb-3 tracking-widest uppercase">Password</label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} value={form.password} onChange={e => set("password", e.target.value)} placeholder="Minimum 8 characters" required minLength={8} className={INPUT + " pr-12"} autoComplete="new-password" />
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] hover:text-[var(--fg)]">
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-4 rounded-2xl font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
                style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)', boxShadow: '0 4px 20px var(--primary-muted)' }}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </span>
                ) : accountType === "company" ? (
                  <span className="flex items-center justify-center gap-2">Continue <ArrowRight size={18} /></span>
                ) : (
                  <span className="flex items-center justify-center gap-2">Create account <ArrowRight size={18} /></span>
                )}
              </button>
            </form>
          )}

          {/* Step 2 - Company */}
          {step === 2 && accountType === "company" && (
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="block text-[var(--fg-muted)] text-xs font-bold mb-3 tracking-widest uppercase">Company name</label>
                <div className="relative">
                  <input type="text" value={form.company} onChange={e => set("company", e.target.value)} placeholder="TechVentures Ltd" required className={INPUT} />
                  <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
                </div>
              </div>
              <div>
                <label className="block text-[var(--fg-muted)] text-xs font-bold mb-3 tracking-widest uppercase">Country</label>
                <div className="relative">
                  <select value={form.country} onChange={e => set("country", e.target.value)} required className={INPUT + " appearance-none cursor-pointer"}>
                    <option value="">Select your country…</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] pointer-events-none" />
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]">▾</div>
                </div>
              </div>
              <div>
                <label className="block text-[var(--fg-muted)] text-xs font-bold mb-3 tracking-widest uppercase">Industry</label>
                <div className="relative">
                  <select value={form.industry} onChange={e => set("industry", e.target.value)} required className={INPUT + " appearance-none cursor-pointer"}>
                    <option value="">Select your industry…</option>
                    {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                  </select>
                  <TrendingUp size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] pointer-events-none" />
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]">▾</div>
                </div>
              </div>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 py-4 rounded-2xl border-2 border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-[var(--primary)]/40 text-sm font-semibold transition-all">
                  ← Back
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-4 rounded-2xl font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)', boxShadow: '0 4px 20px var(--primary-muted)' }}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">Create account <ArrowRight size={18} /></span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Footer */}
          <p className="text-center text-[var(--fg-muted)] mt-8">
            Already have an account?{" "}
            <Link href="/login" className="text-[var(--primary)] hover:text-[var(--primary-hover)] font-semibold">
              Sign in →
            </Link>
          </p>
          <p className="text-center text-[var(--fg-muted)] text-sm mt-4">
            By creating an account you agree to our{" "}
            <a href="#" className="text-[var(--primary)] hover:underline">Terms</a> and{" "}
            <a href="#" className="text-[var(--primary)] hover:underline">Privacy Policy</a>.
          </p>
          <div className="text-center mt-6">
            <Link href="/" className="text-[var(--fg-muted)] hover:text-[var(--fg)] text-sm">← Back to home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}