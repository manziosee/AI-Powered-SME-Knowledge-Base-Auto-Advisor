"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props { children: React.ReactNode; fallback?: React.ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Dashboard error boundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-4 p-8">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center">
            <AlertTriangle size={24} className="text-rose-500" />
          </div>
          <div className="text-center">
            <h3 className="text-[var(--fg)] font-semibold text-base mb-1">Something went wrong</h3>
            <p className="text-[var(--fg-muted)] text-sm max-w-sm">
              {this.state.error?.message ?? "An unexpected error occurred in this section."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all"
          >
            <RefreshCw size={14} /> Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
