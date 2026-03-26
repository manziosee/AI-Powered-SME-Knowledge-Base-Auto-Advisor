"use client";

import React, { useState, useEffect } from "react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import SearchModal from "@/components/ui/SearchModal";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div className="flex h-screen bg-[var(--bg)] overflow-hidden">
      <DashboardSidebar onSearchOpen={() => setSearchOpen(true)} />
      <main className="flex-1 overflow-y-auto bg-[var(--bg)]">
        {children}
      </main>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
