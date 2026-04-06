"use client";

import React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "cyan" | "dark" | "blue" | "teal" | "glass" | "rose";
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
  href?: string;
  glow?: boolean;
}

export default function Button({
  variant = "primary",
  size = "md",
  glow = true,
  children,
  className,
  href,
  ...props
}: ButtonProps) {
  const base =
    "group relative inline-flex items-center justify-center gap-2 font-bold tracking-wide rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 disabled:opacity-50 disabled:pointer-events-none overflow-hidden shine-hover active:scale-[0.97] transition-all duration-300";

  const variants = {
    primary: cn(
      "bg-gradient-to-r from-violet-600 via-purple-600 to-violet-700 text-white",
      "hover:from-violet-500 hover:via-purple-500 hover:to-violet-600",
      "hover:-translate-y-0.5",
      glow && "btn-glow-violet"
    ),
    secondary: cn(
      "bg-[var(--surface)] text-[var(--fg)] border border-[var(--border)]",
      "hover:bg-[var(--surface-hover)] hover:border-violet-500/30 hover:-translate-y-0.5",
      "shadow-sm hover:shadow-md"
    ),
    ghost:
      "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)]",
    outline: cn(
      "border-2 border-violet-500/40 text-violet-600 dark:text-violet-400",
      "hover:border-violet-500/80 hover:bg-violet-500/8 hover:-translate-y-0.5",
      "shadow-[0_0_0_0_rgba(124,58,237,0)] hover:shadow-[0_0_20px_rgba(124,58,237,0.2)]"
    ),
    cyan: cn(
      "bg-gradient-to-r from-cyan-500 to-teal-500 text-white",
      "hover:from-cyan-400 hover:to-teal-400 hover:-translate-y-0.5",
      glow && "btn-glow-cyan"
    ),
    blue: cn(
      "bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white",
      "hover:from-blue-500 hover:via-blue-400 hover:to-indigo-500 hover:-translate-y-0.5",
      glow && "btn-glow-blue"
    ),
    teal: cn(
      "bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-600 text-white",
      "hover:from-teal-500 hover:via-teal-400 hover:to-cyan-500 hover:-translate-y-0.5",
      glow && "btn-glow-teal"
    ),
    glass: cn(
      "bg-white/10 backdrop-blur-xl border border-white/20 text-white",
      "hover:bg-white/18 hover:border-white/35 hover:-translate-y-0.5",
      "shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
    ),
    rose: cn(
      "bg-gradient-to-r from-rose-600 to-pink-600 text-white",
      "hover:from-rose-500 hover:to-pink-500 hover:-translate-y-0.5",
      glow && "btn-glow-rose"
    ),
    dark: cn(
      "bg-[#0f0f14] text-white border border-white/10",
      "hover:bg-[#1a1a24] hover:border-white/20 hover:-translate-y-0.5",
      "shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
    ),
  };

  const sizes = {
    sm:  "px-5 py-2 text-xs font-semibold",
    md:  "px-7 py-2.5 text-sm",
    lg:  "px-9 py-3.5 text-sm",
    xl:  "px-11 py-4 text-base font-black tracking-wider",
  };

  const classes = cn(base, variants[variant], sizes[size], className);

  const inner = (
    <>
      {/* Shimmer overlay */}
      <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/14 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
      {/* Top highlight */}
      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
      {/* Bottom depth */}
      <span className="absolute inset-x-0 bottom-0 h-px bg-black/20" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {inner}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {inner}
    </button>
  );
}
