import React from "react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[var(--bg)] overflow-hidden">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto bg-[var(--bg)]">
        {children}
      </main>
    </div>
  );
}
