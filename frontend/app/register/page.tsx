"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Check } from "lucide-react";
import Logo from "@/components/ui/Logo";
import Button from "@/components/ui/Button";

const COUNTRIES = [
  "Rwanda", "Kenya", "Nigeria", "South Africa",
  "France", "United States", "Uganda", "Tanzania",
  "Ghana", "Ethiopia", "Other",
];

const INDUSTRIES = [
  "Professional Services", "Technology", "Healthcare",
  "Retail & E-commerce", "Logistics & Supply Chain",
  "Finance & Banking", "Agriculture", "Education",
  "Legal & Accounting", "Manufacturing", "Other",
];

export default function RegisterPage() {
  const router = useRouter();
  const [step,     setStep]    = useState(1);
  const [showPw,   setShowPw]  = useState(false);
  const [loading,  setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", password: "", company: "", country: "", industry: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    const user = {
      id: "new", name: form.name, email: form.email,
      role: "Admin", company: form.company, avatar: form.name.slice(0, 2).toUpperCase(),
      country: form.country,
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_user", JSON.stringify(user));
    }
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-ink flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="md" />
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2].map((s) => (
            <React.Fragment key={s}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
                step >= s ? "bg-white text-black" : "bg-white/10 text-white/30"
              }`}>
                {step > s ? <Check size={14} /> : s}
              </div>
              {s < 2 && (
                <div className={`flex-1 h-px transition-all ${step > s ? "bg-white/40" : "bg-white/10"}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-white/3 border border-white/10 rounded-2xl p-8">
          {step === 1 && (
            <>
              <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
              <p className="text-white/40 text-sm mb-6">Start free — no credit card required.</p>

              <form onSubmit={handleNext} className="flex flex-col gap-4">
                <div>
                  <label className="block text-white/50 text-xs uppercase tracking-wide mb-1.5">Full name</label>
                  <input
                    type="text" value={form.name} onChange={(e) => set("name", e.target.value)}
                    placeholder="Alice Uwimana" required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-white/30 text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-white/50 text-xs uppercase tracking-wide mb-1.5">Work email</label>
                  <input
                    type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                    placeholder="alice@company.com" required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-white/30 text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-white/50 text-xs uppercase tracking-wide mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"} value={form.password}
                      onChange={(e) => set("password", e.target.value)}
                      placeholder="Min 8 characters" required minLength={8}
                      className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-white/30 text-sm transition-all"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <Button variant="primary" size="lg" type="submit" className="mt-2 w-full justify-center">
                  Continue <ArrowRight size={16} />
                </Button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-2xl font-bold text-white mb-1">Tell us about your business</h1>
              <p className="text-white/40 text-sm mb-6">We&apos;ll set up the right compliance rules for you.</p>

              <form onSubmit={handleRegister} className="flex flex-col gap-4">
                <div>
                  <label className="block text-white/50 text-xs uppercase tracking-wide mb-1.5">Company name</label>
                  <input
                    type="text" value={form.company} onChange={(e) => set("company", e.target.value)}
                    placeholder="TechVentures Ltd" required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-white/30 text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-white/50 text-xs uppercase tracking-wide mb-1.5">Country</label>
                  <select
                    value={form.country} onChange={(e) => set("country", e.target.value)} required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30 text-sm transition-all appearance-none"
                  >
                    <option value="" className="bg-ink">Select country…</option>
                    {COUNTRIES.map((c) => <option key={c} value={c} className="bg-ink">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-white/50 text-xs uppercase tracking-wide mb-1.5">Industry</label>
                  <select
                    value={form.industry} onChange={(e) => set("industry", e.target.value)} required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30 text-sm transition-all appearance-none"
                  >
                    <option value="" className="bg-ink">Select industry…</option>
                    {INDUSTRIES.map((i) => <option key={i} value={i} className="bg-ink">{i}</option>)}
                  </select>
                </div>

                <div className="flex gap-3 mt-2">
                  <Button variant="outline" size="lg" type="button" onClick={() => setStep(1)} className="flex-1 justify-center">
                    Back
                  </Button>
                  <Button variant="primary" size="lg" type="submit" disabled={loading} className="flex-1 justify-center">
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        Creating…
                      </span>
                    ) : (
                      <> Create account <ArrowRight size={16} /> </>
                    )}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-white/30 text-sm mt-6">
          Already have an account?{" "}
          <a href="/login" className="text-white/60 hover:text-white transition-colors">Sign in</a>
        </p>

        <p className="text-center text-white/15 text-xs mt-4">
          By creating an account you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
