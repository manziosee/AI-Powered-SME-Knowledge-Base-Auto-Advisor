"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  href?: string;
}

export default function Button({
  variant = "primary",
  size = "md",
  children,
  className,
  href,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium tracking-tight transition-all duration-200 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    primary:
      "bg-white text-black hover:bg-ash-soft active:scale-95",
    secondary:
      "bg-ink-muted text-white border border-white/10 hover:border-white/25 hover:bg-white/5 active:scale-95",
    ghost:
      "text-white/70 hover:text-white hover:bg-white/5 active:scale-95",
    outline:
      "border border-white/20 text-white hover:border-white/50 hover:bg-white/5 active:scale-95",
  };

  const sizes = {
    sm:  "px-4 py-2 text-sm",
    md:  "px-6 py-2.5 text-sm",
    lg:  "px-8 py-3.5 text-base",
  };

  const classes = cn(base, variants[variant], sizes[size], className);

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
