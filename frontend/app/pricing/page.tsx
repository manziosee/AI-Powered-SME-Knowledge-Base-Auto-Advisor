"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Pricing from "@/components/sections/Pricing";
import {
  ChevronDown,
  Shield,
  Lock,
  Activity,
  ArrowRight,
} from "lucide-react";

const faqs = [
  {
    q: "Can I upgrade or downgrade my plan at any time?",
    a: "Yes. You can upgrade instantly and the new features become available immediately. Downgrades take effect at the end of your current billing cycle. There are no lock-in periods.",
  },
  {
    q: "What happens if I exceed my document or query limit?",
    a: "On the Starter plan, uploads are paused once you hit 50 documents — existing documents and queries continue to work. You'll receive an in-app prompt to upgrade. On Growth, document limits are soft-capped with a grace period.",
  },
  {
    q: "Is there a free trial for the Growth plan?",
    a: "Absolutely. Every Growth plan starts with a 14-day free trial with full access to all Growth features including unlimited queries, 5 jurisdictions, and custom ML training. No credit card required to start the trial.",
  },
  {
    q: "How does billing work for the Growth plan?",
    a: "Growth is billed monthly at $49/month. Annual billing (saves 20%) is available on request. We accept Visa, Mastercard, and mobile money payment options for African-based businesses.",
  },
  {
    q: "What is included in the Enterprise plan?",
    a: "Enterprise includes everything in Growth plus: unlimited documents, all 7+ compliance jurisdictions, self-hosted / private cloud deployment, SSO & SAML authentication, custom integrations, 99.9% SLA, a dedicated account manager, and security audit support. Pricing is tailored to your team size and infrastructure needs.",
  },
  {
    q: "Is my data safe if I cancel?",
    a: "Yes. Upon cancellation you can export all your documents and conversation history in standard formats before the account closes. We retain your data for 30 days post-cancellation in case you change your mind, then delete it permanently.",
  },
];

const trustBadges = [
  {
    icon: Shield,
    title: "SOC 2 Type II",
    desc: "Annual third-party security audits",
    color: "text-violet-500",
    bg: "bg-violet-500/10 border-violet-500/20",
  },
  {
    icon: Lock,
    title: "AES-256 Encryption",
    desc: "Data encrypted at rest and in transit",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10 border-cyan-500/20",
  },
  {
    icon: Activity,
    title: "99.9% Uptime SLA",
    desc: "Monitored 24/7 with status page",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-[var(--border)] rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-[var(--bg-soft)] transition-colors duration-200"
      >
        <span className="text-[var(--fg)] font-semibold">{q}</span>
        <ChevronDown
          size={18}
          className={`text-[var(--fg-muted)] flex-shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-6 pb-5 border-t border-[var(--border)] bg-[var(--bg-soft)]">
          <p className="text-[var(--fg-muted)] text-sm leading-relaxed pt-4">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <Navbar />

      {/* Hero */}
      <section className="pt-36 pb-8 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-violet-500 mb-4">
            Pricing
          </span>
          <h1 className="text-5xl md:text-6xl font-black text-[var(--fg)] mb-6 leading-tight">
            Simple,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-cyan-500">
              transparent pricing
            </span>
          </h1>
          <p className="text-[var(--fg-soft)] text-lg leading-relaxed max-w-xl mx-auto">
            Start free, scale when you need to. No hidden fees, no lock-in, no
            surprises on your invoice.
          </p>
        </div>
      </section>

      {/* Pricing Component */}
      <Pricing />

      {/* FAQ */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-[var(--fg)] tracking-tight mb-3">
              Frequently asked questions
            </h2>
            <p className="text-[var(--fg-muted)]">
              Still have questions?{" "}
              <Link href="/contact" className="text-violet-500 hover:underline font-medium">
                Contact us
              </Link>{" "}
              and we&apos;ll reply within 24 hours.
            </p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 px-6 bg-[var(--bg-soft)] border-t border-[var(--border)]">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl font-black text-[var(--fg)] mb-3 tracking-tight">
            Your data is safe with us
          </h2>
          <p className="text-[var(--fg-muted)] mb-12">
            Security and privacy are not afterthoughts — they&apos;re baked into
            every layer of AdvisorAI.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trustBadges.map(({ icon: Icon, title, desc, color, bg }) => (
              <div
                key={title}
                className="group p-7 rounded-2xl bg-[var(--bg)] border border-[var(--border)] hover:border-violet-500/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-5 mx-auto ${bg} group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon size={26} className={color} />
                </div>
                <h3 className="text-[var(--fg)] font-bold text-lg mb-2">{title}</h3>
                <p className="text-[var(--fg-muted)] text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-28 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/5 to-transparent pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-4xl font-black text-[var(--fg)] mb-4 tracking-tight">
            Start free today
          </h2>
          <p className="text-[var(--fg-muted)] mb-10 text-lg">
            Join 500+ businesses already using AdvisorAI to stay ahead of
            compliance.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-10 py-5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-black text-lg hover:from-violet-500 hover:to-purple-500 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/30 hover:-translate-y-1"
          >
            Create free account <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
