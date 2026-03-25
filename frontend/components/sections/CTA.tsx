import React from "react";
import { ArrowRight, Sparkles, CheckCircle } from "lucide-react";
import Link from "next/link";

const perks = [
  "Set up in under 5 minutes",
  "No credit card required",
  "Free plan — no expiry",
  "Cancel anytime",
];

export default function CTA() {
  return (
    <section className="py-28 px-6 relative overflow-hidden bg-[var(--bg-soft)]">
      {/* Glows */}
      <div className="glow-violet-radial absolute inset-0 m-auto w-[600px] h-[400px] rounded-full blur-[120px] pointer-events-none opacity-50" />
      <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full blur-[100px] pointer-events-none opacity-30 bg-cyan-500/10" />

      {/* Decorative rings */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[640px] rounded-full border border-violet-500/8 pointer-events-none" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full border border-violet-500/12 pointer-events-none" />

      <div className="relative max-w-3xl mx-auto text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="lift w-16 h-16 rounded-2xl bg-violet-500/12 border border-violet-500/25 flex items-center justify-center shadow-[0_0_24px_rgba(124,58,237,0.2)] cursor-default">
            <Sparkles size={26} className="text-violet-500" />
          </div>
        </div>

        <p className="text-xs text-violet-500 tracking-[0.25em] uppercase mb-5 font-semibold">
          Get started today
        </p>

        <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight text-[var(--fg)] mb-6">
          Your documents are
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 via-cyan-400 to-blue-500">
            waiting to be useful.
          </span>
        </h2>

        <p className="text-[var(--fg-muted)] text-xl mb-10 max-w-xl mx-auto leading-relaxed">
          Stop searching. Stop missing deadlines. Start asking.
          Get your first AI answer in under 2 minutes — completely free.
        </p>

        {/* Perks row */}
        <div className="flex flex-wrap justify-center gap-4 mb-10">
          {perks.map((p) => (
            <span key={p} className="flex items-center gap-1.5 text-[var(--fg-muted)] text-sm">
              <CheckCircle size={14} className="text-emerald-500" />
              {p}
            </span>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all shadow-[0_0_24px_rgba(124,58,237,0.35)] hover:shadow-[0_0_36px_rgba(124,58,237,0.5)] hover:-translate-y-0.5"
          >
            Start for free
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-[var(--border)] text-[var(--fg-muted)] hover:text-violet-500 hover:border-violet-500/40 transition-all text-sm font-medium hover:-translate-y-0.5"
          >
            Sign in to your account
          </Link>
        </div>
      </div>
    </section>
  );
}
