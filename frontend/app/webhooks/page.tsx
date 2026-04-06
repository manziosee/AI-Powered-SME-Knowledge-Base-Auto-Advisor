"use client";

import React from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Zap, FileCheck, AlertTriangle, Clock, Cpu, Shield, RefreshCw, ArrowRight, Terminal } from "lucide-react";

const events = [
  { icon: FileCheck,    event: "document.processed", desc: "Fires when a document has been fully indexed and is ready to query.", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", payload: '{ "event": "document.processed", "document_id": "doc_abc123", "chunks": 42 }' },
  { icon: AlertTriangle,event: "compliance.alert",   desc: "Fires when AdvisorAI detects a new compliance gap or regulatory change.", color: "text-rose-400",    bg: "bg-rose-500/10 border-rose-500/20",       payload: '{ "event": "compliance.alert", "jurisdiction": "RRA", "severity": "high" }' },
  { icon: Clock,        event: "deadline.reminder",  desc: "Fires 30 days, 7 days, and 1 day before a detected regulatory deadline.", color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/20",     payload: '{ "event": "deadline.reminder", "days_remaining": 7, "title": "VAT Return Q1" }' },
  { icon: Cpu,          event: "training.completed", desc: "Fires when a custom ML training job finishes and the new model is active.", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20",   payload: '{ "event": "training.completed", "accuracy": 0.94, "version": "v3" }' },
  { icon: Clock,        event: "document.expiring",  desc: "Fires when a contract or policy document is within 14 days of its expiry date.", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20", payload: '{ "event": "document.expiring", "expiry_date": "2025-04-15", "days_until": 12 }' },
  { icon: FileCheck,    event: "document.shared",    desc: "Fires when a share link is created for a document.", color: "text-cyan-400",    bg: "bg-cyan-500/10 border-cyan-500/20",       payload: '{ "event": "document.shared", "token": "abc123", "expires_at": "..." }' },
];

const setupSteps = [
  { step: "1", title: "Register your endpoint", desc: "Go to Dashboard → Settings → Webhooks. Enter the HTTPS URL that AdvisorAI should POST to. The endpoint must return HTTP 200 within 5 seconds.", color: "from-violet-600 to-purple-600" },
  { step: "2", title: "Select events to subscribe", desc: "Choose which events you want to receive. You can subscribe to all events or pick individual ones per endpoint. Multiple endpoints are supported.", color: "from-blue-600 to-cyan-500" },
  { step: "3", title: "Verify with the signing secret", desc: "Copy the signing secret shown after creation. Use it to verify the HMAC-SHA256 signature on every incoming request (see Security section below).", color: "from-emerald-500 to-teal-500" },
];

const hmacCode = `import hmac
import hashlib

def verify_webhook(payload_bytes: bytes, signature_header: str, secret: str) -> bool:
    """
    Verify an AdvisorAI webhook signature.
    signature_header is the value of X-AdvisorAI-Signature-256.
    """
    expected = hmac.new(
        secret.encode(),
        payload_bytes,
        hashlib.sha256
    ).hexdigest()

    received = signature_header.removeprefix("sha256=")
    return hmac.compare_digest(expected, received)

# Usage in a Flask/FastAPI handler:
# body = await request.body()
# sig  = request.headers["X-AdvisorAI-Signature-256"]
# if not verify_webhook(body, sig, WEBHOOK_SECRET):
#     raise HTTPException(401, "Invalid signature")`;

const fullPayload = `{
  "id": "evt_01J9K2XPQR7MNVBT4Z8HY6WD",
  "event": "document.processed",
  "timestamp": "2025-04-04T14:32:01Z",
  "api_version": "v1",
  "data": {
    "document_id": "doc_abc123",
    "filename": "compliance_policy_2025.pdf",
    "pages": 42,
    "chunks": 187,
    "status": "ready",
    "namespace": "org_manzi_01",
    "processed_at": "2025-04-04T14:31:58Z"
  }
}`;

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/8">
      <div className="flex items-center gap-3 px-4 py-2.5 bg-[#161b22] border-b border-white/5">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-rose-500/60" />
          <div className="w-3 h-3 rounded-full bg-amber-400/60" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
        </div>
        <span className="text-white/30 text-[11px] font-mono ml-1">{lang}</span>
      </div>
      <div className="bg-[#0d1117] overflow-x-auto">
        <pre className="p-5 text-[13px] leading-[1.75] font-mono text-[#c9d1d9] whitespace-pre">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

export default function WebhooksPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <Navbar />

      {/* ── Hero ── */}
      <section className="pt-36 pb-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-[160px]"
            style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.10) 0%, transparent 70%)" }} />
          <div className="absolute inset-0 bg-dots opacity-20" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/25 bg-violet-500/8 text-xs font-bold tracking-widest text-violet-600 dark:text-violet-400 uppercase mb-6">
            <Zap size={11} />
            Webhooks
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-[var(--fg)] mb-6 leading-[1.0] tracking-tight">
            Real-time{" "}
            <span className="gradient-text-brand">event notifications</span>
          </h1>
          <p className="text-[var(--fg-muted)] text-xl leading-relaxed max-w-2xl mx-auto">
            Subscribe to AdvisorAI events and have them pushed to your systems the moment they happen — no polling required.
          </p>
        </div>
      </section>

      {/* ── What are webhooks ── */}
      <section className="py-12 px-6 border-t border-[var(--border)]">
        <div className="max-w-4xl mx-auto">
          <div className="relative p-8 rounded-3xl border border-violet-500/20 bg-[var(--bg-soft)] overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
            <div className="flex gap-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(124,58,237,0.3)]">
                <Zap size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-[var(--fg)] font-black text-xl mb-3">What are webhooks?</h2>
                <p className="text-[var(--fg-muted)] leading-relaxed text-base">
                  Webhooks are HTTP callbacks. You register a URL in your AdvisorAI dashboard, and whenever a subscribed event occurs — a document finishes processing, a deadline is approaching, a compliance alert fires — AdvisorAI sends a signed POST request with the event payload to your URL in real time. Use this to trigger Slack messages, Jira tickets, email alerts, or any downstream automation in your own systems.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Available Events ── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <FileCheck size={16} className="text-emerald-500" />
            </div>
            <h2 className="text-2xl font-black text-[var(--fg)] tracking-tight">Available events</h2>
          </div>
          <p className="text-[var(--fg-muted)] mb-8 text-base">Subscribe to one or all of these event types per endpoint.</p>
          <div className="rounded-3xl border border-[var(--border)] overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3.5 bg-[var(--bg-soft)] border-b border-[var(--border)]">
              <span className="col-span-3 text-[10px] font-bold uppercase tracking-widest text-[var(--fg-muted)]">Event</span>
              <span className="col-span-4 text-[10px] font-bold uppercase tracking-widest text-[var(--fg-muted)]">Description</span>
              <span className="col-span-5 text-[10px] font-bold uppercase tracking-widest text-[var(--fg-muted)]">Sample payload</span>
            </div>
            {events.map(({ icon: Icon, event, desc, payload, color, bg }, i) => (
              <div key={event} className={`flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 px-6 py-5 ${
                i % 2 === 0 ? "bg-[var(--bg)]" : "bg-[var(--surface)]"
              } hover:bg-[var(--surface-hover)] transition-colors border-b border-[var(--border)] last:border-0`}>
                <div className="md:col-span-3 flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0 ${bg}`}>
                    <Icon size={14} className={color} />
                  </div>
                  <code className={`text-xs font-mono font-bold ${color}`}>{event}</code>
                </div>
                <p className="md:col-span-4 text-[var(--fg-muted)] text-sm leading-relaxed">{desc}</p>
                <div className="md:col-span-5 rounded-xl bg-[#0d1117] border border-white/8 px-3 py-2">
                  <code className="text-[11px] font-mono text-[#c9d1d9] leading-relaxed block">{payload}</code>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Setup Guide ── */}
      <section className="py-20 px-6 bg-[var(--bg-soft)] border-t border-[var(--border)]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Zap size={16} className="text-blue-500" />
            </div>
            <h2 className="text-2xl font-black text-[var(--fg)] tracking-tight">Setup guide</h2>
          </div>
          <div className="space-y-4">
            {setupSteps.map(({ step, title, desc, color }) => (
              <div key={step} className="flex gap-5 p-6 rounded-2xl bg-[var(--bg)] border border-[var(--border)] hover:border-violet-500/20 transition-all">
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 font-black text-white text-lg shadow-lg`}>
                  {step}
                </div>
                <div>
                  <h3 className="text-[var(--fg)] font-bold text-base mb-1.5">{title}</h3>
                  <p className="text-[var(--fg-muted)] text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Full Payload ── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Terminal size={16} className="text-cyan-500" />
            </div>
            <h2 className="text-2xl font-black text-[var(--fg)] tracking-tight">Full event payload</h2>
          </div>
          <p className="text-[var(--fg-muted)] mb-6 text-base">
            Every webhook POST includes these top-level fields alongside the event-specific{" "}
            <code className="text-emerald-600 dark:text-emerald-400 font-mono text-sm bg-[var(--surface)] px-2 py-0.5 rounded-lg border border-[var(--border)]">data</code>{" "}
            object.
          </p>
          <CodeBlock code={fullPayload} lang="JSON" />
        </div>
      </section>

      {/* ── Security ── */}
      <section className="py-20 px-6 bg-[var(--bg-soft)] border-t border-[var(--border)]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Shield size={16} className="text-emerald-500" />
            </div>
            <h2 className="text-2xl font-black text-[var(--fg)] tracking-tight">Security — HMAC signature verification</h2>
          </div>
          <p className="text-[var(--fg-muted)] mb-6 text-base">
            Every webhook request includes an{" "}
            <code className="text-emerald-600 dark:text-emerald-400 font-mono text-sm bg-[var(--surface)] px-2 py-0.5 rounded-lg border border-[var(--border)]">X-AdvisorAI-Signature-256</code>{" "}
            header. Always verify this before processing the event.
          </p>
          <CodeBlock code={hmacCode} lang="Python" />
        </div>
      </section>

      {/* ── Retry Policy ── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <RefreshCw size={16} className="text-amber-500" />
            </div>
            <h2 className="text-2xl font-black text-[var(--fg)] tracking-tight">Retry policy</h2>
          </div>
          <div className="p-6 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border)]">
            <p className="text-[var(--fg-muted)] text-sm leading-relaxed mb-4">
              If your endpoint returns a non-2xx status or fails to respond within 5 seconds, AdvisorAI will retry with exponential backoff:
            </p>
            <div className="space-y-2">
              {[
                { label: "Retry 1", time: "1 minute after failure" },
                { label: "Retry 2", time: "5 minutes after Retry 1" },
                { label: "Retry 3", time: "30 minutes after Retry 2" },
                { label: "Retry 4", time: "2 hours after Retry 3" },
                { label: "Retry 5", time: "12 hours after Retry 4" },
              ].map(({ label, time }) => (
                <div key={label} className="flex items-center gap-3 py-2 border-b border-[var(--border)] last:border-0">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 w-16 flex-shrink-0">{label}</span>
                  <span className="text-[var(--fg-muted)] text-sm">{time}</span>
                </div>
              ))}
            </div>
            <p className="text-[var(--fg-muted)] text-sm leading-relaxed mt-4">
              After 5 consecutive failures, the event is marked as{" "}
              <code className="text-rose-500 font-mono bg-[var(--surface)] px-2 py-0.5 rounded-lg border border-[var(--border)]">failed</code>{" "}
              and you will receive an in-app notification. Failed events can be manually replayed from Dashboard → Webhooks → Event log.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 bg-[var(--bg-soft)] border-t border-[var(--border)] text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-black text-[var(--fg)] mb-4 tracking-tight">Ready to connect your systems?</h2>
          <p className="text-[var(--fg-muted)] mb-10 text-lg">Set up your first webhook in under 2 minutes from the dashboard.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold hover:from-violet-500 hover:to-purple-500 transition-all shadow-[0_4px_20px_rgba(124,58,237,0.35)] hover:shadow-[0_8px_30px_rgba(124,58,237,0.5)] hover:-translate-y-0.5">
              Get started <ArrowRight size={16} />
            </Link>
            <Link href="/api-reference"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-[var(--border)] text-[var(--fg)] font-bold hover:border-violet-500/30 hover:bg-[var(--surface)] transition-all">
              API Reference
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
