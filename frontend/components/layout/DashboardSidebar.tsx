"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, MessageSquare, BarChart3,
  ShieldCheck, Bell, Settings, Building2, LogOut,
  ChevronLeft, ChevronRight, Sun, Moon, HelpCircle,
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
];

const BOTTOM_NAV = [
  { label: "Settings",      href: "/dashboard/settings",      icon: Settings        },
  { label: "Help & support", href: "#",                        icon: HelpCircle      },
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
      collapsed ? "w-[60px]" : "w-[220px]"
    )}>

      {/* ── Logo header ── */}
      <div className={cn(
        "flex items-center h-14 border-b border-[var(--border)] px-3",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && <Logo size="sm" />}
        {collapsed  && <Logo size="sm" showText={false} />}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="p-1.5 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] transition-all flex-shrink-0"
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </div>

      {/* ── Main nav ── */}
      <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5 overflow-y-auto">

        {!collapsed && (
          <p className="px-3 text-[8px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-[var(--fg-muted)] mb-1.5">
            Main menu
          </p>
        )}

        {NAV.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          const badge  = label === "Notifications" && unreadCount > 0 ? unreadCount : null;

          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-sm transition-all duration-300 group relative overflow-hidden",
                active
                  ? "bg-gradient-to-r from-violet-500/15 to-purple-500/15 text-violet-600 dark:text-violet-300 border border-violet-500/25 font-medium shadow-lg shadow-violet-500/10"
                  : "text-gray-700 dark:text-[var(--fg-muted)] hover:text-gray-900 dark:hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] hover:scale-[1.02] hover:shadow-md",
                collapsed && "justify-center px-2"
              )}
            >
              {/* Animated background for active state */}
              {active && (
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-purple-500/10 animate-pulse" />
              )}
              
              <Icon size={16} className={cn(
                "flex-shrink-0 transition-all duration-300",
                active ? "text-violet-600 dark:text-violet-300 scale-110" : "group-hover:scale-110 group-hover:text-violet-500"
              )} />
              
              {!collapsed && (
                <span className={cn(
                  "flex-1 truncate text-sm transition-all duration-300",
                  active ? "font-semibold" : "group-hover:font-medium"
                )}>{label}</span>
              )}

              {/* Badge */}
              {!collapsed && badge && (
                <span className="ml-auto flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-bold shadow-[0_0_8px_rgba(225,29,72,0.6)] animate-pulse">
                  {badge}
                </span>
              )}
              {collapsed && badge && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 shadow-[0_0_6px_rgba(225,29,72,0.6)] animate-pulse" />
              )}
            </Link>
          );
        })}

        {/* Divider */}
        <div className="my-2 border-t border-[var(--border)]" />

        {!collapsed && (
          <p className="px-3 text-[8px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-[var(--fg-muted)] mb-1.5">
            General
          </p>
        )}

        {BOTTOM_NAV.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-sm transition-all duration-300 group relative overflow-hidden",
                active
                  ? "bg-gradient-to-r from-violet-500/15 to-purple-500/15 text-violet-600 dark:text-violet-300 border border-violet-500/25 font-medium shadow-lg shadow-violet-500/10"
                  : "text-gray-700 dark:text-[var(--fg-muted)] hover:text-gray-900 dark:hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] hover:scale-[1.02] hover:shadow-md",
                collapsed && "justify-center px-2"
              )}
            >
              {/* Animated background for active state */}
              {active && (
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-purple-500/10 animate-pulse" />
              )}
              
              <Icon size={16} className={cn(
                "flex-shrink-0 transition-all duration-300",
                active ? "text-violet-600 dark:text-violet-300 scale-110" : "group-hover:scale-110 group-hover:text-violet-500"
              )} />
              
              {!collapsed && (
                <span className={cn(
                  "flex-1 truncate text-sm transition-all duration-300",
                  active ? "font-semibold" : "group-hover:font-medium"
                )}>{label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer: theme + user ── */}
      <div className={cn("p-2 border-t border-[var(--border)] flex flex-col gap-1.5", collapsed && "items-center")}>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggle}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className={cn(
            "flex items-center gap-2 px-2.5 py-2.5 rounded-xl text-gray-600 dark:text-[var(--fg-muted)] hover:text-gray-900 dark:hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] transition-all duration-300 text-xs w-full overflow-hidden group hover:scale-[1.02] hover:shadow-md",
            collapsed && "justify-center px-2"
          )}
        >
          <div className="relative">
            {theme === "dark" ? (
              <Sun size={14} className="flex-shrink-0 group-hover:rotate-180 transition-transform duration-500" />
            ) : (
              <Moon size={14} className="flex-shrink-0 group-hover:rotate-12 transition-transform duration-500" />
            )}
          </div>
          {!collapsed && <span className="transition-colors duration-300">{theme === "dark" ? "Light mode" : "Dark mode"}</span>}
        </button>

        {/* User row */}
        {user && !collapsed ? (
          <div className="flex items-center gap-2.5 px-2 py-2.5 rounded-xl hover:bg-[var(--surface-hover)] transition-all duration-300 group hover:scale-[1.02] hover:shadow-md overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30 flex items-center justify-center text-violet-600 dark:text-violet-300 font-bold text-[10px] flex-shrink-0 group-hover:scale-110 transition-transform">
              {user.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-gray-700 dark:text-[var(--fg-soft)] text-xs font-semibold truncate group-hover:text-gray-900 dark:group-hover:text-[var(--fg)] transition-colors">{user.name}</p>
              <p className="text-gray-600 dark:text-[var(--fg-muted)] text-[10px] truncate group-hover:text-gray-800 dark:group-hover:text-[var(--fg-soft)] transition-colors">{user.company}</p>
            </div>
            <Link
              href="/login"
              onClick={() => localStorage.removeItem("auth_user")}
              className="text-gray-600 dark:text-[var(--fg-muted)] hover:text-rose-500 transition-all duration-300 flex-shrink-0 hover:scale-110 hover:rotate-12"
              title="Sign out"
            >
              <LogOut size={13} />
            </Link>
          </div>
        ) : collapsed ? (
          <Link
            href="/login"
            onClick={() => localStorage.removeItem("auth_user")}
            className="p-2 text-gray-600 dark:text-[var(--fg-muted)] hover:text-rose-500 transition-all duration-300 hover:scale-110 hover:rotate-12"
            title="Sign out"
          >
            <LogOut size={15} />
          </Link>
        ) : null}
      </div>
    </aside>
  );
}
