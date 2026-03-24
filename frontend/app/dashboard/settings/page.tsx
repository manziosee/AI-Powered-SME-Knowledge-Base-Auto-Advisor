"use client";

import React, { useState } from "react";
import { User, Bell, Shield, Globe, Key, Save } from "lucide-react";
import Button from "@/components/ui/Button";
import { CURRENT_USER } from "@/lib/mock-data";

const tabs = [
  { id: "profile",       label: "Profile",       icon: User     },
  { id: "notifications", label: "Notifications", icon: Bell     },
  { id: "security",      label: "Security",      icon: Shield   },
  { id: "language",      label: "Language",      icon: Globe    },
  { id: "api",           label: "API Keys",      icon: Key      },
];

export default function SettingsPage() {
  const [active, setActive] = useState("profile");
  const [saved,  setSaved]  = useState(false);
  const [name,   setName]   = useState(CURRENT_USER.name);
  const [email,  setEmail]  = useState(CURRENT_USER.email);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-8">Settings</h1>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-48 flex-shrink-0">
          <nav className="flex flex-col gap-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActive(id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-left transition-all ${
                  active === id ? "bg-white text-black font-medium" : "text-white/50 hover:text-white hover:bg-white/5"
                }`}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
            {active === "profile" && (
              <div className="flex flex-col gap-5">
                <h2 className="text-white font-semibold">Profile Settings</h2>

                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-white font-black text-xl">
                    {CURRENT_USER.avatar}
                  </div>
                  <div>
                    <p className="text-white/70 text-sm font-medium">{CURRENT_USER.name}</p>
                    <p className="text-white/35 text-xs">{CURRENT_USER.role} · {CURRENT_USER.company}</p>
                    <button className="text-white/40 text-xs mt-1 hover:text-white transition-colors">Change avatar</button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Full name",  value: name,  setter: setName,  type: "text"  },
                    { label: "Email",      value: email, setter: setEmail, type: "email" },
                  ].map(({ label, value, setter, type }) => (
                    <div key={label}>
                      <label className="block text-white/50 text-xs uppercase tracking-wide mb-1.5">{label}</label>
                      <input type={type} value={value} onChange={(e) => setter(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white/80 text-sm focus:outline-none focus:border-white/25 transition-all" />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/50 text-xs uppercase tracking-wide mb-1.5">Role</label>
                    <div className="px-3 py-2.5 bg-white/3 border border-white/8 rounded-xl text-white/40 text-sm">{CURRENT_USER.role}</div>
                  </div>
                  <div>
                    <label className="block text-white/50 text-xs uppercase tracking-wide mb-1.5">Country</label>
                    <div className="px-3 py-2.5 bg-white/3 border border-white/8 rounded-xl text-white/40 text-sm">{CURRENT_USER.country}</div>
                  </div>
                </div>

                <Button variant="primary" size="sm" onClick={handleSave} className="self-start">
                  <Save size={13} /> {saved ? "Saved!" : "Save changes"}
                </Button>
              </div>
            )}

            {active === "notifications" && (
              <div className="flex flex-col gap-4">
                <h2 className="text-white font-semibold mb-2">Notification Preferences</h2>
                {[
                  { label: "Deadline reminders",         desc: "Get alerted 30, 7, and 1 day before deadlines",       on: true  },
                  { label: "Compliance gap alerts",       desc: "Notify when new compliance gaps are detected",         on: true  },
                  { label: "Document processed",          desc: "Alert when document processing completes",             on: true  },
                  { label: "Risk level changes",          desc: "Alert when a document risk level changes",             on: false },
                  { label: "Weekly digest email",         desc: "Summary of activity and upcoming deadlines",           on: true  },
                  { label: "Integration webhook failures",desc: "Alert when an outgoing webhook fails",                 on: false },
                ].map(({ label, desc, on }) => (
                  <div key={label} className="flex items-center justify-between p-4 rounded-xl bg-white/3 border border-white/8">
                    <div>
                      <p className="text-white/80 text-sm font-medium">{label}</p>
                      <p className="text-white/35 text-xs mt-0.5">{desc}</p>
                    </div>
                    <div className={`w-10 h-5 rounded-full transition-all cursor-pointer ${on ? "bg-white" : "bg-white/15"}`}>
                      <div className={`w-4 h-4 rounded-full bg-black/80 m-0.5 transition-all ${on ? "translate-x-5" : "translate-x-0"}`} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {active === "security" && (
              <div className="flex flex-col gap-5">
                <h2 className="text-white font-semibold">Security</h2>
                <div className="flex flex-col gap-3">
                  {[
                    { label: "Change password",       desc: "Last changed 30 days ago"     },
                    { label: "Two-factor authentication", desc: "Not enabled — recommended" },
                    { label: "Active sessions",       desc: "2 active sessions"             },
                    { label: "API access tokens",     desc: "1 token active"                },
                  ].map(({ label, desc }) => (
                    <div key={label} className="flex items-center justify-between p-4 rounded-xl bg-white/3 border border-white/8">
                      <div>
                        <p className="text-white/80 text-sm font-medium">{label}</p>
                        <p className="text-white/35 text-xs mt-0.5">{desc}</p>
                      </div>
                      <Button variant="outline" size="sm">Manage</Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {active === "api" && (
              <div className="flex flex-col gap-5">
                <h2 className="text-white font-semibold">API Keys</h2>
                <p className="text-white/40 text-sm">Use API keys to integrate AdvisorAI with your own tools.</p>
                <div className="p-4 rounded-xl bg-white/3 border border-white/8 font-mono text-xs text-white/50 flex items-center justify-between">
                  <span>sk-adv-••••••••••••••••••••••••••••••••</span>
                  <Button variant="ghost" size="sm">Reveal</Button>
                </div>
                <Button variant="outline" size="sm" className="self-start">
                  <Key size={13} /> Generate new key
                </Button>
              </div>
            )}

            {(active === "language") && (
              <div className="flex flex-col gap-4">
                <h2 className="text-white font-semibold">Language &amp; Region</h2>
                {[
                  { label: "Interface language",  options: ["English", "French", "Swahili"],          selected: "English"         },
                  { label: "Date format",          options: ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"], selected: "YYYY-MM-DD"     },
                  { label: "Time zone",            options: ["Africa/Kigali (UTC+2)", "UTC", "CET"],   selected: "Africa/Kigali"   },
                  { label: "Currency",             options: ["RWF", "USD", "EUR", "KES", "NGN"],       selected: "RWF"             },
                ].map(({ label, options, selected }) => (
                  <div key={label}>
                    <label className="block text-white/50 text-xs uppercase tracking-wide mb-1.5">{label}</label>
                    <select className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white/70 text-sm focus:outline-none focus:border-white/25 appearance-none">
                      {options.map((o) => <option key={o} className="bg-ink">{o}</option>)}
                    </select>
                  </div>
                ))}
                <Button variant="primary" size="sm" onClick={handleSave} className="self-start mt-2">
                  <Save size={13} /> {saved ? "Saved!" : "Save preferences"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
