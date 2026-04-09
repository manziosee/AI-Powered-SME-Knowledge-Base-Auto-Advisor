"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus, Mail, X, Loader2, Check } from "lucide-react";
import { team } from "@/lib/api";

interface TeamMember {
  id: string;
  user: { id: string; name: string; email: string; avatar?: string };
  role: string;
  is_owner: boolean;
  joined_at: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  invited_by: { name: string };
}

export default function TeamSettingsPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [membersRes, invitesRes] = await Promise.all([
        team.listMembers(),
        team.listInvitations(),
      ]);
      if (membersRes.data?.items) setMembers(membersRes.data.items);
      if (invitesRes.data?.items) setInvitations(invitesRes.data.items);
    } catch (e) {
      console.error("Failed to load team data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    try {
      const { error } = await team.invite(inviteEmail, inviteRole);
      if (!error) {
        setShowInvite(false);
        setInviteEmail("");
        loadData();
      }
    } catch (e) {
      console.error("Failed to invite:", e);
    } finally {
      setInviting(false);
    }
  };

  const handleCancelInvite = async (id: string) => {
    try {
      await team.cancelInvitation(id);
      setInvitations(prev => prev.filter(i => i.id !== id));
    } catch (e) {
      console.error("Failed to cancel invitation:", e);
    }
  };

  const roleColors: Record<string, string> = {
    admin: "bg-violet-500/20 text-violet-400 border-violet-500/30",
    member: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    editor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    viewer: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
            <Users size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[var(--fg)]">Team Settings</h1>
            <p className="text-[var(--fg-muted)] text-sm">Manage members and invitations</p>
          </div>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all"
        >
          <UserPlus size={16} /> Invite
        </button>
      </div>

      {/* Members */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--fg)] mb-4">Members ({members.length})</h2>
        <div className="space-y-3">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-soft)] border border-[var(--border)]">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                {m.user.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1">
                <p className="text-[var(--fg)] font-medium">{m.user.name}</p>
                <p className="text-[var(--fg-muted)] text-sm">{m.user.email}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${roleColors[m.role] || roleColors.member}`}>
                {m.role}
              </span>
              {m.is_owner && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Owner
                </span>
              )}
            </div>
          ))}
          {members.length === 0 && (
            <p className="text-center text-[var(--fg-muted)] py-8">No team members yet</p>
          )}
        </div>
      </div>

      {/* Invitations */}
      {invitations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-[var(--fg)] mb-4">Pending Invitations ({invitations.length})</h2>
          <div className="space-y-3">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-soft)] border border-[var(--border)]">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Mail size={18} className="text-slate-400" />
                </div>
                <div className="flex-1">
                  <p className="text-[var(--fg)]">{inv.email}</p>
                  <p className="text-[var(--fg-muted)] text-sm">Expires {new Date(inv.expires_at).toLocaleDateString()}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${roleColors[inv.role]}`}>
                  {inv.role}
                </span>
                <button
                  onClick={() => handleCancelInvite(inv.id)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={16} className="text-slate-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setShowInvite(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50">
            <div className="bg-[var(--bg-soft)] border border-[var(--border)] rounded-2xl p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-[var(--fg)] mb-4">Invite Team Member</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[var(--fg-muted)] text-xs mb-1 block">Email</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--fg)] text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="text-[var(--fg-muted)] text-xs mb-1 block">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--fg)] text-sm focus:outline-none focus:border-violet-500"
                  >
                    <option value="admin">Admin - Full access</option>
                    <option value="editor">Editor - Can edit</option>
                    <option value="member">Member - Can view</option>
                    <option value="viewer">Viewer - Read only</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowInvite(false)}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-[var(--fg)] rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  disabled={inviting || !inviteEmail}
                  className="flex-1 px-4 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {inviting ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                  Send Invite
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}