"use client";

import React, { useState } from "react";
import { User, Bell, Shield, Globe, Key, Save, Eye, EyeOff, Check, Copy } from "lucide-react";
import Button from "@/components/ui/Button";
import { CURRENT_USER } from "@/lib/mock-data";

const tabs = [
  { id: "profile",       label: "Profile",       icon: User   },
  { id: "notifications", label: "Notifications", icon: Bell   },
  { id: "security",      label: "Security",      icon: Shield },
  { id: "language",      label: "Language",      icon: Globe  },
  { id: "api",           label: "API Keys",      icon: Key    },
];

const INPUT = "w-full px-3 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--fg)] text-sm focus:outline-none focus:border-violet-500/50 focus:bg-violet-500/5 transition-all placeholder-[var(--fg-muted)]";

export default function SettingsPage() {
  const [active, setActive] = useState("profile");
  const [saved,  setSaved]  = useState(false);
  const [name,   setName]   = useState(CURRENT_USER.name);
  const [email,  setEmail]  = useState(CURRENT_USER.email);

  // Notification toggles — interactive state
  const [notifs, setNotifs] = useState<Record<string, boolean>>({
    "deadline":   true,
    "gap":        true,
    "docready":   true,
    "risk":       false,
    "digest":     true,
    "webhook":    false,
  });
  const toggleNotif = (key: string) => setNotifs((prev) => ({ ...prev, [key]: !prev[key] }));

  // Language / region state
  const [lang,   setLang]   = useState("English");
  const [date,   setDate]   = useState("YYYY-MM-DD");
  const [tz,     setTz]     = useState("Africa/Kigali (UTC+2)");
  const [curr,   setCurr]   = useState("RWF");

  // API key reveal
  const [revealed, setRevealed] = useState(false);
  const [copied,   setCopied]   = useState(false);
  const FAKE_KEY = "sk-adv-7f3a9c2d1e8b4f6a0d5c3b2e9a7f1c4d";

  const handleCopy = () => {
    navigator.clipboard.writeText(FAKE_KEY).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--fg)] mb-8">Settings</h1>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-48 flex-shrink-0">
          <nav className="flex flex-col gap-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" onClick={() => setActive(id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-left transition-all ${
                  active === id
                    ? "bg-violet-500/15 border border-violet-500/30 text-violet-500 font-medium"
                    : "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface)]"
                }`}>
                <Icon size={15} /> {label}
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
                    {CURRENT_USER.avatar}
                  </div>
                  <div>
                    <p className="text-[var(--fg-soft)] text-sm font-medium">{CURRENT_USER.name}</p>
                    <p className="text-[var(--fg-muted)] text-xs">{CURRENT_USER.role} · {CURRENT_USER.company}</p>
                    <button type="button" className="text-violet-500 hover:text-violet-400 text-xs mt-1 transition-colors">
                      Change avatar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[var(--fg-muted)] text-xs uppercase tracking-wide mb-1.5">Full name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={INPUT} />
                  </div>
                  <div>
                    <label className="block text-[var(--fg-muted)] text-xs uppercase tracking-wide mb-1.5">Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={INPUT} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[var(--fg-muted)] text-xs uppercase tracking-wide mb-1.5">Role</label>
                    <div className="px-3 py-2.5 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl text-[var(--fg-muted)] text-sm">{CURRENT_USER.role}</div>
                  </div>
                  <div>
                    <label className="block text-[var(--fg-muted)] text-xs uppercase tracking-wide mb-1.5">Country</label>
                    <div className="px-3 py-2.5 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl text-[var(--fg-muted)] text-sm">{CURRENT_USER.country}</div>
                  </div>
                </div>

                <button type="button" onClick={handleSave}
                  className="self-start flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all shadow-[0_0_15px_rgba(124,58,237,0.25)]">
                  {saved ? <><Check size={13} /> Saved!</> : <><Save size={13} /> Save changes</>}
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
                      aria-label={`Toggle ${label}`}
                      role="switch"
                      aria-checked="true"
                      className={`w-10 h-5 min-w-[2.5rem] rounded-full transition-all relative flex-shrink-0 ${
                        notifs[key] ? "bg-violet-500 shadow-[0_0_10px_rgba(167,139,250,0.4)]" : "bg-[var(--border)]"
                      }`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${notifs[key] ? "left-5" : "left-0.5"}`} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={handleSave}
                  className="self-start flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all mt-2 shadow-[0_0_15px_rgba(124,58,237,0.25)]">
                  {saved ? <><Check size={13} /> Saved!</> : <><Save size={13} /> Save preferences</>}
                </button>
              </div>
            )}

            {/* ── SECURITY ── */}
            {active === "security" && (
              <div className="flex flex-col gap-5">
                <h2 className="text-[var(--fg)] font-semibold">Security</h2>
                <div className="flex flex-col gap-3">
                  {[
                    { label: "Change password",           desc: "Last changed 30 days ago",    action: "Update"  },
                    { label: "Two-factor authentication", desc: "Not enabled — recommended",   action: "Enable"  },
                    { label: "Active sessions",           desc: "2 active sessions",            action: "Manage"  },
                    { label: "Download my data",          desc: "Export all your account data", action: "Export"  },
                  ].map(({ label, desc, action }) => (
                    <div key={label} className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)]">
                      <div>
                        <p className="text-[var(--fg-soft)] text-sm font-medium">{label}</p>
                        <p className="text-[var(--fg-muted)] text-xs mt-0.5">{desc}</p>
                      </div>
                      <button type="button"
                        className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--fg-soft)] hover:text-violet-500 hover:border-violet-500/40 text-xs font-medium transition-all">
                        {action}
                      </button>
                    </div>
                  ))}
                </div>
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
                    <select value={value} onChange={(e) => setter(e.target.value)}
                      title={label}
                      aria-label={label}
                      className={INPUT + " appearance-none cursor-pointer"}>
                      {options.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
                <button type="button" onClick={handleSave}
                  className="self-start flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all mt-2 shadow-[0_0_15px_rgba(124,58,237,0.25)]">
                  {saved ? <><Check size={13} /> Saved!</> : <><Save size={13} /> Save preferences</>}
                </button>
              </div>
            )}

            {/* ── API KEYS ── */}
            {active === "api" && (
              <div className="flex flex-col gap-5">
                <h2 className="text-[var(--fg)] font-semibold">API Keys</h2>
                <p className="text-[var(--fg-muted)] text-sm">Use API keys to integrate AdvisorAI with your own tools. Keep your key secret.</p>

                <div className="p-4 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-xs text-[var(--fg-soft)] flex-1 truncate">
                      {revealed ? FAKE_KEY : "sk-adv-••••••••••••••••••••••••••••••••"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={() => setRevealed((v) => !v)}
                        className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--fg-muted)] hover:text-violet-500 hover:border-violet-500/40 transition-all">
                        {revealed ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                      <button type="button" onClick={handleCopy}
                        className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--fg-muted)] hover:text-violet-500 hover:border-violet-500/40 transition-all">
                        {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--border)]">
                    <p className="text-[var(--fg-muted)] text-xs">Created: Jan 15, 2026</p>
                    <p className="text-[var(--fg-muted)] text-xs">Last used: 2 hours ago</p>
                  </div>
                </div>

                <button type="button"
                  className="self-start flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--fg-soft)] hover:text-violet-500 hover:border-violet-500/40 text-sm font-medium transition-all">
                  <Key size={13} /> Generate new key
                </button>

                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <p className="text-amber-500 text-xs font-medium">Generating a new key will invalidate the current one.</p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
