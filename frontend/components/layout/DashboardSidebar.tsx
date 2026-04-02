"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, MessageSquare, BarChart3,
  ShieldCheck, Bell, Settings, Building2, LogOut,
  ChevronLeft, ChevronRight, Sun, Moon, HelpCircle, Brain, Calendar, Search, Clock,
  ShieldAlert,
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { notifications as notifApi } from "@/lib/api";

const NAV = [
  { label: "Dashboard",     href: "/dashboard",               icon: LayoutDashboard },
  { label: "Documents",     href: "/dashboard/documents",     icon: FileText        },
  { label: "AI Advisor",    href: "/dashboard/advisor",       icon: MessageSquare   },
  { label: "Analytics",     href: "/dashboard/analytics",     icon: BarChart3       },
  { label: "Compliance",    href: "/dashboard/compliance",    icon: ShieldCheck     },
  { label: "Expiry Alerts", href: "/dashboard/expiry",        icon: Clock           },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell            },
  { label: "Company",       href: "/dashboard/company",       icon: Building2       },
  { label: "AI Training",   href: "/dashboard/training",      icon: Brain           },
  { label: "Calendar",      href: "/dashboard/calendar",      icon: Calendar        },
];

const BOTTOM_NAV = [
  { label: "Settings",      href: "/dashboard/settings",      icon: Settings   },
  { label: "Help & Support", href: "/dashboard/help",         icon: HelpCircle },
];

interface DashboardSidebarProps {
  onSearchOpen?: () => void;
}

export default function DashboardSidebar({ onSearchOpen }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; avatar: string; company: string; role?: string } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem("auth_user");
    if (stored) setUser(JSON.parse(stored));
    notifApi.unreadCount().then(({ data }) => {
      if (data) setUnreadCount(data.unread_count);
    });
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
        {!collapsed && <Logo size="sm" href="/dashboard" />}
        {collapsed  && <Logo size="sm" showText={false} href="/dashboard" />}
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
          <p className="px-3 text-[8px] font-semibold uppercase tracking-[0.18em] text-[var(--fg-muted)] mb-1.5">
            Main menu
          </p>
        )}

        {/* Search button */}
        <button
          type="button"
          onClick={onSearchOpen}
          title={collapsed ? "Search (⌘K)" : undefined}
          className={cn(
            "flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-sm transition-all duration-300 group w-full mb-1",
            "text-[var(--fg-soft)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] hover:scale-[1.02] hover:shadow-md",
            collapsed && "justify-center px-2"
          )}
        >
          <Search size={16} className="flex-shrink-0 group-hover:text-violet-500 transition-colors" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left text-sm">Search</span>
              <kbd className="text-[10px] font-mono text-[var(--fg-muted)] bg-[var(--surface)] border border-[var(--border)] px-1.5 py-0.5 rounded">⌘K</kbd>
            </>
          )}
        </button>

        {/* Admin Panel link — only for admin/super_admin */}
        {(user?.role === "admin" || user?.role === "super_admin") && (
          <Link
            href="/dashboard/admin"
            title={collapsed ? "Admin Panel" : undefined}
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-sm transition-all duration-300 group relative overflow-hidden mb-1",
              pathname.startsWith("/dashboard/admin")
                ? "bg-gradient-to-r from-rose-500/15 to-pink-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/25 font-medium shadow-lg shadow-rose-500/10"
                : "text-[var(--fg-soft)] hover:text-[var(--fg)] hover:bg-rose-500/8 hover:scale-[1.02] hover:shadow-md",
              collapsed && "justify-center px-2"
            )}
          >
            <ShieldAlert size={16} className={cn(
              "flex-shrink-0 transition-all duration-300",
              pathname.startsWith("/dashboard/admin") ? "text-rose-600 dark:text-rose-300 scale-110" : "group-hover:scale-110 group-hover:text-rose-500"
            )} />
            {!collapsed && <span className="flex-1 truncate text-sm">Admin Panel</span>}
          </Link>
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
                  : "text-[var(--fg-soft)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] hover:scale-[1.02] hover:shadow-md",
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
          <p className="px-3 text-[8px] font-semibold uppercase tracking-[0.18em] text-[var(--fg-muted)] mb-1.5">
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
                  : "text-[var(--fg-soft)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] hover:scale-[1.02] hover:shadow-md",
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
            "flex items-center gap-2 px-2.5 py-2.5 rounded-xl text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] transition-all duration-300 text-xs w-full overflow-hidden group hover:scale-[1.02] hover:shadow-md",
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
              <p className="text-[var(--fg-soft)] text-xs font-semibold truncate group-hover:text-[var(--fg)] transition-colors">{user.name}</p>
              <p className="text-[var(--fg-muted)] text-[10px] truncate group-hover:text-[var(--fg-soft)] transition-colors">{user.company}</p>
            </div>
            <Link
              href="/login"
              onClick={() => localStorage.removeItem("auth_user")}
              className="text-[var(--fg-muted)] hover:text-rose-500 transition-all duration-300 flex-shrink-0 hover:scale-110 hover:rotate-12"
              title="Sign out"
            >
              <LogOut size={13} />
            </Link>
          </div>
        ) : collapsed ? (
          <Link
            href="/login"
            onClick={() => localStorage.removeItem("auth_user")}
            className="p-2 text-[var(--fg-muted)] hover:text-rose-500 transition-all duration-300 hover:scale-110 hover:rotate-12"
            title="Sign out"
          >
            <LogOut size={15} />
          </Link>
        ) : null}
      </div>
    </aside>
  );
}
