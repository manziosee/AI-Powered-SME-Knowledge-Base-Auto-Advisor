"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import SearchModal from "@/components/ui/SearchModal";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/login");
      return;
    }
    setReady(true);

    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [router]);

  if (!ready) return null;

  return (
    <div className="flex h-screen bg-[var(--bg)] overflow-hidden">
      <DashboardSidebar onSearchOpen={() => setSearchOpen(true)} />
      <main className="flex-1 overflow-y-auto bg-[var(--bg)]">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
