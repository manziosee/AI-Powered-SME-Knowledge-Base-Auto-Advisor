"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Upload, ShieldCheck, Users, CheckCircle, ChevronRight, ChevronLeft, RefreshCw } from "lucide-react";
import { company as companyApi, documents as docsApi } from "@/lib/api";

const STEPS = [
  { id: "company",    label: "Company Profile",     icon: Building2   },
  { id: "document",   label: "Upload a Document",   icon: Upload      },
  { id: "compliance", label: "Compliance Check",    icon: ShieldCheck },
  { id: "team",       label: "Invite Team Member",  icon: Users       },
  { id: "done",       label: "All Set!",            icon: CheckCircle },
];

const INPUT = "w-full px-3 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--fg)] text-sm focus:outline-none focus:border-violet-500/50 placeholder-[var(--fg-muted)]";

export default function OnboardingPage() {
  const router  = useRouter();
  const [step,  setStep]    = useState(0);
  const [busy,  setBusy]    = useState(false);
  const [error, setError]   = useState<string | null>(null);

  // Step 0 — company
  const [companyName,     setCompanyName]     = useState("");
  const [country,         setCountry]         = useState("RW");
  const [industry,        setIndustry]        = useState("");

  // Step 1 — upload
  const [file,            setFile]            = useState<File | null>(null);
  const [uploaded,        setUploaded]        = useState(false);

  // Step 3 — invite
  const [inviteEmail,     setInviteEmail]     = useState("");
  const [invited,         setInvited]         = useState(false);

  const progress = Math.round((step / (STEPS.length - 1)) * 100);

  async function handleNext() {
    setError(null);
    setBusy(true);

    try {
      if (step === 0) {
        if (!companyName.trim()) { setError("Company name is required"); setBusy(false); return; }
        const { error: e } = await companyApi.update({ name: companyName.trim(), country, industry: industry || undefined });
        if (e) { setError(e); setBusy(false); return; }
      }

      if (step === 1 && file) {
        const { error: e } = await docsApi.upload(file);
        if (e) { setError(e); setBusy(false); return; }
        setUploaded(true);
      }

      if (step === 3 && inviteEmail.trim()) {
        const { error: e } = await companyApi.inviteUser(inviteEmail.trim(), "employee");
        if (e && !e.includes("already")) { setError(e); setBusy(false); return; }
        setInvited(true);
      }

      setStep(s => Math.min(s + 1, STEPS.length - 1));
    } catch (ex: any) {
      setError(String(ex));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg)]">
      <div className="w-full max-w-xl">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex flex-col items-center gap-1">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                  i < step  ? "border-violet-500 bg-violet-500 text-white" :
                  i === step ? "border-violet-500 text-violet-400" :
                               "border-[var(--border)] text-[var(--fg-muted)]"
                }`}>
                  {i < step ? <CheckCircle size={16} /> : <s.icon size={16} />}
                </div>
                <span className={`text-[10px] hidden sm:block ${i === step ? "text-violet-400 font-semibold" : "text-[var(--fg-muted)]"}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
          <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-xl">
          {/* Step 0: Company */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black text-[var(--fg)]">Set up your company</h2>
                <p className="text-[var(--fg-muted)] text-sm mt-1">This helps personalise your compliance rules and AI recommendations.</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[var(--fg-muted)] text-xs mb-1 block">Company name *</label>
                  <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Acme Ltd" className={INPUT} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[var(--fg-muted)] text-xs mb-1 block">Country</label>
                    <select value={country} onChange={e => setCountry(e.target.value)} className={INPUT}>
                      <option value="RW">Rwanda</option>
                      <option value="KE">Kenya</option>
                      <option value="UG">Uganda</option>
                      <option value="TZ">Tanzania</option>
                      <option value="NG">Nigeria</option>
                      <option value="GH">Ghana</option>
                      <option value="ZA">South Africa</option>
                      <option value="US">United States</option>
                      <option value="GB">United Kingdom</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[var(--fg-muted)] text-xs mb-1 block">Industry</label>
                    <select value={industry} onChange={e => setIndustry(e.target.value)} className={INPUT}>
                      <option value="">Select…</option>
                      <option value="technology">Technology</option>
                      <option value="finance">Finance</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="retail">Retail</option>
                      <option value="manufacturing">Manufacturing</option>
                      <option value="agriculture">Agriculture</option>
                      <option value="construction">Construction</option>
                      <option value="education">Education</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black text-[var(--fg)]">Upload your first document</h2>
                <p className="text-[var(--fg-muted)] text-sm mt-1">The AI will extract obligations, deadlines, and risks automatically. Try a contract, policy, or tax filing.</p>
              </div>
              {uploaded ? (
                <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/8">
                  <CheckCircle size={18} className="text-emerald-400" />
                  <p className="text-emerald-400 text-sm font-medium">Document uploaded successfully! Processing in background.</p>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-3 p-8 rounded-2xl border-2 border-dashed border-[var(--border)] hover:border-violet-500/40 cursor-pointer transition-all">
                  <Upload size={28} className="text-violet-400" />
                  <div className="text-center">
                    <p className="text-[var(--fg-soft)] font-medium text-sm">Click to select a file</p>
                    <p className="text-[var(--fg-muted)] text-xs mt-0.5">PDF, DOCX, XLSX, TXT — max 50 MB</p>
                  </div>
                  {file && <p className="text-violet-400 text-sm font-medium">{file.name}</p>}
                  <input type="file" accept=".pdf,.docx,.xlsx,.txt,.doc,.xls" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" />
                </label>
              )}
              <p className="text-[var(--fg-muted)] text-xs">You can skip this step and upload documents later from the Documents page.</p>
            </div>
          )}

          {/* Step 2: Compliance info */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black text-[var(--fg)]">Compliance check ready</h2>
                <p className="text-[var(--fg-muted)] text-sm mt-1">AdvisorAI has loaded country-specific compliance rules for your region. Your compliance score will update as you add more documents.</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { label: "Country rules loaded", detail: `Rules for ${country} pre-loaded`, ok: true },
                  { label: "AI Advisor active",    detail: "Ask questions in plain English",  ok: true },
                  { label: "Risk detection",        detail: "Automatic risk scoring enabled",  ok: true },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                    <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />
                    <div>
                      <p className="text-[var(--fg-soft)] text-sm font-medium">{item.label}</p>
                      <p className="text-[var(--fg-muted)] text-xs">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Invite */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black text-[var(--fg)]">Invite a team member</h2>
                <p className="text-[var(--fg-muted)] text-sm mt-1">Collaboration is better together. Invite a colleague — you can always add more later.</p>
              </div>
              {invited ? (
                <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/8">
                  <CheckCircle size={18} className="text-emerald-400" />
                  <p className="text-emerald-400 text-sm font-medium">Invitation sent to {inviteEmail}</p>
                </div>
              ) : (
                <div>
                  <label className="text-[var(--fg-muted)] text-xs mb-1 block">Email address</label>
                  <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} type="email" placeholder="colleague@company.com" className={INPUT} />
                </div>
              )}
              <p className="text-[var(--fg-muted)] text-xs">You can skip this step and invite team members from Company settings.</p>
            </div>
          )}

          {/* Step 4: Done */}
          {step === 4 && (
            <div className="text-center space-y-5 py-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto shadow-lg shadow-violet-500/30">
                <CheckCircle size={32} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[var(--fg)]">You're all set!</h2>
                <p className="text-[var(--fg-muted)] text-sm mt-1">Your workspace is ready. Head to the dashboard to get started.</p>
              </div>
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold text-sm hover:opacity-90 transition-all"
              >
                Go to Dashboard
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 px-4 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/8 text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* Nav buttons */}
          {step < 4 && (
            <div className="flex items-center justify-between mt-8">
              <button
                onClick={() => setStep(s => Math.max(0, s - 1))}
                disabled={step === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--fg-muted)] text-sm hover:text-[var(--fg)] transition-all disabled:opacity-30"
              >
                <ChevronLeft size={15} /> Back
              </button>
              <button
                onClick={handleNext}
                disabled={busy}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
              >
                {busy ? <RefreshCw size={14} className="animate-spin" /> : null}
                {step === 3 ? (inviteEmail ? "Send Invite" : "Skip") : "Continue"}
                {!busy && <ChevronRight size={15} />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
