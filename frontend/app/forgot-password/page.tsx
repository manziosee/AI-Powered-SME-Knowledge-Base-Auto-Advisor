"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Brain, ArrowLeft, ArrowRight, Mail, AlertCircle, CheckCircle, Sparkles, ShieldCheck,
} from "lucide-react";
import { auth as authApi } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email,    setEmail]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { data, error: apiErr } = await authApi.forgotPassword(email);
    if (apiErr) {
      setError(apiErr);
      setLoading(false);
      return;
    }
    setSuccess(true);
    if (data?.reset_token) setDevToken(data.reset_token);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4 py-10 relative overflow-hidden">

      {/* Background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[180px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.08) 0%, transparent 70%)" }} />
      <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] rounded-full blur-[120px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(6,182,212,0.06) 0%, transparent 70%)" }} />
      <div className="absolute inset-0 bg-dots opacity-20 pointer-events-none" />

      <div className="w-full max-w-[420px] relative z-10">

        {/* Back link */}
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-[var(--fg-muted)] hover:text-violet-500 text-xs transition-all mb-8 group"
        >
          <ArrowLeft size={13} className="group-hover:-translate-x-1 transition-transform" />
          Back to sign in
        </Link>

        {/* Card */}
        <div className="rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)] relative overflow-hidden">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
          {/* Subtle inner glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] rounded-full blur-[80px] pointer-events-none"
            style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.06) 0%, transparent 70%)" }} />

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mb-8 hover:opacity-80 transition-opacity relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-[0_0_24px_rgba(124,58,237,0.35)]">
              <Brain size={18} className="text-white" />
            </div>
            <div>
              <span className="text-[var(--fg)] font-black text-base tracking-tight block">AdvisorAI</span>
              <span className="text-[var(--fg-muted)] text-[10px] tracking-widest uppercase">Account Recovery</span>
            </div>
          </Link>

          {/* Header */}
          <div className="mb-7 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 mb-4">
              <Sparkles size={11} className="text-violet-500" />
              <span className="text-violet-500/80 text-xs font-medium tracking-wide">Password reset</span>
            </div>
            <h1 className="text-3xl font-black text-[var(--fg)] mb-2 tracking-tight">Forgot password?</h1>
            <p className="text-[var(--fg-muted)] text-sm leading-relaxed">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          {/* Success state */}
          {success ? (
            <div className="flex flex-col gap-5 relative z-10">
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-500/8 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400">
                <CheckCircle size={18} className="mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-sm mb-0.5">Check your email</p>
                  <p className="text-sm opacity-80">
                    If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset link.
                  </p>
                </div>
              </div>

              {devToken && (
                <div className="p-3.5 rounded-2xl bg-amber-500/8 border border-amber-500/25">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-2">
                    Dev mode — reset token
                  </p>
                  <Link
                    href={`/reset-password?token=${devToken}`}
                    className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 hover:text-amber-500 text-sm font-bold transition-colors underline underline-offset-2"
                  >
                    Click here to reset your password
                    <ArrowRight size={13} />
                  </Link>
                </div>
              )}

              <Link
                href="/login"
                className="flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] text-sm font-semibold transition-all"
              >
                <ArrowLeft size={14} />
                Return to sign in
              </Link>
            </div>
          ) : (
            <div className="relative z-10">
              {error && (
                <div className="flex items-start gap-2.5 p-4 mb-5 rounded-2xl bg-rose-500/8 border border-rose-500/25 text-rose-500 text-sm">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-[var(--fg-muted)] text-[10px] font-bold mb-2 tracking-widest uppercase">
                    Email address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      autoComplete="email"
                      className="w-full px-4 py-3.5 pl-11 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)] placeholder-[var(--fg-muted)] focus:outline-none focus:border-violet-500/60 focus:bg-violet-500/5 transition-all text-sm hover:border-violet-500/30"
                    />
                    <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] pointer-events-none" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-black text-sm transition-all duration-300 disabled:opacity-50 shadow-[0_0_30px_rgba(124,58,237,0.35)] hover:shadow-[0_0_50px_rgba(124,58,237,0.55)] hover:-translate-y-0.5 active:scale-[0.98] mt-1 overflow-hidden shine-hover"
                >
                  <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                  {loading ? (
                    <>
                      <span className="relative z-10 w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="relative z-10">Sending…</span>
                    </>
                  ) : (
                    <>
                      <span className="relative z-10">Send Reset Link</span>
                      <ArrowRight size={15} className="relative z-10 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-[var(--fg-muted)] text-sm mt-6">
                Remember your password?{" "}
                <Link href="/login" className="text-violet-500 hover:text-violet-400 font-bold transition-colors">
                  Sign in
                </Link>
              </p>

              {/* Trust */}
              <div className="flex items-center justify-center gap-4 mt-6 pt-5 border-t border-[var(--border)]">
                <div className="flex items-center gap-1.5 text-[var(--fg-muted)] text-[11px]">
                  <ShieldCheck size={11} className="text-violet-500" />
                  Secure reset link
                </div>
                <div className="flex items-center gap-1.5 text-[var(--fg-muted)] text-[11px]">
                  <Mail size={11} className="text-violet-500" />
                  Expires in 1 hour
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
