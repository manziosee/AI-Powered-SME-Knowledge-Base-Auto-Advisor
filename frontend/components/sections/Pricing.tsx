"use client";

import React, { useState } from "react";
import { Check, Zap, ArrowRight, Star, X, Sparkles, Shield, Building2 } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name:       "Starter",
    badge:      "Free forever",
    price:      { monthly: "Free", annual: "Free" },
    priceSub:   "no expiry · no card",
    desc:       "Perfect for solo founders and small teams getting started with AI-powered compliance.",
    cta:        "Get started free",
    href:       "/register",
    popular:    false,
    icon:       Sparkles,
    iconGrad:   "from-emerald-500 to-teal-500",
    accentColor:"#34d399",
    checkColor: "text-emerald-500",
    checkBg:    "bg-emerald-500/10 border-emerald-500/20",
    priceColor: "text-emerald-600 dark:text-emerald-400",
    badgeColor: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20",
    btnClass:   "from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400",
    btnShadow:  "shadow-[0_4px_20px_rgba(52,211,153,0.3)] hover:shadow-[0_8px_30px_rgba(52,211,153,0.45)]",
    cardLight:  "bg-white border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.10)]",
    cardDark:   "dark:bg-gradient-to-b dark:from-[#0d1020] dark:to-[#080b18] dark:border-white/6 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_20px_50px_rgba(0,0,0,0.4)] dark:hover:shadow-[0_0_0_1px_rgba(52,211,153,0.2),0_30px_60px_rgba(0,0,0,0.5)]",
    topLine:    "from-emerald-400/60 via-teal-400/30 to-transparent",
    features: [
      "Up to 50 documents",
      "100 AI queries / month",
      "1 compliance jurisdiction",
      "Email deadline alerts",
      "PDF export",
      "Community support",
    ],
    notIncluded: [
      "Custom ML model training",
      "Webhook integrations",
      "Team roles & permissions",
    ],
  },
  {
    name:       "Growth",
    badge:      "Most popular",
    price:      { monthly: "$49", annual: "$39" },
    priceSub:   "per month",
    desc:       "For growing teams that need unlimited AI power and multi-country compliance coverage.",
    cta:        "Start 14-day free trial",
    href:       "/register?plan=growth",
    popular:    true,
    icon:       Zap,
    iconGrad:   "from-violet-600 to-purple-600",
    accentColor:"#a78bfa",
    checkColor: "text-violet-500",
    checkBg:    "bg-violet-500/10 border-violet-500/20",
    priceColor: "text-violet-600 dark:text-violet-400",
    badgeColor: "text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/15 border-violet-200 dark:border-violet-500/30",
    btnClass:   "from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500",
    btnShadow:  "shadow-[0_4px_24px_rgba(124,58,237,0.4)] hover:shadow-[0_8px_40px_rgba(124,58,237,0.55)]",
    cardLight:  "bg-white border-violet-200 shadow-[0_8px_40px_rgba(124,58,237,0.12)] hover:shadow-[0_20px_60px_rgba(124,58,237,0.18)]",
    cardDark:   "dark:bg-gradient-to-b dark:from-[#120a2e] dark:to-[#0a0618] dark:border-violet-500/20 dark:shadow-[0_0_0_1px_rgba(124,58,237,0.35),0_30px_80px_rgba(124,58,237,0.2)] dark:hover:shadow-[0_0_0_1px_rgba(124,58,237,0.5),0_40px_80px_rgba(124,58,237,0.3)]",
    topLine:    "from-violet-500/80 via-purple-500/50 to-pink-500/20",
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
    notIncluded: [],
  },
  {
    name:       "Enterprise",
    badge:      "For large teams",
    price:      { monthly: "Custom", annual: "Custom" },
    priceSub:   "contact us",
    desc:       "For established businesses needing full control, private hosting, and guaranteed SLAs.",
    cta:        "Talk to sales",
    href:       "/contact",
    popular:    false,
    icon:       Building2,
    iconGrad:   "from-blue-500 to-cyan-500",
    accentColor:"#60a5fa",
    checkColor: "text-blue-500",
    checkBg:    "bg-blue-500/10 border-blue-500/20",
    priceColor: "text-blue-600 dark:text-blue-400",
    badgeColor: "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20",
    btnClass:   "from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400",
    btnShadow:  "shadow-[0_4px_20px_rgba(37,99,235,0.3)] hover:shadow-[0_8px_30px_rgba(37,99,235,0.45)]",
    cardLight:  "bg-white border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.10)]",
    cardDark:   "dark:bg-gradient-to-b dark:from-[#0a1020] dark:to-[#060b18] dark:border-white/6 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_20px_50px_rgba(0,0,0,0.4)] dark:hover:shadow-[0_0_0_1px_rgba(37,99,235,0.2),0_30px_60px_rgba(0,0,0,0.5)]",
    topLine:    "from-blue-400/60 via-cyan-400/30 to-transparent",
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
    notIncluded: [],
  },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="relative py-28 px-6 overflow-hidden bg-[var(--bg-soft)]">

      {/* Light mode: subtle gradient wash */}
      <div className="absolute inset-0 pointer-events-none dark:hidden"
        style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(124,58,237,0.05) 0%, transparent 70%)" }} />

      {/* Dark mode: deep navy + glows */}
      <div className="absolute inset-0 pointer-events-none hidden dark:block dark-section-deep" />
      <div className="absolute inset-0 pointer-events-none hidden dark:block">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full blur-[160px]"
          style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.18) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 left-0 w-[500px] h-[400px] rounded-full blur-[120px]"
          style={{ background: "radial-gradient(ellipse, rgba(37,99,235,0.12) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 right-0 w-[400px] h-[350px] rounded-full blur-[100px]"
          style={{ background: "radial-gradient(ellipse, rgba(6,182,212,0.08) 0%, transparent 70%)" }} />
        <div className="absolute inset-0 bg-dots opacity-8" />
      </div>

      <div className="absolute top-0 inset-x-0 section-line" />
      <div className="absolute bottom-0 inset-x-0 section-line" />

      <div className="relative z-10 max-w-6xl mx-auto">

        {/* ── Header ── */}
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/25 bg-violet-500/8 text-xs font-bold tracking-widest text-violet-600 dark:text-violet-400 uppercase mb-6">
            <Star size={11} className="fill-current" />
            Pricing
          </div>

          <h2 className="text-4xl md:text-6xl font-black tracking-tight text-[var(--fg)] leading-[1.0] mb-5">
            Simple, honest{" "}
            <span className="gradient-text-brand">pricing</span>
          </h2>

          <p className="text-[var(--fg-muted)] text-lg leading-relaxed mb-10">
            Start free. Scale when you need to. No hidden fees, no lock-in.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-1 p-1.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                !annual
                  ? "bg-[var(--fg)] text-[var(--bg)] shadow-md"
                  : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                annual
                  ? "bg-[var(--fg)] text-[var(--bg)] shadow-md"
                  : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
              }`}
            >
              Annual
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white tracking-wide">
                −20%
              </span>
            </button>
          </div>
        </div>

        {/* ── Plans ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const displayPrice = annual ? plan.price.annual : plan.price.monthly;
            const showSavings = annual && plan.price.monthly !== "Free" && plan.price.monthly !== "Custom";

            return (
              <div
                key={plan.name}
                className={`relative group flex flex-col ${plan.popular ? "lg:-translate-y-5" : ""}`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-4 inset-x-0 flex justify-center z-20">
                    <div className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-[10px] font-black rounded-full shadow-[0_4px_20px_rgba(124,58,237,0.45)] tracking-widest uppercase">
                      <Zap size={10} className="fill-current" />
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Card */}
                <div className={`relative flex flex-col flex-1 rounded-3xl border overflow-hidden transition-all duration-400 group-hover:-translate-y-1 ${plan.cardLight} ${plan.cardDark}`}>

                  {/* Top accent line */}
                  <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${plan.topLine}`} />

                  {/* Light mode inner glow */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[280px] h-[160px] rounded-full blur-[60px] pointer-events-none dark:hidden"
                    style={{ background: `radial-gradient(ellipse, ${plan.accentColor}12 0%, transparent 70%)` }} />

                  {/* Dark mode inner glow */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[280px] h-[160px] rounded-full blur-[80px] pointer-events-none hidden dark:block"
                    style={{ background: `radial-gradient(ellipse, ${plan.accentColor}20 0%, transparent 70%)` }} />

                  <div className="relative z-10 flex flex-col flex-1 p-7">

                    {/* Icon + badge */}
                    <div className="flex items-start justify-between mb-6">
                      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${plan.iconGrad} flex items-center justify-center shadow-lg flex-shrink-0`}>
                        <Icon size={18} className="text-white" />
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border ${plan.badgeColor}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        {plan.badge}
                      </span>
                    </div>

                    {/* Plan name */}
                    <p className="text-[var(--fg-muted)] text-xs font-bold uppercase tracking-widest mb-2">{plan.name}</p>

                    {/* Price */}
                    <div className="flex items-end gap-2 mb-1">
                      <span className={`text-6xl font-black leading-none tracking-tight ${plan.priceColor}`}>
                        {displayPrice}
                      </span>
                      {plan.price.monthly !== "Free" && plan.price.monthly !== "Custom" && (
                        <span className="text-[var(--fg-muted)] text-sm mb-2">{plan.priceSub}</span>
                      )}
                    </div>

                    {/* Savings / sub */}
                    <div className="flex items-center gap-2 mb-5 h-5">
                      {showSavings ? (
                        <>
                          <span className="text-[var(--fg-muted)] text-xs line-through">{plan.price.monthly}/mo</span>
                          <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold">Save 20%</span>
                        </>
                      ) : (
                        <span className="text-[var(--fg-muted)] text-xs">{plan.priceSub}</span>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-[var(--border)] mb-5" />

                    {/* Description */}
                    <p className="text-[var(--fg-muted)] text-sm leading-relaxed mb-6">{plan.desc}</p>

                    {/* Features */}
                    <ul className="flex flex-col gap-3 flex-1 mb-7">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${plan.checkBg}`}>
                            <Check size={10} className={plan.checkColor} strokeWidth={3} />
                          </div>
                          <span className="text-[var(--fg-soft)] text-sm">{f}</span>
                        </li>
                      ))}
                      {plan.notIncluded.map((f) => (
                        <li key={f} className="flex items-center gap-3 opacity-40">
                          <div className="w-5 h-5 rounded-full border border-[var(--border)] flex items-center justify-center flex-shrink-0 bg-[var(--surface)]">
                            <X size={9} className="text-[var(--fg-muted)]" strokeWidth={3} />
                          </div>
                          <span className="text-[var(--fg-muted)] text-sm line-through">{f}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Link
                      href={plan.href}
                      className={`group/btn relative w-full py-4 rounded-2xl bg-gradient-to-r ${plan.btnClass} ${plan.btnShadow} text-white font-black text-sm transition-all duration-300 flex items-center justify-center gap-2.5 overflow-hidden shine-hover`}
                    >
                      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                      <span className="relative z-10">{plan.cta}</span>
                      <ArrowRight size={15} className="relative z-10 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Trust row ── */}
        <div className="mt-16 flex flex-col items-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-6">
            {[
              { icon: Shield, text: "SSL encrypted"  },
              { icon: Check,  text: "GDPR compliant" },
              { icon: Zap,    text: "Auto backups"   },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-[var(--fg-muted)] text-sm">
                <Icon size={14} className="text-[var(--fg-muted)] opacity-60" />
                {text}
              </div>
            ))}
          </div>
          <p className="text-[var(--fg-muted)] text-sm text-center">
            No hidden fees. Cancel or downgrade anytime.{" "}
            <Link href="/contact" className="text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300 transition-colors font-medium">
              Questions? Contact us →
            </Link>
          </p>
        </div>

      </div>
    </section>
  );
}
