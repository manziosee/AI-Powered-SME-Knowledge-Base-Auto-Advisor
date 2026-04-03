"use client";

import React from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  Upload,
  Cpu,
  MessageSquare,
  Lightbulb,
  Play,
  ArrowRight,
  CheckCircle,
  HardDrive,
  Slack,
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Upload your documents",
    description:
      "Drag and drop PDFs, Word documents, Excel sheets, or policy files directly into AdvisorAI. Supports bulk upload up to 2,000 documents on the Growth plan. Connect Google Drive or Dropbox for automatic sync.",
    callout: "Supports PDF, DOCX, XLSX, TXT, and more",
    color: "text-violet-500",
    borderColor: "border-violet-500/30",
    bg: "bg-violet-500/10",
    glow: "shadow-violet-500/20",
  },
  {
    number: "02",
    icon: Cpu,
    title: "AI processes & indexes",
    description:
      "Our pipeline splits every document into semantic chunks, generates vector embeddings using SentenceTransformers, and stores everything in a private pgvector namespace. Processing takes seconds, not hours.",
    callout: "Average processing time: 8 seconds per document",
    color: "text-cyan-500",
    borderColor: "border-cyan-500/30",
    bg: "bg-cyan-500/10",
    glow: "shadow-cyan-500/20",
  },
  {
    number: "03",
    icon: MessageSquare,
    title: "Ask questions naturally",
    description:
      "Type any question in plain English, French, or Swahili. AdvisorAI retrieves the most relevant document chunks using vector similarity search, then passes them to Groq Llama 3.3 for a grounded, cited answer.",
    callout: "Answers include source citations so you can verify",
    color: "text-emerald-500",
    borderColor: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
    glow: "shadow-emerald-500/20",
  },
  {
    number: "04",
    icon: Lightbulb,
    title: "Get actionable insights",
    description:
      "Beyond answers, AdvisorAI surfaces compliance gaps, upcoming deadlines, and risk flags automatically. Your analytics dashboard tracks trends over time and generates audit-ready reports with one click.",
    callout: "Export compliance reports in PDF or Excel",
    color: "text-amber-500",
    borderColor: "border-amber-500/30",
    bg: "bg-amber-500/10",
    glow: "shadow-amber-500/20",
  },
];

const integrations = [
  {
    icon: HardDrive,
    name: "Google Drive",
    desc: "Auto-sync documents from your Drive folders",
    color: "text-blue-500",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    icon: HardDrive,
    name: "Dropbox",
    desc: "Connect your Dropbox Business account",
    color: "text-sky-500",
    bg: "bg-sky-500/10 border-sky-500/20",
  },
  {
    icon: Slack,
    name: "Slack",
    desc: "Receive deadline alerts and AI answers in Slack",
    color: "text-rose-500",
    bg: "bg-rose-500/10 border-rose-500/20",
  },
];

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <Navbar />

      {/* Hero */}
      <section className="pt-36 pb-24 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-violet-500 mb-4">
            How it works
          </span>
          <h1 className="text-5xl md:text-6xl font-black text-[var(--fg)] mb-6 leading-tight">
            From upload to insight{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-cyan-500">
              in minutes
            </span>
          </h1>
          <p className="text-[var(--fg-soft)] text-lg leading-relaxed max-w-2xl mx-auto">
            No complex setup, no IT team required. AdvisorAI takes your existing
            documents and turns them into an always-on AI knowledge base in four
            simple steps.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto space-y-8">
          {steps.map(({ number, icon: Icon, title, description, callout, color, borderColor, bg, glow }, idx) => (
            <div
              key={number}
              className={`group relative flex flex-col md:flex-row gap-8 p-8 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border)] hover:border-violet-500/30 hover:shadow-2xl hover:${glow} transition-all duration-300`}
            >
              {/* Number */}
              <div className="flex-shrink-0 flex md:flex-col items-center md:items-start gap-4 md:gap-0">
                <span
                  className={`text-7xl font-black leading-none ${color} opacity-20 group-hover:opacity-40 transition-opacity duration-300 select-none`}
                >
                  {number}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl border flex items-center justify-center ${bg} ${borderColor} group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon size={22} className={color} />
                  </div>
                  <h3 className="text-[var(--fg)] font-black text-xl">{title}</h3>
                </div>
                <p className="text-[var(--fg-muted)] leading-relaxed mb-5">
                  {description}
                </p>
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold ${bg} ${borderColor} ${color}`}
                >
                  <CheckCircle size={14} />
                  {callout}
                </div>
              </div>

              {/* Connector line */}
              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute -bottom-4 left-[3.5rem] w-0.5 h-8 bg-gradient-to-b from-[var(--border)] to-transparent" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Video / Demo Placeholder */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-black text-[var(--fg)] mb-3 tracking-tight">
            See it in action
          </h2>
          <p className="text-[var(--fg-muted)] mb-10">
            Watch how a legal firm went from manual compliance checking to instant
            AI answers in under 10 minutes.
          </p>
          <div className="relative rounded-3xl bg-[var(--bg-soft)] border border-[var(--border)] overflow-hidden aspect-video flex items-center justify-center group cursor-pointer hover:border-violet-500/30 transition-colors duration-300">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/10" />
            {/* Fake thumbnail content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="grid grid-cols-3 gap-2 w-3/4 h-1/2 opacity-20">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="rounded-lg bg-[var(--fg-muted)]" />
                ))}
              </div>
            </div>
            {/* Play button */}
            <div className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-violet-500/40 group-hover:scale-110 transition-transform duration-300">
              <Play size={32} className="text-white ml-1" fill="white" />
            </div>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[var(--fg-muted)] text-sm font-medium">
              Demo video — 4 min walkthrough
            </div>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-24 px-6 bg-[var(--bg-soft)] border-t border-[var(--border)]">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-black text-[var(--fg)] mb-3 tracking-tight">
            Connects with your existing tools
          </h2>
          <p className="text-[var(--fg-muted)] mb-12">
            Bring your documents from wherever they live. No migration required.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {integrations.map(({ icon: Icon, name, desc, color, bg }) => (
              <div
                key={name}
                className="group p-7 rounded-2xl bg-[var(--bg)] border border-[var(--border)] hover:border-violet-500/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-5 mx-auto ${bg} group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon size={26} className={color} />
                </div>
                <h3 className="text-[var(--fg)] font-bold text-lg mb-2">{name}</h3>
                <p className="text-[var(--fg-muted)] text-sm">{desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-[var(--fg-muted)] text-sm">
            More integrations coming soon — REST API available for custom
            connections.{" "}
            <Link href="/webhooks" className="text-violet-500 hover:underline font-medium">
              View webhooks docs
            </Link>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/5 to-transparent pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-4xl font-black text-[var(--fg)] mb-4 tracking-tight">
            Start your knowledge base today
          </h2>
          <p className="text-[var(--fg-muted)] mb-10 text-lg">
            Free forever. No credit card. Upload your first document in minutes.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-10 py-5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-black text-lg hover:from-violet-500 hover:to-purple-500 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/30 hover:-translate-y-1"
          >
            Get started for free <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
