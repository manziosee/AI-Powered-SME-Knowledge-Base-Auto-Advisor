"use client";

import React, { useState, useEffect } from "react";
import {
  User, Bell, Shield, Globe, Key, Save, Eye, EyeOff, Check, Copy,
  AlertCircle, X, Lock, Plus, Trash2, RefreshCw, Smartphone, Monitor,
  LogOut, ChevronDown,
} from "lucide-react";
import { auth as authApi } from "@/lib/api";

const tabs = [
  { id: "profile",       label: "Profile",       icon: User    },
  { id: "notifications", label: "Notifications", icon: Bell    },
  { id: "security",      label: "Security",      icon: Shield  },
  { id: "language",      label: "Language",      icon: Globe   },
  { id: "api",           label: "API Keys",      icon: Key     },
  { id: "sessions",      label: "Sessions",      icon: Monitor },
];

const INPUT = "w-full px-3 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--fg)] text-sm focus:outline-none focus:border-violet-500/50 focus:bg-violet-500/5 transition-all placeholder-[var(--fg-muted)]";

// ── API Keys Tab ──────────────────────────────────────────────────────────────
function ApiKeysTab() {
  const [keys,      setKeys]      = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [creating,  setCreating]  = useState(false);
  const [showForm,  setShowForm]  = useState(false);
  const [newKey,    setNewKey]    = useState<string | null>(null);
  const [copied,    setCopied]    = useState(false);
  const [keyName,   setKeyName]   = useState("");
  const [expiryDays, setExpiryDays] = useState("90");
  const [scopes,    setScopes]    = useState<string[]>(["read"]);

  const ALL_SCOPES = ["read", "write", "documents", "analytics", "admin"];

  useEffect(() => {
    authApi.listApiKeys().then(({ data }) => {
      setKeys(data || []);
      setLoading(false);
    });
  }, []);

  async function create() {
    if (!keyName.trim()) return;
    setCreating(true);
    const { data } = await authApi.createApiKey(keyName.trim(), scopes, parseInt(expiryDays) || undefined);
    setCreating(false);
    if (data) {
      setNewKey(data.key);
      setKeys(prev => [data, ...prev]);
      setKeyName(""); setScopes(["read"]); setShowForm(false);
    }
  }

  async function revoke(id: string) {
    await authApi.revokeApiKey(id);
    setKeys(prev => prev.filter(k => k.id !== id));
  }

  function toggleScope(s: string) {
    setScopes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  function copyKey() {
    if (!newKey) return;
    navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[var(--fg)] font-semibold">API Keys</h2>
          <p className="text-[var(--fg-muted)] text-xs mt-0.5">Use API keys to integrate with your own tools. Keys are shown only once.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-500 text-white text-xs font-semibold hover:bg-violet-400 transition-all">
          <Plus size={13} /> New Key
        </button>
      </div>

      {/* New key revealed */}
      {newKey && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/8 space-y-2">
          <p className="text-emerald-400 text-xs font-semibold">Copy your API key — it won't be shown again!</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-emerald-300 text-xs font-mono break-all">{newKey}</code>
            <button onClick={copyKey} className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs hover:bg-emerald-500/30 transition-all">
              {copied ? <Check size={11} /> : <Copy size={11} />} {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <button onClick={() => setNewKey(null)} className="text-[var(--fg-muted)] text-xs hover:text-[var(--fg)]">Dismiss</button>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] space-y-3">
          <div>
            <label className="text-[var(--fg-muted)] text-xs mb-1 block">Key name</label>
            <input value={keyName} onChange={e => setKeyName(e.target.value)} placeholder="e.g. CI/CD pipeline"
              className={INPUT} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[var(--fg-muted)] text-xs mb-1 block">Expires in (days)</label>
              <select value={expiryDays} onChange={e => setExpiryDays(e.target.value)} className={INPUT}>
                <option value="">Never</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="180">180 days</option>
                <option value="365">1 year</option>
              </select>
            </div>
            <div>
              <label className="text-[var(--fg-muted)] text-xs mb-1 block">Scopes</label>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {ALL_SCOPES.map(s => (
                  <button key={s} type="button" onClick={() => toggleScope(s)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all ${
                      scopes.includes(s)
                        ? "bg-violet-500 border-violet-500 text-white"
                        : "border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)]"
                    }`}>{s}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={create} disabled={creating || !keyName.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500 text-white text-sm font-semibold hover:bg-violet-400 disabled:opacity-50 transition-all">
              {creating ? <RefreshCw size={13} className="animate-spin" /> : <Key size={13} />} Create Key
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--fg-muted)] text-sm hover:text-[var(--fg)] transition-all">Cancel</button>
          </div>
        </div>
      )}

      {/* Key list */}
      {loading ? (
        <div className="flex items-center gap-2 text-[var(--fg-muted)] py-8 justify-center">
          <RefreshCw size={14} className="animate-spin" /> Loading…
        </div>
      ) : keys.length === 0 ? (
        <div className="text-center py-10 text-[var(--fg-muted)] text-sm">No API keys yet</div>
      ) : (
        <div className="flex flex-col gap-2">
          {keys.map(k => (
            <div key={k.id} className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)]">
              <div className="flex items-start gap-3 min-w-0">
                <Key size={14} className="text-violet-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[var(--fg-soft)] text-sm font-medium">{k.name}</p>
                  <code className="text-[var(--fg-muted)] text-xs">{k.key_prefix}••••••••</code>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {(k.scopes || []).map((s: string) => (
                      <span key={s} className="px-1.5 py-0.5 rounded text-[10px] bg-violet-500/10 text-violet-400 border border-violet-500/20">{s}</span>
                    ))}
                    {k.expires_at && (
                      <span className="text-[10px] text-[var(--fg-muted)]">
                        Expires {new Date(k.expires_at).toLocaleDateString()}
                      </span>
                    )}
                    {k.last_used_at && (
                      <span className="text-[10px] text-[var(--fg-muted)]">
                        Last used {new Date(k.last_used_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => revoke(k.id)}
                className="flex-shrink-0 p-1.5 rounded-lg text-[var(--fg-muted)] hover:text-rose-400 hover:bg-rose-500/8 transition-all">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
        <p className="text-amber-500 text-xs">Keep API keys secret. Revoking a key immediately invalidates it.</p>
      </div>
    </div>
  );
}

// ── Sessions Tab ──────────────────────────────────────────────────────────────
function SessionsTab() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    authApi.listSessions().then(({ data }) => {
      setSessions(data || []);
      setLoading(false);
    });
  }, []);

  async function revoke(id: string) {
    setRevoking(id);
    await authApi.revokeSession(id);
    setSessions(prev => prev.filter(s => s.id !== id));
    setRevoking(null);
  }

  async function revokeAll() {
    await authApi.revokeAllSessions();
    setSessions([]);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[var(--fg)] font-semibold">Active Sessions</h2>
          <p className="text-[var(--fg-muted)] text-xs mt-0.5">Devices and browsers where you're currently signed in.</p>
        </div>
        {sessions.length > 1 && (
          <button onClick={revokeAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/8 text-xs transition-all">
            <LogOut size={12} /> Sign out all others
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[var(--fg-muted)] py-8 justify-center">
          <RefreshCw size={14} className="animate-spin" /> Loading…
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-10 text-[var(--fg-muted)] text-sm">No active sessions</div>
      ) : (
        <div className="flex flex-col gap-2">
          {sessions.map((s, i) => (
            <div key={s.id} className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)]">
              <div className="flex items-start gap-3">
                <Monitor size={15} className="text-violet-400 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[var(--fg-soft)] text-sm font-medium">{s.device_hint || "Unknown device"}</p>
                    {i === 0 && <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Current</span>}
                  </div>
                  <p className="text-[var(--fg-muted)] text-xs mt-0.5">{s.ip_address || "Unknown IP"}</p>
                  <p className="text-[var(--fg-muted)] text-xs">
                    Started {new Date(s.created_at).toLocaleDateString()} · Last seen {new Date(s.last_seen_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {i !== 0 && (
                <button onClick={() => revoke(s.id)} disabled={revoking === s.id}
                  className="flex-shrink-0 p-1.5 rounded-lg text-[var(--fg-muted)] hover:text-rose-400 hover:bg-rose-500/8 transition-all disabled:opacity-50">
                  {revoking === s.id ? <RefreshCw size={13} className="animate-spin" /> : <LogOut size={13} />}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 2FA Section (within Security tab) ────────────────────────────────────────
function TwoFASection() {
  const [status,   setStatus]   = useState<{ otp_enabled: boolean; has_secret: boolean } | null>(null);
  const [qr,       setQr]       = useState<string | null>(null);
  const [secret,   setSecret]   = useState<string | null>(null);
  const [code,     setCode]     = useState("");
  const [busy,     setBusy]     = useState(false);
  const [msg,      setMsg]      = useState<{ text: string; ok: boolean } | null>(null);
  const [showDisable, setShowDisable] = useState(false);

  useEffect(() => {
    authApi.twoFaStatus().then(({ data }) => data && setStatus(data));
  }, []);

  async function setup() {
    setBusy(true); setMsg(null);
    const { data } = await authApi.twoFaSetup();
    setBusy(false);
    if (data) { setQr(data.qr_code_base64); setSecret(data.secret); }
  }

  async function verify() {
    if (!code) return;
    setBusy(true); setMsg(null);
    const { data, error } = await authApi.twoFaVerify(code);
    setBusy(false);
    if (error) { setMsg({ text: error, ok: false }); return; }
    setMsg({ text: "2FA enabled successfully!", ok: true });
    setStatus({ otp_enabled: true, has_secret: true });
    setQr(null); setSecret(null); setCode("");
  }

  async function disable() {
    if (!code) return;
    setBusy(true); setMsg(null);
    const { data, error } = await authApi.twoFaDisable(code);
    setBusy(false);
    if (error) { setMsg({ text: error, ok: false }); return; }
    setMsg({ text: "2FA disabled.", ok: true });
    setStatus({ otp_enabled: false, has_secret: false });
    setCode(""); setShowDisable(false);
  }

  if (!status) return <div className="flex items-center gap-2 text-[var(--fg-muted)] text-sm"><RefreshCw size={13} className="animate-spin" /> Loading…</div>;

  return (
    <div className="rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] overflow-hidden">
      <div className="flex items-center justify-between p-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[var(--fg-soft)] text-sm font-medium">Two-factor authentication</p>
            {status.otp_enabled
              ? <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Enabled</span>
              : <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">Not enabled</span>
            }
          </div>
          <p className="text-[var(--fg-muted)] text-xs mt-0.5">
            {status.otp_enabled ? "Your account is protected with TOTP" : "Add extra security with an authenticator app"}
          </p>
        </div>
        {status.otp_enabled ? (
          <button onClick={() => setShowDisable(v => !v)}
            className="px-3 py-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/8 text-xs transition-all">
            Disable
          </button>
        ) : (
          <button onClick={setup} disabled={busy}
            className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--fg-soft)] hover:text-violet-500 hover:border-violet-500/40 text-xs font-medium transition-all">
            {busy ? "Setting up…" : "Enable"}
          </button>
        )}
      </div>

      {/* Setup QR */}
      {qr && (
        <div className="px-4 pb-4 border-t border-[var(--border)] pt-4 space-y-4">
          <p className="text-[var(--fg-muted)] text-xs">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
          <div className="flex items-start gap-4">
            <img src={`data:image/png;base64,${qr}`} alt="2FA QR Code" className="w-32 h-32 rounded-xl border border-[var(--border)]" />
            <div className="flex-1 space-y-2">
              <p className="text-[var(--fg-muted)] text-xs">Or enter this secret manually:</p>
              <code className="block text-violet-400 text-xs break-all bg-violet-500/8 p-2 rounded-lg">{secret}</code>
            </div>
          </div>
          <div>
            <label className="text-[var(--fg-muted)] text-xs mb-1 block">Enter the 6-digit code from your app</label>
            <div className="flex gap-2">
              <input value={code} onChange={e => setCode(e.target.value)} placeholder="000000" maxLength={6}
                className="w-36 px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--fg)] text-sm font-mono tracking-widest focus:outline-none focus:border-violet-500/50" />
              <button onClick={verify} disabled={busy || code.length !== 6}
                className="px-4 py-2 rounded-xl bg-violet-500 text-white text-sm font-semibold hover:bg-violet-400 disabled:opacity-50 transition-all">
                {busy ? <RefreshCw size={13} className="animate-spin" /> : "Verify & Enable"}
              </button>
            </div>
          </div>
          {msg && (
            <p className={`text-xs ${msg.ok ? "text-emerald-400" : "text-rose-400"}`}>{msg.text}</p>
          )}
        </div>
      )}

      {/* Disable form */}
      {showDisable && (
        <div className="px-4 pb-4 border-t border-[var(--border)] pt-4 space-y-3">
          <p className="text-[var(--fg-muted)] text-xs">Enter your current TOTP code to disable 2FA.</p>
          <div className="flex gap-2">
            <input value={code} onChange={e => setCode(e.target.value)} placeholder="000000" maxLength={6}
              className="w-36 px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--fg)] text-sm font-mono tracking-widest focus:outline-none focus:border-rose-500/50" />
            <button onClick={disable} disabled={busy || code.length !== 6}
              className="px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-400 disabled:opacity-50 transition-all">
              {busy ? <RefreshCw size={13} className="animate-spin" /> : "Disable 2FA"}
            </button>
          </div>
          {msg && <p className={`text-xs ${msg.ok ? "text-emerald-400" : "text-rose-400"}`}>{msg.text}</p>}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [active,   setActive]   = useState("profile");
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [saveErr,  setSaveErr]  = useState<string | null>(null);

  // Password change
  const [showPwForm, setShowPwForm] = useState(false);
  const [curPw,      setCurPw]      = useState("");
  const [newPw,      setNewPw]      = useState("");
  const [confirmPw,  setConfirmPw]  = useState("");
  const [pwSaving,   setPwSaving]   = useState(false);
  const [pwSuccess,  setPwSuccess]  = useState(false);
  const [pwError,    setPwError]    = useState<string | null>(null);

  const handlePasswordChange = async () => {
    setPwError(null);
    if (newPw.length < 8) { setPwError("New password must be at least 8 characters."); return; }
    if (newPw !== confirmPw) { setPwError("Passwords do not match."); return; }
    setPwSaving(true);
    const { error } = await authApi.changePassword(curPw, newPw);
    setPwSaving(false);
    if (error) { setPwError(error); return; }
    setPwSuccess(true);
    setCurPw(""); setNewPw(""); setConfirmPw("");
    setTimeout(() => { setPwSuccess(false); setShowPwForm(false); }, 2500);
  };

  const [name,        setName]        = useState("");
  const [email,       setEmail]       = useState("");
  const [userRole,    setUserRole]    = useState("");
  const [userCompany, setUserCompany] = useState("");
  const [userAvatar,  setUserAvatar]  = useState("U");

  useEffect(() => {
    authApi.me().then(({ data }) => {
      if (data) {
        setName(data.full_name);
        setEmail(data.email);
        setUserRole(data.role);
        setUserCompany(data.company?.name ?? "");
        const initials = data.full_name?.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) ?? "U";
        setUserAvatar(initials);
      } else {
        try {
          const stored = localStorage.getItem("auth_user");
          if (stored) {
            const u = JSON.parse(stored);
            setName(u.name ?? ""); setEmail(u.email ?? "");
            setUserRole(u.role ?? ""); setUserCompany(u.company ?? "");
            setUserAvatar(u.avatar ?? "U");
          }
        } catch { /* ignore */ }
      }
    });
  }, []);

  const [notifs, setNotifs] = useState<Record<string, boolean>>(() => {
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem("advisorai_notif_prefs") : null;
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return { deadline: true, gap: true, docready: true, risk: false, digest: true, webhook: false };
  });
  const toggleNotif = (key: string) => setNotifs(prev => ({ ...prev, [key]: !prev[key] }));

  const [lang, setLang] = useState(() => { try { return typeof window !== "undefined" ? (localStorage.getItem("advisorai_lang") ?? "English") : "English"; } catch { return "English"; } });
  const [date, setDate] = useState(() => { try { return typeof window !== "undefined" ? (localStorage.getItem("advisorai_date_fmt") ?? "YYYY-MM-DD") : "YYYY-MM-DD"; } catch { return "YYYY-MM-DD"; } });
  const [tz, setTz] = useState(() => { try { return typeof window !== "undefined" ? (localStorage.getItem("advisorai_tz") ?? "Africa/Kigali (UTC+2)") : "Africa/Kigali (UTC+2)"; } catch { return "Africa/Kigali (UTC+2)"; } });
  const [curr, setCurr] = useState(() => { try { return typeof window !== "undefined" ? (localStorage.getItem("advisorai_currency") ?? "RWF") : "RWF"; } catch { return "RWF"; } });

  const handleSave = async () => {
    setSaving(true); setSaveErr(null);
    await authApi.updateMe({ full_name: name, email });
    setSaving(false); setSaved(true);
    try {
      const stored = localStorage.getItem("auth_user");
      if (stored) {
        const u = JSON.parse(stored) as Record<string, string>;
        localStorage.setItem("auth_user", JSON.stringify({ ...u, name, email }));
      }
      localStorage.setItem("advisorai_notif_prefs", JSON.stringify(notifs));
      localStorage.setItem("advisorai_lang", lang);
      localStorage.setItem("advisorai_date_fmt", date);
      localStorage.setItem("advisorai_tz", tz);
      localStorage.setItem("advisorai_currency", curr);
    } catch { /* ignore */ }
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shadow-[0_0_16px_rgba(100,116,139,0.35)] flex-shrink-0">
          <User size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">
            <span className="gradient-text-brand">Settings</span>
          </h1>
          <p className="text-[var(--fg-muted)] text-sm">Manage your account, security, and preferences</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-48 flex-shrink-0">
          <nav className="flex flex-col gap-1.5">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" onClick={() => setActive(id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-all duration-300 hover:scale-[1.01] group ${
                  active === id
                    ? "bg-gradient-to-r from-blue-600/15 to-teal-500/10 border border-blue-500/30 text-blue-500 font-semibold shadow-lg shadow-blue-500/10"
                    : "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface)] border border-transparent hover:border-[var(--border)]"
                }`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${active === id ? "bg-blue-500/15 border border-blue-500/25" : "bg-[var(--surface)] border border-[var(--border)] group-hover:border-blue-500/20"}`}>
                  <Icon size={13} className={active === id ? "text-blue-500" : "text-[var(--fg-muted)] group-hover:text-[var(--fg)]"} />
                </div>
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-[var(--bg-soft)] border border-[var(--border)] rounded-2xl p-6">

            {/* ── PROFILE ── */}
            {active === "profile" && (
              <div className="flex flex-col gap-5">
                <h2 className="text-[var(--fg)] font-semibold">Profile Settings</h2>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center text-violet-500 font-black text-xl">
                    {userAvatar}
                  </div>
                  <div>
                    <p className="text-[var(--fg-soft)] text-sm font-medium">{name}</p>
                    <p className="text-[var(--fg-muted)] text-xs capitalize">{userRole} · {userCompany}</p>
                    <button type="button" className="text-violet-500 hover:text-violet-400 text-xs mt-1 transition-colors">Change avatar</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[var(--fg-muted)] text-xs uppercase tracking-wide mb-1.5">Full name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className={INPUT} placeholder="Your full name" />
                  </div>
                  <div>
                    <label className="block text-[var(--fg-muted)] text-xs uppercase tracking-wide mb-1.5">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={INPUT} placeholder="Your email" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[var(--fg-muted)] text-xs uppercase tracking-wide mb-1.5">Role</label>
                    <div className="px-3 py-2.5 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl text-[var(--fg-muted)] text-sm capitalize">{userRole}</div>
                  </div>
                  <div>
                    <label className="block text-[var(--fg-muted)] text-xs uppercase tracking-wide mb-1.5">Company</label>
                    <div className="px-3 py-2.5 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl text-[var(--fg-muted)] text-sm">{userCompany}</div>
                  </div>
                </div>
                {saveErr && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/8 border border-rose-500/20 text-rose-500 text-xs">
                    <AlertCircle size={13} /> {saveErr}
                  </div>
                )}
                <button type="button" onClick={handleSave} disabled={saving}
                  className="self-start flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white font-bold text-sm transition-all shadow-[0_0_15px_rgba(37,99,235,0.25)] hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 overflow-hidden shine-hover relative">
                  <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                  {saved ? <><Check size={13} className="relative z-10" /><span className="relative z-10">Saved!</span></> : saving ? <><Save size={13} className="animate-spin relative z-10" /><span className="relative z-10">Saving…</span></> : <><Save size={13} className="relative z-10" /><span className="relative z-10">Save changes</span></>}
                </button>
              </div>
            )}

            {/* ── NOTIFICATIONS ── */}
            {active === "notifications" && (
              <div className="flex flex-col gap-4">
                <h2 className="text-[var(--fg)] font-semibold mb-2">Notification Preferences</h2>
                {[
                  { key: "deadline", label: "Deadline reminders",          desc: "Get alerted 30, 7, and 1 day before deadlines"   },
                  { key: "gap",      label: "Compliance gap alerts",        desc: "Notify when new compliance gaps are detected"     },
                  { key: "docready", label: "Document processed",           desc: "Alert when document processing completes"         },
                  { key: "risk",     label: "Risk level changes",           desc: "Alert when a document risk level changes"         },
                  { key: "digest",   label: "Weekly digest email",          desc: "Summary of activity and upcoming deadlines"       },
                  { key: "webhook",  label: "Integration webhook failures", desc: "Alert when an outgoing webhook fails"             },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)]">
                    <div>
                      <p className="text-[var(--fg-soft)] text-sm font-medium">{label}</p>
                      <p className="text-[var(--fg-muted)] text-xs mt-0.5">{desc}</p>
                    </div>
                    <button type="button" onClick={() => toggleNotif(key)}
                      role="switch" aria-checked={notifs[key]} aria-label={`Toggle ${label}`}
                      className={`w-10 h-5 min-w-[2.5rem] rounded-full transition-all relative flex-shrink-0 ${notifs[key] ? "bg-violet-500 shadow-[0_0_10px_rgba(167,139,250,0.4)]" : "bg-[var(--border)]"}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${notifs[key] ? "left-5" : "left-0.5"}`} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={handleSave}
                  className="self-start flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all mt-2">
                  {saved ? <><Check size={13} /> Saved!</> : <><Save size={13} /> Save preferences</>}
                </button>
              </div>
            )}

            {/* ── SECURITY ── */}
            {active === "security" && (
              <div className="flex flex-col gap-5">
                <h2 className="text-[var(--fg)] font-semibold">Security</h2>

                {/* Change password */}
                <div className="rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] overflow-hidden">
                  <div className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-[var(--fg-soft)] text-sm font-medium">Change password</p>
                      <p className="text-[var(--fg-muted)] text-xs mt-0.5">{pwSuccess ? "Password changed!" : "Update your account password"}</p>
                    </div>
                    <button type="button" onClick={() => { setShowPwForm(v => !v); setPwError(null); }}
                      className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--fg-soft)] hover:text-violet-500 hover:border-violet-500/40 text-xs font-medium transition-all">
                      {showPwForm ? "Cancel" : "Update"}
                    </button>
                  </div>
                  {showPwForm && (
                    <div className="px-4 pb-4 flex flex-col gap-3 border-t border-[var(--border)] pt-4">
                      <div>
                        <label className="block text-[var(--fg-muted)] text-xs uppercase tracking-wide mb-1.5"><Lock size={10} className="inline mr-1" /> Current password</label>
                        <input type="password" value={curPw} onChange={e => setCurPw(e.target.value)} className={INPUT} placeholder="Current password" />
                      </div>
                      <div>
                        <label className="block text-[var(--fg-muted)] text-xs uppercase tracking-wide mb-1.5">New password</label>
                        <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} className={INPUT} placeholder="At least 8 characters" minLength={8} />
                      </div>
                      <div>
                        <label className="block text-[var(--fg-muted)] text-xs uppercase tracking-wide mb-1.5">Confirm new password</label>
                        <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} className={INPUT} placeholder="Re-enter new password" />
                      </div>
                      {pwError && <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/8 border border-rose-500/20 text-rose-500 text-xs"><AlertCircle size={13} /> {pwError}</div>}
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={handlePasswordChange} disabled={pwSaving || !curPw || !newPw || !confirmPw}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all disabled:opacity-50">
                          {pwSaving ? <><Save size={13} className="animate-spin" /> Saving…</> : <><Check size={13} /> Change Password</>}
                        </button>
                        <button type="button" onClick={() => { setShowPwForm(false); setPwError(null); setCurPw(""); setNewPw(""); setConfirmPw(""); }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] text-sm transition-all">
                          <X size={13} /> Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2FA */}
                <TwoFASection />
              </div>
            )}

            {/* ── LANGUAGE ── */}
            {active === "language" && (
              <div className="flex flex-col gap-4">
                <h2 className="text-[var(--fg)] font-semibold">Language &amp; Region</h2>
                {[
                  { label: "Interface language", options: ["English", "French", "Swahili"],           value: lang,  setter: setLang  },
                  { label: "Date format",         options: ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"], value: date,  setter: setDate  },
                  { label: "Time zone",           options: ["Africa/Kigali (UTC+2)", "UTC", "CET"],    value: tz,    setter: setTz    },
                  { label: "Currency",            options: ["RWF", "USD", "EUR", "KES", "NGN"],        value: curr,  setter: setCurr  },
                ].map(({ label, options, value, setter }) => (
                  <div key={label}>
                    <label className="block text-[var(--fg-muted)] text-xs uppercase tracking-wide mb-1.5">{label}</label>
                    <select value={value} onChange={e => setter(e.target.value)} aria-label={label} className={INPUT + " appearance-none cursor-pointer"}>
                      {options.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
                <button type="button" onClick={handleSave}
                  className="self-start flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all mt-2">
                  {saved ? <><Check size={13} /> Saved!</> : <><Save size={13} /> Save preferences</>}
                </button>
              </div>
            )}

            {/* ── API KEYS ── */}
            {active === "api" && <ApiKeysTab />}

            {/* ── SESSIONS ── */}
            {active === "sessions" && <SessionsTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
