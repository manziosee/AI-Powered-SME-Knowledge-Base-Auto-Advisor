import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Brain, Shield, Globe, Users, Zap, Award, ArrowRight } from "lucide-react";

const values = [
  { icon: Brain,  title: "AI-First",        desc: "We believe every SME deserves the same AI capabilities as Fortune 500 companies.",         grad: "from-blue-600 to-indigo-600",   glow: "rgba(37,99,235,0.2)"    },
  { icon: Shield, title: "Privacy & Trust",  desc: "Multi-tenant isolation, encrypted at rest, GDPR-ready. Your data never trains our models.", grad: "from-teal-500 to-emerald-600",  glow: "rgba(13,148,136,0.18)"  },
  { icon: Globe,  title: "Built for Africa", desc: "Compliance rules for Rwanda, Kenya, Nigeria, Ghana and beyond — not just the West.",         grad: "from-violet-600 to-purple-600", glow: "rgba(124,58,237,0.18)"  },
  { icon: Users,  title: "Human-Centred",    desc: "Answers in plain English. No jargon. No PhD required to use your own business data.",       grad: "from-cyan-500 to-teal-500",    glow: "rgba(6,182,212,0.18)"   },
  { icon: Zap,    title: "Always Fast",      desc: "Groq-powered inference delivers answers in under 500 ms, even on large document sets.",     grad: "from-amber-500 to-orange-500", glow: "rgba(245,158,11,0.18)"  },
  { icon: Award,  title: "Open & Auditable", desc: "Built on LangChain, pgvector, and FastAPI. Open-source components you can inspect.",        grad: "from-rose-500 to-pink-600",    glow: "rgba(244,63,94,0.18)"   },
];

const team = [
  { name: "Alice Uwimana",  role: "CEO & Co-founder",     avatar: "AU", grad: "from-blue-600 to-indigo-600",    ring: "border-blue-500/30",   glow: "rgba(37,99,235,0.3)"    },
  { name: "James Mwangi",   role: "CTO & Co-founder",     avatar: "JM", grad: "from-teal-500 to-emerald-600",  ring: "border-teal-500/30",   glow: "rgba(13,148,136,0.3)"   },
  { name: "Fatima Okonkwo", role: "Head of Compliance",   avatar: "FO", grad: "from-violet-600 to-purple-600", ring: "border-violet-500/30", glow: "rgba(124,58,237,0.3)"   },
  { name: "Sophie Dubois",  role: "Head of Engineering",  avatar: "SD", grad: "from-amber-500 to-orange-500",  ring: "border-amber-500/30",  glow: "rgba(245,158,11,0.3)"   },
];

const statsData = [
  { value: "500+",  label: "Companies onboarded",     color: "text-blue-500",   glow: "stat-glow-blue"   },
  { value: "7",     label: "Compliance jurisdictions", color: "text-teal-500",   glow: "stat-glow-teal"   },
  { value: "99.9%", label: "Uptime SLA",              color: "text-violet-500", glow: "stat-glow-violet" },
  { value: "<500ms",label: "Avg AI response time",    color: "text-amber-400",  glow: "stat-glow-amber"  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <Navbar />

      {/* Hero */}
      <section className="pt-36 pb-24 px-6 text-center relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[150px]"
            style={{ background: "radial-gradient(ellipse, rgba(37,99,235,0.10) 0%, transparent 70%)" }} />
          <div className="absolute inset-0 bg-dots opacity-20" />
        </div>

        <div className="max-w-3xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/25 bg-blue-500/8 text-xs font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            About AdvisorAI
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-[var(--fg)] mb-6 leading-tight">
            We make compliance{" "}
            <span className="gradient-text-brand">
              accessible to every SME
            </span>
          </h1>
          <p className="text-[var(--fg-soft)] text-lg leading-relaxed max-w-2xl mx-auto mb-8">
            AdvisorAI was born out of frustration. Too many small businesses were missing deadlines,
            losing contracts, and paying fines — not because they were careless, but because compliance
            information was locked away in complex documents no one had time to read. We built the AI
            that reads it for you.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a href="/register"
              className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-bold btn-glow-blue hover:-translate-y-0.5 transition-all duration-300 overflow-hidden shine-hover relative">
              <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              <span className="relative z-10">Get started free</span>
              <ArrowRight size={14} className="relative z-10 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a href="/contact"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-[var(--border)] text-[var(--fg-soft)] text-sm font-semibold hover:border-blue-500/30 hover:text-[var(--fg)] hover:-translate-y-0.5 transition-all duration-300">
              Contact us
            </a>
          </div>
        </div>
      </section>

      {/* Stats — enhanced dark section */}
      <section className="py-16 px-6 relative overflow-hidden border-y border-[var(--border)]">
        <div className="absolute inset-0 dark-section-deep opacity-95" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-full blur-[120px]"
            style={{ background: "radial-gradient(ellipse, rgba(37,99,235,0.18) 0%, transparent 70%)" }} />
        </div>
        <div className="absolute top-0 inset-x-0 section-line opacity-50" />
        <div className="absolute bottom-0 inset-x-0 section-line opacity-50" />

        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative z-10">
          {statsData.map((s) => (
            <div key={s.label} className="group">
              <p className={`text-4xl md:text-5xl font-black mb-2 ${s.color} ${s.glow} group-hover:scale-110 transition-transform duration-300`}>{s.value}</p>
              <p className="text-white/40 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/25 bg-blue-500/8 text-xs font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Our Services
            </div>
            <h2 className="text-4xl font-black text-[var(--fg)] tracking-tight">What we stand for</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {values.map(({ icon: Icon, title, desc, grad, glow }) => (
              <div key={title}
                className="group relative p-6 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border)] hover:border-blue-500/30 transition-all duration-400 hover:shadow-2xl hover:-translate-y-2 cursor-default overflow-hidden shine-hover">
                {/* Hover glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"
                  style={{ background: `radial-gradient(ellipse 80% 60% at 50% 100%, ${glow}, transparent)` }} />
                {/* Top line */}
                <div className={`absolute top-0 left-6 right-6 h-px bg-gradient-to-r ${grad} opacity-0 group-hover:opacity-60 transition-opacity`} />

                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                  <Icon size={20} className="text-white" />
                </div>
                <h3 className="text-[var(--fg)] font-bold mb-2">{title}</h3>
                <p className="text-[var(--fg-muted)] text-sm leading-relaxed">{desc}</p>

                {/* Bottom bar */}
                <div className="mt-5 h-[2px] rounded-full bg-[var(--border)] overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${grad} w-0 group-hover:w-full transition-all duration-700 rounded-full`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 px-6 bg-[var(--bg-soft)] border-t border-[var(--border)] relative overflow-hidden">
        {/* Subtle background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[130px]"
            style={{ background: "radial-gradient(ellipse, rgba(37,99,235,0.06) 0%, transparent 70%)" }} />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/25 bg-blue-500/8 text-xs font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Our Team
          </div>
          <h2 className="text-3xl font-black text-[var(--fg)] mb-4 tracking-tight">Meet the team</h2>
          <p className="text-[var(--fg-muted)] mb-12">A small team of builders obsessed with making compliance painless.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {team.map((m) => (
              <div key={m.name} className="flex flex-col items-center gap-3 group">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${m.grad} flex items-center justify-center font-black text-2xl text-white shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
                  style={{ boxShadow: `0 0 30px ${m.glow}` }}>
                  {m.avatar}
                </div>
                <div>
                  <p className="text-[var(--fg)] font-semibold text-sm group-hover:text-blue-500 transition-colors">{m.name}</p>
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
