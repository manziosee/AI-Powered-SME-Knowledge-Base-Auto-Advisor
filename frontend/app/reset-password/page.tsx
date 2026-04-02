"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Brain, ArrowLeft, ArrowRight, Eye, EyeOff, Lock,
  AlertCircle, CheckCircle, Sparkles, ShieldCheck,
} from "lucide-react";
import { auth as authApi } from "@/lib/api";

const INPUT =
  "w-full px-4 py-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)] placeholder-[var(--fg-muted)] focus:outline-none focus:border-violet-500/60 focus:bg-violet-500/5 transition-all text-sm hover:border-violet-500/30";

// Inner component that uses useSearchParams (must be inside Suspense)
function ResetPasswordForm() {
  const router   = useRouter();
  const params   = useSearchParams();
  const token    = params.get("token");

  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [showCf,    setShowCf]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState(false);

  // No token in URL
  if (!token) {
    return (
      <div className="flex flex-col items-center gap-5 text-center py-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center">
          <AlertCircle size={24} className="text-rose-500" />
        </div>
        <div>
          <h2 className="text-[var(--fg)] font-bold text-lg mb-1">Invalid reset link</h2>
          <p className="text-[var(--fg-muted)] text-sm leading-relaxed max-w-xs">
            This password reset link is missing or has expired. Please request a new one.
          </p>
        </div>
        <Link
          href="/forgot-password"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-sm font-bold transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.45)] hover:-translate-y-0.5"
        >
          Request new link
          <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  const validate = (): string => {
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== confirm) return "Passwords do not match.";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErr = validate();
    if (validationErr) { setError(validationErr); return; }
    setError("");
    setLoading(true);

    const { error: apiErr } = await authApi.resetPassword(token, password);

    if (apiErr) {
      setError(apiErr);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => router.push("/login"), 2000);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center gap-5 text-center py-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
          <CheckCircle size={24} className="text-emerald-500" />
        </div>
        <div>
          <h2 className="text-[var(--fg)] font-bold text-lg mb-1">Password reset!</h2>
          <p className="text-[var(--fg-muted)] text-sm">
            Redirecting you to sign in…
          </p>
        </div>
        <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  const strengthPct = Math.min(100, (password.length / 12) * 100);
  const strengthColor =
    password.length === 0 ? "bg-[var(--border)]"
    : password.length < 8  ? "bg-rose-500"
    : password.length < 10 ? "bg-amber-500"
    : "bg-emerald-500";

  return (
    <>
      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-2.5 p-4 mb-5 rounded-xl bg-rose-500/8 border border-rose-500/25 text-rose-500 text-sm">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* New password */}
        <div>
          <label className="block text-[var(--fg-muted)] text-[10px] font-semibold mb-2 tracking-widest uppercase">
            New password
          </label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              autoComplete="new-password"
              className={INPUT + " pl-10 pr-12"}
            />
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] pointer-events-none" />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              aria-label={showPw ? "Hide password" : "Show password"}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {/* Strength bar */}
          {password.length > 0 && (
            <div className="mt-2">
              <div className="h-1 rounded-full bg-[var(--border)] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${strengthColor}`}
                  style={{ width: `${strengthPct}%` }}
                />
              </div>
              <p className={`text-[10px] mt-1 ${
                password.length < 8 ? "text-rose-500" : password.length < 10 ? "text-amber-500" : "text-emerald-500"
              }`}>
                {password.length < 8 ? "Too short" : password.length < 10 ? "Good" : "Strong"}
              </p>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label className="block text-[var(--fg-muted)] text-[10px] font-semibold mb-2 tracking-widest uppercase">
            Confirm password
          </label>
          <div className="relative">
            <input
              type={showCf ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat your new password"
              required
              autoComplete="new-password"
              className={INPUT + " pl-10 pr-12" + (confirm && confirm !== password ? " border-rose-500/50 focus:border-rose-500/60" : "")}
            />
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] pointer-events-none" />
            <button
              type="button"
              onClick={() => setShowCf(!showCf)}
              aria-label={showCf ? "Hide password" : "Show password"}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
            >
              {showCf ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {confirm && confirm !== password && (
            <p className="text-rose-500 text-[11px] mt-1.5 flex items-center gap-1">
              <AlertCircle size={11} />
              Passwords do not match
            </p>
          )}
          {confirm && confirm === password && password.length >= 8 && (
            <p className="text-emerald-500 text-[11px] mt-1.5 flex items-center gap-1">
              <CheckCircle size={11} />
              Passwords match
            </p>
          )}
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
              <span className="relative z-10">Resetting…</span>
            </>
          ) : (
            <>
              <ShieldCheck size={15} className="relative z-10" />
              <span className="relative z-10">Reset Password</span>
            </>
          )}
        </button>
      </form>

      <p className="text-center text-[var(--fg-muted)] text-sm mt-6">
        Remembered it?{" "}
        <Link href="/login" className="text-violet-500 hover:text-violet-400 font-semibold transition-colors">
          Sign in
        </Link>
      </p>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4 py-10 transition-colors duration-300 relative overflow-hidden">

      {/* Background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[150px] pointer-events-none bg-violet-500/8 dark:bg-violet-600/12" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full blur-[100px] pointer-events-none bg-cyan-500/6" />

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
              <span className="text-violet-500/70 text-xs tracking-wide">Set new password</span>
            </div>
            <h1 className="text-2xl font-black text-[var(--fg)] mb-2 tracking-tight">Reset password</h1>
            <p className="text-[var(--fg-muted)] text-sm leading-relaxed">
              Choose a strong password to secure your account.
            </p>
          </div>

          <Suspense fallback={
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
