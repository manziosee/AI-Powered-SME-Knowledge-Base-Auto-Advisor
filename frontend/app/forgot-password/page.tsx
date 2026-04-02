"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Brain, ArrowLeft, ArrowRight, Mail, AlertCircle, CheckCircle, Sparkles,
} from "lucide-react";
import { auth as authApi } from "@/lib/api";

const INPUT =
  "w-full px-4 py-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)] placeholder-[var(--fg-muted)] focus:outline-none focus:border-violet-500/60 focus:bg-violet-500/5 transition-all text-sm hover:border-violet-500/30";

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
    if (data?.reset_token) {
      setDevToken(data.reset_token);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4 py-10 transition-colors duration-300 relative overflow-hidden">

      {/* Background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[150px] pointer-events-none bg-violet-500/8 dark:bg-violet-600/12" />
      <div className="absolute bottom-1/4 right-0 w-[300px] h-[300px] rounded-full blur-[100px] pointer-events-none bg-cyan-500/6" />

      <div className="w-full max-w-[400px] relative z-10">

        {/* Back link */}
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-[var(--fg-muted)] hover:text-violet-500 text-xs transition-all mb-8 group"
        >
          <ArrowLeft size={13} className="group-hover:-translate-x-1 transition-transform" />
          Back to sign in
        </Link>

        {/* Card */}
        <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-8 shadow-[0_8px_40px_rgba(0,0,0,0.08)] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />

          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center shadow-[0_0_16px_rgba(124,58,237,0.15)]">
              <Brain size={18} className="text-violet-500" />
            </div>
            <span className="text-[var(--fg)] font-bold text-base tracking-tight">AdvisorAI</span>
          </div>

          {/* Header */}
          <div className="mb-7">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={13} className="text-violet-500" />
              <span className="text-violet-500/70 text-xs tracking-wide">Account recovery</span>
            </div>
            <h1 className="text-2xl font-black text-[var(--fg)] mb-2 tracking-tight">Forgot password?</h1>
            <p className="text-[var(--fg-muted)] text-sm leading-relaxed">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          {/* Success state */}
          {success ? (
            <div className="flex flex-col gap-5">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/8 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400">
                <CheckCircle size={18} className="mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm mb-0.5">Check your email</p>
                  <p className="text-sm opacity-80">
                    If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset link.
                  </p>
                </div>
              </div>

              {/* Dev mode token */}
              {devToken && (
                <div className="p-3.5 rounded-xl bg-amber-500/8 border border-amber-500/25">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-2">
                    Dev mode — reset token
                  </p>
                  <Link
                    href={`/reset-password?token=${devToken}`}
                    className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 hover:text-amber-500 text-sm font-semibold transition-colors underline underline-offset-2"
                  >
                    Click here to reset your password
                    <ArrowRight size={13} />
                  </Link>
                </div>
              )}

              <Link
                href="/login"
                className="flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] text-sm font-semibold transition-all"
              >
                <ArrowLeft size={14} />
                Return to sign in
              </Link>
            </div>
          ) : (
            <>
              {/* Error banner */}
              {error && (
                <div className="flex items-start gap-2.5 p-4 mb-5 rounded-xl bg-rose-500/8 border border-rose-500/25 text-rose-500 text-sm">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-[var(--fg-muted)] text-[10px] font-semibold mb-2 tracking-widest uppercase">
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
                      className={INPUT + " pl-10"}
                    />
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] pointer-events-none" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-black text-sm transition-all duration-300 disabled:opacity-50 shadow-[0_0_24px_rgba(124,58,237,0.3)] hover:shadow-[0_0_36px_rgba(124,58,237,0.5)] hover:-translate-y-0.5 active:scale-[0.98] mt-1 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
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
                <Link href="/login" className="text-violet-500 hover:text-violet-400 font-semibold transition-colors">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
