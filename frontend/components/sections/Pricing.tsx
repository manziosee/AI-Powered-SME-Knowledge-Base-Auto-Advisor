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

        {/* Plans - Beautiful Gradient Cards */}
        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Plan - Starter */}
            <div className="relative group">
              <div className="relative flex flex-col h-full rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-1 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/30">
                <div className="flex flex-col h-full rounded-3xl bg-[var(--bg)] p-8">
                  <div className="mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 text-sm font-semibold mb-4">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      STARTER
                    </div>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-5xl font-black text-[var(--fg)]">Free</span>
                      <span className="text-[var(--fg-muted)] text-lg">forever</span>
                    </div>
                    <p className="text-[var(--fg-muted)] text-lg leading-relaxed mb-6">
                      Perfect for solo founders and small teams getting started with AI-powered compliance.
                    </p>
                  </div>
                  
                  <ul className="space-y-4 mb-8 flex-1">
                    {plans[0].features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check size={14} className="text-emerald-600" />
                        </div>
                        <span className="text-[var(--fg-soft)] text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link
                    href={plans[0].href}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm transition-all duration-300 hover:from-emerald-600 hover:to-teal-600 hover:shadow-lg hover:shadow-emerald-500/40 group/btn flex items-center justify-center"
                  >
                    Get started free
                    <ArrowRight size={16} className="inline-block ml-2 transition-transform group-hover/btn:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Middle Plan - Growth (Featured) */}
            <div className="relative lg:scale-105 lg:-translate-y-4">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <div className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-bold rounded-full shadow-2xl shadow-violet-500/30">
                  <Zap size={16} className="animate-pulse" />
                  MOST POPULAR
                </div>
              </div>
              <div className="relative flex flex-col h-full rounded-3xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 p-1 transition-all duration-500 hover:scale-110 hover:shadow-3xl hover:shadow-violet-500/40">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex flex-col h-full rounded-3xl bg-[var(--bg)] p-8 relative z-10">
                  <div className="mb-8">
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-6xl font-black text-violet-600">$49</span>
                      <span className="text-[var(--fg-muted)] text-lg">/ month</span>
                    </div>
                    <p className="text-[var(--fg-muted)] text-lg leading-relaxed mb-6">
                      For growing teams that need unlimited AI power and multi-country compliance coverage.
                    </p>
                  </div>
                  
                  <ul className="space-y-4 mb-8 flex-1">
                    {plans[1].features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-violet-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check size={14} className="text-violet-600" />
                        </div>
                        <span className="text-[var(--fg-soft)] text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link
                    href={plans[1].href}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-sm transition-all duration-300 hover:from-violet-500 hover:to-purple-500 hover:shadow-2xl hover:shadow-violet-500/40 hover:-translate-y-1 flex items-center justify-center"
                  >
                    Start 14-day free trial
                    <ArrowRight size={16} className="inline-block ml-2 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Plan - Enterprise */}
            <div className="relative group">
              <div className="relative flex flex-col h-full rounded-3xl bg-gradient-to-br from-blue-500 via-cyan-500 to-sky-500 p-1 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/30">
                <div className="flex flex-col h-full rounded-3xl bg-[var(--bg)] p-8">
                  <div className="mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-600 text-sm font-semibold mb-4">
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      ENTERPRISE
                    </div>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-5xl font-black text-[var(--fg)]">Custom</span>
                      <span className="text-[var(--fg-muted)] text-lg">contact us</span>
                    </div>
                    <p className="text-[var(--fg-muted)] text-lg leading-relaxed mb-6">
                      For established businesses needing full control, private hosting, and guaranteed SLAs.
                    </p>
                  </div>
                  
                  <ul className="space-y-4 mb-8 flex-1">
                    {plans[2].features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check size={14} className="text-blue-600" />
                        </div>
                        <span className="text-[var(--fg-soft)] text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link
                    href={plans[2].href}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold text-sm transition-all duration-300 hover:from-blue-600 hover:to-cyan-600 hover:shadow-lg hover:shadow-blue-500/40 group/btn flex items-center justify-center"
                  >
                    Talk to sales
                    <ArrowRight size={16} className="inline-block ml-2 transition-transform group-hover/btn:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-[var(--fg-muted)] text-xs mt-10">
          All plans include SSL encryption, automatic backups, and GDPR-compliant data handling.
          <br />No hidden fees. Cancel or downgrade anytime.
        </p>
      </div>
    </section>
  );
}
