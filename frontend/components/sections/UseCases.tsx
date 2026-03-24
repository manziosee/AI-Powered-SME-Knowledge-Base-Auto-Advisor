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
  },
  {
    icon:  Stethoscope,
    industry: "Healthcare & Clinics",
    title: "Stay compliant with health regulations",
    bullets: [
      "Track HACCP, fire safety, and pharmacy licences",
      "GDPR patient data handling guidance",
      "Regulatory inspection readiness checklist",
    ],
  },
  {
    icon:  Truck,
    industry: "Logistics & Supply Chain",
    title: "Manage supplier contracts at scale",
    bullets: [
      "Import duty calculations and HS code lookup",
      "Customs compliance document store",
      "Multi-vendor SLA monitoring",
    ],
  },
  {
    icon:  Scale,
    industry: "Legal & Accounting",
    title: "Accelerate due diligence reviews",
    bullets: [
      "Instant semantic search across case files",
      "AML/KYC record management",
      "Auto-generate compliance gap reports",
    ],
  },
  {
    icon:  Leaf,
    industry: "Agriculture & Agribusiness",
    title: "Navigate cross-border trade compliance",
    bullets: [
      "Export permit tracking and reminders",
      "Phytosanitary certification management",
      "Multi-jurisdiction VAT guidance",
    ],
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
  },
];

export default function UseCases() {
  return (
    <section id="use-cases" className="py-28 px-6 relative">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <p className="text-xs text-white/40 tracking-[0.25em] uppercase mb-4">Use cases</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
            Built for every
            <br />
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage: "linear-gradient(135deg, #fff 0%, #666 100%)",
              }}
            >
              growing business
            </span>
          </h2>
          <p className="mt-5 text-white/45 text-lg">
            From a 5-person clinic to a 200-person logistics company — if you
            deal with documents and compliance, AdvisorAI is for you.
          </p>
        </div>

        {/* Case cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cases.map((c, i) => {
            const Icon = c.icon;
            return (
              <div
                key={i}
                className="group p-6 rounded-2xl border border-white/8 hover:border-white/18 bg-white/2 hover:bg-white/4 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center group-hover:bg-white/12 transition-colors">
                    <Icon size={16} className="text-white/60" />
                  </div>
                  <span className="text-white/35 text-xs font-medium tracking-wide uppercase">
                    {c.industry}
                  </span>
                </div>

                <h3 className="text-white font-semibold mb-3 leading-snug">
                  {c.title}
                </h3>

                <ul className="flex flex-col gap-2">
                  {c.bullets.map((b, j) => (
                    <li key={j} className="flex items-start gap-2 text-white/45 text-sm">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white/25 flex-shrink-0" />
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
