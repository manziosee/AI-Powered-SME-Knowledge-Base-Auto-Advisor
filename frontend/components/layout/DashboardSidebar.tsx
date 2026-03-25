"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, MessageSquare, BarChart3,
  ShieldCheck, Bell, Settings, Building2, LogOut,
  ChevronLeft, ChevronRight, Sun, Moon,
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { NOTIFICATIONS } from "@/lib/mock-data";

const NAV = [
  { label: "Dashboard",     href: "/dashboard",               icon: LayoutDashboard },
  { label: "Documents",     href: "/dashboard/documents",     icon: FileText        },
  { label: "AI Advisor",    href: "/dashboard/advisor",       icon: MessageSquare   },
  { label: "Analytics",     href: "/dashboard/analytics",     icon: BarChart3       },
  { label: "Compliance",    href: "/dashboard/compliance",    icon: ShieldCheck     },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell            },
  { label: "Company",       href: "/dashboard/company",       icon: Building2       },
  { label: "Settings",      href: "/dashboard/settings",      icon: Settings        },
];

const unreadCount = NOTIFICATIONS.filter((n) => !n.read).length;

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; avatar: string; company: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("auth_user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  return (
    <aside className={cn(
      "hidden md:flex flex-col h-screen sticky top-0 border-r transition-all duration-300",
      "bg-[var(--bg-soft)] border-[var(--border)]",
      collapsed ? "w-16" : "w-60"
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center px-4 h-16 border-b border-[var(--border)]",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && <Logo size="sm" />}
        {collapsed && <Logo size="sm" showText={false} />}
        <button type="button" onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] transition-all">
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          const badge  = label === "Notifications" && unreadCount > 0 ? unreadCount : null;

          return (
            <Link key={href} href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group relative",
                active
                  ? "bg-violet-500/15 text-violet-600 dark:text-violet-300 border border-violet-500/25 font-medium"
                  : "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)]",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? label : undefined}
            >
              <Icon size={17} className="flex-shrink-0" />
              {!collapsed && <span className="flex-1 truncate">{label}</span>}
              {!collapsed && badge && (
                <span className="ml-auto flex items-center justify-center w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold shadow-[0_0_6px_rgba(225,29,72,0.5)]">
                  {badge}
                </span>
              )}
              {collapsed && badge && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_4px_rgba(225,29,72,0.5)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Theme toggle + User */}
      <div className={cn("p-3 border-t border-[var(--border)] flex flex-col gap-2", collapsed && "items-center")}>
        {/* Theme toggle button */}
        <button type="button" onClick={toggle}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] transition-all text-xs",
            collapsed && "px-2 justify-center"
          )}>
          {theme === "dark"
            ? <><Sun size={14} className="flex-shrink-0" />{!collapsed && <span>Light mode</span>}</>
            : <><Moon size={14} className="flex-shrink-0" />{!collapsed && <span>Dark mode</span>}</>
          }
        </button>

        {/* User profile */}
        {user && !collapsed ? (
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-[var(--surface-hover)] transition-all group">
            <div className="w-8 h-8 rounded-full bg-violet-500/15 border border-violet-500/25 flex items-center justify-center text-violet-600 dark:text-violet-300 font-bold text-xs flex-shrink-0">
              {user.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[var(--fg-soft)] text-xs font-medium truncate">{user.name}</p>
              <p className="text-[var(--fg-muted)] text-[10px] truncate">{user.company}</p>
            </div>
            <Link href="/login" onClick={() => localStorage.removeItem("auth_user")}
              className="text-[var(--fg-muted)] hover:text-rose-500 transition-colors" title="Sign out">
              <LogOut size={14} />
            </Link>
          </div>
        ) : (
          <Link href="/login" onClick={() => localStorage.removeItem("auth_user")}
            className="p-2 text-[var(--fg-muted)] hover:text-rose-500 transition-colors" title="Sign out">
            <LogOut size={16} />
          </Link>
        )}
      </div>
    </aside>
  );
}
