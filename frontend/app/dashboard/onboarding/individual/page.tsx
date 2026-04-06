"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Upload, MessageSquare, ShieldCheck, CheckCircle, ChevronRight, RefreshCw, Brain } from "lucide-react";
import { documents as docsApi } from "@/lib/api";

const STEPS = [
  { id: "welcome",   label: "Welcome",          icon: User        },
  { id: "document",  label: "Upload a Document", icon: Upload      },
  { id: "advisor",   label: "AI Advisor",        icon: MessageSquare },
  { id: "done",      label: "All Set!",          icon: CheckCircle },
];

const FEATURES = [
  { icon: Upload,        label: "Upload Documents",  desc: "PDF, DOCX, XLSX — up to 50 MB each" },
  { icon: MessageSquare, label: "AI Advisor",         desc: "Ask questions about your documents" },
  { icon: ShieldCheck,   label: "Compliance Checks",  desc: "Country-specific compliance rules" },
  { icon: Brain,         label: "Knowledge Base",     desc: "AI extracts key info automatically" },
];

export default function IndividualOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const progress = Math.round((step / (STEPS.length - 1)) * 100);

  const handleNext = async () => {
    setError(null);
    setBusy(true);
    try {
      if (step === 1 && file) {
        const { error: e } = await docsApi.upload(file);
        if (e) { setError(e); setBusy(false); return; }
        setUploaded(true);
      }
      setStep(s => Math.min(s + 1, STEPS.length - 1));
    } catch (ex: any) {
      setError(String(ex));
    } finally {
      setBusy(false);
    }
  };

  const finish = () => {
    localStorage.setItem("individual_onboarded", "1");
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg)]">
      <div className="w-full max-w-lg">

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex flex-col items-center gap-1">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                  i < step  ? "border-amber-500 bg-amber-500 text-white" :
                  i === step ? "border-amber-500 text-amber-400" :
                               "border-[var(--border)] text-[var(--fg-muted)]"
                }`}>
                  {i < step ? <CheckCircle size={16} /> : <s.icon size={16} />}
                </div>
                <span className={`text-[10px] hidden sm:block ${i === step ? "text-amber-400 font-semibold" : "text-[var(--fg-muted)]"}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
          <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-xl">

          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                  <User size={22} className="text-amber-500" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[var(--fg)]">Welcome to AdvisorAI</h2>
                  <p className="text-[var(--fg-muted)] text-sm">Personal account</p>
                </div>
              </div>
              <p className="text-[var(--fg-muted)] text-sm leading-relaxed">
                Your personal workspace is ready. Here&apos;s what you can do with your account:
              </p>
              <div className="grid grid-cols-2 gap-3">
                {FEATURES.map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-soft)]">
                    <Icon size={16} className="text-amber-500 mb-2" />
                    <p className="text-[var(--fg-soft)] text-xs font-semibold">{label}</p>
                    <p className="text-[var(--fg-muted)] text-[10px] mt-0.5">{desc}</p>
                  </div>
                ))}
              </div>
              <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400 text-xs">
                💡 Personal accounts are for individual use. To collaborate with a team, register a company account.
              </div>
            </div>
          )}

          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black text-[var(--fg)]">Upload your first document</h2>
                <p className="text-[var(--fg-muted)] text-sm mt-1">Try a contract, invoice, or any business document. The AI will extract key information automatically.</p>
              </div>
              {uploaded ? (
                <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/8">
                  <CheckCircle size={18} className="text-emerald-400" />
                  <p className="text-emerald-400 text-sm font-medium">Document uploaded! Processing in background.</p>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-3 p-8 rounded-2xl border-2 border-dashed border-[var(--border)] hover:border-amber-500/40 cursor-pointer transition-all">
                  <Upload size={28} className="text-amber-400" />
                  <div className="text-center">
                    <p className="text-[var(--fg-soft)] font-medium text-sm">Click to select a file</p>
                    <p className="text-[var(--fg-muted)] text-xs mt-0.5">PDF, DOCX, XLSX, TXT — max 50 MB</p>
                  </div>
                  {file && <p className="text-amber-400 text-sm font-medium">{file.name}</p>}
                  <input type="file" accept=".pdf,.docx,.xlsx,.txt,.doc,.xls" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" />
                </label>
              )}
              <p className="text-[var(--fg-muted)] text-xs">You can skip this and upload documents later from the Documents page.</p>
            </div>
          )}

          {/* Step 2: AI Advisor intro */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black text-[var(--fg)]">Meet your AI Advisor</h2>
                <p className="text-[var(--fg-muted)] text-sm mt-1">Ask questions about your documents in plain English and get cited answers instantly.</p>
              </div>
              <div className="space-y-3">
                {[
                  "\"What are the payment terms in my contract?\"",
                  "\"When does my business license expire?\"",
                  "\"What VAT obligations apply to me?\"",
                ].map((q) => (
                  <div key={q} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-soft)]">
                    <MessageSquare size={14} className="text-amber-400 flex-shrink-0" />
                    <p className="text-[var(--fg-soft)] text-xs italic">{q}</p>
                    <ChevronRight size={12} className="text-[var(--fg-muted)] ml-auto flex-shrink-0" />
                  </div>
                ))}
              </div>
              <p className="text-[var(--fg-muted)] text-xs">Upload documents first, then ask the AI Advisor anything about them.</p>
            </div>
          )}

          {/* Step 3: Done */}
          {step === 3 && (
            <div className="text-center space-y-5 py-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30">
                <CheckCircle size={32} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[var(--fg)]">You&apos;re all set!</h2>
                <p className="text-[var(--fg-muted)] text-sm mt-1">Your personal workspace is ready. Start by uploading a document or asking the AI Advisor a question.</p>
              </div>
              <button
                onClick={finish}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-sm hover:opacity-90 transition-all"
              >
                Go to Dashboard
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 px-4 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/8 text-rose-400 text-xs">
              {error}
            </div>
          )}

          {step < 3 && (
            <div className="flex items-center justify-between mt-8">
              <button
                onClick={() => setStep(s => Math.max(0, s - 1))}
                disabled={step === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--fg-muted)] text-sm hover:text-[var(--fg)] transition-all disabled:opacity-30"
              >
                ← Back
              </button>
              <button
                onClick={handleNext}
                disabled={busy}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
              >
                {busy ? <RefreshCw size={14} className="animate-spin" /> : null}
                {step === 1 && !file ? "Skip" : "Continue"}
                {!busy && <ChevronRight size={15} />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
