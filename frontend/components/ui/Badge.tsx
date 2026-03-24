import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export default function Badge({ children, className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
        "bg-white/8 border border-white/12 text-white/70",
        className
      )}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse-slow" />
      )}
      {children}
    </span>
  );
}
