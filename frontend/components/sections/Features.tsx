import React from "react";
import {
  Brain, FileSearch, ShieldCheck, BarChart3,
  Bell, Puzzle, Zap, Lock,
} from "lucide-react";

const features = [
  {
    icon:  Brain,
    title: "AI-Powered Advisor",
    desc:  "Ask any business question in plain English. Our LangChain ReAct agent searches your documents, checks compliance rules, and answers in under 500 ms.",
    iconBg: "bg-violet-500/12 border-violet-500/25 dark:bg-violet-500/12 dark:border-violet-500/25",
    iconColor: "text-violet-500",
    barW: "bar-full",
    barColor: "from-violet-500/60",
    tilt: "lift-r",
    shadow: "hover:shadow-violet-500/10",
  },
  {
    icon:  FileSearch,
    title: "Hybrid Document Search",
    desc:  "Upload contracts, invoices, tax forms, HR policies. BM25 + pgvector RAG finds exactly what you need — even across 10,000+ documents.",
    iconBg: "bg-cyan-500/12 border-cyan-500/25",
    iconColor: "text-cyan-500",
    barW: "bar-3-4",
    barColor: "from-cyan-500/60",
    tilt: "lift-l",
    shadow: "hover:shadow-cyan-500/10",
  },
  {
    icon:  ShieldCheck,
    title: "Compliance Engine",
    desc:  "Automatic rules for Rwanda, Kenya, Nigeria, South Africa, France, US and EU/GDPR. Get gap analysis with actionable fix recommendations.",
    iconBg: "bg-emerald-500/12 border-emerald-500/25",
    iconColor: "text-emerald-500",
    barW: "bar-2-3",
    barColor: "from-emerald-500/60",
    tilt: "lift-r",
    shadow: "hover:shadow-emerald-500/10",
  },
  {
    icon:  BarChart3,
    title: "Analytics Dashboard",
    desc:  "Real-time KPIs: compliance score, risk distribution, query trends, document processing rates. One-click PDF or Excel export.",
    iconBg: "bg-blue-500/12 border-blue-500/25",
    iconColor: "text-blue-500",
    barW: "bar-4-5",
    barColor: "from-blue-500/60",
    tilt: "lift-l",
    shadow: "hover:shadow-blue-500/10",
  },
  {
    icon:  Bell,
    title: "Smart Deadline Alerts",
    desc:  "Never miss a filing deadline. Automated alerts 30, 7, and 1 day before PAYE, VAT, license renewals, contract expiries, and more.",
    iconBg: "bg-amber-500/12 border-amber-500/25",
    iconColor: "text-amber-500",
    barW: "bar-3-4",
    barColor: "from-amber-500/60",
    tilt: "lift-r",
    shadow: "hover:shadow-amber-500/10",
  },
  {
    icon:  Zap,
    title: "Streaming Chat",
    desc:  "Real-time SSE streaming responses. Watch the AI reason step-by-step, with every claim traced back to your uploaded source documents.",
    iconBg: "bg-rose-500/12 border-rose-500/25",
    iconColor: "text-rose-500",
    barW: "bar-2-3",
    barColor: "from-rose-500/60",
    tilt: "lift-l",
    shadow: "hover:shadow-rose-500/10",
  },
  {
    icon:  Puzzle,
    title: "Webhook Integrations",
    desc:  "Connect to ERP, HR, and CRM systems via HMAC-SHA256-signed webhooks. Inbound data pipelines bring your existing tools into the AI loop.",
    iconBg: "bg-indigo-500/12 border-indigo-500/25",
    iconColor: "text-indigo-500",
    barW: "bar-4-5",
    barColor: "from-indigo-500/60",
    tilt: "lift-r",
    shadow: "hover:shadow-indigo-500/10",
  },
  {
    icon:  Lock,
    title: "Enterprise Security",
    desc:  "Multi-tenant data isolation. JWT auth, rate limiting, TLS everywhere. Role-based access: Super Admin → Admin → Manager → Employee.",
    iconBg: "bg-teal-500/12 border-teal-500/25",
    iconColor: "text-teal-500",
    barW: "bar-full",
    barColor: "from-teal-500/60",
    tilt: "lift-l",
    shadow: "hover:shadow-teal-500/10",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-28 px-6 relative bg-[var(--bg)]">
      {/* Grid background */}
      <div className="absolute inset-0 bg-grid opacity-100 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <p className="text-xs text-violet-500 tracking-[0.25em] uppercase mb-4 font-semibold">
            Everything you need
          </p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--fg)] leading-tight">
            One platform for your
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 via-cyan-500 to-blue-500">
              entire business knowledge
            </span>
          </h2>
          <p className="mt-5 text-[var(--fg-muted)] text-lg">
            From document ingestion to AI-driven insights — built for SMEs that
            can&apos;t afford to miss anything.
          </p>
        </div>

        {/* Feature grid — 4 columns, each card springs on hover */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className={`group relative p-6 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border)] cursor-default ${feat.tilt} hover:border-violet-500/25 hover:shadow-xl ${feat.shadow}`}
              >
                {/* Icon */}
                <div className={`icon-box w-11 h-11 rounded-xl border flex items-center justify-center mb-5 ${feat.iconBg}`}>
                  <Icon size={20} className={feat.iconColor} />
                </div>

                <h3 className="text-[var(--fg)] font-semibold mb-2 text-sm leading-snug">
                  {feat.title}
                </h3>
                <p className="text-[var(--fg-muted)] text-xs leading-relaxed">
                  {feat.desc}
                </p>

                {/* Accent progress bar */}
                <div className="mt-5 h-[3px] bg-[var(--border)] rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${feat.barColor} to-transparent rounded-full ${feat.barW}`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
