"use client";

import React, { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import Logo from "@/components/ui/Logo";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Features",     href: "#features"     },
  { label: "How it works", href: "#how-it-works"  },
  { label: "Use Cases",    href: "#use-cases"     },
  { label: "Pricing",      href: "#pricing"       },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open,     setOpen]     = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4">
      <div
        className={cn(
          "w-full max-w-5xl transition-all duration-300 rounded-2xl",
          scrolled
            ? "bg-ink/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50"
            : "bg-white/4 backdrop-blur-md border border-white/8"
        )}
      >
        <nav className="flex items-center justify-between px-5 py-3">
          {/* Logo */}
          <Logo size="sm" />

          {/* Desktop links */}
          <ul className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors rounded-xl hover:bg-white/5"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" href="/login">
              Sign in
            </Button>
            <Button variant="primary" size="sm" href="/register">
              Get started free
            </Button>
          </div>

          {/* Mobile burger */}
          <button
            className="md:hidden p-2 text-white/60 hover:text-white"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-white/8 px-5 py-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-4 py-2.5 text-sm text-white/70 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <hr className="border-white/8 my-1" />
            <Button variant="outline" size="sm" href="/login" className="justify-center">
              Sign in
            </Button>
            <Button variant="primary" size="sm" href="/register" className="justify-center">
              Get started free
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
