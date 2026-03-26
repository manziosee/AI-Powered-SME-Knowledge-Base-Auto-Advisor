import React from "react";
import Logo from "@/components/ui/Logo";
import { Github, Twitter, Linkedin } from "lucide-react";

const links = {
  Product: [
    { label: "Features",     href: "/#features"    },
    { label: "How it works", href: "/#how-it-works" },
    { label: "Use cases",    href: "/#use-cases"    },
    { label: "Pricing",      href: "/#pricing"      },
    { label: "Changelog",    href: "/changelog"     },
  ],
  Developers: [
    { label: "Documentation",  href: "/docs"             },
    { label: "API Reference",  href: "/docs#auth"        },
    { label: "Quick Start",    href: "/docs#quickstart"  },
    { label: "Webhooks",       href: "/docs#webhooks"    },
    { label: "SDKs & Examples",href: "/docs"             },
  ],
  Company: [
    { label: "About us",        href: "/about"   },
    { label: "Contact",         href: "/contact" },
    { label: "Privacy Policy",  href: "/privacy" },
    { label: "Terms of Service",href: "/terms"   },
  ],
};

const socials = [
  { icon: Github,   href: "https://github.com/manziosee/AI-Powered-SME-Knowledge-Base-Auto-Advisor", label: "GitHub"   },
  { icon: Twitter,  href: "https://twitter.com/advisorai",                                            label: "Twitter"  },
  { icon: Linkedin, href: "https://linkedin.com/company/advisorai",                                   label: "LinkedIn" },
];

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] pt-16 pb-8 px-6 bg-[var(--bg-soft)]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-10 mb-14">

          {/* Brand */}
          <div className="md:col-span-3">
            <Logo size="md" href="/" className="mb-5" />
            <p className="text-[var(--fg-muted)] text-sm leading-relaxed max-w-xs">
              AI-powered knowledge base and compliance advisor for small and
              medium enterprises. Built for Africa and the world.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-3 mt-6">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center text-[var(--fg-muted)] hover:text-violet-500 hover:border-violet-500/40 hover:bg-violet-500/5 transition-all duration-200 hover:-translate-y-1"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-2 mt-5">
              {["GDPR Ready", "SOC 2", "TLS 1.3", "AES-256"].map((b) => (
                <span key={b} className="px-2.5 py-1 rounded-full border border-[var(--border)] text-[var(--fg-muted)] text-xs font-mono">
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="text-[var(--fg)] text-xs font-bold tracking-[0.15em] uppercase mb-5">
                {category}
              </h4>
              <ul className="flex flex-col gap-3">
                {items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="link-slide text-[var(--fg-muted)] text-sm hover:text-violet-500 transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[var(--border)]">
          <p className="text-[var(--fg-muted)] text-xs">
            © {new Date().getFullYear()} AdvisorAI Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <a href="/privacy" className="link-slide text-[var(--fg-muted)] text-xs hover:text-violet-500 transition-colors">
              Privacy Policy
            </a>
            <a href="/terms" className="link-slide text-[var(--fg-muted)] text-xs hover:text-violet-500 transition-colors">
              Terms of Service
            </a>
            <span className="text-[var(--fg-muted)] text-xs opacity-50">FastAPI + Next.js</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
