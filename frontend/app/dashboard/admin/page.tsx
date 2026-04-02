"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Users, Building2, FileText, Brain, Shield, AlertTriangle, CheckCircle,
  RefreshCw, Plus, Trash2, UserCog, Activity, BarChart3, Clock, X,
  Mail, Lock, Eye, EyeOff, ChevronDown, Search, Globe,
} from "lucide-react";
import { auth as authApi, admin as adminApi } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SystemStats {
  companies: number;
  users: { total: number; active: number };
  documents: number;
  knowledge_entries: number;
}

interface AdminUser {
  id: string; email: string; full_name: string; role: string;
  company_id: string | null; is_active: boolean;
  created_at: string; last_login: string | null;
}

interface AdminCompany {
  id: string; name: string; country: string; industry?: string;
  is_active: boolean; user_count: number; document_count: number;
  created_at: string; health_score?: number;
}

interface HealthAlert {
  company_id: string; company_name: string;
  alert_type: string; severity: string; detail: string;
}

interface AuditLog {
  id: string; action: string; resource_type: string; resource_id?: string;
  user_email?: string; user_name?: string; details?: string;
  created_at: string; ip_address?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLES = ["employee", "manager", "admin", "super_admin"];

const TABS = [
  { key: "overview",   label: "Overview",   icon: BarChart3 },
  { key: "users",      label: "Users",      icon: Users     },
  { key: "companies",  label: "Companies",  icon: Building2 },
  { key: "audit",      label: "Audit Logs", icon: Activity  },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// ── Skeleton loader ───────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-xl bg-[var(--surface)] animate-pulse ${className}`} />
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, color, sub,
}: {
  label: string; value: string | number; icon: React.ElementType;
  color: string; sub?: string;
}) {
  return (
    <div className="flex flex-col gap-2 p-5 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border)] hover:border-violet-500/20 transition-all hover:shadow-md">
      <div className="flex items-center gap-2">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${color}`}>
          <Icon size={16} />
        </div>
        <span className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-3xl font-black text-[var(--fg)] leading-none">{value}</p>
      {sub && <p className="text-xs text-[var(--fg-muted)]">{sub}</p>}
    </div>
  );
}

// ── Role badge ────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    super_admin: "bg-violet-500/15 text-violet-500 border-violet-500/30",
    admin:       "bg-blue-500/15 text-blue-500 border-blue-500/30",
    manager:     "bg-cyan-500/15 text-cyan-500 border-cyan-500/30",
    employee:    "bg-[var(--surface)] text-[var(--fg-muted)] border-[var(--border)]",
  };
  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border capitalize ${styles[role] ?? styles.employee}`}>
      {role.replace("_", " ")}
    </span>
  );
}

// ── Severity badge ────────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    critical: "bg-rose-500/15 text-rose-500 border-rose-500/30",
    warning:  "bg-amber-500/15 text-amber-500 border-amber-500/30",
    info:     "bg-blue-500/15 text-blue-500 border-blue-500/30",
  };
  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border capitalize ${styles[severity] ?? styles.info}`}>
      {severity}
    </span>
  );
}

// ── Create User Modal ─────────────────────────────────────────────────────────

interface CreateUserModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function CreateUserModal({ onClose, onCreated }: CreateUserModalProps) {
  const [email,     setEmail]     = useState("");
  const [fullName,  setFullName]  = useState("");
  const [password,  setPassword]  = useState("");
  const [role,      setRole]      = useState("employee");
  const [companyId, setCompanyId] = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: apiErr } = await adminApi.createUser({
      email, full_name: fullName, password, role,
      ...(companyId ? { company_id: companyId } : {}),
    });
    if (apiErr) { setError(apiErr); setLoading(false); return; }
    onCreated();
    onClose();
  };

  const INPUT = "w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)] text-sm placeholder-[var(--fg-muted)] focus:outline-none focus:border-violet-500/50 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[420px] rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
              <UserCog size={15} className="text-violet-500" />
            </div>
            <h3 className="font-bold text-[var(--fg)] text-sm">Create New User</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] transition-all"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleCreate} className="p-6 flex flex-col gap-4">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/8 border border-rose-500/25 text-rose-500 text-xs">
              <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-[var(--fg-muted)] text-[10px] font-semibold mb-1.5 tracking-widest uppercase">
                Full Name
              </label>
              <div className="relative">
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe" required className={INPUT + " pl-9"} />
                <UserCog size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] pointer-events-none" />
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-[var(--fg-muted)] text-[10px] font-semibold mb-1.5 tracking-widest uppercase">
                Email
              </label>
              <div className="relative">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@company.com" required className={INPUT + " pl-9"} />
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] pointer-events-none" />
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-[var(--fg-muted)] text-[10px] font-semibold mb-1.5 tracking-widest uppercase">
                Password
              </label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters" required minLength={8} className={INPUT + " pl-9 pr-10"} />
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] pointer-events-none" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[var(--fg-muted)] text-[10px] font-semibold mb-1.5 tracking-widest uppercase">
                Role
              </label>
              <div className="relative">
                <select value={role} onChange={(e) => setRole(e.target.value)}
                  className={INPUT + " pr-8 appearance-none capitalize"}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r.replace("_", " ")}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[var(--fg-muted)] text-[10px] font-semibold mb-1.5 tracking-widest uppercase">
                Company ID (opt.)
              </label>
              <div className="relative">
                <input type="text" value={companyId} onChange={(e) => setCompanyId(e.target.value)}
                  placeholder="uuid…" className={INPUT + " pl-9"} />
                <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] text-sm font-semibold transition-all">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-sm font-bold transition-all disabled:opacity-50 shadow-[0_0_16px_rgba(124,58,237,0.3)]">
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating…</>
              ) : (
                <><Plus size={14} /> Create User</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [activeTab,   setActiveTab]  = useState<TabKey>("overview");
  const [isAdmin,     setIsAdmin]    = useState(false);
  const [roleChecked, setRoleChecked] = useState(false);

  const [stats,     setStats]    = useState<SystemStats | null>(null);
  const [users,     setUsers]    = useState<AdminUser[]>([]);
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [alerts,    setAlerts]   = useState<HealthAlert[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [loadingStats,   setLoadingStats]   = useState(true);
  const [loadingUsers,   setLoadingUsers]   = useState(true);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingAlerts,  setLoadingAlerts]  = useState(true);
  const [loadingAudit,   setLoadingAudit]   = useState(true);

  const [userSearch,   setUserSearch]   = useState("");
  const [showCreate,   setShowCreate]   = useState(false);
  const [auditRefreshKey, setAuditRefreshKey] = useState(0);

  // For role dropdowns per user row
  const [roleDropdownUser, setRoleDropdownUser] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close role dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setRoleDropdownUser(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Check admin role
  useEffect(() => {
    authApi.me().then(({ data }) => {
      const role = data?.role ?? "";
      const ok = role === "super_admin" || role === "admin";
      setIsAdmin(ok);
      setRoleChecked(true);
    });
  }, []);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    const { data } = await adminApi.systemStats();
    if (data) setStats(data);
    setLoadingStats(false);
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    const { data } = await adminApi.listUsers({ limit: 50 });
    if (data?.items) setUsers(data.items);
    setLoadingUsers(false);
  }, []);

  const fetchCompanies = useCallback(async () => {
    setLoadingCompanies(true);
    const { data } = await adminApi.listCompanies();
    if (data?.items) setCompanies(data.items);
    setLoadingCompanies(false);
  }, []);

  const fetchAlerts = useCallback(async () => {
    setLoadingAlerts(true);
    const { data } = await adminApi.healthAlerts();
    if (data?.alerts) setAlerts(data.alerts);
    setLoadingAlerts(false);
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    setLoadingAudit(true);
    const { data } = await adminApi.auditLogs({ limit: 20 });
    if (data?.items) setAuditLogs(data.items);
    setLoadingAudit(false);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    fetchStats();
    fetchUsers();
    fetchCompanies();
    fetchAlerts();
    fetchAuditLogs();
  }, [isAdmin, fetchStats, fetchUsers, fetchCompanies, fetchAlerts, fetchAuditLogs]);

  // Auto-refresh audit logs every 30s
  useEffect(() => {
    if (!isAdmin) return;
    const id = setInterval(() => {
      fetchAuditLogs();
      setAuditRefreshKey((k) => k + 1);
    }, 30_000);
    return () => clearInterval(id);
  }, [isAdmin, fetchAuditLogs]);

  // ── User actions ────────────────────────────────────────────────────────────

  const handleToggleStatus = async (user: AdminUser) => {
    const { error } = await adminApi.toggleUserStatus(user.id, !user.is_active);
    if (!error) fetchUsers();
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    setRoleDropdownUser(null);
    await adminApi.updateUserRole(userId, newRole);
    fetchUsers();
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (!confirm(`Delete user "${user.full_name}" (${user.email})? This cannot be undone.`)) return;
    await adminApi.deleteUser(user.id);
    fetchUsers();
  };

  // ── Access denied ───────────────────────────────────────────────────────────

  if (roleChecked && !isAdmin) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center">
            <Shield size={20} className="text-rose-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[var(--fg)] tracking-tight">Admin Panel</h1>
            <p className="text-[var(--fg-muted)] text-sm">System administration & oversight</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-24 gap-5 text-center rounded-2xl bg-[var(--bg-soft)] border border-[var(--border)]">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center">
            <Shield size={28} className="text-rose-500" />
          </div>
          <h2 className="text-[var(--fg)] font-bold text-xl">Access Denied</h2>
          <p className="text-[var(--fg-muted)] text-sm max-w-sm leading-relaxed">
            This area is restricted to administrators only. Contact your system administrator if you believe you should have access.
          </p>
        </div>
      </div>
    );
  }

  // ── Loading (role not checked yet) ─────────────────────────────────────────

  if (!roleChecked) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Skeleton className="w-10 h-10" />
          <div className="flex flex-col gap-2">
            <Skeleton className="w-40 h-5" />
            <Skeleton className="w-60 h-3.5" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  // ── Filtered users ──────────────────────────────────────────────────────────

  const filteredUsers = users.filter((u) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center">
            <Shield size={20} className="text-violet-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[var(--fg)] tracking-tight">Admin Panel</h1>
            <p className="text-[var(--fg-muted)] text-sm">System administration & oversight</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => { fetchStats(); fetchUsers(); fetchCompanies(); fetchAlerts(); fetchAuditLogs(); }}
          title="Refresh all data"
          className="p-2.5 rounded-xl border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] transition-all"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 mb-7 p-1 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border)] w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={[
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
              activeTab === key
                ? "bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-600 dark:text-violet-300 border border-violet-500/25 shadow-sm"
                : "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)]",
            ].join(" ")}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          OVERVIEW TAB
      ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="flex flex-col gap-6">

          {/* Stat cards */}
          {loadingStats ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Companies"
                value={stats?.companies ?? 0}
                icon={Building2}
                color="text-cyan-500 bg-cyan-500/10 border-cyan-500/25"
              />
              <StatCard
                label="Total Users"
                value={stats?.users.total ?? 0}
                icon={Users}
                color="text-violet-500 bg-violet-500/10 border-violet-500/25"
                sub={`${stats?.users.active ?? 0} active`}
              />
              <StatCard
                label="Documents"
                value={stats?.documents ?? 0}
                icon={FileText}
                color="text-blue-500 bg-blue-500/10 border-blue-500/25"
              />
              <StatCard
                label="Knowledge Entries"
                value={stats?.knowledge_entries ?? 0}
                icon={Brain}
                color="text-emerald-500 bg-emerald-500/10 border-emerald-500/25"
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Health Alerts */}
            <div className="lg:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)]">
                <h3 className="text-[var(--fg)] text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-500" /> Health Alerts
                </h3>
                <span className="text-[10px] text-[var(--fg-muted)] uppercase tracking-wide font-semibold">
                  {alerts.length} alert{alerts.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="p-4 flex flex-col gap-2.5 max-h-72 overflow-y-auto">
                {loadingAlerts ? (
                  [...Array(3)].map((_, i) => <Skeleton key={i} className="h-14" />)
                ) : alerts.length === 0 ? (
                  <div className="flex flex-col items-center py-8 gap-2 text-center">
                    <CheckCircle size={22} className="text-emerald-500" />
                    <p className="text-[var(--fg-muted)] text-sm">All systems healthy</p>
                  </div>
                ) : (
                  alerts.map((a, i) => (
                    <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-amber-500/20 transition-all">
                      <SeverityBadge severity={a.severity} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[var(--fg-soft)] text-xs font-semibold truncate">{a.company_name}</p>
                        <p className="text-[var(--fg-muted)] text-[11px] mt-0.5">{a.detail}</p>
                      </div>
                      <span className="text-[10px] text-[var(--fg-muted)] flex-shrink-0 capitalize">{a.alert_type}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* System Health summary */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[var(--border)]">
                <h3 className="text-[var(--fg)] text-sm font-semibold flex items-center gap-2">
                  <Activity size={14} className="text-violet-500" /> System Health
                </h3>
              </div>
              <div className="p-5 flex flex-col gap-4">
                {[
                  { label: "API",        status: "operational", color: "text-emerald-500" },
                  { label: "Database",   status: "operational", color: "text-emerald-500" },
                  { label: "AI Engine",  status: "operational", color: "text-emerald-500" },
                  { label: "Storage",    status: "operational", color: "text-emerald-500" },
                  { label: "Auth",       status: "operational", color: "text-emerald-500" },
                ].map(({ label, status, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[var(--fg-muted)] text-sm">{label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full bg-emerald-500 animate-pulse ${color.replace("text-", "bg-")}`} />
                      <span className={`text-xs font-semibold capitalize ${color}`}>{status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent activity */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)]">
              <h3 className="text-[var(--fg)] text-sm font-semibold flex items-center gap-2">
                <Clock size={14} className="text-cyan-500" /> Recent Activity
              </h3>
              <span className="text-[10px] text-[var(--fg-muted)] uppercase tracking-wide font-semibold">Last 5 events</span>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {loadingAudit ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="px-5 py-3.5 flex items-center gap-3">
                    <Skeleton className="w-28 h-3.5" />
                    <Skeleton className="w-36 h-3.5" />
                    <Skeleton className="w-20 h-3.5 ml-auto" />
                  </div>
                ))
              ) : auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-[var(--surface-hover)] transition-colors">
                  <span className="text-[var(--fg-soft)] text-xs font-semibold capitalize min-w-[120px]">{log.action}</span>
                  <span className="text-[var(--fg-muted)] text-xs flex-1 truncate">{log.user_email ?? log.user_name ?? "system"}</span>
                  <span className="text-[10px] text-[var(--fg-muted)] capitalize px-2 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--border)]">{log.resource_type}</span>
                  <span className="text-[var(--fg-muted)] text-[10px] flex-shrink-0 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          USERS TAB
      ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "users" && (
        <div className="flex flex-col gap-5">

          {/* Toolbar */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] pointer-events-none" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)] text-sm placeholder-[var(--fg-muted)] focus:outline-none focus:border-violet-500/50 transition-all"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-sm font-bold transition-all shadow-[0_0_16px_rgba(124,58,237,0.3)] hover:shadow-[0_0_24px_rgba(124,58,237,0.45)] active:scale-95"
            >
              <Plus size={14} /> Create User
            </button>
          </div>

          {/* Users table */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
                    {["Name", "Email", "Role", "Status", "Last Login", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--fg-muted)]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {loadingUsers ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        {[...Array(6)].map((_, j) => (
                          <td key={j} className="px-4 py-3.5">
                            <Skeleton className="h-4 w-24" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-[var(--fg-muted)] text-sm">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-500 text-[10px] font-bold flex-shrink-0">
                              {user.full_name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                            </div>
                            <span className="text-[var(--fg-soft)] font-medium text-xs truncate max-w-[120px]">{user.full_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-[var(--fg-muted)] text-xs truncate max-w-[160px]">{user.email}</td>
                        <td className="px-4 py-3.5">
                          <RoleBadge role={user.role} />
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                            user.is_active
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                              : "bg-[var(--surface)] text-[var(--fg-muted)] border-[var(--border)]"
                          }`}>
                            {user.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-[var(--fg-muted)] text-[11px] whitespace-nowrap">
                          {user.last_login
                            ? new Date(user.last_login).toLocaleDateString([], { month: "short", day: "numeric" })
                            : "Never"}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5" ref={roleDropdownUser === user.id ? dropdownRef : null}>

                            {/* Toggle status */}
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(user)}
                              title={user.is_active ? "Deactivate" : "Activate"}
                              className={`p-1.5 rounded-lg border transition-all ${
                                user.is_active
                                  ? "text-emerald-500 border-emerald-500/25 bg-emerald-500/5 hover:bg-emerald-500/15"
                                  : "text-[var(--fg-muted)] border-[var(--border)] hover:bg-[var(--surface-hover)]"
                              }`}
                            >
                              <CheckCircle size={13} />
                            </button>

                            {/* Role dropdown */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setRoleDropdownUser(roleDropdownUser === user.id ? null : user.id)}
                                title="Change role"
                                className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] transition-all flex items-center gap-1"
                              >
                                <UserCog size={13} />
                                <ChevronDown size={10} />
                              </button>
                              {roleDropdownUser === user.id && (
                                <div className="absolute right-0 top-full mt-1 z-20 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden min-w-[130px]">
                                  {ROLES.map((r) => (
                                    <button
                                      key={r}
                                      type="button"
                                      onClick={() => handleUpdateRole(user.id, r)}
                                      className={`w-full text-left px-3 py-2 text-xs capitalize transition-colors hover:bg-[var(--surface-hover)] ${
                                        r === user.role ? "text-violet-500 font-semibold" : "text-[var(--fg-soft)]"
                                      }`}
                                    >
                                      {r.replace("_", " ")}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(user)}
                              title="Delete user"
                              className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--fg-muted)] hover:text-rose-500 hover:border-rose-500/30 hover:bg-rose-500/5 transition-all"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {!loadingUsers && (
              <div className="px-5 py-3 border-t border-[var(--border)] text-[10px] text-[var(--fg-muted)]">
                Showing {filteredUsers.length} of {users.length} users
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          COMPANIES TAB
      ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "companies" && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
                  {["Name", "Country", "Industry", "Users", "Documents", "Health", "Status", "Created"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--fg-muted)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {loadingCompanies ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(8)].map((_, j) => (
                        <td key={j} className="px-4 py-3.5">
                          <Skeleton className="h-4 w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : companies.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-[var(--fg-muted)] text-sm">
                      No companies found.
                    </td>
                  </tr>
                ) : (
                  companies.map((co) => {
                    const score = co.health_score ?? null;
                    const scoreColor =
                      score === null ? "text-[var(--fg-muted)]"
                      : score >= 80 ? "text-emerald-500"
                      : score >= 50 ? "text-amber-500"
                      : "text-rose-500";
                    return (
                      <tr key={co.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center flex-shrink-0">
                              <Building2 size={13} className="text-cyan-500" />
                            </div>
                            <span className="text-[var(--fg-soft)] font-medium text-xs">{co.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1 text-[var(--fg-muted)] text-xs">
                            <Globe size={11} />
                            {co.country}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-[var(--fg-muted)] text-xs">{co.industry ?? "—"}</td>
                        <td className="px-4 py-3.5 text-[var(--fg-soft)] text-xs font-semibold">{co.user_count}</td>
                        <td className="px-4 py-3.5 text-[var(--fg-soft)] text-xs font-semibold">{co.document_count}</td>
                        <td className="px-4 py-3.5">
                          <span className={`text-xs font-bold ${scoreColor}`}>
                            {score !== null ? `${score}%` : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                            co.is_active
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                              : "bg-[var(--surface)] text-[var(--fg-muted)] border-[var(--border)]"
                          }`}>
                            {co.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-[var(--fg-muted)] text-[11px] whitespace-nowrap">
                          {new Date(co.created_at).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {!loadingCompanies && (
            <div className="px-5 py-3 border-t border-[var(--border)] text-[10px] text-[var(--fg-muted)]">
              {companies.length} compan{companies.length !== 1 ? "ies" : "y"} total
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          AUDIT LOGS TAB
      ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "audit" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-[var(--fg-muted)] text-sm">
              Auto-refreshes every 30 seconds.
            </p>
            <button
              type="button"
              onClick={() => { fetchAuditLogs(); setAuditRefreshKey((k) => k + 1); }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] text-xs font-semibold transition-all"
            >
              <RefreshCw size={13} className={loadingAudit ? "animate-spin" : ""} /> Refresh
            </button>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
                    {["Action", "User", "Resource", "Details", "IP", "Time"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--fg-muted)]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {loadingAudit ? (
                    [...Array(8)].map((_, i) => (
                      <tr key={i}>
                        {[...Array(6)].map((_, j) => (
                          <td key={j} className="px-4 py-3.5">
                            <Skeleton className="h-4 w-24" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-[var(--fg-muted)] text-sm">
                        No audit logs found.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                        <td className="px-4 py-3.5">
                          <span className="text-xs font-semibold text-violet-500 capitalize">{log.action}</span>
                        </td>
                        <td className="px-4 py-3.5 text-[var(--fg-muted)] text-xs truncate max-w-[160px]">
                          {log.user_email ?? log.user_name ?? "system"}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-[10px] font-semibold text-[var(--fg-soft)] capitalize px-2 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--border)]">
                            {log.resource_type}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-[var(--fg-muted)] text-xs max-w-[200px] truncate">
                          {log.details ?? `ID: ${log.resource_id ?? "—"}`}
                        </td>
                        <td className="px-4 py-3.5 text-[var(--fg-muted)] text-[11px] font-mono">
                          {log.ip_address ?? "—"}
                        </td>
                        <td className="px-4 py-3.5 text-[var(--fg-muted)] text-[11px] whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString([], {
                            month: "short", day: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {!loadingAudit && (
              <div className="px-5 py-3 border-t border-[var(--border)] flex items-center justify-between">
                <span className="text-[10px] text-[var(--fg-muted)]">{auditLogs.length} entries shown</span>
                <span className="text-[10px] text-[var(--fg-muted)]">
                  Key: {auditRefreshKey} · refreshed {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create user modal */}
      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={fetchUsers}
        />
      )}
    </div>
  );
}
