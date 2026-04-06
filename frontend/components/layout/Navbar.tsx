"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Menu,
  X,
  Sun,
  Moon,
  ArrowRight,
  ChevronDown,
  Book,
  Code2,
  Zap,
  Radio,
  Package,
  Users,
  Mail,
  Shield,
  FileText,
  Sparkles,
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

/* ─────────────────────────────── Types ───────────────────────────────────── */

interface NavItem {
  label: string;
  href: string;
  icon?: React.ElementType;
  desc?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

/* ─────────────────────────────── Data ────────────────────────────────────── */

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Product",
    items: [
      { label: "Features",     href: "/features",      icon: Sparkles,  desc: "Everything the platform can do" },
      { label: "How it works", href: "/how-it-works",  desc: "Step-by-step walkthrough" },
      { label: "Use Cases",    href: "/use-cases",     desc: "Real-world scenarios for SMEs" },
      { label: "Pricing",      href: "/pricing",       desc: "Plans that scale with you" },
      { label: "Changelog",    href: "/changelog",     desc: "Latest updates & releases" },
    ],
  },
  {
    label: "Developers",
    items: [
      { label: "Documentation",  href: "/docs",           icon: Book,     desc: "Full technical reference" },
      { label: "API Reference",  href: "/api-reference",  icon: Code2,    desc: "REST endpoints & schemas" },
      { label: "Quick Start",    href: "/quick-start",    icon: Zap,      desc: "Up and running in minutes" },
      { label: "Webhooks",       href: "/webhooks",       icon: Radio,    desc: "Real-time event streams" },
      { label: "SDKs & Examples", href: "/sdks",          icon: Package,  desc: "Client libraries & sample code" },
    ],
  },
  {
    label: "Company",
    items: [
      { label: "About Us",         href: "/about",    icon: Users,    desc: "Our mission & the team" },
      { label: "Contact",          href: "/contact",  icon: Mail,     desc: "Get in touch with us" },
      { label: "Privacy Policy",   href: "/privacy",  icon: Shield,   desc: "How we protect your data" },
      { label: "Terms of Service", href: "/terms",    icon: FileText, desc: "Usage terms & conditions" },
    ],
  },
];

/* ─────────────────────────────── Desktop Dropdown ────────────────────────── */

function DesktopDropdown({
  group,
  pathname,
  isOpen,
  onToggle,
  onClose,
}: {
  group: NavGroup;
  pathname: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  return (
    <div className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex items-center gap-1 px-3.5 py-2 text-sm font-medium rounded-xl transition-colors focus:outline-none",
          isOpen
            ? "text-[var(--fg)] bg-[var(--surface-hover)]"
            : "text-[var(--fg-soft)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)]"
        )}
      >
        {group.label}
        <ChevronDown
          size={14}
          className={cn(
            "mt-px text-[var(--fg-muted)] transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Panel */}
      <div
        className={cn(
          "absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 z-50",
          "transition-all duration-200 ease-out",
          isOpen
            ? "opacity-100 pointer-events-auto translate-y-0"
            : "opacity-0 pointer-events-none translate-y-1"
        )}
      >
        {/* Arrow notch */}
        <div className="relative left-1/2 -translate-x-1/2 mb-[-1px] w-3 h-3 rotate-45 bg-white dark:bg-[#1e1e1e] border-t border-l border-[var(--border)] dark:border-white/10 rounded-sm" />

        <div className="rounded-xl border border-[var(--border)] dark:border-white/10 bg-white dark:bg-[#1e1e1e] shadow-xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden">
          {group.items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 transition-colors",
                  active
                    ? "bg-violet-500/10 text-violet-500"
                    : "text-[var(--fg-soft)] dark:text-white/70 hover:bg-[var(--surface-hover)] dark:hover:bg-white/5 hover:text-[var(--fg)] dark:hover:text-white"
                )}
              >
                {Icon ? (
                  <span
                    className={cn(
                      "mt-0.5 flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center",
                      active
                        ? "bg-violet-500/15 text-violet-500"
                        : "bg-[var(--bg-soft)] dark:bg-white/8 text-[var(--fg-muted)] dark:text-white/50"
                    )}
                  >
                    <Icon size={14} />
                  </span>
                ) : (
                  <span className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-lg bg-[var(--bg-soft)] dark:bg-white/8 flex items-center justify-center">
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        active ? "bg-violet-500" : "bg-[var(--fg-muted)] dark:bg-white/30"
                      )}
                    />
                  </span>
                )}
                <span className="flex flex-col min-w-0">
                  <span
                    className={cn(
                      "text-sm font-medium leading-snug truncate",
                      active ? "text-violet-500" : "text-[var(--fg)] dark:text-white/90"
                    )}
                  >
                    {item.label}
                  </span>
                  {item.desc && (
                    <span className="text-xs text-[var(--fg-muted)] dark:text-white/40 leading-tight mt-0.5 line-clamp-1">
                      {item.desc}
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────── Mobile Section ──────────────────────────── */

function MobileSection({
  group,
  pathname,
  onClose,
}: {
  group: NavGroup;
  pathname: string;
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const anyActive = group.items.some((i) => pathname === i.href);

  return (
    <div className="border-b border-[var(--border-soft)] last:border-0">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-xl transition-colors",
          anyActive
            ? "text-violet-500"
            : "text-[var(--fg)] hover:bg-[var(--surface-hover)]"
        )}
      >
        {group.label}
        <ChevronDown
          size={15}
          className={cn(
            "text-[var(--fg-muted)] transition-transform duration-200",
            expanded && "rotate-180"
          )}
        />
      </button>

      {/* Accordion content */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-200 ease-out",
          expanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="pb-2 pl-2 flex flex-col gap-0.5">
          {group.items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors",
                  active
                    ? "bg-violet-500/10 text-violet-500 font-medium"
                    : "text-[var(--fg-soft)] dark:text-white/70 hover:text-[var(--fg)] dark:hover:text-white hover:bg-[var(--surface-hover)] dark:hover:bg-white/5"
                )}
              >
                {Icon ? (
                  <span
                    className={cn(
                      "flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center",
                      active
                        ? "bg-violet-500/15 text-violet-500"
                        : "bg-[var(--bg-soft)] dark:bg-white/8 text-[var(--fg-muted)] dark:text-white/50"
                    )}
                  >
                    <Icon size={13} />
                  </span>
                ) : (
                  <span className="flex-shrink-0 w-6 h-6 rounded-md bg-[var(--bg-soft)] dark:bg-white/8 flex items-center justify-center">
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        active ? "bg-violet-500" : "bg-[var(--fg-muted)] dark:bg-white/30"
                      )}
                    />
                  </span>
                )}
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────── Navbar ──────────────────────────────────── */

export default function Navbar() {
  const { theme, toggle } = useTheme();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  /* Scroll detection */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Close all dropdowns on route change */
  useEffect(() => {
    setMobileOpen(false);
    setOpenGroup(null);
  }, [pathname]);

  /* Close dropdown when clicking outside the navbar */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenGroup(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Lock body scroll when mobile menu is open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleGroupToggle = (label: string) => {
    setOpenGroup((prev) => (prev === label ? null : label));
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4">
      <div
        ref={navRef}
        className={cn(
          "w-full max-w-5xl rounded-2xl transition-all duration-300",
          scrolled
            ? "bg-[var(--bg-soft)]/90 backdrop-blur-xl border border-[var(--border)] shadow-lg"
            : "bg-[var(--surface)] backdrop-blur-md border border-[var(--border-soft)]"
        )}
      >
        <nav className="flex items-center justify-between px-5 py-3">
          {/* Logo */}
          <Logo size="sm" />

          {/* Desktop nav — dropdown groups */}
          <ul className="hidden md:flex items-center gap-0.5">
            {NAV_GROUPS.map((group) => (
              <li key={group.label}>
                <DesktopDropdown
                  group={group}
                  pathname={pathname}
                  isOpen={openGroup === group.label}
                  onToggle={() => handleGroupToggle(group.label)}
                  onClose={() => setOpenGroup(null)}
                />
              </li>
            ))}
          </ul>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-2">
            {/* Divider */}
            <span className="w-px h-5 bg-[var(--border)] mx-1" />

            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggle}
              aria-label="Toggle theme"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] transition-all"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Log In */}
            <Link
              href="/login"
              className="px-5 py-2 rounded-full text-sm font-semibold text-violet-600 dark:text-violet-300 border border-violet-500/40 hover:border-violet-500/70 hover:bg-violet-500/8 transition-all duration-200 active:scale-95"
            >
              Log In
            </Link>

            {/* Get Started */}
            <Link
              href="/register"
              className="group relative inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 hover:from-blue-500 hover:via-violet-500 hover:to-purple-500 text-white text-sm font-bold tracking-wide transition-all duration-200 shadow-[0_4px_20px_rgba(37,99,235,0.4)] hover:shadow-[0_6px_28px_rgba(37,99,235,0.6)] hover:-translate-y-0.5 active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              <span className="relative z-10">Get Started</span>
              <ArrowRight
                size={14}
                className="relative z-10 group-hover:translate-x-0.5 transition-transform"
              />
            </Link>
          </div>

          {/* Mobile controls */}
          <div className="md:hidden flex items-center gap-1">
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
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] transition-all"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </nav>

        {/* Mobile menu — accordion */}
        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300 ease-out",
            mobileOpen ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="border-t border-[var(--border)] px-3 py-3 flex flex-col overflow-y-auto max-h-[75vh]">
            {/* Accordion sections */}
            {NAV_GROUPS.map((group) => (
              <MobileSection
                key={group.label}
                group={group}
                pathname={pathname}
                onClose={() => setMobileOpen(false)}
              />
            ))}

            {/* CTA buttons */}
            <div className="pt-3 mt-1 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="w-full py-2.5 rounded-xl border border-violet-500/35 text-center text-sm font-semibold text-violet-600 dark:text-violet-300 hover:bg-violet-500/8 transition-all"
              >
                Log In
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 text-white text-center text-sm font-bold shadow-[0_4px_16px_rgba(37,99,235,0.4)] hover:from-blue-500 hover:via-violet-500 hover:to-purple-500 transition-all flex items-center justify-center gap-2 relative overflow-hidden"
              >
                <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                <span className="relative z-10">Get Started</span>
                <ArrowRight size={14} className="relative z-10" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
