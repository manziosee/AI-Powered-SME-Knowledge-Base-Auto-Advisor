import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";

export default function CTA() {
  return (
    <section className="py-28 px-6 relative overflow-hidden">
      {/* Large glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[400px] bg-white/5 rounded-full blur-[120px]" />
      </div>

      {/* Rotating ring decoration */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/4 pointer-events-none" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-white/6 pointer-events-none" />

      <div className="relative max-w-3xl mx-auto text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-white/8 border border-white/15 flex items-center justify-center">
            <Sparkles size={24} className="text-white/70" />
          </div>
        </div>

        <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight text-white mb-6">
          Your documents are
          <br />
          <span
            className="text-transparent bg-clip-text"
            style={{
              backgroundImage: "linear-gradient(135deg, #fff 0%, #777 100%)",
            }}
          >
            waiting to be useful.
          </span>
        </h2>

        <p className="text-white/45 text-xl mb-10 max-w-xl mx-auto leading-relaxed">
          Stop searching. Stop missing deadlines. Start asking.
          Get your first answer in under 2 minutes — free, no credit card.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Button variant="primary" size="lg" href="/register">
            Start for free
            <ArrowRight size={16} />
          </Button>
          <Button variant="secondary" size="lg" href="/demo">
            Request a demo
          </Button>
        </div>

        {/* Bottom footnote */}
        <p className="mt-8 text-white/20 text-sm">
          Set up in &lt; 5 minutes · No code required · Cancel anytime
        </p>
      </div>
    </section>
  );
}
