import React from "react";

const stats = [
  { value: "500+",   label: "Projects Done",        sub: "across 7 African countries",       color: "text-blue-400",   glow: "stat-glow-blue",   bar: "from-blue-500 to-indigo-500"   },
  { value: "98%",    label: "Client Satisfaction",   sub: "verified by real reviews",          color: "text-violet-400", glow: "stat-glow-violet", bar: "from-violet-500 to-purple-500" },
  { value: "24/7",   label: "AI Support",            sub: "with Groq LLaMA 3.3 70B",          color: "text-teal-400",   glow: "stat-glow-teal",   bar: "from-teal-500 to-cyan-500"     },
  { value: "10+",    label: "Team Members",          sub: "experts across the globe",          color: "text-amber-400",  glow: "stat-glow-amber",  bar: "from-amber-500 to-orange-500"  },
];

const techStack = [
  { name: "Next.js 15",           color: "hover:border-blue-500/50   hover:text-blue-400"    },
  { name: "FastAPI",              color: "hover:border-emerald-500/50 hover:text-emerald-400" },
  { name: "PostgreSQL",           color: "hover:border-blue-500/50   hover:text-blue-400"    },
  { name: "pgvector",             color: "hover:border-cyan-500/50   hover:text-cyan-400"    },
  { name: "LangChain",            color: "hover:border-violet-500/50 hover:text-violet-400"  },
  { name: "Groq LLM",             color: "hover:border-amber-500/50  hover:text-amber-400"   },
  { name: "Celery",               color: "hover:border-rose-500/50   hover:text-rose-400"    },
  { name: "Redis",                color: "hover:border-red-500/50    hover:text-red-400"     },
  { name: "SentenceTransformers", color: "hover:border-indigo-500/50 hover:text-indigo-400"  },
  { name: "BM25",                 color: "hover:border-teal-500/50   hover:text-teal-400"    },
  { name: "Docker",               color: "hover:border-blue-500/50   hover:text-blue-400"    },
  { name: "spaCy NLP",            color: "hover:border-cyan-500/50   hover:text-cyan-400"    },
  { name: "JWT Auth",             color: "hover:border-violet-500/50 hover:text-violet-400"  },
  { name: "Alembic",              color: "hover:border-emerald-500/50 hover:text-emerald-400"},
];

export default function Stats() {
  return (
    <section className="relative overflow-hidden">
      {/* Dark gradient banner — inspired by image 1 dark stats bar & image 3 dark theme */}
      <div className="dark-section-deep py-20 px-6 relative">
        {/* Multi-layer mesh */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] rounded-full blur-[140px]"
            style={{ background: "radial-gradient(ellipse, rgba(37,99,235,0.15) 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 right-0 w-[500px] h-[300px] rounded-full blur-[100px]"
            style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 70%)" }} />
          <div className="absolute inset-0 bg-dots opacity-8" />
        </div>
        <div className="absolute top-0 inset-x-0 section-line opacity-50" />
        <div className="absolute bottom-0 inset-x-0 section-line opacity-50" />

        <div className="relative max-w-7xl mx-auto">
          <p className="text-center text-white/40 text-[11px] tracking-[0.25em] uppercase mb-4 font-semibold">
            Proven at scale — trusted by real businesses
          </p>
          {/* Image 1 inspired "Ready to grow?" tag line */}
          <h2 className="text-center text-white/80 text-2xl md:text-3xl font-black mb-12 tracking-tight">
            Ready to <span className="gradient-text-brand">Grow Your Business?</span>
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className="group relative p-7 rounded-2xl border border-white/8 bg-white/4 hover:bg-white/8 hover:border-white/18 transition-all duration-400 cursor-default text-center overflow-hidden"
              >
                {/* Icon ring decoration */}
                <div className="absolute top-3 right-3 w-12 h-12 rounded-full border border-white/5 opacity-30 group-hover:opacity-60 transition-opacity" />
                <div className="absolute top-4 right-4 w-8 h-8 rounded-full border border-white/5 opacity-20 group-hover:opacity-40 transition-opacity" />

                {/* Top gradient bar */}
                <div className={`absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r ${stat.bar} opacity-60 group-hover:opacity-100 transition-opacity`} />

                <span className={`text-5xl md:text-6xl font-black tracking-tight ${stat.color} ${stat.glow} block mb-3 group-hover:scale-110 transition-transform duration-300`}>
                  {stat.value}
                </span>
                <span className="text-white/75 font-semibold text-sm block mb-1">
                  {stat.label}
                </span>
                <span className="text-white/30 text-xs">{stat.sub}</span>

                {/* Number watermark */}
                <span className="absolute bottom-3 right-4 text-6xl font-black text-white/3 select-none pointer-events-none leading-none">
                  {i + 1}
                </span>
              </div>
            ))}
          </div>

          {/* CTA inside stats */}
          <div className="mt-14 text-center">
            <div className="inline-flex flex-col sm:flex-row items-center gap-5 px-8 py-6 rounded-3xl border border-white/10 bg-white/4 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-violet-500/5 to-transparent pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
              <div>
                <p className="text-white/50 text-sm mb-1">Trusted by 10,000+ SMEs</p>
                <p className="text-white font-black text-xl tracking-tight">
                  Ready to <span className="gradient-text-brand">Grow Your Business?</span>
                </p>
              </div>
              <a
                href="/contact"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-black btn-glow-blue hover:-translate-y-0.5 transition-all duration-300 shine-hover overflow-hidden relative flex-shrink-0"
              >
                <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                <span className="relative z-10">Contact Us Today</span>
                <span className="relative z-10">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Tech stack section */}
      <div className="py-16 px-6 bg-[var(--bg)] border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-[var(--fg-muted)] text-[11px] tracking-[0.25em] uppercase mb-8 font-semibold">
            Built on proven open-source technology
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {techStack.map(({ name, color }) => (
              <span
                key={name}
                className={`pop-pill px-4 py-2 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--fg-muted)] text-xs font-mono cursor-default transition-all duration-300 hover:bg-[var(--surface-hover)] hover:shadow-lg ${color}`}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
