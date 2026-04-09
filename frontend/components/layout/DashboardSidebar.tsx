"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, MessageSquare, BarChart3,
  ShieldCheck, Bell, Settings, Building2, LogOut,
  ChevronLeft, ChevronRight, Sun, Moon, HelpCircle, Brain, Calendar, Search, Clock,
  ShieldAlert, Sparkles, Users,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { notifications as notifApi, auth as authApi } from "@/lib/api";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  permission?: string;       // required permission key
  companyOnly?: boolean;     // hide for individual accounts
  adminOnly?: boolean;       // handled separately
}

const NAV: NavItem[] = [
  { label: "Dashboard",     href: "/dashboard",               icon: LayoutDashboard },
  { label: "Documents",     href: "/dashboard/documents",     icon: FileText,        permission: "can_view_documents" },
  { label: "AI Advisor",    href: "/dashboard/advisor",       icon: MessageSquare   },
  { label: "Analytics",     href: "/dashboard/analytics",     icon: BarChart3,       permission: "can_view_analytics" },
  { label: "Compliance",    href: "/dashboard/compliance",    icon: ShieldCheck,     permission: "can_view_compliance" },
  { label: "Expiry Alerts", href: "/dashboard/expiry",        icon: Clock,           permission: "can_receive_alerts" },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell            },
  { label: "Team",          href: "/dashboard/settings/team", icon: Users,          companyOnly: true },
  { label: "Company",       href: "/dashboard/company",       icon: Building2,       companyOnly: true },
  { label: "AI Training",   href: "/dashboard/training",      icon: Brain,           permission: "can_view_ai_training" },
  { label: "Calendar",      href: "/dashboard/calendar",      icon: Calendar        },
];

const BOTTOM_NAV = [
  { label: "Settings",       href: "/dashboard/settings", icon: Settings   },
  { label: "Help & Support", href: "/dashboard/help",     icon: HelpCircle },
];

interface StoredUser {
  name: string; email: string; avatar: string; company: string;
  role?: string; account_type?: string; permissions?: string[];
}

interface DashboardSidebarProps {
  onSearchOpen?: () => void;
}

export default function DashboardSidebar({ onSearchOpen }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dark = theme === "dark";

  useEffect(() => {
    const stored = localStorage.getItem("auth_user");
    if (stored) {
      const u: StoredUser = JSON.parse(stored);
      setUser(u);
      // Use stored permissions first for instant render
      setPermissions(u.permissions ?? []);
    }

    // Always re-fetch from server to get latest permissions
    authApi.me().then(({ data }) => {
      if (data) {
        const perms = data.permissions ?? [];
        setPermissions(perms);
        // Update stored user with fresh permissions
        const stored2 = localStorage.getItem("auth_user");
        if (stored2) {
          const u2 = JSON.parse(stored2);
          localStorage.setItem("auth_user", JSON.stringify({ ...u2, permissions: perms, role: data.role, account_type: data.account_type }));
          setUser((prev) => prev ? { ...prev, permissions: perms, role: data.role, account_type: data.account_type } : prev);
        }
      }
    });

    notifApi.unreadCount().then(({ data }) => {
      if (data) setUnreadCount(data.unread_count);
    });
  }, []);

  const isIndividual = user?.account_type === "individual";
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const canSee = (item: NavItem): boolean => {
    if (item.companyOnly && isIndividual) return false;
    if (!item.permission) return true;
    // Admins always see everything
    if (isAdmin) return true;
    return permissions.includes(item.permission);
  };

  const visibleNav = NAV.filter(canSee);

  return (
    <aside className={cn(
      "hidden md:flex flex-col h-screen sticky top-0 transition-all duration-300 z-30",
      dark
        ? "sidebar-glass"
        : "bg-white border-r border-gray-100 shadow-sm",
      collapsed ? "w-[64px]" : "w-[230px]"
    )}>

      {dark && (
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
      )}

      {/* Logo header */}
      <div className={cn(
        "flex items-center h-16 px-3 flex-shrink-0",
        dark ? "border-b border-white/5" : "border-b border-gray-100",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-[0_0_16px_rgba(124,58,237,0.4)]">
              <Sparkles size={14} className="text-white" />
            </div>
            <span className={cn("font-black text-sm tracking-tight", dark ? "text-white" : "text-gray-900")}>
              AdvisorAI
            </span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-[0_0_16px_rgba(124,58,237,0.4)]">
            <Sparkles size={14} className="text-white" />
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "p-1.5 rounded-lg transition-all flex-shrink-0",
            dark
              ? "text-white/30 hover:text-white/70 hover:bg-white/8"
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
            collapsed && "absolute -right-3 top-5 w-6 h-6 rounded-full border shadow-md flex items-center justify-center p-0",
            collapsed && (dark ? "bg-[#0a0e23] border-white/10" : "bg-white border-gray-200")
          )}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5 overflow-y-auto scrollbar-thin">

        {!collapsed && (
          <p className={cn(
            "px-3 text-[9px] font-bold uppercase tracking-[0.2em] mb-2 mt-1",
            dark ? "text-white/20" : "text-gray-400"
          )}>
            Main menu
          </p>
        )}

        {/* Search button */}
        <button
          type="button"
          onClick={onSearchOpen}
          title={collapsed ? "Search (⌘K)" : undefined}
          className={cn(
            "flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm transition-all duration-200 group w-full mb-1",
            dark
              ? "text-white/40 hover:text-white/80 hover:bg-white/6"
              : "text-gray-500 hover:text-gray-800 hover:bg-gray-100",
            collapsed && "justify-center px-2"
          )}
        >
          <Search size={15} className={cn("flex-shrink-0 transition-colors", dark ? "group-hover:text-violet-400" : "group-hover:text-violet-600")} />
          {!collapsed && (
            <>
              <span className="flex-1 text-left text-xs">Search</span>
              <kbd className={cn(
                "text-[9px] font-mono px-1.5 py-0.5 rounded border",
                dark ? "text-white/20 bg-white/5 border-white/8" : "text-gray-400 bg-gray-100 border-gray-200"
              )}>⌘K</kbd>
            </>
          )}
        </button>

        {/* Admin Panel — only for admin/super_admin */}
        {isAdmin && (
          <Link
            href="/dashboard/admin"
            title={collapsed ? "Admin Panel" : undefined}
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs transition-all duration-200 group relative mb-1 sidebar-item",
              pathname.startsWith("/dashboard/admin")
                ? dark
                  ? "bg-rose-500/15 text-rose-300 border border-rose-500/25"
                  : "bg-rose-50 text-rose-600 border border-rose-200"
                : dark
                  ? "text-white/40 hover:text-white/80 hover:bg-white/6"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-100",
              collapsed && "justify-center px-2"
            )}
          >
            <ShieldAlert size={15} className={cn(
              "flex-shrink-0 transition-all",
              pathname.startsWith("/dashboard/admin")
                ? "text-rose-400"
                : dark ? "group-hover:text-rose-400" : "group-hover:text-rose-500"
            )} />
            {!collapsed && <span className="flex-1 truncate font-medium">Admin Panel</span>}
          </Link>
        )}

        {visibleNav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          const badge  = label === "Notifications" && unreadCount > 0 ? unreadCount : null;

          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs transition-all duration-200 group relative sidebar-item",
                active
                  ? dark
                    ? "nav-active text-violet-300 font-semibold"
                    : "bg-violet-50 text-violet-700 border border-violet-200 font-semibold"
                  : dark
                    ? "text-white/40 hover:text-white/80 hover:bg-white/6"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-100",
                collapsed && "justify-center px-2"
              )}
            >
              {active && !collapsed && (
                <div className={cn(
                  "absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full",
                  dark ? "bg-violet-400" : "bg-violet-600"
                )} />
              )}

              <Icon size={15} className={cn(
                "flex-shrink-0 transition-all duration-200",
                active
                  ? dark ? "text-violet-400" : "text-violet-600"
                  : dark ? "group-hover:text-violet-400" : "group-hover:text-violet-600"
              )} />

              {!collapsed && <span className="flex-1 truncate">{label}</span>}

              {!collapsed && badge && (
                <span className="ml-auto flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[9px] font-bold shadow-[0_0_8px_rgba(225,29,72,0.5)]">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
              {collapsed && badge && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(225,29,72,0.6)]" />
              )}
            </Link>
          );
        })}

        <div className={cn("my-2 mx-2 h-px", dark ? "bg-white/5" : "bg-gray-100")} />

        {!collapsed && (
          <p className={cn(
            "px-3 text-[9px] font-bold uppercase tracking-[0.2em] mb-2",
            dark ? "text-white/20" : "text-gray-400"
          )}>
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
                "flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs transition-all duration-200 group relative sidebar-item",
                active
                  ? dark
                    ? "nav-active text-violet-300 font-semibold"
                    : "bg-violet-50 text-violet-700 border border-violet-200 font-semibold"
                  : dark
                    ? "text-white/40 hover:text-white/80 hover:bg-white/6"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-100",
                collapsed && "justify-center px-2"
              )}
            >
              {active && !collapsed && (
                <div className={cn(
                  "absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full",
                  dark ? "bg-violet-400" : "bg-violet-600"
                )} />
              )}
              <Icon size={15} className={cn(
                "flex-shrink-0 transition-all duration-200",
                active
                  ? dark ? "text-violet-400" : "text-violet-600"
                  : dark ? "group-hover:text-violet-400" : "group-hover:text-violet-600"
              )} />
              {!collapsed && <span className="flex-1 truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={cn(
        "p-2 flex flex-col gap-1 flex-shrink-0",
        dark ? "border-t border-white/5" : "border-t border-gray-100",
        collapsed && "items-center"
      )}>

        <button
          type="button"
          onClick={toggle}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className={cn(
            "flex items-center gap-2 px-2.5 py-2 rounded-xl transition-all duration-200 text-xs w-full group",
            dark
              ? "text-white/30 hover:text-white/70 hover:bg-white/6"
              : "text-gray-400 hover:text-gray-700 hover:bg-gray-100",
            collapsed && "justify-center px-2"
          )}
        >
          {theme === "dark" ? (
            <Sun size={14} className="flex-shrink-0 group-hover:rotate-180 transition-transform duration-500" />
          ) : (
            <Moon size={14} className="flex-shrink-0 group-hover:rotate-12 transition-transform duration-500" />
          )}
          {!collapsed && <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>}
        </button>

        {user && !collapsed ? (
          <div className={cn(
            "flex items-center gap-2.5 px-2 py-2 rounded-xl transition-all duration-200 group",
            dark ? "hover:bg-white/5" : "hover:bg-gray-50"
          )}>
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0",
              dark
                ? "bg-gradient-to-br from-violet-500/30 to-blue-500/20 border border-violet-500/30 text-violet-300"
                : "bg-gradient-to-br from-violet-100 to-blue-100 border border-violet-200 text-violet-700"
            )}>
              {user.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn("text-xs font-semibold truncate", dark ? "text-white/70" : "text-gray-700")}>{user.name}</p>
              <p className={cn("text-[10px] truncate", dark ? "text-white/25" : "text-gray-400")}>
                {isIndividual ? "Personal account" : user.company}
              </p>
            </div>
            <Link
              href="/login"
              onClick={() => { localStorage.removeItem("auth_user"); localStorage.removeItem("access_token"); localStorage.removeItem("refresh_token"); }}
              className={cn(
                "flex-shrink-0 transition-all duration-200 hover:scale-110",
                dark ? "text-white/20 hover:text-rose-400" : "text-gray-300 hover:text-rose-500"
              )}
              title="Sign out"
            >
              <LogOut size={13} />
            </Link>
          </div>
        ) : collapsed ? (
          <Link
            href="/login"
            onClick={() => { localStorage.removeItem("auth_user"); localStorage.removeItem("access_token"); localStorage.removeItem("refresh_token"); }}
            className={cn(
              "p-2 transition-all duration-200 hover:scale-110",
              dark ? "text-white/20 hover:text-rose-400" : "text-gray-300 hover:text-rose-500"
            )}
            title="Sign out"
          >
            <LogOut size={15} />
          </Link>
        ) : null}
      </div>
    </aside>
  );
}
