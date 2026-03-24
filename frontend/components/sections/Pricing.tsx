import React from "react";
import { Check, Zap } from "lucide-react";
import Button from "@/components/ui/Button";

const plans = [
  {
    name:  "Starter",
    price: "Free",
    sub:   "forever",
    desc:  "Perfect for solo founders and small teams getting started.",
    cta:   "Get started free",
    href:  "/register",
    features: [
      "Up to 50 documents",
      "100 AI queries / month",
      "Basic compliance rules (1 country)",
      "Email notifications",
      "PDF export",
      "Community support",
    ],
    highlight: false,
  },
  {
    name:  "Growth",
    price: "$49",
    sub:   "/ month",
    desc:  "For growing teams that need more power and compliance coverage.",
    cta:   "Start 14-day trial",
    href:  "/register?plan=growth",
    features: [
      "Up to 2,000 documents",
      "Unlimited AI queries",
      "5 compliance jurisdictions",
      "Custom ML model training",
      "Webhook integrations",
      "PDF + Excel exports",
      "Priority email support",
      "Team roles & permissions",
    ],
    highlight: true,
  },
  {
    name:  "Enterprise",
    price: "Custom",
    sub:   "contact us",
    desc:  "For established businesses needing full control and SLAs.",
    cta:   "Talk to sales",
    href:  "mailto:hello@advisorai.app",
    features: [
      "Unlimited documents",
      "All compliance jurisdictions",
      "Self-hosted / private cloud",
      "SSO & SAML",
      "Custom integrations",
      "SLA 99.9% uptime",
      "Dedicated account manager",
      "Security audit support",
    ],
    highlight: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-28 px-6 relative">
      {/* Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-white/4 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 max-w-xl mx-auto">
          <p className="text-xs text-white/40 tracking-[0.25em] uppercase mb-4">Pricing</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            Simple, honest pricing
          </h2>
          <p className="mt-4 text-white/45 text-lg">
            Start free. Scale when you need to.
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`relative flex flex-col p-7 rounded-2xl border transition-all ${
                plan.highlight
                  ? "border-white/30 bg-white/7 shadow-xl shadow-white/5"
                  : "border-white/8 bg-white/2 hover:border-white/15 hover:bg-white/4"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 bg-white text-black text-xs font-semibold rounded-full">
                  <Zap size={11} />
                  Most popular
                </div>
              )}

              <div className="mb-6">
                <p className="text-white/50 text-xs font-medium tracking-widest uppercase mb-3">
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  <span className="text-white/35 text-sm">{plan.sub}</span>
                </div>
                <p className="text-white/40 text-sm mt-2">{plan.desc}</p>
              </div>

              <ul className="flex flex-col gap-2.5 mb-8 flex-1">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-white/60 text-sm">
                    <Check size={14} className="mt-0.5 flex-shrink-0 text-white/50" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.highlight ? "primary" : "outline"}
                href={plan.href}
                className="w-full justify-center"
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        <p className="text-center text-white/25 text-xs mt-8">
          All plans include SSL encryption, data backups, and GDPR-compliant data handling.
          <br />No hidden fees. Cancel anytime.
        </p>
      </div>
    </section>
  );
}
