"use client";

import React, { useState, useEffect } from "react";
import {
  Building2, Globe, Users, Shield, MoreHorizontal, Plus,
  X, Mail, CheckCircle, Clock, Trash2, UserCog, RefreshCw, Save, Check,
} from "lucide-react";
import { company as companyApi, analytics } from "@/lib/api";

const roleColors: Record<string, string> = {
  admin:    "text-violet-600 dark:text-violet-300 bg-violet-500/12 border-violet-500/30",
  manager:  "text-cyan-600   dark:text-cyan-300   bg-cyan-500/10   border-cyan-500/25",
  employee: "text-blue-600   dark:text-blue-300   bg-blue-500/8    border-blue-500/20",
  super_admin: "text-rose-600 dark:text-rose-300  bg-rose-500/10   border-rose-500/25",
};

type Member = { id: string; full_name: string; email: string; role: string };
type CompanyData = { id: string; name: string; country: string; industry?: string };

function InviteModal({ onClose, onInvited }: { onClose: () => void; onInvited: (m: Member) => void }) {
  const [email,   setEmail]   = useState("");
  const [role,    setRole]    = useState("employee");
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setError("");
    const { error: apiErr } = await companyApi.inviteUser(email, role);
    if (apiErr) setError(apiErr);
    setSending(false);
    setSent(true);
    onInvited({ id: `invited-${Date.now()}`, full_name: email.split("@")[0], email, role });
    setTimeout(onClose, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-[var(--bg-soft)] border border-[var(--border)] shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center">
              <Users size={16} className="text-violet-500" />
            </div>
            <div>
              <h3 className="text-[var(--fg)] font-bold text-sm">Invite Team Member</h3>
              <p className="text-[var(--fg-muted)] text-xs">They&apos;ll receive an email invitation</p>
            </div>
          </div>
          <button type="button" onClick={onClose} title="Close" aria-label="Close" className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--fg-muted)] transition-all">
            <X size={16} />
          </button>
        </div>

        {sent ? (
          <div className="flex flex-col items-center py-6 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
              <CheckCircle size={28} className="text-emerald-500" />
            </div>
            <p className="text-[var(--fg)] font-semibold text-sm">Invitation sent!</p>
            <p className="text-[var(--fg-muted)] text-xs text-center">
              An invitation email has been sent to <strong>{email}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wide mb-1.5">Email address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@company.com" required
                  className="w-full pl-9 pr-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--fg)] text-sm placeholder-[var(--fg-muted)] focus:outline-none focus:border-violet-500/50 transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wide mb-1.5">Role</label>
              <div className="grid grid-cols-3 gap-2">
                {["employee", "manager", "admin"].map((r) => (
                  <button key={r} type="button" onClick={() => setRole(r)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all capitalize ${
                      role === r
                        ? "bg-violet-500/15 border-violet-500/40 text-violet-600 dark:text-violet-300"
                        : "bg-[var(--surface)] border-[var(--border)] text-[var(--fg-muted)] hover:border-violet-500/30 hover:text-[var(--fg)]"
                    }`}>{r}</button>
                ))}
              </div>
            </div>
            {error && <p className="text-xs text-rose-500 bg-rose-500/8 border border-rose-500/20 px-3 py-2 rounded-lg">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-[var(--fg-muted)] text-sm hover:text-[var(--fg)] hover:border-violet-500/30 transition-all">
                Cancel
              </button>
              <button type="submit" disabled={sending || !email.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-sm font-bold transition-all disabled:opacity-40 active:scale-95 shadow-[0_4px_16px_rgba(124,58,237,0.3)]">
                {sending ? <><Clock size={13} className="animate-spin" /> Sending…</> : <><Mail size={13} /> Send Invite</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function MemberMenu({ member, onRemove }: { member: Member; onRemove: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" title="Member options" onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-all">
        <MoreHorizontal size={14} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 w-44 rounded-xl bg-[var(--bg-soft)] border border-[var(--border)] shadow-xl py-1 overflow-hidden">
            <button type="button" onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-[var(--fg-soft)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] transition-colors">
              <UserCog size={13} className="text-violet-500" /> Change role
            </button>
            <div className="h-px bg-[var(--border)] mx-2" />
            <button type="button" onClick={() => { setOpen(false); onRemove(member.id); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-rose-500 hover:bg-rose-500/8 transition-colors">
              <Trash2 size={13} /> Remove member
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function CompanyPage() {
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [members,     setMembers]     = useState<Member[]>([]);
  const [showInvite,  setShowInvite]  = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [complianceScore, setComplianceScore] = useState<number | null>(null);
  const [totalDocs,   setTotalDocs]   = useState(0);
  const [editing,     setEditing]     = useState(false);
  const [editForm,    setEditForm]    = useState({ name: "", country: "", industry: "" });
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);

  useEffect(() => {
    Promise.all([
      companyApi.get(),
      companyApi.users(),
      analytics.complianceScore(),
      analytics.overview(),
    ]).then(([compRes, usersRes, complianceRes, overviewRes]) => {
      if (compRes.data) {
        setCompanyData(compRes.data);
        setEditForm({ name: compRes.data.name, country: compRes.data.country, industry: compRes.data.industry ?? "" });
      }
      if (usersRes.data) setMembers(usersRes.data.items ?? []);
      if (complianceRes.data) setComplianceScore(Math.round(complianceRes.data.compliance_score));
      if (overviewRes.data) setTotalDocs(overviewRes.data.documents.total);
      setLoading(false);
    });
  }, []);

  const handleInvited = (m: Member) => setMembers((prev) => [...prev, m]);

  const handleRemove = async (id: string) => {
    await companyApi.removeUser(id);
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    await companyApi.update({ name: editForm.name, country: editForm.country, industry: editForm.industry });
    setCompanyData(prev => prev ? { ...prev, ...editForm } : prev);
    setSaving(false);
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20 gap-2 text-[var(--fg-muted)]">
        <RefreshCw size={16} className="animate-spin" />
        <span className="text-sm">Loading company data…</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} onInvited={handleInvited} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-[var(--fg)] tracking-tight">Company</h1>
          <p className="text-[var(--fg-muted)] text-sm mt-0.5">Manage your organisation profile and team</p>
        </div>
        <button type="button" onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-sm font-bold transition-all shadow-[0_4px_16px_rgba(124,58,237,0.35)] hover:shadow-[0_6px_24px_rgba(124,58,237,0.5)] hover:-translate-y-0.5 active:scale-95">
          <Plus size={14} /> Invite member
        </button>
      </div>

      {/* Company profile card */}
      <div className="p-6 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border)] mb-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/12 border border-cyan-500/25 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <Building2 size={28} />
          </div>
          <div className="flex-1">
            {editing ? (
              <div className="flex flex-col gap-3">
                <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--fg)] text-sm focus:outline-none focus:border-violet-500/50"
                  placeholder="Company name" />
                <div className="flex gap-2">
                  <input value={editForm.country} onChange={e => setEditForm(f => ({ ...f, country: e.target.value }))}
                    className="flex-1 px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--fg)] text-sm focus:outline-none focus:border-violet-500/50"
                    placeholder="Country" />
                  <input value={editForm.industry} onChange={e => setEditForm(f => ({ ...f, industry: e.target.value }))}
                    className="flex-1 px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--fg)] text-sm focus:outline-none focus:border-violet-500/50"
                    placeholder="Industry" />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={handleSave} disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all disabled:opacity-50">
                    {saving ? <RefreshCw size={12} className="animate-spin" /> : saved ? <Check size={12} /> : <Save size={12} />}
                    {saving ? "Saving…" : saved ? "Saved!" : "Save"}
                  </button>
                  <button type="button" onClick={() => setEditing(false)}
                    className="px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--fg-muted)] text-xs hover:text-[var(--fg)] transition-all">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-[var(--fg)] text-xl font-bold">{companyData?.name ?? "—"}</h2>
                <p className="text-[var(--fg-muted)] text-sm mt-0.5">{companyData?.industry ?? "—"} · {companyData?.country ?? "—"}</p>
                <div className="flex flex-wrap gap-4 mt-4">
                  {[
                    { icon: Globe,  label: companyData?.country ?? "—",          color: "text-blue-600 dark:text-blue-400"    },
                    { icon: Users,  label: `${members.length} members`,           color: "text-cyan-600 dark:text-cyan-400"    },
                    { icon: Shield, label: complianceScore !== null ? `${complianceScore}% compliant` : "—", color: "text-emerald-600 dark:text-emerald-400" },
                  ].map(({ icon: Icon, label, color }) => (
                    <div key={label} className={`flex items-center gap-1.5 text-xs font-medium ${color}`}>
                      <Icon size={12} /> {label}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          {!editing && (
            <button type="button" onClick={() => setEditing(true)}
              className="px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--fg-soft)] text-sm hover:text-violet-600 dark:hover:text-violet-300 hover:border-violet-500/40 transition-all">
              Edit profile
            </button>
          )}
        </div>

        <div className="grid grid-cols-4 gap-px bg-[var(--border)] rounded-xl overflow-hidden mt-6">
          {[
            { label: "Documents",    value: totalDocs.toLocaleString() },
            { label: "Team members", value: `${members.length}`        },
            { label: "Compliance",   value: complianceScore !== null ? `${complianceScore}%` : "—" },
            { label: "Country",      value: companyData?.country ?? "—" },
          ].map((s) => (
            <div key={s.label} className="bg-[var(--bg-soft)] px-4 py-3">
              <p className="text-[var(--fg)] font-black text-xl">{s.value}</p>
              <p className="text-[var(--fg-muted)] text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team members */}
      <div>
        <h3 className="text-[var(--fg)] font-semibold mb-4">Team Members ({members.length})</h3>
        <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="grid grid-cols-12 px-5 py-3 bg-[var(--bg-muted)] border-b border-[var(--border)] text-[var(--fg-muted)] text-xs uppercase tracking-wide font-semibold">
            <div className="col-span-5">Member</div>
            <div className="col-span-3">Role</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-1" />
          </div>

          {members.map((user, i) => {
            const initials = user.full_name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) ?? "U";
            return (
              <div key={user.id}
                className={`grid grid-cols-12 px-5 py-4 items-center hover:bg-[var(--surface-hover)] transition-all group ${
                  i < members.length - 1 ? "border-b border-[var(--border)]" : ""
                }`}>
                <div className="col-span-5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500/20 to-cyan-500/10 border border-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-300 font-bold text-xs flex-shrink-0">
                    {initials}
                  </div>
                  <div>
                    <p className="text-[var(--fg-soft)] text-sm font-medium">{user.full_name}</p>
                  </div>
                </div>
                <div className="col-span-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${roleColors[user.role] ?? "text-[var(--fg-muted)] bg-[var(--surface)] border-[var(--border)]"}`}>
                    {user.role}
                  </span>
                </div>
                <div className="col-span-3 text-[var(--fg-muted)] text-xs truncate">{user.email}</div>
                <div className="col-span-1 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <MemberMenu member={user} onRemove={handleRemove} />
                </div>
              </div>
            );
          })}

          {members.length === 0 && (
            <div className="py-12 text-center text-[var(--fg-muted)] text-sm">
              No team members yet. Invite someone above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
