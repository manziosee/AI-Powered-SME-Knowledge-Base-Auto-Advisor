"use client";

import React, { useState, useEffect } from "react";
import { Menu, X, Sun, Moon } from "lucide-react";
import Logo from "@/components/ui/Logo";
import Button from "@/components/ui/Button";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Features",     href: "#features"     },
  { label: "How it works", href: "#how-it-works"  },
  { label: "Use Cases",    href: "#use-cases"     },
  { label: "Pricing",      href: "#pricing"       },
];

export default function Navbar() {
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [open,     setOpen]     = useState(false);

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
                <a href={link.href}
                  className="px-4 py-2 text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors rounded-xl hover:bg-[var(--surface-hover)]">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Desktop CTA + theme toggle */}
          <div className="hidden md:flex items-center gap-2">
            <button type="button" onClick={toggle} aria-label="Toggle theme"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] transition-all">
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Button variant="ghost" size="sm" href="/login">Sign in</Button>
            <Button variant="primary" size="sm" href="/register">Get started free</Button>
          </div>

          {/* Mobile controls */}
          <div className="md:hidden flex items-center gap-2">
            <button type="button" onClick={toggle} aria-label="Toggle theme"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--fg-muted)] hover:bg-[var(--surface-hover)] transition-all">
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button type="button" onClick={() => setOpen(!open)} aria-label="Toggle menu"
              className="p-2 text-[var(--fg-muted)] hover:text-[var(--fg)]">
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-[var(--border)] px-5 py-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href}
                className="px-4 py-2.5 text-sm text-[var(--fg-soft)] hover:text-[var(--fg)] rounded-xl hover:bg-[var(--surface-hover)] transition-colors"
                onClick={() => setOpen(false)}>
                {link.label}
              </a>
            ))}
            <hr className="border-[var(--border)] my-1" />
            <Button variant="outline" size="sm" href="/login" className="justify-center">Sign in</Button>
            <Button variant="primary" size="sm" href="/register" className="justify-center">Get started free</Button>
          </div>
        )}
      </div>
    </div>
  );
}
