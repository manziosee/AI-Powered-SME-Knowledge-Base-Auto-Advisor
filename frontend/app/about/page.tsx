import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Brain, Shield, Globe, Users, Zap, Award } from "lucide-react";

const values = [
  { icon: Brain,  title: "AI-First",        desc: "We believe every SME deserves the same AI capabilities as Fortune 500 companies."         },
  { icon: Shield, title: "Privacy & Trust",  desc: "Multi-tenant isolation, encrypted at rest, GDPR-ready. Your data never trains our models." },
  { icon: Globe,  title: "Built for Africa", desc: "Compliance rules for Rwanda, Kenya, Nigeria, Ghana and beyond — not just the West."         },
  { icon: Users,  title: "Human-Centred",    desc: "Answers in plain English. No jargon. No PhD required to use your own business data."       },
  { icon: Zap,    title: "Always Fast",      desc: "Groq-powered inference delivers answers in under 500 ms, even on large document sets."     },
  { icon: Award,  title: "Open & Auditable", desc: "Built on LangChain, pgvector, and FastAPI. Open-source components you can inspect."        },
];

const team = [
  { name: "Alice Uwimana",  role: "CEO & Co-founder",     avatar: "AU", color: "bg-violet-500/20 border-violet-500/30 text-violet-600 dark:text-violet-300" },
  { name: "James Mwangi",   role: "CTO & Co-founder",     avatar: "JM", color: "bg-cyan-500/20 border-cyan-500/30 text-cyan-600 dark:text-cyan-300" },
  { name: "Fatima Okonkwo", role: "Head of Compliance",   avatar: "FO", color: "bg-emerald-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-300" },
  { name: "Sophie Dubois",  role: "Head of Engineering",  avatar: "SD", color: "bg-amber-500/20 border-amber-500/30 text-amber-600 dark:text-amber-300" },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <Navbar />

      {/* Hero */}
      <section className="pt-36 pb-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-violet-500 mb-4">About AdvisorAI</span>
          <h1 className="text-5xl font-black text-[var(--fg)] mb-6 leading-tight">
            We make compliance <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-cyan-500">
              accessible to every SME
            </span>
          </h1>
          <p className="text-[var(--fg-soft)] text-lg leading-relaxed max-w-2xl mx-auto">
            AdvisorAI was born out of frustration. Too many small businesses were missing deadlines,
            losing contracts, and paying fines — not because they were careless, but because compliance
            information was locked away in complex documents no one had time to read. We built the AI
            that reads it for you.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-6 border-y border-[var(--border)] bg-[var(--bg-soft)]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "500+",  label: "Companies onboarded"    },
            { value: "7",     label: "Compliance jurisdictions"},
            { value: "99.9%", label: "Uptime SLA"              },
            { value: "<500ms",label: "Avg AI response time"    },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-4xl font-black text-violet-500 mb-1">{s.value}</p>
              <p className="text-[var(--fg-muted)] text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-[var(--fg)] text-center mb-12">What we stand for</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {values.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border)] hover:border-violet-500/30 transition-all">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
                  <Icon size={18} className="text-violet-500" />
                </div>
                <h3 className="text-[var(--fg)] font-semibold mb-2">{title}</h3>
                <p className="text-[var(--fg-muted)] text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 px-6 bg-[var(--bg-soft)] border-t border-[var(--border)]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[var(--fg)] mb-4">Meet the team</h2>
          <p className="text-[var(--fg-muted)] mb-12">A small team of builders obsessed with making compliance painless.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {team.map((m) => (
              <div key={m.name} className="flex flex-col items-center gap-3">
                <div className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center font-black text-xl ${m.color}`}>
                  {m.avatar}
                </div>
                <div>
                  <p className="text-[var(--fg)] font-semibold text-sm">{m.name}</p>
                  <p className="text-[var(--fg-muted)] text-xs mt-0.5">{m.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
