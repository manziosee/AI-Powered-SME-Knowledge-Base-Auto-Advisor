import React from "react";

const companies = [
  { name: "TechVentures RW",  flag: "🇷🇼" },
  { name: "RetailPro Africa", flag: "🌍" },
  { name: "FinServe Kenya",   flag: "🇰🇪" },
  { name: "BuildRight Co.",   flag: "🇳🇬" },
  { name: "AgriSmarts",       flag: "🇿🇦" },
  { name: "MedCare Clinics",  flag: "🇷🇼" },
  { name: "LegalEase",        flag: "🌍" },
  { name: "EduPath Africa",   flag: "🇰🇪" },
  { name: "GreenLogistics",   flag: "🇳🇬" },
  { name: "CloudFirst",       flag: "🇫🇷" },
  { name: "Horizon Consult",  flag: "🇺🇸" },
  { name: "Savanna Group",    flag: "🇿🇦" },
];

export default function LogoTicker() {
  return (
    <section className="py-16 border-y border-[var(--border)] overflow-hidden bg-[var(--bg-soft)]">
      <p className="text-center text-[var(--fg-muted)] text-xs tracking-[0.2em] uppercase mb-8 font-medium">
        Trusted by growing businesses across Africa &amp; beyond
      </p>

      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[var(--bg-soft)] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[var(--bg-soft)] to-transparent z-10 pointer-events-none" />

        <div className="flex animate-marquee whitespace-nowrap">
          {[...companies, ...companies].map((c, i) => (
            <div
              key={i}
              className="mx-8 flex items-center gap-2.5 text-[var(--fg-muted)] hover:text-violet-500 transition-colors duration-200 cursor-default"
            >
              <span className="text-base leading-none">{c.flag}</span>
              <span className="w-px h-3.5 bg-[var(--border)]" />
              <span className="text-sm font-medium tracking-wide">{c.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
