"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye, EyeOff, ArrowRight, AlertCircle, Brain,
  ShieldCheck, Zap, Sparkles, Globe, Lock, Star,
  CheckCircle, FileText, Users,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { auth as authApi } from "@/lib/api";

/* ── Animated AI Core Panel ─────────────────────────────────── */
function AICorePanel() {
  return (
    <div className="hidden lg:flex lg:w-[58%] relative flex-col justify-between overflow-hidden"
      style={{ background: "linear-gradient(145deg, #020510 0%, #050d20 40%, #030918 100%)" }}>

      {/* Grid background */}
      <div className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "linear-gradient(rgba(99,102,241,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.15) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

      {/* Radial glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, rgba(37,99,235,0.08) 40%, transparent 70%)" }} />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-[120px]"
          style={{ background: "radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 left-0 w-[350px] h-[350px] rounded-full blur-[100px]"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)" }} />
      </div>

      {/* Top logo */}
      <div className="relative z-10 p-8 lg:p-12">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/50 transition-shadow">
            <Brain size={22} className="text-white" />
          </div>
          <span className="text-white font-black text-xl tracking-tight">AdvisorAI</span>
        </Link>
      </div>

      {/* Central AI Orb */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8">

        {/* Orbital rings */}
        <div className="relative w-72 h-72 flex items-center justify-center mb-10">
          {/* Ring 1 — outermost, slow */}
          <div className="absolute inset-0 rounded-full border border-violet-500/20 animate-[spin_18s_linear_infinite]">
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.8)]" />
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-violet-600/60" />
          </div>
          {/* Ring 2 — medium */}
          <div className="absolute inset-8 rounded-full border border-indigo-500/25 animate-[spin_12s_linear_infinite_reverse]">
            <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.9)]" />
            <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400/60" />
          </div>
          {/* Ring 3 — inner, faster */}
          <div className="absolute inset-16 rounded-full border border-cyan-500/20 animate-[spin_8s_linear_infinite]">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
          </div>

          {/* Dashed orbit accent */}
          <div className="absolute inset-4 rounded-full border border-dashed border-white/5" />

          {/* Central Orb */}
          <div className="relative flex items-center justify-center">
            {/* Pulse rings */}
            <div className="absolute w-28 h-28 rounded-full bg-violet-600/10 animate-ping" style={{ animationDuration: "3s" }} />
            <div className="absolute w-20 h-20 rounded-full bg-violet-600/15 animate-ping" style={{ animationDuration: "2.5s", animationDelay: "0.5s" }} />
            {/* Core sphere */}
            <div className="relative w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: "radial-gradient(circle at 35% 35%, #a78bfa, #7c3aed 50%, #4c1d95 100%)",
                boxShadow: "0 0 40px rgba(124,58,237,0.6), 0 0 80px rgba(124,58,237,0.3), inset 0 0 20px rgba(255,255,255,0.15)",
              }}>
              <Brain size={28} className="text-white" />
            </div>
          </div>
        </div>

        {/* Headline */}
        <div className="text-center mb-8 max-w-sm">
          <h2 className="text-2xl lg:text-3xl font-black text-white leading-tight mb-3">
            Your AI-powered
            <span className="block" style={{
              background: "linear-gradient(135deg, #818cf8, #a78bfa, #22d3ee)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>business advisor</span>
          </h2>
          <p className="text-white/50 text-sm leading-relaxed">
            Upload documents, ask anything, stay compliant — built for SMEs across Africa and beyond.
          </p>
        </div>

        {/* Feature pills */}
        <div className="grid grid-cols-2 gap-2.5 max-w-xs w-full">
          {[
            { icon: Brain,       label: "LangChain RAG",      color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
            { icon: ShieldCheck, label: "7 Jurisdictions",     color: "text-cyan-400",   bg: "bg-cyan-500/10 border-cyan-500/20"   },
            { icon: Zap,         label: "< 500ms Answers",     color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20"},
            { icon: FileText,    label: "1,248+ Docs indexed", color: "text-teal-400",   bg: "bg-teal-500/10 border-teal-500/20"   },
          ].map(({ icon: Icon, label, color, bg }) => (
            <div key={label} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${bg} backdrop-blur-sm`}>
              <Icon size={13} className={color} />
              <span className="text-white/70 text-xs font-medium leading-none">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonial */}
      <div className="relative z-10 p-8 lg:p-12">
        <div className="p-4 rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm">
          <div className="flex gap-0.5 mb-2.5">
            {[...Array(5)].map((_, i) => <Star key={i} size={11} className="text-amber-400 fill-amber-400" />)}
          </div>
          <p className="text-white/70 text-xs leading-relaxed mb-3">
            &ldquo;Found a contract renewal we had missed. Saved us $24,000 in auto-renewal fees.&rdquo;
          </p>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold text-[10px]">
              JM
            </div>
            <div>
              <p className="text-white/80 font-medium text-xs">James Mwangi</p>
              <p className="text-white/40 text-[10px]">Operations Manager, RetailPro Kenya</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Login Page ─────────────────────────────────────────── */
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
      localStorage.setItem("auth_user", JSON.stringify({
        id: u.id, name: u.full_name, email: u.email,
        role: u.role, company: u.company?.name ?? "", avatar: initials,
      }));
    }
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#030916" }}>
      {/* Left AI Panel */}
      <AICorePanel />

      {/* Right Form Panel */}
      <div className="flex-1 flex flex-col justify-center px-6 lg:px-14 py-10 relative"
        style={{ background: "linear-gradient(160deg, #060d1e 0%, #08101f 100%)" }}>

        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-[150px] opacity-30"
            style={{ background: "radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full blur-[120px] opacity-20"
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
          <div className="mb-9">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 mb-5">
              <Sparkles size={11} className="text-violet-400" />
              <span className="text-violet-400 text-xs font-semibold">
                {needs2FA ? "Two-factor auth" : "Welcome back"}
              </span>
            </div>
            <h1 className="text-4xl lg:text-[2.75rem] font-black leading-none tracking-tight mb-3"
              style={{ color: "#f0f4ff" }}>
              {needs2FA ? "Verify identity" : "Sign in"}
            </h1>
            <p className="text-slate-400 text-base">
              {needs2FA
                ? "Enter the 6-digit code from your authenticator app."
                : "Access your AdvisorAI workspace."}
            </p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400"
            >
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {needs2FA ? (
              <div>
                <label className="block text-slate-400 text-[10px] font-bold mb-3 tracking-[0.18em] uppercase">
                  Authenticator Code
                </label>
                <input
                  type="text"
                  value={totpCode}
                  onChange={e => setTotpCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                  required
                  className="w-full px-5 py-4 rounded-2xl text-center text-3xl font-mono tracking-[0.5em] text-white placeholder-slate-600 outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1.5px solid rgba(255,255,255,0.10)",
                  }}
                  onFocus={e => { e.target.style.borderColor = "rgba(124,58,237,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.10)"; e.target.style.boxShadow = "none"; }}
                />
              </div>
            ) : (
              <>
                {/* Email */}
                <div>
                  <label className="block text-slate-400 text-[10px] font-bold mb-3 tracking-[0.18em] uppercase">
                    Email Address
                  </label>
                  <div className="relative">
                    <Globe
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      autoComplete="email"
                      className="w-full pl-11 pr-4 py-4 rounded-2xl text-white placeholder-slate-600 outline-none transition-all"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1.5px solid rgba(255,255,255,0.08)",
                      }}
                      onFocus={e => { e.target.style.borderColor = "rgba(124,58,237,0.55)"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.12), 0 0 20px rgba(124,58,237,0.06)"; }}
                      onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-slate-400 text-[10px] font-bold tracking-[0.18em] uppercase">
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-violet-400 hover:text-violet-300 text-xs font-medium transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                    />
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                      className="w-full pl-11 pr-12 py-4 rounded-2xl text-white placeholder-slate-600 outline-none transition-all"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1.5px solid rgba(255,255,255,0.08)",
                      }}
                      onFocus={e => { e.target.style.borderColor = "rgba(124,58,237,0.55)"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.12), 0 0 20px rgba(124,58,237,0.06)"; }}
                      onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      aria-label={showPw ? "Hide password" : "Show password"}
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full py-4 rounded-2xl font-black text-white text-sm tracking-wide transition-all duration-300 overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5 active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #2563eb 100%)",
                boxShadow: "0 4px 30px rgba(124,58,237,0.4), 0 1px 0 rgba(255,255,255,0.15) inset",
              }}
            >
              {/* Shine overlay */}
              <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              {loading ? (
                <span className="flex items-center justify-center gap-2.5">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {needs2FA ? "Verifying..." : "Signing in..."}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2.5">
                  {needs2FA ? "Verify Code" : "Sign In"}
                  <ArrowRight size={16} />
                </span>
              )}
            </button>
          </form>

          {/* Social proof + divider */}
          <div className="flex items-center gap-4 my-7">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
            <span className="text-slate-600 text-xs">or</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>

          {/* Stats row */}
          <div className="flex justify-center gap-6 mb-7">
            {[
              { icon: Users, value: "10K+", label: "SMEs" },
              { icon: ShieldCheck, value: "94%", label: "Compliance" },
              { icon: Zap, value: "<500ms", label: "Response" },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <Icon size={12} className="text-slate-500" />
                <span className="text-white text-xs font-bold">{value}</span>
                <span className="text-slate-500 text-xs">{label}</span>
              </div>
            ))}
          </div>

          {/* Sign-up link */}
          <p className="text-center text-slate-500 text-sm">
            New to AdvisorAI?{" "}
            <Link href="/register" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
              Create free account →
            </Link>
          </p>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-3 mt-7">
            {["SOC 2 Ready", "GDPR", "TLS 1.3"].map((b) => (
              <span
                key={b}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono text-slate-500 border border-slate-700/60"
              >
                <CheckCircle size={9} className="text-teal-500" />
                {b}
              </span>
            ))}
          </div>

          {/* Back */}
          <div className="text-center mt-6">
            <Link href="/" className="text-slate-600 hover:text-slate-400 text-xs transition-colors">
              ← Back to home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
