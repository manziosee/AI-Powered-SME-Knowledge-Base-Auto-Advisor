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
      "relative overflow-hidden bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white hover:shadow-[0_10px_40px_rgba(124,58,237,0.4)] hover:shadow-[0_15px_50px_rgba(124,58,237,0.6)] hover:-translate-y-0.5 active:scale-95 transition-all duration-300",
    secondary:
      "bg-gradient-to-r from-white/10 to-white/5 text-white border border-white/20 hover:border-white/40 hover:bg-white/10 hover:shadow-lg hover:shadow-white/10 active:scale-95 transition-all duration-300",
    ghost:
      "text-white/70 hover:text-white hover:bg-white/10 hover:shadow-lg hover:shadow-white/5 active:scale-95 transition-all duration-300",
    outline:
      "relative overflow-hidden border-2 border-violet-500/30 text-violet-400 hover:border-violet-500/60 hover:bg-violet-500/10 hover:shadow-lg hover:shadow-violet-500/20 hover:-translate-y-0.5 active:scale-95 transition-all duration-300",
  };

  const sizes = {
    sm:  "px-4 py-2 text-sm font-semibold",
    md:  "px-6 py-2.5 text-sm font-bold",
    lg:  "px-8 py-3.5 text-base font-black",
  };

  const classes = cn(base, variants[variant], sizes[size], className);

  const buttonContent = (
    <>
      {(variant === 'primary' || variant === 'outline') && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </>
  );

  if (href) {
    return (
      <a href={href} className={classes}>
        {buttonContent}
      </a>
    );
  }

  return (
    <button className={classes} {...props}>
      {buttonContent}
    </button>
  );
}
