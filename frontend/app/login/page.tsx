"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";
import Logo from "@/components/ui/Logo";
import Button from "@/components/ui/Button";
import { DEMO_USERS } from "@/lib/mock-data";

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    await new Promise((r) => setTimeout(r, 800));

    const user = DEMO_USERS.find(
      (u) => u.email === email && u.password === password
    );

    if (user) {
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_user", JSON.stringify(user));
      }
      router.push("/dashboard");
    } else {
      setError("Invalid email or password. Try a demo account below.");
    }
    setLoading(false);
  };

  const quickLogin = (user: (typeof DEMO_USERS)[0]) => {
    setEmail(user.email);
    setPassword(user.password);
  };

  return (
    <div className="min-h-screen bg-ink flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12">
        {/* Background grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink to-ink-muted" />

        {/* Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-[100px]" />

        <div className="relative z-10">
          <Logo size="md" />
        </div>

        <div className="relative z-10">
          <blockquote className="text-2xl font-semibold text-white leading-snug mb-6">
            &ldquo;AdvisorAI found a contract renewal we had completely missed.
            Saved us $24,000 in auto-renewal fees.&rdquo;
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-sm">
              JM
            </div>
            <div>
              <p className="text-white text-sm font-medium">James Mwangi</p>
              <p className="text-white/40 text-xs">Operations Manager, RetailPro Kenya</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap gap-4 text-white/25 text-xs">
          <span>🔒 SOC 2 ready</span>
          <span>🌍 7 jurisdictions</span>
          <span>⚡ Powered by Groq</span>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col justify-center px-6 lg:px-16 py-12">
        <div className="max-w-md w-full mx-auto">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Logo size="sm" />
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-white/40 mb-8">Sign in to your AdvisorAI workspace.</p>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 mb-5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-white/60 text-xs font-medium mb-2 uppercase tracking-wide">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 focus:outline-none focus:border-white/30 focus:bg-white/8 transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-white/60 text-xs font-medium mb-2 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 focus:outline-none focus:border-white/30 focus:bg-white/8 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="flex justify-end mt-1.5">
                <a href="#" className="text-white/35 text-xs hover:text-white/60 transition-colors">
                  Forgot password?
                </a>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              type="submit"
              disabled={loading}
              className="mt-2 w-full justify-center"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={16} />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-white/30 text-sm mt-6">
            Don&apos;t have an account?{" "}
            <a href="/register" className="text-white/60 hover:text-white transition-colors">
              Create one free
            </a>
          </p>

          {/* Demo accounts */}
          <div className="mt-8 pt-6 border-t border-white/8">
            <p className="text-white/30 text-xs text-center mb-3 uppercase tracking-wide">
              Demo accounts — click to fill
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.id}
                  onClick={() => quickLogin(u)}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-white/8 hover:border-white/20 hover:bg-white/5 transition-all text-left"
                >
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 font-bold text-xs flex-shrink-0">
                    {u.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white/70 text-xs font-medium truncate">{u.name.split(" ")[0]}</p>
                    <p className="text-white/30 text-[10px] truncate">{u.role}</p>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-center text-white/20 text-xs mt-2">
              Password for all demo accounts: <code className="text-white/40">demo1234</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
