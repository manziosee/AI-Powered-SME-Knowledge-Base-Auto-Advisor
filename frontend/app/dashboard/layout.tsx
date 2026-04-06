"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import SearchModal from "@/components/ui/SearchModal";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import LiveNotificationBanner from "@/components/LiveNotificationBanner";
import { auth as authApi } from "@/lib/api";

const SESSION_WARN_MS = 5 * 60 * 1000; // warn 5 min before expiry

function parseJwtExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [sessionWarning, setSessionWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const extendSession = useCallback(async () => {
    const rt = localStorage.getItem("refresh_token");
    if (!rt) return;
    const res = await authApi.me(); // triggers auto-refresh via the api client
    if (!res.error) setSessionWarning(false);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/login");
      return;
    }
    setReady(true);

    // Redirect individual users to individual onboarding if not done
    const stored = localStorage.getItem("auth_user");
    if (stored) {
      const u = JSON.parse(stored);
      if (u.account_type === "individual" && !localStorage.getItem("individual_onboarded")) {
        router.replace("/dashboard/onboarding/individual");
        return;
      }
    }

    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKey);

    // Session expiry warning
    const checkExpiry = () => {
      const t = localStorage.getItem("access_token");
      if (!t) return;
      const exp = parseJwtExp(t);
      if (!exp) return;
      const remaining = exp - Date.now();
      if (remaining > 0 && remaining <= SESSION_WARN_MS) {
        setSessionWarning(true);
        setSecondsLeft(Math.floor(remaining / 1000));
      } else if (remaining <= 0) {
        setSessionWarning(false);
      } else {
        setSessionWarning(false);
      }
    };

    const expiryInterval = setInterval(checkExpiry, 10_000);
    checkExpiry();

    // Countdown ticker when warning is active
    const countdownInterval = setInterval(() => {
      setSecondsLeft(s => Math.max(0, s - 1));
    }, 1000);

    return () => {
      window.removeEventListener("keydown", handleKey);
      clearInterval(expiryInterval);
      clearInterval(countdownInterval);
    };
  }, [router]);

  if (!ready) return null;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <div className="flex h-screen bg-[var(--bg)] overflow-hidden">
      <DashboardSidebar onSearchOpen={() => setSearchOpen(true)} />
      <main className="flex-1 overflow-y-auto bg-[var(--bg)] relative">

        {/* Session expiry warning banner */}
        {sessionWarning && secondsLeft > 0 && (
          <div className="sticky top-0 z-40 flex items-center justify-between gap-4 px-5 py-2.5 bg-amber-500/95 backdrop-blur-sm text-white text-xs font-semibold shadow-lg">
            <span>
              ⏱ Your session expires in{" "}
              <strong>{mins > 0 ? `${mins}m ` : ""}{secs}s</strong>
              {" "}— save your work.
            </span>
            <button
              type="button"
              onClick={extendSession}
              className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 transition-all text-white font-bold text-xs"
            >
              Stay logged in
            </button>
          </div>
        )}

        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <LiveNotificationBanner />
    </div>
  );
}
