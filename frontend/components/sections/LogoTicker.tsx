import React from "react";

const companies = [
  "TechVentures",
  "RetailPro",
  "FinServe Africa",
  "BuildRight Co.",
  "AgriSmarts",
  "MedCare Clinics",
  "LegalEase",
  "EduPath",
  "GreenLogistics",
  "CloudFirst",
];

export default function LogoTicker() {
  return (
    <section className="py-16 border-y border-white/8 overflow-hidden">
      <p className="text-center text-white/30 text-xs tracking-[0.2em] uppercase mb-8">
        Trusted by growing businesses across Africa &amp; beyond
      </p>

      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-ink to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-ink to-transparent z-10 pointer-events-none" />

        <div className="flex animate-marquee whitespace-nowrap">
          {[...companies, ...companies].map((name, i) => (
            <div
              key={i}
              className="mx-10 flex items-center gap-2 text-white/25 hover:text-white/50 transition-colors"
            >
              {/* Mini logo dot */}
              <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
              <span className="text-sm font-medium tracking-wide">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
