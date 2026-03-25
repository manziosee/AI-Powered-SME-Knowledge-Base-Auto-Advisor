import React from "react";

const stats = [
  { value: "500+",   label: "Companies onboarded",       sub: "across 7 African countries",       color: "text-violet-500" },
  { value: "<500ms", label: "Average AI response time",   sub: "with Groq Llama 3.1 70B",          color: "text-cyan-500"   },
  { value: "7",      label: "Compliance jurisdictions",   sub: "RW · KE · NG · ZA · FR · US · EU", color: "text-emerald-500" },
  { value: "99.9%",  label: "Uptime SLA",                 sub: "production-ready architecture",     color: "text-amber-500"  },
];

const techStack = [
  { name: "Next.js 15",          color: "hover:border-blue-500/50   hover:text-blue-500"    },
  { name: "FastAPI",             color: "hover:border-emerald-500/50 hover:text-emerald-500" },
  { name: "PostgreSQL",          color: "hover:border-blue-500/50   hover:text-blue-500"    },
  { name: "pgvector",            color: "hover:border-cyan-500/50   hover:text-cyan-500"    },
  { name: "LangChain",           color: "hover:border-violet-500/50 hover:text-violet-500"  },
  { name: "Groq LLM",            color: "hover:border-amber-500/50  hover:text-amber-500"   },
  { name: "Celery",              color: "hover:border-rose-500/50   hover:text-rose-500"    },
  { name: "Redis",               color: "hover:border-red-500/50    hover:text-red-500"     },
  { name: "SentenceTransformers",color: "hover:border-indigo-500/50 hover:text-indigo-500"  },
  { name: "BM25",                color: "hover:border-teal-500/50   hover:text-teal-500"    },
  { name: "Docker",              color: "hover:border-blue-500/50   hover:text-blue-500"    },
  { name: "Nginx",               color: "hover:border-emerald-500/50 hover:text-emerald-500"},
  { name: "spaCy NLP",           color: "hover:border-cyan-500/50   hover:text-cyan-500"    },
  { name: "JWT Auth",            color: "hover:border-violet-500/50 hover:text-violet-500"  },
];

export default function Stats() {
  return (
    <section className="py-24 px-6 border-y border-[var(--border)] relative overflow-hidden bg-[var(--bg)]">
      {/* Center glow */}
      <div className="glow-violet-radial absolute inset-0 m-auto w-[600px] h-[300px] rounded-full blur-[100px] pointer-events-none opacity-40" />

      <div className="relative max-w-7xl mx-auto">
        {/* Stats grid — each cell lifts on hover */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--border)] rounded-2xl overflow-hidden">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="lift bg-[var(--bg)] p-8 flex flex-col gap-1 hover:bg-[var(--bg-soft)] cursor-default"
            >
              <span className={`text-4xl md:text-5xl font-black tracking-tight ${stat.color}`}>
                {stat.value}
              </span>
              <span className="text-[var(--fg-soft)] font-semibold text-sm mt-1">
                {stat.label}
              </span>
              <span className="text-[var(--fg-muted)] text-xs">{stat.sub}</span>
            </div>
          ))}
        </div>

        {/* Tech stack pills */}
        <div className="mt-16">
          <p className="text-center text-[var(--fg-muted)] text-xs tracking-[0.2em] uppercase mb-6 font-medium">
            Built on proven open-source technology
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {techStack.map(({ name, color }) => (
              <span
                key={name}
                className={`pop-pill px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--fg-muted)] text-xs font-mono cursor-default ${color}`}
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
