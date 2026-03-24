"use client";

import React from "react";
import { ArrowRight, Sparkles, Shield, Brain } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-ink pt-20">

      {/* Background: dot grid */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Radial glow top-center */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-white/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Subtle bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-ink to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center flex flex-col items-center gap-8">

        {/* Top badge */}
        <div className="animate-fade-up" style={{ animationDelay: "0ms" }}>
          <Badge dot className="gap-2">
            <Sparkles size={11} />
            Powered by Groq · LangChain · pgvector
          </Badge>
        </div>

        {/* Headline */}
        <div className="animate-fade-up" style={{ animationDelay: "80ms" }}>
          <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight text-balance">
            <span className="text-white">Your Business,</span>
            <br />
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage: "linear-gradient(135deg, #ffffff 0%, #888888 60%, #ffffff 100%)",
              }}
            >
              Always Compliant.
            </span>
            <br />
            <span className="text-white">Always Advised.</span>
          </h1>
        </div>

        {/* Sub-headline */}
        <div className="animate-fade-up" style={{ animationDelay: "160ms" }}>
          <p className="text-lg md:text-xl text-white/55 max-w-2xl leading-relaxed text-balance">
            AI-powered knowledge base and auto-advisor for small and medium
            enterprises. Upload your documents, ask questions in plain language,
            and stay ahead of compliance deadlines — automatically.
          </p>
        </div>

        {/* CTA buttons */}
        <div
          className="flex flex-col sm:flex-row items-center gap-3 animate-fade-up"
          style={{ animationDelay: "240ms" }}
        >
          <Button variant="primary" size="lg" href="/register">
            Start for free
            <ArrowRight size={16} />
          </Button>
          <Button variant="secondary" size="lg" href="#how-it-works">
            See how it works
          </Button>
        </div>

        {/* Trust signals row */}
        <div
          className="flex flex-wrap justify-center items-center gap-6 text-white/35 text-xs tracking-wide animate-fade-up"
          style={{ animationDelay: "320ms" }}
        >
          {[
            { icon: Shield,  label: "SOC 2 ready"         },
            { icon: Brain,   label: "LangChain RAG"        },
            { icon: Sparkles,label: "Groq Llama 3.1 70B"  },
          ].map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-1.5">
              <Icon size={13} className="text-white/40" />
              {label}
            </span>
          ))}
          <span className="hidden sm:block text-white/15">•</span>
          <span>No credit card required</span>
          <span className="hidden sm:block text-white/15">•</span>
          <span>Deploy in minutes</span>
        </div>

        {/* Dashboard mockup */}
        <div
          className="w-full max-w-4xl mt-4 animate-fade-up"
          style={{ animationDelay: "400ms" }}
        >
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60">
            {/* Top bar */}
            <div className="flex items-center gap-2 px-4 py-3 bg-ink-muted border-b border-white/8">
              <span className="w-3 h-3 rounded-full bg-white/15" />
              <span className="w-3 h-3 rounded-full bg-white/10" />
              <span className="w-3 h-3 rounded-full bg-white/8"  />
              <span className="ml-4 flex-1 h-5 rounded-full bg-white/5 max-w-xs" />
            </div>

            {/* Fake dashboard body */}
            <div className="bg-ink-soft p-6 min-h-[320px] grid grid-cols-12 gap-4">
              {/* Sidebar */}
              <div className="col-span-2 flex flex-col gap-3">
                {[60, 80, 55, 70, 45].map((w, i) => (
                  <div
                    key={i}
                    className="h-5 rounded-md bg-white/5"
                    style={{ width: `${w}%` }}
                  />
                ))}
              </div>

              {/* Main content */}
              <div className="col-span-10 flex flex-col gap-4">
                {/* Stat cards row */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Documents",   val: "1,248", color: "from-white/8 to-white/4" },
                    { label: "Compliance",  val: "94%",   color: "from-white/8 to-white/4" },
                    { label: "Risks Found", val: "3",     color: "from-white/8 to-white/4" },
                    { label: "AI Queries",  val: "876",   color: "from-white/8 to-white/4" },
                  ].map((card) => (
                    <div
                      key={card.label}
                      className={`rounded-xl p-3 bg-gradient-to-br ${card.color} border border-white/8`}
                    >
                      <div className="h-2.5 w-16 rounded bg-white/20 mb-2" />
                      <div className="text-white/80 text-lg font-bold">{card.val}</div>
                      <div className="text-white/30 text-xs mt-0.5">{card.label}</div>
                    </div>
                  ))}
                </div>

                {/* Chat area */}
                <div className="flex-1 rounded-xl border border-white/8 bg-white/3 p-4 flex flex-col gap-3 min-h-[160px]">
                  {/* User message */}
                  <div className="flex justify-end">
                    <div className="bg-white/10 text-white/70 text-xs px-3 py-2 rounded-2xl rounded-tr-sm max-w-xs">
                      What are our compliance deadlines for Q2?
                    </div>
                  </div>
                  {/* AI response */}
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Brain size={12} className="text-white/50" />
                    </div>
                    <div className="bg-white/5 text-white/60 text-xs px-3 py-2 rounded-2xl rounded-tl-sm max-w-sm">
                      Based on your documents, you have 3 upcoming deadlines:
                      <br />• VAT return — April 15
                      <br />• PAYE filing — April 30
                      <br />• License renewal — May 1
                    </div>
                  </div>
                  {/* Typing indicator */}
                  <div className="flex gap-1 ml-8">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse-slow"
                        style={{ animationDelay: `${i * 200}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Glow under mockup */}
          <div className="h-px w-2/3 mx-auto bg-gradient-to-r from-transparent via-white/20 to-transparent mt-0" />
        </div>
      </div>
    </section>
  );
}
