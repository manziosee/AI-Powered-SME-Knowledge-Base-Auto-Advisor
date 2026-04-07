"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Zap, Shield, Brain, FileText, Sparkles, Bug, Settings2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

type ChangeType = "feature" | "improvement" | "fix" | "security";

interface Change {
  type: ChangeType;
  text: string;
}

interface Release {
  version: string;
  date: string;
  tag: "latest" | "stable" | null;
  summary: string;
  changes: Change[];
}

const TYPE_CONFIG: Record<ChangeType, { label: string; cls: string; icon: React.ElementType }> = {
  feature:     { label: "New",         cls: "bg-violet-500/15 text-violet-400 border border-violet-500/25", icon: Sparkles  },
  improvement: { label: "Improved",    cls: "bg-blue-500/15   text-blue-400   border border-blue-500/25",   icon: Zap       },
  fix:         { label: "Fixed",       cls: "bg-amber-500/15  text-amber-400  border border-amber-500/25",  icon: Bug       },
  security:    { label: "Security",    cls: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25", icon: Shield },
};

const RELEASES: Release[] = [
  {
    version: "1.6.0",
    date: "April 7, 2026",
    tag: "latest",
    summary: "Activity analytics API, document reprocess flow, hardened AI prompts, WebSocket retry guard, and RAG answers that acknowledge in-flight documents.",
    changes: [
      { type: "feature",     text: "GET /analytics/activity returns daily uploads, processed docs, and knowledge entries (7/14/30d) for dashboard charts" },
      { type: "feature",     text: "POST /documents/{id}/reprocess re-triggers stuck uploads using the stored S3 object" },
      { type: "improvement", text: "Chatbot/advisor responses now acknowledge uploaded-but-processing docs instead of claiming no data" },
      { type: "improvement", text: "Dashboard activity, compliance, and advisor sidebars pull live counts instead of hardcoded placeholders" },
      { type: "improvement", text: "WebSocket client has bounded reconnect attempts to reduce noisy console errors when WS is unreachable" },
      { type: "improvement", text: "Postman collection includes activity + reprocess endpoints; API descriptions updated" },
      { type: "fix",         text: "Documents upload crash guard when name is missing; upload response maps original_filename correctly" },
      { type: "fix",         text: "AI training enforces multi-class labels client- and server-side to prevent 500s" },
      { type: "security",    text: "Chatbot prompt tightened: grounded answers, no fabrication, explicit handling of processing documents" },
    ],
  },
  {
    version: "1.5.0",
    date: "April 2, 2026",
    tag: null,
    summary: "Admin Panel, forgot password, document delete fix, audit logs, and full API coverage.",
    changes: [
      { type: "feature",     text: "Admin Panel (/dashboard/admin) — system-wide overview, user CRUD, company list, audit logs, health alerts" },
      { type: "feature",     text: "Super-admin account auto-seeded on startup (admin@admin.com, role: super_admin, no company)" },
      { type: "feature",     text: "Forgot password flow — /forgot-password and /reset-password pages with Redis-backed token" },
      { type: "feature",     text: "Admin API: GET /admin/companies, GET /admin/health-alerts, GET /admin/audit-logs, POST /admin/users, PUT /admin/users/{id}/role, DELETE /admin/users/{id}" },
      { type: "feature",     text: "Audit logs table (migration 006) — tracks all mutations with user, action, resource, IP" },
      { type: "feature",     text: "Training data supports CSV, Excel (.xlsx/.xls), Word (.docx), and TXT uploads" },
      { type: "improvement", text: "Document delete button always visible (removed opacity-0 group-hover hiding)" },
      { type: "improvement", text: "POST /admin/ml/predict-risk now accepts JSON body {text} instead of query param" },
      { type: "improvement", text: "GET /admin/stats accessible to ADMIN role (not just SUPER_ADMIN)" },
      { type: "improvement", text: "GET /admin/audit-logs accessible to ADMIN role with graceful fallback if table missing" },
      { type: "improvement", text: "Docs page (/docs) tag icons updated to cover all API groups including Admin and Integrations" },
      { type: "improvement", text: "Postman collection regenerated from live OpenAPI spec — all 60+ endpoints included" },
      { type: "fix",         text: "Fixed /admin/stats 500 — double .scalar() on exhausted SQLAlchemy result objects" },
      { type: "fix",         text: "Fixed TrainingPage crash — STATUS_CONFIG typed as Record with 'trained' key and idle fallback" },
      { type: "fix",         text: "Fixed mlStatus response normalization — backend {risk_scorer:{}} shape mapped to {status:string}" },
      { type: "security",    text: "Admin routes require minimum ADMIN role; SUPER_ADMIN required for destructive operations" },
    ],
  },
  {
    version: "1.4.0",
    date: "March 26, 2026",
    tag: null,
    summary: "Business Insights, Compliance Calendar, CI/CD pipeline, and security hardening.",
    changes: [
      { type: "feature",     text: "Business Health Score — aggregate 0–100 score with component breakdown and AI recommendations" },
      { type: "feature",     text: "Compliance Calendar — automatic statutory deadlines (VAT, payroll, GDPR, corporate tax)" },
      { type: "feature",     text: "Document Expiry Tracker — flags contracts and policies nearing expiry" },
      { type: "feature",     text: "API Documentation page at /docs — full endpoint reference with cURL, Python, TypeScript examples" },
      { type: "feature",     text: "GitHub Actions CI/CD — Docker image published to ghcr.io on every push to main" },
      { type: "security",    text: "Account lockout after 5 failed login attempts (15-minute Redis-backed lock)" },
      { type: "security",    text: "HSTS header enabled in production (max-age=63072000; includeSubDomains; preload)" },
      { type: "security",    text: "Content-Security-Policy with per-request nonces, Cross-Origin-Opener-Policy headers" },
      { type: "improvement", text: "Dashboard: added Business Health Score and Document Expiry widgets" },
      { type: "improvement", text: "Compliance Calendar page with interactive grid, event detail modal, and category filters" },
      { type: "fix",         text: "CI spaCy model download — replaced broken python -m spacy download with direct wheel URL" },
      { type: "fix",         text: "Vercel deployment — standalone output mode is now conditional on NEXT_STANDALONE env var" },
    ],
  },
  {
    version: "1.3.0",
    date: "March 20, 2026",
    tag: "stable",
    summary: "Full platform redesign, Help & Support, AI Training, and typed API client.",
    changes: [
      { type: "feature",     text: "Help & Support page with FAQ accordion, quick actions, system status, and contact form" },
      { type: "feature",     text: "AI Model Training page with live training log, metric cards, and risk predictor" },
      { type: "feature",     text: "Typed API client (lib/api.ts) with graceful fallback when backend unreachable" },
      { type: "feature",     text: "Logo is now clickable — navigates to / on landing page, /dashboard inside app" },
      { type: "improvement", text: "Navbar section links use /#anchor when not on the home page" },
      { type: "improvement", text: "Nav links (Features, How it works, Use Cases, Pricing) always visible in dark and light mode" },
      { type: "improvement", text: "CTA section redesigned — removed orbital rings, added floating stat cards" },
      { type: "improvement", text: "Hero headline updated, placeholder text removed" },
      { type: "improvement", text: "Documents page: real upload progress bar, per-file status, download and delete actions" },
      { type: "improvement", text: "Company page: invite modal with role selector, member management" },
      { type: "improvement", text: "Settings page: saves profile via API, dynamic notification toggles" },
      { type: "security",    text: "ARIA attributes fixed across all dashboard pages (no hardcoded boolean aria-checked)" },
      { type: "fix",         text: "Favicon updated to custom AdvisorAI SVG logo" },
    ],
  },
  {
    version: "1.2.0",
    date: "March 10, 2026",
    tag: null,
    summary: "RAG pipeline improvements, rate limiting, and multi-tenant compliance engine.",
    changes: [
      { type: "feature",     text: "Hybrid search: BM25 + vector similarity with Reciprocal Rank Fusion (RRF)" },
      { type: "feature",     text: "Compliance engine: gap analysis, risk scoring, country-specific rules" },
      { type: "feature",     text: "Sliding-window Redis rate limiting per endpoint and per IP" },
      { type: "feature",     text: "Celery background task queue for document processing (chunk → embed → index)" },
      { type: "improvement", text: "SentenceTransformer model cached in Docker image — no runtime download" },
      { type: "improvement", text: "pgvector enabled for cosine similarity search on 384-dim embeddings" },
      { type: "security",    text: "Refresh token rotation with Redis blacklist" },
      { type: "fix",         text: "Fixed asyncpg connection pool exhaustion under high load" },
    ],
  },
  {
    version: "1.1.0",
    date: "February 28, 2026",
    tag: null,
    summary: "Chatbot sessions, analytics exports, webhook integrations.",
    changes: [
      { type: "feature",     text: "Multi-turn chatbot with persistent session history" },
      { type: "feature",     text: "Analytics export in PDF and Excel formats via ReportLab" },
      { type: "feature",     text: "Webhooks: HMAC-SHA256 signed event payloads" },
      { type: "feature",     text: "MinIO integration for local S3-compatible file storage in development" },
      { type: "improvement", text: "Dashboard redesign with candlestick compliance chart and sparkline KPIs" },
      { type: "fix",         text: "Document delete now correctly removes all associated knowledge entries" },
    ],
  },
  {
    version: "1.0.0",
    date: "February 14, 2026",
    tag: null,
    summary: "Initial public release — document upload, RAG advisor, JWT auth, multi-tenant architecture.",
    changes: [
      { type: "feature", text: "Document upload and processing pipeline (PDF, DOCX, XLSX, TXT)" },
      { type: "feature", text: "AI Advisor with cited answers powered by Groq (Llama 3.1 70B)" },
      { type: "feature", text: "JWT authentication with access + refresh tokens" },
      { type: "feature", text: "Multi-tenant architecture scoped by company_id" },
      { type: "feature", text: "PostgreSQL + pgvector for document embeddings" },
      { type: "feature", text: "FastAPI backend with async SQLAlchemy" },
      { type: "feature", text: "Next.js 15 frontend with dark/light theme" },
    ],
  },
];

export default function ChangelogPage() {
  const [filter, setFilter] = useState<ChangeType | "all">("all");

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-28 pb-24 px-4 bg-[var(--bg)]">
        <div className="max-w-2xl mx-auto">

          {/* Header */}
          <div className="mb-12">
            <Link href="/" className="inline-flex items-center gap-2 text-[var(--fg-muted)] hover:text-violet-500 text-sm transition-colors mb-6 group">
              <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
              Back to home
            </Link>
            <h1 className="text-4xl font-black text-[var(--fg)] tracking-tight mb-3">Changelog</h1>
            <p className="text-[var(--fg-muted)] text-base">
              Every update, improvement, and fix to the AdvisorAI platform.
            </p>
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap gap-2 mb-10">
            {([
              { id: "all",         label: "All updates"  },
              { id: "feature",     label: "New features" },
              { id: "improvement", label: "Improvements" },
              { id: "fix",         label: "Bug fixes"    },
              { id: "security",    label: "Security"     },
            ] as const).map(({ id, label }) => (
              <button key={id} type="button" onClick={() => setFilter(id)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all",
                  filter === id
                    ? "bg-violet-500 text-white shadow-lg shadow-violet-500/25"
                    : "bg-[var(--surface)] border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-violet-500/30"
                )}>
                {label}
              </button>
            ))}
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[7px] top-2 bottom-0 w-px bg-[var(--border)]" />

            {RELEASES.map((release) => {
              const visibleChanges = filter === "all"
                ? release.changes
                : release.changes.filter(c => c.type === filter);
              if (visibleChanges.length === 0) return null;

              return (
                <div key={release.version} className="relative pl-8 mb-14">
                  {/* Timeline dot */}
                  <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-violet-500 bg-[var(--bg)]" />

                  {/* Version header */}
                  <div className="flex items-center flex-wrap gap-2.5 mb-2">
                    <h2 className="text-[var(--fg)] font-black text-xl">v{release.version}</h2>
                    {release.tag && (
                      <span className={cn(
                        "text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider",
                        release.tag === "latest"
                          ? "bg-violet-500/15 text-violet-400 border border-violet-500/30"
                          : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                      )}>
                        {release.tag}
                      </span>
                    )}
                    <time className="text-[var(--fg-muted)] text-sm">{release.date}</time>
                  </div>

                  <p className="text-[var(--fg-soft)] text-sm mb-5 leading-relaxed">{release.summary}</p>

                  {/* Changes */}
                  <div className="flex flex-col gap-2.5">
                    {visibleChanges.map((change, i) => {
                      const cfg = TYPE_CONFIG[change.type];
                      const CIcon = cfg.icon;
                      return (
                        <div key={i} className="flex items-start gap-3 group">
                          <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 mt-0.5", cfg.cls)}>
                            <CIcon size={9} />
                            {cfg.label}
                          </span>
                          <p className="text-[var(--fg-soft)] text-sm leading-relaxed group-hover:text-[var(--fg)] transition-colors">
                            {change.text}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="mt-4 p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] text-center">
            <p className="text-[var(--fg-muted)] text-sm">
              Want to see what&apos;s next?{" "}
              <Link href="/contact" className="text-violet-500 hover:underline font-medium">Request a feature</Link>
              {" "}or check our{" "}
              <Link href="/docs" className="text-violet-500 hover:underline font-medium">API docs</Link>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
