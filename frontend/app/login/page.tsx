"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye, EyeOff, ArrowRight, AlertCircle, Brain,
  ShieldCheck, FileText, Bell, Globe, Zap, Sparkles,
  Users, Lock, CheckCircle, Star,
} from "lucide-react";
import Link from "next/link";
import { auth as authApi } from "@/lib/api";

const features = [
  { icon: Brain, label: "AI Advisor", desc: "Get instant answers from your documents" },
  { icon: ShieldCheck, label: "Compliance", desc: "Auto-check against 7 jurisdictions" },
  { icon: FileText, label: "Document Search", desc: "Upload & search any file type" },
  { icon: Zap, label: "Fast Answers", desc: "Under 500ms response time" },
];

const socialProof = [
  { value: "10K+", label: "SMEs", icon: Users },
  { value: "94%", label: "Compliance", icon: ShieldCheck },
  { value: "500ms", label: "Avg Response", icon: Zap },
  { value: "7", label: "Countries", icon: Globe },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needs2FA, setNeeds2FA] = useState(false);
  const [userId2FA, setUserId2FA] = useState("");
  const [totpCode, setTotpCode] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
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
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Brain size={24} className="text-white" />
            </div>
            <span className="text-white font-black text-xl tracking-tight">AdvisorAI</span>
          </Link>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center py-8">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-medium mb-4">
              <Star size={12} className="text-amber-400 fill-amber-400" />
              Trusted by 10,000+ businesses
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white leading-[1.2] mb-3">
              Your AI-powered<br />
              <span className="gradient-text-brand">business advisor.</span>
            </h1>
            <p className="text-white/70 text-base leading-relaxed max-w-md">
              Upload documents, ask questions, stay compliant. Built for SMEs across Africa and beyond.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="p-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/15 transition-all">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mb-2">
                  <Icon size={14} className="text-violet-400" />
                </div>
                <p className="text-white font-medium text-xs mb-0.5">{label}</p>
                <p className="text-white/50 text-[10px]">{desc}</p>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="flex gap-4">
            {socialProof.map(({ value, label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-1.5">
                <Icon size={14} className="text-white/50" />
                <span className="text-white font-semibold text-sm">{value}</span>
                <span className="text-white/50 text-xs">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative z-10 p-4 rounded-xl bg-white/10 border border-white/20">
          <div className="flex gap-1 mb-2">
            {[...Array(5)].map((_, i) => <Star key={i} size={12} className="text-amber-400 fill-amber-400" />)}
          </div>
          <p className="text-white/80 text-xs leading-relaxed mb-3">&ldquo;Found a contract renewal we had missed. Saved us $24,000 in auto-renewal fees.&rdquo;</p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
              JM
            </div>
            <div>
              <p className="text-white font-medium text-xs">James Mwangi</p>
              <p className="text-white/50 text-[10px]">Operations Manager, RetailPro Kenya</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT - Form Panel */}
      <div className="flex-1 flex flex-col justify-center px-6 lg:px-16 py-10 relative bg-[var(--bg)]">
        {/* Background Effects */}
        <div className="absolute top-20 right-20 w-[400px] h-[400px] rounded-full blur-[150px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--primary-muted) 0%, transparent 70%)' }} />
        <div className="absolute bottom-20 left-20 w-[300px] h-[300px] rounded-full blur-[120px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--secondary-muted) 0%, transparent 70%)' }} />

        <div className="max-w-[440px] w-full mx-auto relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Brain size={18} className="text-white" />
            </div>
            <span className="text-[var(--fg)] font-black text-lg">AdvisorAI</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--primary-muted)] mb-5">
              <Sparkles size={12} className="text-[var(--primary)]" />
              <span className="text-[var(--primary)] text-xs font-semibold">Welcome back</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-[var(--fg)] tracking-tight mb-2">
              {needs2FA ? "Two-factor auth" : "Sign in"}
            </h1>
            <p className="text-[var(--fg-muted)] text-base">
              {needs2FA ? "Enter the 6-digit code from your authenticator app." : "Access your AdvisorAI workspace."}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 p-4 mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {needs2FA ? (
              <div>
                <label className="block text-[var(--fg-muted)] text-xs font-bold mb-3 tracking-widest uppercase">Authenticator Code</label>
                <input type="text" value={totpCode} onChange={e => setTotpCode(e.target.value)}
                  placeholder="000000" maxLength={6} autoFocus required
                  className="w-full px-5 py-4 rounded-2xl bg-[var(--surface)] border-2 border-[var(--border)] text-[var(--fg)] placeholder-[var(--fg-muted)] focus:outline-none focus:border-[var(--primary)] text-center text-3xl font-mono tracking-[0.5em]" />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-[var(--fg-muted)] text-xs font-bold mb-3 tracking-widest uppercase">Email</label>
                  <div className="relative">
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@company.com" required autoComplete="email"
                      className="w-full px-4 py-4 pl-12 rounded-2xl bg-[var(--surface)] border-2 border-[var(--border)] text-[var(--fg)] placeholder-[var(--fg-muted)] focus:outline-none focus:border-[var(--primary)] transition-all" />
                    <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-[var(--fg-muted)] text-xs font-bold tracking-widest uppercase">Password</label>
                    <Link href="/forgot-password" className="text-[var(--primary)] hover:text-[var(--primary-hover)] text-sm font-medium">Forgot?</Link>
                  </div>
                  <div className="relative">
                    <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Enter your password" required autoComplete="current-password"
                      className="w-full px-4 py-4 pl-12 rounded-2xl bg-[var(--surface)] border-2 border-[var(--border)] text-[var(--fg)] placeholder-[var(--fg-muted)] focus:outline-none focus:border-[var(--primary)] pr-12" />
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] hover:text-[var(--fg)]">
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-2xl font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
              style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)', boxShadow: '0 4px 20px var(--primary-muted)' }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {needs2FA ? "Verify Code" : "Sign in"}
                  <ArrowRight size={18} />
                </span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-[var(--fg-muted)] text-sm">or</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          <p className="text-center text-[var(--fg-muted)]">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-[var(--primary)] hover:text-[var(--primary-hover)] font-semibold">
              Create free account →
            </Link>
          </p>

          {/* Back */}
          <div className="text-center mt-8">
            <Link href="/" className="text-[var(--fg-muted)] hover:text-[var(--fg)] text-sm">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}