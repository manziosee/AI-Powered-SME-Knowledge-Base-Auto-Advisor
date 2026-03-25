import React from "react";
import { clsx } from "clsx";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "light" | "dark";
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: { icon: 28, text: "text-base" },
  md: { icon: 36, text: "text-xl"   },
  lg: { icon: 48, text: "text-2xl"  },
  xl: { icon: 64, text: "text-4xl"  },
};

export default function Logo({
  size = "md",
  variant = "light",
  showText = true,
  className,
}: LogoProps) {
  const { icon, text } = sizes[size];
  
  // Use CSS variables for theme-aware colors instead of useTheme hook
  return (
    <div className={clsx("flex items-center gap-2.5", className)}>
      {/* SVG Icon Mark */}
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="AdvisorAI Logo"
        className="text-[var(--fg)]"
      >
        {/* Outer ring */}
        <circle cx="24" cy="24" r="23" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3" />

        {/* Brain / neural node cluster */}
        <circle cx="24" cy="24" r="4" fill="currentColor" />

        {/* Connection nodes */}
        <circle cx="24" cy="10" r="2.5" fill="currentColor" fillOpacity="0.9" />
        <circle cx="37" cy="17" r="2.5" fill="currentColor" fillOpacity="0.9" />
        <circle cx="37" cy="31" r="2.5" fill="currentColor" fillOpacity="0.9" />
        <circle cx="24" cy="38" r="2.5" fill="currentColor" fillOpacity="0.9" />
        <circle cx="11" cy="31" r="2.5" fill="currentColor" fillOpacity="0.9" />
        <circle cx="11" cy="17" r="2.5" fill="currentColor" fillOpacity="0.9" />

        {/* Connection lines (spokes) */}
        <line x1="24" y1="20" x2="24" y2="12.5" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.6" />
        <line x1="27.5" y1="21.5" x2="34.7" y2="18.8" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.6" />
        <line x1="27.5" y1="26.5" x2="34.7" y2="29.2" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.6" />
        <line x1="24" y1="28" x2="24" y2="35.5" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.6" />
        <line x1="20.5" y1="26.5" x2="13.3" y2="29.2" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.6" />
        <line x1="20.5" y1="21.5" x2="13.3" y2="18.8" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.6" />

        {/* Small secondary connections */}
        <line x1="24" y1="10" x2="37" y2="17" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.2" />
        <line x1="37" y1="17" x2="37" y2="31" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.2" />
        <line x1="37" y1="31" x2="24" y2="38" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.2" />
        <line x1="24" y1="38" x2="11" y2="31" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.2" />
        <line x1="11" y1="31" x2="11" y2="17" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.2" />
        <line x1="11" y1="17" x2="24" y2="10" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.2" />
      </svg>

      {showText && (
        <div className={clsx("flex flex-col leading-none", "text-[var(--fg)]")}>
          <span className={clsx("font-bold tracking-tight", text)}>
            Advisor<span className="text-[var(--fg-muted)]">AI</span>
          </span>
          {size !== "sm" && (
            <span className="text-[10px] tracking-[0.2em] uppercase opacity-50 mt-0.5">
              for SMEs
            </span>
          )}
        </div>
      )}
    </div>
  );
}
