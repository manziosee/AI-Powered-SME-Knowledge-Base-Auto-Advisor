import React from "react";
import Logo from "@/components/ui/Logo";
import { Github, Twitter, Linkedin } from "lucide-react";

const links = {
  Product: [
    { label: "Features",    href: "#features"     },
    { label: "How it works",href: "#how-it-works"  },
    { label: "Use cases",   href: "#use-cases"     },
    { label: "Pricing",     href: "#pricing"       },
    { label: "Changelog",   href: "/changelog"     },
  ],
  Resources: [
    { label: "Documentation", href: "/docs"        },
    { label: "API Reference",  href: "/docs/api"   },
    { label: "Blog",           href: "/blog"       },
    { label: "Status",         href: "/status"     },
  ],
  Company: [
    { label: "About",      href: "/about"         },
    { label: "Careers",    href: "/careers"       },
    { label: "Contact",    href: "/contact"       },
    { label: "Privacy",    href: "/privacy"       },
    { label: "Terms",      href: "/terms"         },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-white/8 pt-16 pb-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Top row */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-14">
          {/* Brand */}
          <div className="md:col-span-2">
            <Logo size="md" className="mb-5" />
            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              AI-powered knowledge base and compliance advisor for small and
              medium enterprises. Built for Africa and the world.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-3 mt-6">
              {[
                { icon: Github,   href: "https://github.com/manziosee/AI-Powered-SME-Knowledge-Base-Auto-Advisor", label: "GitHub"   },
                { icon: Twitter,  href: "#",  label: "Twitter"  },
                { icon: Linkedin, href: "#",  label: "LinkedIn" },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="text-white/60 text-xs font-semibold tracking-[0.2em] uppercase mb-4">
                {category}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-white/35 text-sm hover:text-white/70 transition-colors"
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/8">
          <p className="text-white/20 text-xs">
            © {new Date().getFullYear()} AdvisorAI. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="/privacy" className="text-white/20 text-xs hover:text-white/50 transition-colors">
              Privacy Policy
            </a>
            <a href="/terms"   className="text-white/20 text-xs hover:text-white/50 transition-colors">
              Terms of Service
            </a>
            <span className="text-white/10 text-xs">
              Built with FastAPI + Next.js
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
