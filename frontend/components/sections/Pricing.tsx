import React from "react";
import { Check, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name:  "Starter",
    price: "Free",
    sub:   "forever",
    desc:  "Perfect for solo founders and small teams getting started with AI-powered compliance.",
    cta:   "Get started free",
    href:  "/register",
    features: [
      "Up to 50 documents",
      "100 AI queries / month",
      "1 compliance jurisdiction",
      "Email deadline alerts",
      "PDF export",
      "Community support",
    ],
    highlight: false,
    checkColor: "text-emerald-500",
    nameColor: "text-[var(--fg-muted)]",
    priceColor: "text-[var(--fg)]",
  },
  {
    name:  "Growth",
    price: "$49",
    sub:   "/ month",
    desc:  "For growing teams that need unlimited AI power and multi-country compliance coverage.",
    cta:   "Start 14-day free trial",
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
    checkColor: "text-violet-500",
    nameColor: "text-violet-500",
    priceColor: "text-violet-500",
  },
  {
    name:  "Enterprise",
    price: "Custom",
    sub:   "contact us",
    desc:  "For established businesses needing full control, private hosting, and guaranteed SLAs.",
    cta:   "Talk to sales",
    href:  "mailto:hello@advisorai.app",
    features: [
      "Unlimited documents",
      "All compliance jurisdictions",
      "Self-hosted / private cloud",
      "SSO & SAML",
      "Custom integrations",
      "99.9% uptime SLA",
      "Dedicated account manager",
      "Security audit support",
    ],
    highlight: false,
    checkColor: "text-cyan-500",
    nameColor: "text-[var(--fg-muted)]",
    priceColor: "text-[var(--fg)]",
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-28 px-6 relative bg-[var(--bg)]">
      <div className="glow-violet-radial absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full blur-[100px] pointer-events-none opacity-40" />

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 max-w-xl mx-auto">
          <p className="text-xs text-violet-500 tracking-[0.25em] uppercase mb-4 font-semibold">Pricing</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--fg)]">
            Simple, honest pricing
          </h2>
          <p className="mt-4 text-[var(--fg-muted)] text-lg">
            Start free. Scale when you need to. No hidden fees, no lock-in.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border transition-all duration-300 ${
                plan.highlight
                  ? "lift border-violet-500/50 bg-violet-500/5 shadow-2xl shadow-violet-500/15 scale-[1.02]"
                  : "lift-l border-[var(--border)] bg-[var(--bg-soft)] hover:border-violet-500/20"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3.5 py-1.5 bg-violet-600 text-white text-xs font-semibold rounded-full shadow-[0_0_16px_rgba(124,58,237,0.5)]">
                  <Zap size={11} />
                  Most popular
                </div>
              )}

              <div className="p-7 pb-0">
                <p className={`text-xs font-semibold tracking-widest uppercase mb-3 ${plan.nameColor}`}>
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className={`text-4xl font-black ${plan.priceColor}`}>{plan.price}</span>
                  <span className="text-[var(--fg-muted)] text-sm">{plan.sub}</span>
                </div>
                <p className="text-[var(--fg-muted)] text-sm mb-6 leading-relaxed">{plan.desc}</p>
              </div>

              <ul className="flex flex-col gap-2.5 px-7 pb-7 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[var(--fg-soft)] text-sm">
                    <Check size={14} className={`mt-0.5 flex-shrink-0 ${plan.checkColor}`} />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="px-7 pb-7">
                <Link
                  href={plan.href}
                  className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                    plan.highlight
                      ? "bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_28px_rgba(124,58,237,0.45)]"
                      : "border border-[var(--border)] text-[var(--fg-soft)] hover:border-violet-500/40 hover:text-violet-500"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-[var(--fg-muted)] text-xs mt-10">
          All plans include SSL encryption, automatic backups, and GDPR-compliant data handling.
          <br />No hidden fees. Cancel or downgrade anytime.
        </p>
      </div>
    </section>
  );
}
