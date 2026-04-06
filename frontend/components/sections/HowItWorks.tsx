import React from "react";
import { Upload, Cpu, MessageSquare, TrendingUp, ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Upload your documents",
    desc: "Drag and drop contracts, invoices, policies, tax docs and HR files. PDF, Word, Excel, plain text — no reformatting. Batch upload hundreds at once.",
    detail: ["Auto-categorization", "OCR included", "Batch upload", "50 MB / file"],
    grad: "from-cyan-500 to-teal-500",
    iconBg: "bg-cyan-500/15 border-cyan-500/30",
    iconColor: "text-cyan-500",
    glowColor: "rgba(6,182,212,0.15)",
    badgeBg: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    numColor: "text-cyan-500",
  },
  {
    number: "02",
    icon: Cpu,
    title: "AI processes & indexes everything",
    desc: "LangChain splits and embeds every chunk into pgvector with BM25 sparse indexing. spaCy extracts dates, orgs, and monetary values automatically.",
    detail: ["384-dim embeddings", "Hybrid search", "Entity extraction", "~30 sec / doc"],
    grad: "from-violet-600 to-purple-600",
    iconBg: "bg-violet-500/15 border-violet-500/30",
    iconColor: "text-violet-500",
    glowColor: "rgba(124,58,237,0.15)",
    badgeBg: "bg-violet-500/10 text-violet-500 border-violet-500/20",
    numColor: "text-violet-500",
  },
  {
    number: "03",
    icon: MessageSquare,
    title: "Ask anything, get instant answers",
    desc: "Type questions in plain English. The AI searches your docs, checks compliance rules, scores risks, and responds with exact citations — verify every claim.",
    detail: ["ReAct agent", "RAG pipeline", "SSE streaming", "Source citations"],
    grad: "from-emerald-500 to-green-500",
    iconBg: "bg-emerald-500/15 border-emerald-500/30",
    iconColor: "text-emerald-500",
    glowColor: "rgba(52,211,153,0.15)",
    badgeBg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    numColor: "text-emerald-500",
  },
  {
    number: "04",
    icon: TrendingUp,
    title: "Stay ahead with proactive insights",
    desc: "Automated deadline reminders, compliance gap reports, and risk-level alerts keep you informed before problems become crises. Export as PDF or Excel.",
    detail: ["Email alerts", "Dashboard KPIs", "PDF & Excel export", "Webhook push"],
    grad: "from-amber-500 to-orange-500",
    iconBg: "bg-amber-500/15 border-amber-500/30",
    iconColor: "text-amber-500",
    glowColor: "rgba(245,158,11,0.15)",
    badgeBg: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    numColor: "text-amber-500",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-32 px-6 relative overflow-hidden bg-[var(--bg-soft)]">
      {/* Background */}
      <div className="absolute inset-0 bg-dots opacity-40 pointer-events-none" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-500/5 blur-[140px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-20 max-w-xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/25 bg-violet-500/8 text-xs font-bold tracking-widest text-violet-600 dark:text-violet-400 uppercase mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
            How it works
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-[var(--fg)] leading-[1.05]">
            From upload to{" "}
            <span className="gradient-text-hero">insight in minutes</span>
          </h2>
          <p className="mt-4 text-[var(--fg-muted)] text-lg leading-relaxed">
            Four simple steps, zero technical knowledge required.
          </p>
        </div>

        {/* Steps — alternating layout */}
        <div className="flex flex-col gap-16">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isLeft = i % 2 === 0;
            return (
              <div key={step.number} className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

                {/* Visual card */}
                <div className={`${isLeft ? "lg:order-2" : "lg:order-1"} flex justify-center`}>
                  <div className={`group relative w-full max-w-sm h-64 rounded-3xl border border-[var(--border)] bg-[var(--bg)] flex flex-col items-center justify-center overflow-hidden cursor-default hover:-translate-y-2 transition-all duration-500 hover:shadow-2xl hover:border-white/20`}>
                    {/* Background */}
                    <div className="absolute inset-0 bg-dots opacity-50" />
                    <div className={`absolute inset-0 bg-gradient-to-br ${step.grad} opacity-5 group-hover:opacity-10 transition-opacity`} />

                    {/* Step number watermark */}
                    <span className="absolute bottom-3 right-5 text-9xl font-black text-[var(--fg)] opacity-[0.03] select-none pointer-events-none leading-none">
                      {step.number}
                    </span>

                    {/* Icon */}
                    <div className={`relative z-10 w-20 h-20 rounded-2xl border flex items-center justify-center mb-4 ${step.iconBg} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                      <Icon size={36} className={step.iconColor} />
                    </div>

                    {/* Step badge */}
                    <div className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold ${step.badgeBg}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      STEP {step.number}
                    </div>

                    {/* Top accent */}
                    <div className={`absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r ${step.grad} opacity-50 group-hover:opacity-80 transition-opacity`} />
                  </div>
                </div>

                {/* Content */}
                <div className={`${isLeft ? "lg:order-1" : "lg:order-2"}`}>
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black tracking-widest mb-4 ${step.badgeBg}`}>
                    STEP {step.number}
                  </div>

                  <h3 className="text-[var(--fg)] font-black text-2xl md:text-3xl mb-4 leading-tight">
                    {step.title}
                  </h3>
                  <p className="text-[var(--fg-soft)] leading-relaxed mb-6 text-base">
                    {step.desc}
                  </p>

                  {/* Detail chips */}
                  <div className="flex flex-wrap gap-2">
                    {step.detail.map((d) => (
                      <span key={d} className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${step.badgeBg}`}>
                        {d}
                      </span>
                    ))}
                  </div>

                  {/* Continue arrow */}
                  {i < steps.length - 1 && (
                    <div className={`mt-8 flex items-center gap-2 text-xs font-semibold ${step.numColor} opacity-60`}>
                      <span>Next step</span>
                      <ArrowRight size={14} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
