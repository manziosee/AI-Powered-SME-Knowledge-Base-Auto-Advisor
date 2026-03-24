import React from "react";
import {
  Brain, FileSearch, ShieldCheck, BarChart3,
  Bell, Puzzle, Zap, Lock,
} from "lucide-react";

const features = [
  {
    icon:  Brain,
    title: "AI-Powered Advisor",
    desc:  "Ask any business question in plain English. Our LangChain ReAct agent searches your documents, checks compliance rules, and answers in seconds.",
    accent: "w-full",
  },
  {
    icon:  FileSearch,
    title: "Hybrid Document Search",
    desc:  "Upload contracts, invoices, tax forms, HR policies. Our BM25 + pgvector RAG pipeline finds exactly what you need — even across 10,000+ documents.",
    accent: "w-3/4",
  },
  {
    icon:  ShieldCheck,
    title: "Compliance Engine",
    desc:  "Automatic compliance rules for Rwanda, Kenya, Nigeria, South Africa, France, US and EU/GDPR. Get gap analysis and actionable recommendations.",
    accent: "w-2/3",
  },
  {
    icon:  BarChart3,
    title: "Analytics Dashboard",
    desc:  "Real-time KPIs: compliance score, risk distribution, document processing rates. Export to PDF or Excel in one click.",
    accent: "w-4/5",
  },
  {
    icon:  Bell,
    title: "Smart Notifications",
    desc:  "Never miss a deadline. Automated alerts for expiring contracts, PAYE filings, license renewals, and more — delivered to your dashboard.",
    accent: "w-3/4",
  },
  {
    icon:  Zap,
    title: "Streaming Chat",
    desc:  "Real-time SSE streaming responses. See the AI think, step by step, with sources cited from your own uploaded documents.",
    accent: "w-2/3",
  },
  {
    icon:  Puzzle,
    title: "Integration APIs",
    desc:  "Connect to your existing tools via webhooks with HMAC-SHA256 signing. ERP, HR systems, and custom inbound data pipelines supported.",
    accent: "w-4/5",
  },
  {
    icon:  Lock,
    title: "Enterprise Security",
    desc:  "Multi-tenant data isolation. JWT + refresh token auth. Rate limiting. TLS everywhere. Role-based access: Super Admin → Admin → Manager → Employee.",
    accent: "w-full",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-28 px-6 relative">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <p className="text-xs text-white/40 tracking-[0.25em] uppercase mb-4">
            Everything you need
          </p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
            One platform for your
            <br />
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage: "linear-gradient(135deg, #ffffff 0%, #666666 100%)",
              }}
            >
              entire business knowledge
            </span>
          </h2>
          <p className="mt-5 text-white/50 text-lg">
            From document ingestion to AI-driven insights — built for SMEs that
            can&apos;t afford to miss anything.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div
                key={i}
                className="group relative p-6 rounded-2xl bg-white/3 border border-white/8 hover:border-white/18 hover:bg-white/5 transition-all duration-300 cursor-default"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-white/8 flex items-center justify-center mb-4 group-hover:bg-white/12 transition-colors">
                  <Icon size={18} className="text-white/70" />
                </div>

                <h3 className="text-white font-semibold mb-2 text-sm">
                  {feat.title}
                </h3>
                <p className="text-white/45 text-xs leading-relaxed">
                  {feat.desc}
                </p>

                {/* Bottom accent line */}
                <div className="mt-5 h-px bg-white/8 rounded">
                  <div
                    className="h-px bg-gradient-to-r from-white/40 to-transparent rounded transition-all duration-500 group-hover:from-white/70"
                    style={{ width: feat.accent }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
