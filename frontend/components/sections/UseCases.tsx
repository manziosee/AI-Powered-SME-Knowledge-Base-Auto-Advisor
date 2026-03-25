import React from "react";
import { Building2, Stethoscope, Truck, Scale, Leaf, GraduationCap } from "lucide-react";

const cases = [
  {
    icon:  Building2,
    industry: "Professional Services",
    title: "Never miss a client contract deadline",
    bullets: [
      "Auto-extract renewal dates from 500+ contracts",
      "30-day and 7-day automated email alerts",
      "AI summarises key obligations per contract",
    ],
    iconBg: "bg-violet-500/12 border-violet-500/25",
    iconColor: "text-violet-500",
    dot: "bg-violet-500/60",
    tilt: "lift-r",
  },
  {
    icon:  Stethoscope,
    industry: "Healthcare & Clinics",
    title: "Stay compliant with health regulations",
    bullets: [
      "Track HACCP, fire safety, and pharmacy licences",
      "GDPR patient data handling guidance built-in",
      "Regulatory inspection readiness checklist",
    ],
    iconBg: "bg-rose-500/12 border-rose-500/25",
    iconColor: "text-rose-500",
    dot: "bg-rose-500/60",
    tilt: "lift",
  },
  {
    icon:  Truck,
    industry: "Logistics & Supply Chain",
    title: "Manage supplier contracts at scale",
    bullets: [
      "Import duty calculations and HS code lookup",
      "Customs compliance document store",
      "Multi-vendor SLA monitoring and alerts",
    ],
    iconBg: "bg-amber-500/12 border-amber-500/25",
    iconColor: "text-amber-500",
    dot: "bg-amber-500/60",
    tilt: "lift-l",
  },
  {
    icon:  Scale,
    industry: "Legal & Accounting",
    title: "Accelerate due diligence reviews",
    bullets: [
      "Instant semantic search across all case files",
      "AML/KYC record management with audit trail",
      "Auto-generate compliance gap reports",
    ],
    iconBg: "bg-blue-500/12 border-blue-500/25",
    iconColor: "text-blue-500",
    dot: "bg-blue-500/60",
    tilt: "lift-r",
  },
  {
    icon:  Leaf,
    industry: "Agriculture & Agribusiness",
    title: "Navigate cross-border trade compliance",
    bullets: [
      "Export permit tracking and renewal reminders",
      "Phytosanitary certification management",
      "Multi-jurisdiction VAT guidance",
    ],
    iconBg: "bg-emerald-500/12 border-emerald-500/25",
    iconColor: "text-emerald-500",
    dot: "bg-emerald-500/60",
    tilt: "lift",
  },
  {
    icon:  GraduationCap,
    industry: "Education & NGOs",
    title: "Streamline grant and board governance",
    bullets: [
      "Donor reporting obligation tracking",
      "Board resolution and minute management",
      "Policy version control and distribution",
    ],
    iconBg: "bg-indigo-500/12 border-indigo-500/25",
    iconColor: "text-indigo-500",
    dot: "bg-indigo-500/60",
    tilt: "lift-l",
  },
];

export default function UseCases() {
  return (
    <section id="use-cases" className="py-28 px-6 relative bg-[var(--bg-soft)]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <p className="text-xs text-violet-500 tracking-[0.25em] uppercase mb-4 font-semibold">Use cases</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--fg)] leading-tight">
            Built for every{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 via-emerald-500 to-cyan-500">
              growing business
            </span>
          </h2>
          <p className="mt-5 text-[var(--fg-muted)] text-lg">
            From a 5-person clinic to a 200-person logistics company — if you
            deal with documents and compliance, AdvisorAI is for you.
          </p>
        </div>

        {/* Case cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cases.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.industry}
                className={`group p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] hover:border-violet-500/25 cursor-default ${c.tilt}`}
              >
                {/* Header row */}
                <div className="flex items-center gap-3 mb-5">
                  <div className={`icon-box w-10 h-10 rounded-xl border flex items-center justify-center ${c.iconBg}`}>
                    <Icon size={17} className={c.iconColor} />
                  </div>
                  <span className={`text-xs font-semibold tracking-wide uppercase ${c.iconColor}`}>
                    {c.industry}
                  </span>
                </div>

                <h3 className="text-[var(--fg)] font-bold mb-4 leading-snug">
                  {c.title}
                </h3>

                <ul className="flex flex-col gap-2.5">
                  {c.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-[var(--fg-muted)] text-sm">
                      <span className={`mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
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
