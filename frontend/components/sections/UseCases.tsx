import React from "react";
import { Building2, Stethoscope, Truck, Scale, Leaf, GraduationCap, ArrowUpRight } from "lucide-react";

const cases = [
  {
    icon:  Building2,
    industry: "Professional Services",
    title: "Never miss a client contract deadline",
    bullets: ["Auto-extract renewal dates from 500+ contracts","30-day & 7-day automated email alerts","AI summarises key obligations per contract"],
    accent: "violet",
    grad: "from-violet-600 to-purple-600",
    iconBg: "bg-violet-500/15 border-violet-500/30",
    iconColor: "text-violet-500",
    tag: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
    dot: "bg-violet-500",
    glowClass: "case-glow-violet",
  },
  {
    icon:  Stethoscope,
    industry: "Healthcare & Clinics",
    title: "Stay compliant with health regulations",
    bullets: ["Track HACCP, fire safety, and pharmacy licences","GDPR patient data handling guidance built-in","Regulatory inspection readiness checklist"],
    accent: "rose",
    grad: "from-rose-500 to-pink-500",
    iconBg: "bg-rose-500/15 border-rose-500/30",
    iconColor: "text-rose-500",
    tag: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    dot: "bg-rose-500",
    glowClass: "case-glow-rose",
  },
  {
    icon:  Truck,
    industry: "Logistics & Supply Chain",
    title: "Manage supplier contracts at scale",
    bullets: ["Import duty calculations and HS code lookup","Customs compliance document store","Multi-vendor SLA monitoring and alerts"],
    accent: "amber",
    grad: "from-amber-500 to-orange-500",
    iconBg: "bg-amber-500/15 border-amber-500/30",
    iconColor: "text-amber-500",
    tag: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    dot: "bg-amber-500",
    glowClass: "case-glow-amber",
  },
  {
    icon:  Scale,
    industry: "Legal & Accounting",
    title: "Accelerate due diligence reviews",
    bullets: ["Instant semantic search across all case files","AML/KYC record management with audit trail","Auto-generate compliance gap reports"],
    accent: "blue",
    grad: "from-blue-500 to-indigo-500",
    iconBg: "bg-blue-500/15 border-blue-500/30",
    iconColor: "text-blue-500",
    tag: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    dot: "bg-blue-500",
    glowClass: "case-glow-blue",
  },
  {
    icon:  Leaf,
    industry: "Agriculture & Agribusiness",
    title: "Navigate cross-border trade compliance",
    bullets: ["Export permit tracking and renewal reminders","Phytosanitary certification management","Multi-jurisdiction VAT guidance"],
    accent: "emerald",
    grad: "from-emerald-500 to-green-500",
    iconBg: "bg-emerald-500/15 border-emerald-500/30",
    iconColor: "text-emerald-500",
    tag: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-500",
    glowClass: "case-glow-emerald",
  },
  {
    icon:  GraduationCap,
    industry: "Education & NGOs",
    title: "Streamline grant and board governance",
    bullets: ["Donor reporting obligation tracking","Board resolution and minute management","Policy version control and distribution"],
    accent: "indigo",
    grad: "from-indigo-500 to-violet-500",
    iconBg: "bg-indigo-500/15 border-indigo-500/30",
    iconColor: "text-indigo-500",
    tag: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    dot: "bg-indigo-500",
    glowClass: "case-glow-indigo",
  },
];

export default function UseCases() {
  return (
    <section id="use-cases" className="py-32 px-6 relative bg-[var(--bg)] overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-grid opacity-50 pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-violet-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-20 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/25 bg-violet-500/8 text-xs font-bold tracking-widest text-violet-600 dark:text-violet-400 uppercase mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
            Use cases
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-[var(--fg)] leading-[1.05]">
            Built for every{" "}
            <span className="gradient-text-hero">growing business</span>
          </h2>
          <p className="mt-5 text-[var(--fg-muted)] text-lg leading-relaxed">
            From a 5-person clinic to a 200-person logistics company — if you deal with
            documents and compliance, AdvisorAI is for you.
          </p>
        </div>

        {/* Bento-style case cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cases.map((c, i) => {
            const Icon = c.icon;
            return (
              <div
                key={c.industry}
                className={`group relative p-7 rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] hover:border-[var(--border)] cursor-default transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl overflow-hidden shine-hover ${i === 0 ? "lg:col-span-2 lg:row-span-1" : ""}`}
              >
                {/* Hover glow */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none ${c.glowClass}`} />

                {/* Top gradient line */}
                <div className={`absolute top-0 left-8 right-8 h-px bg-gradient-to-r ${c.grad} opacity-0 group-hover:opacity-60 transition-opacity duration-300`} />

                {/* Header */}
                <div className="flex items-start justify-between mb-5 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 ${c.iconBg} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                      <Icon size={20} className={c.iconColor} />
                    </div>
                    <span className={`inline-flex px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wide ${c.tag}`}>
                      {c.industry}
                    </span>
                  </div>
                  <ArrowUpRight size={16} className="text-[var(--fg-muted)] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
                </div>

                <h3 className="text-[var(--fg)] font-bold text-lg mb-4 leading-snug relative z-10">
                  {c.title}
                </h3>

                <ul className="flex flex-col gap-3 relative z-10">
                  {c.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-3 text-[var(--fg-muted)] text-sm">
                      <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${c.dot} opacity-80`} />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
