import React from "react";
import { Upload, Cpu, MessageSquare, TrendingUp } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Upload your documents",
    desc: "Drag and drop contracts, invoices, policies, tax documents, and HR files. We accept PDF, Word, Excel, and plain text — no reformatting needed. Batch upload hundreds of files at once.",
    detail: "Auto-categorization · OCR included · Batch upload · 50 MB per file",
    iconBg: "bg-cyan-500/12 border-cyan-500/25",
    iconColor: "text-cyan-500",
    numColor: "text-cyan-500",
    glow: "bg-cyan-500/8",
    border: "border-cyan-500/20",
    badge: "bg-cyan-500/10 text-cyan-500 border-cyan-500/25",
  },
  {
    number: "02",
    icon: Cpu,
    title: "AI processes & indexes everything",
    desc: "LangChain splits and embeds every chunk into pgvector with BM25 sparse indexing. spaCy automatically extracts dates, organizations, and monetary values from your documents.",
    detail: "384-dim embeddings · Hybrid search · Entity extraction · ~30 sec/doc",
    iconBg: "bg-violet-500/12 border-violet-500/25",
    iconColor: "text-violet-500",
    numColor: "text-violet-500",
    glow: "bg-violet-500/8",
    border: "border-violet-500/20",
    badge: "bg-violet-500/10 text-violet-500 border-violet-500/25",
  },
  {
    number: "03",
    icon: MessageSquare,
    title: "Ask anything, get instant answers",
    desc: "Type questions in plain English. The AI agent searches your documents, checks compliance rules, scores risk levels, and responds with exact citations so you can verify every claim.",
    detail: "ReAct agent · RAG pipeline · SSE streaming · Source citations",
    iconBg: "bg-emerald-500/12 border-emerald-500/25",
    iconColor: "text-emerald-500",
    numColor: "text-emerald-500",
    glow: "bg-emerald-500/8",
    border: "border-emerald-500/20",
    badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/25",
  },
  {
    number: "04",
    icon: TrendingUp,
    title: "Stay ahead with proactive insights",
    desc: "Automated deadline reminders, compliance gap reports, and risk-level alerts keep you informed before problems become crises. Export any report as PDF or Excel with one click.",
    detail: "Email alerts · Dashboard analytics · PDF & Excel export · Webhook push",
    iconBg: "bg-amber-500/12 border-amber-500/25",
    iconColor: "text-amber-500",
    numColor: "text-amber-500",
    glow: "bg-amber-500/8",
    border: "border-amber-500/20",
    badge: "bg-amber-500/10 text-amber-500 border-amber-500/25",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-28 px-6 relative overflow-hidden bg-[var(--bg-soft)]">
      <div className="glow-violet-radial absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[600px] rounded-full blur-[140px] pointer-events-none opacity-40" />

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-16 max-w-xl">
          <p className="text-xs text-violet-500 tracking-[0.25em] uppercase mb-4 font-semibold">
            How it works
          </p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--fg)] leading-tight">
            From upload to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-cyan-500">
              insight in minutes
            </span>
          </h2>
          <p className="mt-4 text-[var(--fg-muted)] text-lg">
            Four simple steps, zero technical knowledge required.
          </p>
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-8">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isLeft = i % 2 === 0;

            return (
              <div key={step.number} className="lg:grid lg:grid-cols-2 lg:gap-16 flex flex-col gap-6 items-center">
                {/* Content */}
                <div className={`flex flex-col justify-center ${!isLeft ? "lg:col-start-2" : ""}`}>
                  <div className="flex items-start gap-5">
                    <div className={`flex-shrink-0 w-13 h-13 w-12 h-12 rounded-2xl border flex items-center justify-center ${step.iconBg}`}>
                      <Icon size={22} className={step.iconColor} />
                    </div>
                    <div className="flex-1">
                      <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-mono tracking-widest mb-3 ${step.badge}`}>
                        STEP {step.number}
                      </div>
                      <h3 className="text-[var(--fg)] font-bold text-xl mb-3">
                        {step.title}
                      </h3>
                      <p className="text-[var(--fg-soft)] leading-relaxed mb-4 text-sm">
                        {step.desc}
                      </p>
                      <p className={`text-xs font-mono ${step.numColor} opacity-70`}>
                        {step.detail}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Visual card — lifts on hover */}
                <div className={`hidden lg:flex items-center justify-center ${isLeft ? "lg:col-start-2" : "lg:col-start-1 lg:row-start-1"}`}>
                  <div className={`group lift w-full max-w-sm h-52 rounded-2xl border ${step.border} ${step.glow} flex flex-col items-center justify-center relative overflow-hidden cursor-default`}>
                    <div className="absolute inset-0 bg-dots opacity-60" />
                    <Icon size={52} className={`${step.iconColor} opacity-15 relative z-10`} />
                    <span className="absolute bottom-4 right-5 text-8xl font-black opacity-5 text-[var(--fg)] select-none">
                      {step.number}
                    </span>
                    {/* Corner badge */}
                    <div className={`absolute top-4 left-4 px-2 py-1 rounded-lg border text-xs font-semibold ${step.badge}`}>
                      Step {step.number}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
