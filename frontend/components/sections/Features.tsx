import React from "react";
import { Brain, FileSearch, ShieldCheck, BarChart3, Bell, Zap, Puzzle, Lock } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Advisor",
    desc: "Ask any business question in plain English. ReAct agent searches your documents, checks compliance rules, and answers in under 500 ms.",
    accent: "blue",
    iconGrad: "from-blue-600 to-indigo-600",
    border: "hover:border-blue-500/40",
    tag: "RAG · ReAct",
  },
  {
    icon: FileSearch,
    title: "Hybrid Document Search",
    desc: "Upload contracts, invoices, HR policies. BM25 + pgvector RAG finds exactly what you need — even across 10,000+ documents.",
    accent: "cyan",
    iconGrad: "from-cyan-500 to-teal-500",
    border: "hover:border-cyan-500/40",
    tag: "BM25 · pgvector",
  },
  {
    icon: ShieldCheck,
    title: "Compliance Engine",
    desc: "Automatic rules for RW, KE, NG, ZA, FR, US and EU/GDPR. Get gap analysis with actionable fix recommendations.",
    accent: "teal",
    iconGrad: "from-teal-500 to-emerald-500",
    border: "hover:border-teal-500/40",
    tag: "7 Jurisdictions",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    desc: "Real-time KPIs: compliance score, risk distribution, query trends, processing rates. One-click PDF or Excel export.",
    accent: "violet",
    iconGrad: "from-violet-600 to-purple-600",
    border: "hover:border-violet-500/40",
    tag: "PDF · Excel",
  },
  {
    icon: Bell,
    title: "Smart Deadline Alerts",
    desc: "Never miss a filing deadline. Automated alerts 30, 7, and 1 day before PAYE, VAT, license renewals, and contract expiries.",
    accent: "amber",
    iconGrad: "from-amber-500 to-orange-500",
    border: "hover:border-amber-500/40",
    tag: "Email · Push",
  },
  {
    icon: Zap,
    title: "Streaming Chat",
    desc: "Real-time SSE streaming responses. Watch the AI reason step-by-step, with every claim traced back to your source documents.",
    accent: "rose",
    iconGrad: "from-rose-500 to-pink-500",
    border: "hover:border-rose-500/40",
    tag: "SSE · Citations",
  },
  {
    icon: Puzzle,
    title: "Webhook Integrations",
    desc: "Connect to ERP, HR, and CRM systems via HMAC-SHA256-signed webhooks. Inbound pipelines bring your tools into the AI loop.",
    accent: "indigo",
    iconGrad: "from-indigo-500 to-violet-500",
    border: "hover:border-indigo-500/40",
    tag: "HMAC · REST",
  },
  {
    icon: Lock,
    title: "Enterprise Security",
    desc: "Multi-tenant isolation. JWT auth, rate limiting, TLS everywhere. Role-based access: Super Admin → Admin → Manager → Employee.",
    accent: "emerald",
    iconGrad: "from-emerald-500 to-teal-500",
    border: "hover:border-emerald-500/40",
    tag: "JWT · RBAC",
  },
];

const accentMap: Record<string, { bg: string; text: string; glowClass: string }> = {
  blue:    { bg: "bg-blue-500/10",    text: "text-blue-500",    glowClass: "feat-glow-blue"         },
  cyan:    { bg: "bg-cyan-500/10",    text: "text-cyan-500",    glowClass: "feat-glow-cyan"          },
  teal:    { bg: "bg-teal-500/10",    text: "text-teal-500",    glowClass: "feat-glow-teal"          },
  violet:  { bg: "bg-violet-500/10",  text: "text-violet-500",  glowClass: "feat-glow-violet"        },
  amber:   { bg: "bg-amber-500/10",   text: "text-amber-500",   glowClass: "feat-glow-amber"         },
  rose:    { bg: "bg-rose-500/10",    text: "text-rose-500",    glowClass: "feat-glow-rose"          },
  indigo:  { bg: "bg-indigo-500/10",  text: "text-indigo-500",  glowClass: "feat-glow-indigo"        },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500", glowClass: "feat-glow-emerald"       },
};

export default function Features() {
  return (
    <section id="features" className="py-32 px-6 relative bg-[var(--bg)] overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-grid opacity-60 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] pointer-events-none rounded-full blur-[150px]"
        style={{ background: "radial-gradient(ellipse, rgba(37,99,235,0.08) 0%, transparent 70%)" }} />

      <div className="relative max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-20 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/25 bg-blue-500/8 text-xs font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Complete Web Solutions
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-[var(--fg)] leading-[1.05]">
            One platform for your
            <span className="block gradient-text-brand mt-1">entire business knowledge</span>
          </h2>
          <p className="mt-5 text-[var(--fg-muted)] text-lg leading-relaxed">
            From document ingestion to AI-driven insights — built for SMEs that
            can&apos;t afford to miss anything.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feat) => {
            const Icon = feat.icon;
            const a = accentMap[feat.accent];
            return (
              <div
                key={feat.title}
                className={`group relative p-6 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border)] ${feat.border} cursor-default transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl shine-hover overflow-hidden`}
              >
                {/* Glow on hover */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none ${a.glowClass}`} />

                {/* Top accent line */}
                <div className={`absolute top-0 left-6 right-6 h-px opacity-0 group-hover:opacity-60 transition-opacity`}
                  style={{ background: `linear-gradient(90deg, transparent, currentColor, transparent)` }} />

                {/* Gradient border reveal on hover */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `linear-gradient(135deg, transparent 60%, rgba(37,99,235,0.06))` }} />

                {/* Icon */}
                <div className={`relative w-11 h-11 rounded-xl bg-gradient-to-br ${feat.iconGrad} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                  <Icon size={20} className="text-white" />
                </div>

                {/* Tag */}
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${a.bg} ${a.text} mb-3`}>
                  {feat.tag}
                </span>

                <h3 className="text-[var(--fg)] font-bold mb-2 text-sm leading-snug">
                  {feat.title}
                </h3>
                <p className="text-[var(--fg-muted)] text-xs leading-relaxed">
                  {feat.desc}
                </p>

                {/* Bottom accent bar */}
                <div className="mt-5 h-[2px] rounded-full bg-[var(--border)] overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${feat.iconGrad} w-0 group-hover:w-full transition-all duration-700 rounded-full`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
