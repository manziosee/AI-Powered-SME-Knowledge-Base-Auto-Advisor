"use client";

import React from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  Scale,
  Calculator,
  Users,
  Heart,
  ShoppingBag,
  Rocket,
  ArrowRight,
  Quote,
} from "lucide-react";

const useCases = [
  {
    icon: Scale,
    title: "Legal Firms",
    problem: "Lawyers spend hours manually searching contracts and legislation for precedents and compliance clauses.",
    solution: "AdvisorAI indexes your entire case library and statute database. Get instant, cited answers to legal queries in under a second.",
    quote: "We cut contract review time by 70% in the first month.",
    author: "Senior Partner, Kigali Law Associates",
    color: "text-violet-500",
    bg: "bg-violet-500/10 border-violet-500/20",
    quoteBg: "bg-violet-500/5 border-violet-500/10",
  },
  {
    icon: Calculator,
    title: "Accounting & Finance",
    problem: "Accountants juggle tax codes across multiple jurisdictions and risk missing regulatory updates that trigger fines.",
    solution: "AdvisorAI tracks changes in RRA, KRA, and FIRS regulations. Get instant answers about deductibility, filing deadlines, and penalty rules.",
    quote: "Our compliance score went from 68% to 94% within 6 weeks.",
    author: "CFO, Nairobi-based SME Group",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10 border-cyan-500/20",
    quoteBg: "bg-cyan-500/5 border-cyan-500/10",
  },
  {
    icon: Users,
    title: "HR Departments",
    problem: "HR teams struggle to maintain consistent, compliant employment policies across regions with different labor laws.",
    solution: "Upload your HR policies and labor law documents. AdvisorAI answers employee queries and flags policy gaps before they become disputes.",
    quote: "Onboarding new staff now takes half the time with instant policy lookup.",
    author: "Head of HR, Pan-African Retailer",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    quoteBg: "bg-emerald-500/5 border-emerald-500/10",
  },
  {
    icon: Heart,
    title: "Healthcare",
    problem: "Clinics and hospitals must comply with evolving health regulations, drug approval processes, and patient data laws.",
    solution: "AdvisorAI processes clinical guidelines, MOH directives, and internal SOPs. Staff get instant answers without searching through binders.",
    quote: "Our audits are cleaner — staff actually know the protocols now.",
    author: "Operations Manager, Kampala Private Clinic",
    color: "text-rose-500",
    bg: "bg-rose-500/10 border-rose-500/20",
    quoteBg: "bg-rose-500/5 border-rose-500/10",
  },
  {
    icon: ShoppingBag,
    title: "Retail SMEs",
    problem: "Retailers face product import regulations, VAT filing requirements, and consumer protection rules that change frequently.",
    solution: "AdvisorAI monitors your compliance calendar, answers VAT and customs queries, and alerts you 30 days before any filing deadline.",
    quote: "No more surprise fines. AdvisorAI caught a missed VAT deadline we'd have missed.",
    author: "Owner, Lagos Electronics Retailer",
    color: "text-amber-500",
    bg: "bg-amber-500/10 border-amber-500/20",
    quoteBg: "bg-amber-500/5 border-amber-500/10",
  },
  {
    icon: Rocket,
    title: "Tech Startups",
    problem: "Founders lack legal and compliance expertise but face data privacy, investor reporting, and IP registration requirements.",
    solution: "AdvisorAI becomes your on-call compliance team. Upload term sheets, GDPR policies, and shareholder agreements — ask anything, anytime.",
    quote: "Saved us $8k in legal fees in the first quarter. Absolute game-changer.",
    author: "Co-founder, Accra SaaS Startup",
    color: "text-blue-500",
    bg: "bg-blue-500/10 border-blue-500/20",
    quoteBg: "bg-blue-500/5 border-blue-500/10",
  },
];

const stats = [
  { value: "10,000+", label: "Documents processed" },
  { value: "7",       label: "Compliance jurisdictions" },
  { value: "500ms",   label: "Avg AI response time" },
  { value: "500+",    label: "Businesses onboarded" },
];

export default function UseCasesPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <Navbar />

      {/* Hero */}
      <section className="pt-36 pb-24 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-violet-500 mb-4">
            Use cases
          </span>
          <h1 className="text-5xl md:text-6xl font-black text-[var(--fg)] mb-6 leading-tight">
            Trusted by businesses{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-cyan-500">
              across Africa and beyond
            </span>
          </h1>
          <p className="text-[var(--fg-soft)] text-lg leading-relaxed max-w-2xl mx-auto">
            From legal firms in Kigali to tech startups in Accra — AdvisorAI
            adapts to your industry, your documents, and your regulatory
            environment.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-6 border-y border-[var(--border)] bg-[var(--bg-soft)]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-4xl font-black text-violet-500 mb-1">{s.value}</p>
              <p className="text-[var(--fg-muted)] text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Use Case Cards */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {useCases.map(({ icon: Icon, title, problem, solution, quote, author, color, bg, quoteBg }) => (
              <div
                key={title}
                className="group flex flex-col p-7 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border)] hover:border-violet-500/30 hover:shadow-2xl hover:shadow-violet-500/10 hover:-translate-y-1 transition-all duration-300"
              >
                <div
                  className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-5 ${bg} group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon size={22} className={color} />
                </div>
                <h3 className={`text-[var(--fg)] font-black text-xl mb-3 ${color} group-hover:text-current transition-colors`}>
                  {title}
                </h3>
                <div className="mb-4">
                  <p className="text-xs uppercase tracking-widest text-[var(--fg-muted)] mb-1 font-semibold">
                    The challenge
                  </p>
                  <p className="text-[var(--fg-soft)] text-sm leading-relaxed">{problem}</p>
                </div>
                <div className="mb-5">
                  <p className="text-xs uppercase tracking-widest text-[var(--fg-muted)] mb-1 font-semibold">
                    The solution
                  </p>
                  <p className="text-[var(--fg-soft)] text-sm leading-relaxed">{solution}</p>
                </div>
                <div className={`mt-auto rounded-xl border p-4 ${quoteBg}`}>
                  <Quote size={14} className={`${color} mb-2 opacity-60`} />
                  <p className="text-[var(--fg-soft)] text-sm italic leading-relaxed mb-2">
                    &ldquo;{quote}&rdquo;
                  </p>
                  <p className="text-[var(--fg-muted)] text-xs font-semibold">— {author}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-6 bg-[var(--bg-soft)] border-t border-[var(--border)] text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-black text-[var(--fg)] mb-4 tracking-tight">
            Your industry is next
          </h2>
          <p className="text-[var(--fg-muted)] mb-10 text-lg">
            Whatever documents your business runs on, AdvisorAI can index and
            answer them. Start free, no setup required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-10 py-5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-black text-lg hover:from-violet-500 hover:to-purple-500 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/30 hover:-translate-y-1"
            >
              Start for free <ArrowRight size={20} />
            </Link>
            <Link
              href="/features"
              className="inline-flex items-center gap-2 px-10 py-5 rounded-2xl border border-[var(--border)] text-[var(--fg)] font-bold text-lg hover:border-violet-500/40 hover:bg-[var(--bg)] transition-all duration-300"
            >
              Explore features
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
