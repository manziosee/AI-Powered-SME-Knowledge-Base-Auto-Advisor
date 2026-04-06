"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye, EyeOff, ArrowRight, AlertCircle, Brain,
  ShieldCheck, FileText, Bell, Globe, Zap, Sparkles,
  TrendingUp, Users, Lock,
} from "lucide-react";
import Link from "next/link";
import { auth as authApi } from "@/lib/api";

const stats = [
  { value: "10K+", label: "SMEs", color: "text-violet-400" },
  { value: "94%",  label: "Compliance", color: "text-emerald-400" },
  { value: "500ms",label: "AI Speed", color: "text-cyan-400" },
  { value: "7",    label: "Countries", color: "text-amber-400" },
];

const features = [
  { icon: Brain,       label: "AI Advisor",       desc: "Ask anything in plain English",  color: "text-violet-400", glow: "rgba(124,58,237,0.3)" },
  { icon: ShieldCheck, label: "Compliance Engine", desc: "7 jurisdictions covered",        color: "text-emerald-400",glow: "rgba(52,211,153,0.3)"  },
  { icon: FileText,    label: "Document RAG",      desc: "Search across all your files",   color: "text-blue-400",   glow: "rgba(59,130,246,0.3)"  },
  { icon: Bell,        label: "Smart Alerts",      desc: "Never miss a deadline",          color: "text-amber-400",  glow: "rgba(251,191,36,0.3)"  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [needs2FA,  setNeeds2FA]  = useState(false);
  const [userId2FA, setUserId2FA] = useState("");
  const [totpCode,  setTotpCode]  = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    if (needs2FA) {
      const { data, error } = await authApi.loginWith2FA(userId2FA, totpCode);
      if (data?.access_token) { await _storeAndRedirect(); }
      else { setError(error ?? "Invalid code."); setLoading(false); }
      return;
    }
    const { data, error, userId } = await authApi.login(email, password);
    if (data?.access_token) { await _storeAndRedirect(); }
    else if (error === "2fa_required") { setNeeds2FA(true); setUserId2FA(userId ?? ""); setLoading(false); }
    else { setError(error ?? "Invalid email or password."); setLoading(false); }
  };

  const _storeAndRedirect = async () => {
    const meRes = await authApi.me();
    if (meRes.data) {
      const u = meRes.data;
      const initials = u.full_name?.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) ?? "U";
      localStorage.setItem("auth_user", JSON.stringify({ id: u.id, name: u.full_name, email: u.email, role: u.role, company: u.company?.name ?? "", avatar: initials }));
    }
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex bg-[#050914]">

      {/* ── LEFT: Immersive dark panel ── */}
      <div className="hidden lg:flex w-[52%] relative flex-col overflow-hidden">

        {/* Animated mesh background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[#050914]" />
          {/* Orb 1 — violet */}
          <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] rounded-full blur-[120px] opacity-40"
            style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }} />
          {/* Orb 2 — blue */}
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[100px] opacity-30"
            style={{ background: "radial-gradient(circle, #2563eb 0%, transparent 70%)" }} />
          {/* Orb 3 — cyan accent */}
          <div className="absolute top-[40%] right-[10%] w-[40%] h-[40%] rounded-full blur-[80px] opacity-20"
            style={{ background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)" }} />
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-12">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.5)]">
              <Brain size={20} className="text-white" />
            </div>
            <span className="text-white font-black text-lg tracking-tight">AdvisorAI</span>
          </Link>

          {/* Main headline */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs font-medium mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Trusted by 10,000+ businesses
              </div>
              <h1 className="text-5xl font-black text-white leading-[1.05] tracking-tight mb-4">
                Your AI-powered<br />
                <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  business advisor.
                </span>
              </h1>
              <p className="text-white/40 text-base leading-relaxed max-w-sm">
                Upload documents, ask questions, stay compliant. Built for SMEs across Africa and beyond.
              </p>
            </div>

            {/* Feature grid */}
            <div className="grid grid-cols-2 gap-3 mb-10">
              {features.map(({ icon: Icon, label, desc, color, glow }) => (
                <div key={label}
                  className="group p-4 rounded-2xl bg-white/4 border border-white/8 hover:bg-white/7 hover:border-white/15 transition-all duration-300 cursor-default">
                  <div className="w-8 h-8 rounded-xl bg-white/8 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
                    style={{ boxShadow: `0 0 16px ${glow}` }}>
                    <Icon size={15} className={color} />
                  </div>
                  <p className="text-white/80 text-xs font-semibold mb-0.5">{label}</p>
                  <p className="text-white/30 text-[11px]">{desc}</p>
                </div>
              ))}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-3">
              {stats.map(({ value, label, color }) => (
                <div key={label} className="text-center p-3 rounded-xl bg-white/3 border border-white/6">
                  <p className={`text-xl font-black ${color}`}>{value}</p>
                  <p className="text-white/30 text-[10px] mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial */}
          <div className="p-5 rounded-2xl bg-white/4 border border-white/8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
            <div className="flex gap-0.5 mb-2">
              {[...Array(5)].map((_, i) => <span key={i} className="text-amber-400 text-xs">★</span>)}
            </div>
            <p className="text-white/55 text-sm leading-relaxed italic mb-3">
              &ldquo;Found a contract renewal we had missed. Saved us $24,000 in auto-renewal fees.&rdquo;
            </p>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs">JM</div>
              <div>
                <p className="text-white/65 text-xs font-semibold">James Mwangi</p>
                <p className="text-white/25 text-[10px]">Operations Manager, RetailPro Kenya</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Form panel ── */}
      <div className="flex-1 flex flex-col justify-center px-6 lg:px-16 py-10 relative bg-[var(--bg)]">

        {/* Subtle glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[160px] pointer-events-none opacity-30"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)" }} />

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
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 mb-5">
              <Sparkles size={11} className="text-violet-500" />
              <span className="text-violet-600 dark:text-violet-400 text-xs font-semibold">Welcome back</span>
            </div>
            <h1 className="text-4xl font-black text-[var(--fg)] tracking-tight mb-2">
              {needs2FA ? "Two-factor auth" : "Sign in"}
            </h1>
            <p className="text-[var(--fg-muted)] text-sm">
              {needs2FA ? "Enter the 6-digit code from your authenticator app." : "Access your AdvisorAI workspace."}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 p-4 mb-6 rounded-2xl bg-rose-500/8 border border-rose-500/25 text-rose-500 text-sm">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {needs2FA ? (
              <div>
                <label className="block text-[var(--fg-muted)] text-[10px] font-bold mb-2 tracking-widest uppercase">Authenticator Code</label>
                <input type="text" value={totpCode} onChange={e => setTotpCode(e.target.value)}
                  placeholder="000000" maxLength={6} autoFocus required
                  className="w-full px-4 py-4 rounded-2xl bg-[var(--surface)] border-2 border-[var(--border)] text-[var(--fg)] placeholder-[var(--fg-muted)] focus:outline-none focus:border-violet-500 transition-all text-center text-3xl font-mono tracking-[0.6em] hover:border-violet-500/40" />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-[var(--fg-muted)] text-[10px] font-bold mb-2 tracking-widest uppercase">Email address</label>
                  <div className="relative">
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@company.com" required autoComplete="email"
                      className="w-full px-4 py-4 pl-11 rounded-2xl bg-[var(--surface)] border-2 border-[var(--border)] text-[var(--fg)] placeholder-[var(--fg-muted)] focus:outline-none focus:border-violet-500 transition-all text-sm hover:border-violet-500/40" />
                    <Globe size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[var(--fg-muted)] text-[10px] font-bold tracking-widest uppercase">Password</label>
                    <Link href="/forgot-password" className="text-violet-500/70 hover:text-violet-500 text-xs transition-colors font-medium">Forgot password?</Link>
                  </div>
                  <div className="relative">
                    <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••" required autoComplete="current-password"
                      className="w-full px-4 py-4 pl-11 rounded-2xl bg-[var(--surface)] border-2 border-[var(--border)] text-[var(--fg)] placeholder-[var(--fg-muted)] focus:outline-none focus:border-violet-500 transition-all text-sm hover:border-violet-500/40 pr-12" />
                    <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </>
            )}

            <button type="submit" disabled={loading}
              className="group relative w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 hover:from-violet-500 hover:via-blue-500 hover:to-cyan-500 text-white font-black text-sm transition-all duration-300 disabled:opacity-50 shadow-[0_4px_30px_rgba(124,58,237,0.4)] hover:shadow-[0_8px_40px_rgba(124,58,237,0.6)] hover:-translate-y-0.5 active:scale-[0.98] overflow-hidden mt-2">
              <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Signing in…</span></>
              ) : (
                <><span>{needs2FA ? "Verify Code" : "Sign in"}</span><ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-[var(--fg-muted)] text-xs">or</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          <p className="text-center text-[var(--fg-muted)] text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-violet-600 dark:text-violet-400 hover:text-violet-500 font-bold transition-colors">
              Create one free →
            </Link>
          </p>

          {/* Trust row */}
          <div className="flex items-center justify-center gap-5 mt-8 pt-6 border-t border-[var(--border)]">
            {[
              { icon: Globe,       text: "7 countries" },
              { icon: Zap,         text: "< 500ms"     },
              { icon: ShieldCheck, text: "SOC 2"        },
              { icon: Users,       text: "10K+ SMEs"   },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-[var(--fg-muted)] text-[10px]">
                <Icon size={10} className="text-violet-500" />
                {text}
              </div>
            ))}
          </div>

          {/* Back link */}
          <div className="text-center mt-4">
            <Link href="/" className="text-[var(--fg-muted)] text-xs hover:text-[var(--fg)] transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
