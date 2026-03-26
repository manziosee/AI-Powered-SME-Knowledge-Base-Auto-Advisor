"use client";

import React, { useState, useEffect } from "react";
import { Menu, X, Sun, Moon, ArrowRight } from "lucide-react";
import Logo from "@/components/ui/Logo";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_SECTIONS = [
  { label: "Features",     anchor: "features"     },
  { label: "How it works", anchor: "how-it-works"  },
  { label: "Use Cases",    anchor: "use-cases"     },
  { label: "Pricing",      anchor: "pricing"       },
];

export default function Navbar() {
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [open,     setOpen]     = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  // Build href: on home page use "#anchor", elsewhere use "/#anchor"
  const navLinks = NAV_SECTIONS.map(({ label, anchor }) => ({
    label,
    href: isHome ? `#${anchor}` : `/#${anchor}`,
  }));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4">
      <div className={cn(
        "w-full max-w-5xl rounded-2xl transition-all duration-300",
        scrolled
          ? "bg-[var(--bg-soft)]/90 backdrop-blur-xl border border-[var(--border)] shadow-lg"
          : "bg-[var(--surface)] backdrop-blur-md border border-[var(--border-soft)]"
      )}>
        <nav className="flex items-center justify-between px-5 py-3">
          <Logo size="sm" />

          {/* Desktop links */}
          <ul className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-[var(--fg-soft)] hover:text-[var(--fg)] transition-colors rounded-xl hover:bg-[var(--surface-hover)]"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-2">
            {/* Docs link */}
            <Link
              href="/docs"
              className="px-3 py-2 text-sm font-medium text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors rounded-xl hover:bg-[var(--surface-hover)] flex items-center gap-1.5"
            >
              <span>Docs</span>
            </Link>

            <button
              type="button"
              onClick={toggle}
              aria-label="Toggle theme"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] transition-all"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* LOG IN — styled outlined pill */}
            <Link
              href="/login"
              className="px-5 py-2 rounded-full text-sm font-semibold text-violet-600 dark:text-violet-300 border border-violet-500/40 hover:border-violet-500/70 hover:bg-violet-500/8 transition-all duration-200 active:scale-95"
            >
              Log In
            </Link>

            {/* SIGN UP — gradient pill with glow */}
            <Link
              href="/register"
              className="group relative inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-sm font-bold tracking-wide transition-all duration-200 shadow-[0_4px_20px_rgba(124,58,237,0.4)] hover:shadow-[0_6px_28px_rgba(124,58,237,0.6)] hover:-translate-y-0.5 active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative z-10">Get Started</span>
              <ArrowRight size={14} className="relative z-10 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Mobile controls */}
          <div className="md:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={toggle}
              aria-label="Toggle theme"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--fg-muted)] hover:bg-[var(--surface-hover)] transition-all"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              type="button"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
              className="p-2 text-[var(--fg-muted)] hover:text-[var(--fg)]"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-[var(--border)] px-5 py-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-4 py-2.5 text-sm text-[var(--fg-soft)] hover:text-[var(--fg)] rounded-xl hover:bg-[var(--surface-hover)] transition-colors"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/docs"
              className="px-4 py-2.5 text-sm text-[var(--fg-soft)] hover:text-[var(--fg)] rounded-xl hover:bg-[var(--surface-hover)] transition-colors"
              onClick={() => setOpen(false)}
            >
              API Docs
            </Link>
            <hr className="border-[var(--border)] my-1" />
            <Link
              href="/login"
              className="w-full py-2.5 rounded-xl border border-violet-500/35 text-center text-sm font-semibold text-violet-600 dark:text-violet-300 hover:bg-violet-500/8 transition-all"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-center text-sm font-bold shadow-[0_4px_16px_rgba(124,58,237,0.4)] hover:from-violet-500 hover:to-purple-500 transition-all"
            >
              Get Started Free
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
