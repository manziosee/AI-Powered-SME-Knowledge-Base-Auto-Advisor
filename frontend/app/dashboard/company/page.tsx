"use client";

import React from "react";
import { Building2, Globe, Users, Shield, MoreHorizontal, Plus } from "lucide-react";
import { DEMO_USERS } from "@/lib/mock-data";
import Button from "@/components/ui/Button";

const roleColors: Record<string, string> = {
  Admin:    "text-white/80 bg-white/10 border-white/20",
  Manager:  "text-white/60 bg-white/6  border-white/12",
  Employee: "text-white/40 bg-white/3  border-white/8",
};

export default function CompanyPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Company</h1>
          <p className="text-white/40 text-sm mt-0.5">Manage your organisation profile</p>
        </div>
        <Button variant="primary" size="sm">
          <Plus size={13} /> Invite member
        </Button>
      </div>

      {/* Company profile card */}
      <div className="p-6 rounded-2xl bg-white/3 border border-white/10 mb-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-white/8 flex items-center justify-center text-white">
            <Building2 size={28} />
          </div>
          <div className="flex-1">
            <h2 className="text-white text-xl font-bold">TechVentures RW</h2>
            <p className="text-white/40 text-sm mt-0.5">Professional Services · Rwanda</p>
            <div className="flex flex-wrap gap-4 mt-4">
              {[
                { icon: Globe,  label: "Kigali, Rwanda"   },
                { icon: Users,  label: "18 employees"     },
                { icon: Shield, label: "94% compliant"    },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-white/40 text-xs">
                  <Icon size={12} /> {label}
                </div>
              ))}
            </div>
          </div>
          <Button variant="outline" size="sm">Edit profile</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-px bg-white/8 rounded-xl overflow-hidden mt-6">
          {[
            { label: "Documents",    value: "1,248" },
            { label: "Team members", value: "18"    },
            { label: "Integrations", value: "3"     },
            { label: "On plan",      value: "Growth" },
          ].map((s) => (
            <div key={s.label} className="bg-ink px-4 py-3">
              <p className="text-white font-black text-xl">{s.value}</p>
              <p className="text-white/35 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team members */}
      <div>
        <h3 className="text-white font-semibold mb-4">Team Members</h3>
        <div className="rounded-2xl border border-white/8 overflow-hidden">
          <div className="grid grid-cols-12 px-5 py-3 bg-white/3 border-b border-white/8 text-white/30 text-xs uppercase tracking-wide">
            <div className="col-span-5">Member</div>
            <div className="col-span-3">Role</div>
            <div className="col-span-3">Company</div>
            <div className="col-span-1" />
          </div>

          {[...DEMO_USERS, {
            id: "u5", name: "Eric Habimana", email: "eric@techventures.rw",
            role: "Employee", company: "TechVentures RW", avatar: "EH", country: "Rwanda", password: "",
          }].map((user, i, arr) => (
            <div key={user.id}
              className={`grid grid-cols-12 px-5 py-4 items-center hover:bg-white/3 transition-all ${
                i < arr.length - 1 ? "border-b border-white/5" : ""
              }`}>
              <div className="col-span-5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/60 font-bold text-sm">
                  {user.avatar}
                </div>
                <div>
                  <p className="text-white/80 text-sm font-medium">{user.name}</p>
                  <p className="text-white/30 text-xs">{user.email}</p>
                </div>
              </div>
              <div className="col-span-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${roleColors[user.role]}`}>
                  {user.role}
                </span>
              </div>
              <div className="col-span-3 text-white/40 text-sm">{user.company}</div>
              <div className="col-span-1 flex justify-end">
                <button className="p-1.5 rounded-lg hover:bg-white/10 text-white/25 hover:text-white transition-all">
                  <MoreHorizontal size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
