import React from "react";
import { Upload, Cpu, MessageSquare, TrendingUp } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Upload your documents",
    desc: "Drag and drop contracts, invoices, policies, tax documents, and HR files. Our system accepts PDF, Word, Excel, and plain text. No reformatting needed.",
    detail: "Supports batch upload · Auto-categorization · OCR included",
  },
  {
    number: "02",
    icon: Cpu,
    title: "AI processes & indexes everything",
    desc: "LangChain splits, embeds, and stores every chunk in pgvector with BM25 sparse indexing. spaCy extracts dates, organizations, and monetary values automatically.",
    detail: "384-dim embeddings · Hybrid search · Automatic entity extraction",
  },
  {
    number: "03",
    icon: MessageSquare,
    title: "Ask anything, get instant answers",
    desc: "Type questions in plain English. The AI agent searches your documents, checks compliance rules, scores risk levels, and answers with cited sources.",
    detail: "ReAct agent · RAG pipeline · SSE streaming · Source citations",
  },
  {
    number: "04",
    icon: TrendingUp,
    title: "Stay ahead with proactive insights",
    desc: "Automated deadline reminders, compliance gap reports, and risk alerts keep you informed before problems become crises. Export reports in PDF or Excel.",
    detail: "Email alerts · Dashboard analytics · Exportable reports",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-28 px-6 relative overflow-hidden">
      {/* Side glow */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[600px] bg-white/3 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-16 max-w-xl">
          <p className="text-xs text-white/40 tracking-[0.25em] uppercase mb-4">
            How it works
          </p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
            From upload to
            <br />
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage: "linear-gradient(135deg, #ffffff 0%, #666 100%)",
              }}
            >
              insight in minutes
            </span>
          </h2>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute left-[calc(50%-1px)] top-12 bottom-12 w-px bg-gradient-to-b from-transparent via-white/15 to-transparent" />

          <div className="flex flex-col gap-8">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isLeft = i % 2 === 0;

              return (
                <div
                  key={i}
                  className={`lg:grid lg:grid-cols-2 lg:gap-16 flex flex-col gap-6 ${!isLeft ? "lg:direction-rtl" : ""}`}
                >
                  {/* Content side */}
                  <div className={`flex flex-col justify-center ${!isLeft ? "lg:col-start-2" : ""}`}>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <Icon size={20} className="text-white/60" />
                      </div>
                      <div>
                        <div className="text-white/20 text-xs font-mono tracking-widest mb-1">
                          STEP {step.number}
                        </div>
                        <h3 className="text-white font-semibold text-xl mb-2">
                          {step.title}
                        </h3>
                        <p className="text-white/50 leading-relaxed mb-3">
                          {step.desc}
                        </p>
                        <p className="text-white/25 text-xs font-mono">
                          {step.detail}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Visual side */}
                  <div
                    className={`hidden lg:flex items-center justify-center ${isLeft ? "lg:col-start-2" : "lg:col-start-1 lg:row-start-1"}`}
                  >
                    <div className="w-full max-w-xs h-48 rounded-2xl bg-white/3 border border-white/8 flex items-center justify-center relative overflow-hidden">
                      {/* Animated dot grid */}
                      <div
                        className="absolute inset-0 opacity-30"
                        style={{
                          backgroundImage:
                            "radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)",
                          backgroundSize: "20px 20px",
                        }}
                      />
                      <Icon size={40} className="text-white/10 relative z-10" />
                      {/* Step number watermark */}
                      <span className="absolute bottom-3 right-4 text-7xl font-black text-white/4 select-none">
                        {step.number}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
