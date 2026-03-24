"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, MessageSquare, BarChart3,
  ShieldCheck, Bell, Settings, Building2, LogOut, ChevronLeft, ChevronRight,
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { NOTIFICATIONS } from "@/lib/mock-data";

const NAV = [
  { label: "Dashboard",    href: "/dashboard",               icon: LayoutDashboard },
  { label: "Documents",    href: "/dashboard/documents",     icon: FileText        },
  { label: "AI Advisor",   href: "/dashboard/advisor",       icon: MessageSquare   },
  { label: "Analytics",    href: "/dashboard/analytics",     icon: BarChart3       },
  { label: "Compliance",   href: "/dashboard/compliance",    icon: ShieldCheck     },
  { label: "Notifications",href: "/dashboard/notifications", icon: Bell            },
  { label: "Company",      href: "/dashboard/company",       icon: Building2       },
  { label: "Settings",     href: "/dashboard/settings",      icon: Settings        },
];

const unreadCount = NOTIFICATIONS.filter((n) => !n.read).length;

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; avatar: string; company: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("auth_user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen sticky top-0 bg-ink-soft border-r border-white/8 transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Header */}
      <div className={cn("flex items-center px-4 h-16 border-b border-white/8", collapsed ? "justify-center" : "justify-between")}>
        {!collapsed && <Logo size="sm" />}
        {collapsed && <Logo size="sm" showText={false} />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          const badge = label === "Notifications" && unreadCount > 0 ? unreadCount : null;

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group",
                active
                  ? "bg-violet-500/15 text-violet-300 border border-violet-500/25 font-medium"
                  : "text-white/50 hover:text-white hover:bg-white/5",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? label : undefined}
            >
              <Icon size={17} className="flex-shrink-0" />
              {!collapsed && (
                <span className="flex-1 truncate">{label}</span>
              )}
              {!collapsed && badge && (
                <span className="ml-auto flex items-center justify-center w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold shadow-[0_0_6px_#e11d48]">
                  {badge}
                </span>
              )}
              {collapsed && badge && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_4px_#e11d48]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User profile */}
      <div className={cn("p-3 border-t border-white/8", collapsed && "flex justify-center")}>
        {user && !collapsed ? (
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-all group">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 font-bold text-xs flex-shrink-0">
              {user.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white/80 text-xs font-medium truncate">{user.name}</p>
              <p className="text-white/30 text-[10px] truncate">{user.company}</p>
            </div>
            <Link href="/login" className="text-white/20 hover:text-white/60 transition-colors">
              <LogOut size={14} />
            </Link>
          </div>
        ) : (
          <Link href="/login" className="p-2 text-white/30 hover:text-white transition-colors" title="Sign out">
            <LogOut size={16} />
          </Link>
        )}
      </div>
    </aside>
  );
}
