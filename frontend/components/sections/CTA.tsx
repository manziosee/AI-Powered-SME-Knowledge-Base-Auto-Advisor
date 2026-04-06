import React from "react";
import { ArrowRight, CheckCircle, Clock, CreditCard, Infinity, RotateCcw, FileText, Brain, ShieldCheck, TrendingUp, Sparkles, Mail } from "lucide-react";
import Link from "next/link";

const perks = [
  { icon: Clock,      text: "Set up in under 5 minutes" },
  { icon: CreditCard, text: "No credit card required"   },
  { icon: Infinity,   text: "Free plan — no expiry"     },
  { icon: RotateCcw,  text: "Cancel anytime"            },
];

const floatingCards = [
  { icon: FileText,    value: "1,248",  label: "Documents indexed", color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-500/10",    border: "border-blue-200 dark:border-blue-500/20"    },
  { icon: ShieldCheck, value: "94%",    label: "Compliance score",  color: "text-teal-600 dark:text-teal-400",    bg: "bg-teal-50 dark:bg-teal-500/10",    border: "border-teal-200 dark:border-teal-500/20"    },
  { icon: Brain,       value: "876",    label: "AI queries today",  color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10", border: "border-violet-200 dark:border-violet-500/20" },
  { icon: TrendingUp,  value: "<500ms", label: "Avg answer time",   color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-500/10",  border: "border-amber-200 dark:border-amber-500/20"  },
];

export default function CTA() {
  return (
    <section className="relative overflow-hidden py-32 px-6">

      {/* ── Light mode background ── */}
      <div className="absolute inset-0 dark:hidden"
        style={{ background: "linear-gradient(135deg, #f0f4ff 0%, #faf5ff 50%, #f0fdf4 100%)" }} />
      <div className="absolute inset-0 pointer-events-none dark:hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[120px]"
          style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.08) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[300px] rounded-full blur-[100px]"
          style={{ background: "radial-gradient(ellipse, rgba(37,99,235,0.06) 0%, transparent 70%)" }} />
      </div>

      {/* ── Dark mode background ── */}
      <div className="absolute inset-0 hidden dark:block dark-section-deep" />
      <div className="absolute inset-0 pointer-events-none hidden dark:block">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] rounded-full blur-[160px]"
          style={{ background: "radial-gradient(ellipse, rgba(37,99,235,0.18) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] rounded-full blur-[120px]"
          style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.14) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[300px] rounded-full blur-[100px]"
          style={{ background: "radial-gradient(ellipse, rgba(13,148,136,0.10) 0%, transparent 70%)" }} />
        <div className="absolute inset-0 bg-dots opacity-6" />
      </div>

      <div className="absolute top-0 inset-x-0 section-line" />
      <div className="absolute bottom-0 inset-x-0 section-line" />

      {/* ── Floating stat cards — LEFT ── */}
      <div className="hidden xl:flex flex-col gap-3 absolute left-[max(2rem,calc(50%-580px))] top-1/2 -translate-y-1/2 w-52">
        {floatingCards.slice(0, 2).map(({ icon: Icon, value, label, color, bg, border }) => (
          <div key={label} className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl ${bg} border ${border} float-badge shadow-lg backdrop-blur-sm`}>
            <div className={`w-9 h-9 rounded-xl ${bg} border ${border} flex items-center justify-center flex-shrink-0`}>
              <Icon size={16} className={color} />
            </div>
            <div>
              <p className={`text-sm font-black leading-none ${color}`}>{value}</p>
              <p className="text-[var(--fg-muted)] text-[10px] mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Floating stat cards — RIGHT ── */}
      <div className="hidden xl:flex flex-col gap-3 absolute right-[max(2rem,calc(50%-580px))] top-1/2 -translate-y-1/2 w-52">
        {floatingCards.slice(2).map(({ icon: Icon, value, label, color, bg, border }) => (
          <div key={label} className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl ${bg} border ${border} float-badge-2 shadow-lg backdrop-blur-sm`}>
            <div className={`w-9 h-9 rounded-xl ${bg} border ${border} flex items-center justify-center flex-shrink-0`}>
              <Icon size={16} className={color} />
            </div>
            <div>
              <p className={`text-sm font-black leading-none ${color}`}>{value}</p>
              <p className="text-[var(--fg-muted)] text-[10px] mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Center content ── */}
      <div className="relative z-10 max-w-2xl mx-auto text-center flex flex-col items-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-xs font-bold tracking-widest text-blue-600 dark:text-blue-300 uppercase mb-8 shadow-[0_0_20px_rgba(37,99,235,0.12)]">
          <Sparkles size={11} className="text-blue-500" />
          Ready to grow your business?
        </div>

        {/* Headline */}
        <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.0] text-[var(--fg)] mb-6">
          Your documents are
          <span className="block gradient-text-brand mt-1">waiting to be useful.</span>
        </h2>

        {/* Sub-copy */}
        <p className="text-[var(--fg-muted)] text-lg mb-10 max-w-lg leading-relaxed">
          Stop searching. Stop missing deadlines. Start asking.
          Get your first AI answer in under 2 minutes — completely free.
        </p>

        {/* Perks grid */}
        <div className="grid grid-cols-2 gap-3 mb-10 w-full max-w-sm">
          {perks.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2.5 px-3.5 py-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-left hover:bg-[var(--surface-hover)] hover:border-blue-500/30 transition-all">
              <div className="w-7 h-7 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Icon size={13} className="text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs text-[var(--fg-soft)] font-medium leading-tight">{text}</span>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 w-full">
          <Link
            href="/contact"
            className="group relative inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-full bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 text-white font-black text-sm tracking-wider transition-all duration-300 btn-glow-blue hover:-translate-y-1 active:scale-95 overflow-hidden shine-hover w-full sm:w-auto"
          >
            <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <Mail size={15} className="relative z-10" />
            <span className="relative z-10">Contact Us Today</span>
            <ArrowRight size={16} className="relative z-10 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-[var(--border)] text-[var(--fg-soft)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] hover:border-blue-500/30 font-semibold text-sm transition-all duration-300 hover:-translate-y-0.5 active:scale-95 w-full sm:w-auto"
          >
            Start for free
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Social proof */}
        <p className="mt-8 text-xs text-[var(--fg-muted)] flex items-center gap-2">
          <CheckCircle size={12} className="text-teal-500" />
          Trusted by 10,000+ SMEs across Africa &amp; beyond
        </p>
      </div>
    </section>
  );
}
