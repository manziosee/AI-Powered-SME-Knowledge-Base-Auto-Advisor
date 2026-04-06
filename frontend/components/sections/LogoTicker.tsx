import React from "react";

const companies = [
  { name: "TechVentures RW",  flag: "🇷🇼", color: "hover:text-violet-500" },
  { name: "RetailPro Africa", flag: "🌍",   color: "hover:text-cyan-500"   },
  { name: "FinServe Kenya",   flag: "🇰🇪", color: "hover:text-emerald-500" },
  { name: "BuildRight Co.",   flag: "🇳🇬", color: "hover:text-amber-500"   },
  { name: "AgriSmarts",       flag: "🇿🇦", color: "hover:text-rose-500"    },
  { name: "MedCare Clinics",  flag: "🇷🇼", color: "hover:text-violet-500"  },
  { name: "LegalEase",        flag: "🌍",   color: "hover:text-cyan-500"    },
  { name: "EduPath Africa",   flag: "🇰🇪", color: "hover:text-emerald-500" },
  { name: "GreenLogistics",   flag: "🇳🇬", color: "hover:text-amber-500"   },
  { name: "CloudFirst",       flag: "🇫🇷", color: "hover:text-blue-500"    },
  { name: "Horizon Consult",  flag: "🇺🇸", color: "hover:text-indigo-500"  },
  { name: "Savanna Group",    flag: "🇿🇦", color: "hover:text-teal-500"    },
];

export default function LogoTicker() {
  return (
    <section className="relative py-14 overflow-hidden border-y border-[var(--border)] bg-[var(--bg-soft)]">
      {/* Top/bottom gradient lines */}
      <div className="absolute top-0 inset-x-0 section-line" />
      <div className="absolute bottom-0 inset-x-0 section-line" />

      {/* Label */}
      <p className="text-center text-[var(--fg-muted)] text-[11px] tracking-[0.25em] uppercase mb-8 font-semibold">
        Trusted by growing businesses across{" "}
        <span className="gradient-text font-bold">Africa &amp; beyond</span>
      </p>

      {/* Scrolling strip */}
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-[var(--bg-soft)] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-[var(--bg-soft)] to-transparent z-10 pointer-events-none" />

        <div className="animate-marquee">
          {[...companies, ...companies].map((c, i) => (
            <div
              key={i}
              className={`mx-10 flex items-center gap-3 text-[var(--fg-muted)] ${c.color} transition-all duration-300 cursor-default group`}
            >
              {/* Logo placeholder pill */}
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full border border-[var(--border)] bg-[var(--surface)] group-hover:border-violet-500/25 group-hover:bg-[var(--surface-hover)] transition-all duration-300 shadow-sm">
                <span className="text-base leading-none">{c.flag}</span>
                <span className="w-px h-3.5 bg-[var(--border)]" />
                <span className="text-xs font-semibold tracking-wide whitespace-nowrap">{c.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats bar below ticker */}
      <div className="max-w-3xl mx-auto mt-10 grid grid-cols-3 gap-4 px-6">
        {[
          { val: "500+",  label: "Companies", color: "text-violet-500"  },
          { val: "7",     label: "Countries",  color: "text-cyan-500"    },
          { val: "99.9%", label: "Uptime SLA", color: "text-emerald-500" },
        ].map(({ val, label, color }) => (
          <div key={label} className="text-center">
            <p className={`text-2xl font-black ${color}`}>{val}</p>
            <p className="text-[var(--fg-muted)] text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
