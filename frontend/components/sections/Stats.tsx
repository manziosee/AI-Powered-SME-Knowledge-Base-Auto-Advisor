import React from "react";

const stats = [
  { value: "165+",   label: "Built-in training samples",   sub: "document & risk models"     },
  { value: "<500ms", label: "Average AI response time",    sub: "with Groq Llama 3.1 70B"    },
  { value: "7",      label: "Compliance jurisdictions",    sub: "RW · KE · NG · ZA · FR · US · EU" },
  { value: "99.9%",  label: "Uptime SLA",                  sub: "production-ready architecture" },
];

const techStack = [
  "Next.js 14", "FastAPI", "PostgreSQL", "pgvector",
  "LangChain", "Groq LLM", "Celery", "Redis",
  "SentenceTransformers", "BM25", "Docker", "Nginx",
];

export default function Stats() {
  return (
    <section className="py-24 px-6 border-y border-white/8 relative overflow-hidden">
      {/* Center glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[300px] bg-white/4 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/8 rounded-2xl overflow-hidden">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="bg-ink p-8 flex flex-col gap-1 hover:bg-ink-soft transition-colors"
            >
              <span className="text-4xl md:text-5xl font-black text-white tracking-tight">
                {stat.value}
              </span>
              <span className="text-white/70 font-medium text-sm mt-1">
                {stat.label}
              </span>
              <span className="text-white/30 text-xs">{stat.sub}</span>
            </div>
          ))}
        </div>

        {/* Tech stack ticker */}
        <div className="mt-16">
          <p className="text-center text-white/25 text-xs tracking-[0.2em] uppercase mb-6">
            Built on proven open-source technology
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {techStack.map((tech) => (
              <span
                key={tech}
                className="px-3 py-1.5 rounded-full border border-white/10 text-white/40 text-xs font-mono hover:border-white/25 hover:text-white/60 transition-colors"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
