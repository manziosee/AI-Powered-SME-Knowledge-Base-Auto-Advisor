"use client";

import React from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  Zap,
  FileCheck,
  AlertTriangle,
  Clock,
  Cpu,
  Shield,
  RefreshCw,
  ArrowRight,
  Terminal,
} from "lucide-react";

const events = [
  {
    icon: FileCheck,
    event: "document.processed",
    desc: "Fires when a document has been fully indexed and is ready to query.",
    payload: '{ "event": "document.processed", "document_id": "doc_abc123", "status": "ready", "chunks": 42 }',
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: AlertTriangle,
    event: "compliance.alert",
    desc: "Fires when AdvisorAI detects a new compliance gap or regulatory change affecting your documents.",
    payload: '{ "event": "compliance.alert", "jurisdiction": "RRA", "severity": "high", "rule": "RRA Monthly VAT Filing" }',
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
  {
    icon: Clock,
    event: "deadline.reminder",
    desc: "Fires 30 days, 7 days, and 1 day before a detected regulatory deadline.",
    payload: '{ "event": "deadline.reminder", "deadline": "2025-03-31", "days_remaining": 7, "title": "VAT Return Q1" }',
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    icon: Cpu,
    event: "training.completed",
    desc: "Fires when a custom ML training job finishes and the new model is active.",
    payload: '{ "event": "training.completed", "model_id": "mdl_xyz789", "accuracy": 0.94, "version": "v3" }',
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    icon: Clock,
    event: "document.expiring",
    desc: "Fires when a contract or policy document is within 14 days of its expiry date.",
    payload: '{ "event": "document.expiring", "document_id": "doc_xyz", "expiry_date": "2025-04-15", "days_until": 12 }',
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    icon: FileCheck,
    event: "document.shared",
    desc: "Fires when a share link is created for a document.",
    payload: '{ "event": "document.shared", "document_id": "doc_abc", "token": "abc123", "expires_at": "2025-04-20T00:00:00Z" }',
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
];

const setupSteps = [
  {
    step: "1",
    title: "Register your endpoint",
    desc: "Go to Dashboard → Settings → Webhooks. Enter the HTTPS URL that AdvisorAI should POST to. The endpoint must return HTTP 200 within 5 seconds.",
  },
  {
    step: "2",
    title: "Select events to subscribe",
    desc: "Choose which events you want to receive. You can subscribe to all events or pick individual ones per endpoint. Multiple endpoints are supported.",
  },
  {
    step: "3",
    title: "Verify with the signing secret",
    desc: "Copy the signing secret shown after creation. Use it to verify the HMAC-SHA256 signature on every incoming request (see Security section below).",
  },
];

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

const hmacExample = `import hmac
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

export default function WebhooksPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <Navbar />

      {/* Hero */}
      <section className="pt-36 pb-20 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-violet-500 mb-4">
            Webhooks
          </span>
          <h1 className="text-5xl md:text-6xl font-black text-[var(--fg)] mb-6 leading-tight">
            Real-time{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-cyan-500">
              event notifications
            </span>
          </h1>
          <p className="text-[var(--fg-soft)] text-lg leading-relaxed max-w-2xl mx-auto">
            Subscribe to AdvisorAI events and have them pushed to your systems
            the moment they happen — no polling required.
          </p>
        </div>
      </section>

      {/* What are webhooks */}
      <section className="py-12 px-6 border-t border-[var(--border)]">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-5 p-8 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border)]">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0 mt-1">
              <Zap size={22} className="text-violet-500" />
            </div>
            <div>
              <h2 className="text-[var(--fg)] font-black text-xl mb-3">What are webhooks?</h2>
              <p className="text-[var(--fg-muted)] leading-relaxed">
                Webhooks are HTTP callbacks. You register a URL in your AdvisorAI
                dashboard, and whenever a subscribed event occurs — a document
                finishes processing, a deadline is approaching, a compliance alert
                fires — AdvisorAI sends a signed POST request with the event
                payload to your URL in real time. Use this to trigger Slack
                messages, Jira tickets, email alerts, or any downstream automation
                in your own systems.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Available Events */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-black text-[var(--fg)] mb-2 tracking-tight">
            Available events
          </h2>
          <p className="text-[var(--fg-muted)] mb-8">
            Subscribe to one or all of these event types per endpoint.
          </p>
          <div className="rounded-2xl border border-[var(--border)] overflow-hidden divide-y divide-[var(--border)]">
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-[var(--bg-soft)]">
              <span className="col-span-3 text-xs font-bold uppercase tracking-widest text-[var(--fg-muted)]">Event</span>
              <span className="col-span-5 text-xs font-bold uppercase tracking-widest text-[var(--fg-muted)]">Description</span>
              <span className="col-span-4 text-xs font-bold uppercase tracking-widest text-[var(--fg-muted)]">Sample payload excerpt</span>
            </div>
            {events.map(({ icon: Icon, event, desc, payload, color, bg }) => (
              <div key={event} className="flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 px-6 py-5 bg-[var(--bg)] hover:bg-[var(--bg-soft)] transition-colors duration-200">
                <div className="md:col-span-3 flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={13} className={color} />
                  </div>
                  <code className={`text-xs font-mono font-bold ${color}`}>{event}</code>
                </div>
                <p className="md:col-span-5 text-[var(--fg-muted)] text-sm leading-relaxed">{desc}</p>
                <code className="md:col-span-4 text-xs font-mono text-emerald-400 bg-[var(--bg-soft)] rounded-lg p-2 leading-relaxed block">
                  {payload}
                </code>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Setup Guide */}
      <section className="py-20 px-6 bg-[var(--bg-soft)] border-t border-[var(--border)]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-[var(--fg)] mb-8 tracking-tight">
            Setup guide
          </h2>
          <div className="space-y-5">
            {setupSteps.map(({ step, title, desc }) => (
              <div key={step} className="flex gap-5 p-6 rounded-2xl bg-[var(--bg)] border border-[var(--border)]">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0 font-black text-violet-500">
                  {step}
                </div>
                <div>
                  <h3 className="text-[var(--fg)] font-bold mb-1">{title}</h3>
                  <p className="text-[var(--fg-muted)] text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Full Payload Example */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-[var(--fg)] mb-2 tracking-tight">
            Full event payload
          </h2>
          <p className="text-[var(--fg-muted)] mb-6">
            Every webhook POST includes these top-level fields alongside the
            event-specific{" "}
            <code className="text-emerald-400 font-mono text-sm bg-[var(--bg-soft)] px-1.5 py-0.5 rounded">
              data
            </code>{" "}
            object.
          </p>
          <div className="rounded-xl bg-[var(--bg)] border border-[var(--border)] p-6">
            <pre className="font-mono text-sm text-emerald-400 overflow-x-auto leading-relaxed whitespace-pre">
              {fullPayload}
            </pre>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-20 px-6 bg-[var(--bg-soft)] border-t border-[var(--border)]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Shield size={18} className="text-emerald-500" />
            </div>
            <h2 className="text-2xl font-black text-[var(--fg)] tracking-tight">
              Security — HMAC signature verification
            </h2>
          </div>
          <p className="text-[var(--fg-muted)] mb-6">
            Every webhook request includes an{" "}
            <code className="text-emerald-400 font-mono text-sm bg-[var(--bg)] px-1.5 py-0.5 rounded border border-[var(--border)]">
              X-AdvisorAI-Signature-256
            </code>{" "}
            header. Always verify this before processing the event.
          </p>
          <div className="rounded-xl bg-[var(--bg)] border border-[var(--border)] p-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[var(--border)]">
              <Terminal size={14} className="text-[var(--fg-muted)]" />
              <span className="text-[var(--fg-muted)] text-xs font-mono">Python verification example</span>
            </div>
            <pre className="font-mono text-sm text-emerald-400 overflow-x-auto leading-relaxed whitespace-pre">
              {hmacExample}
            </pre>
          </div>
        </div>
      </section>

      {/* Retry Policy */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <RefreshCw size={18} className="text-amber-500" />
            </div>
            <h2 className="text-2xl font-black text-[var(--fg)] tracking-tight">
              Retry policy
            </h2>
          </div>
          <div className="p-6 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border)] text-[var(--fg-muted)] text-sm leading-relaxed space-y-3">
            <p>
              If your endpoint returns a non-2xx status or fails to respond within
              5 seconds, AdvisorAI will retry the delivery with exponential backoff:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Retry 1 — 1 minute after failure</li>
              <li>Retry 2 — 5 minutes after Retry 1</li>
              <li>Retry 3 — 30 minutes after Retry 2</li>
              <li>Retry 4 — 2 hours after Retry 3</li>
              <li>Retry 5 — 12 hours after Retry 4</li>
            </ul>
            <p>
              After 5 consecutive failures, the event is marked as{" "}
              <code className="text-rose-400 font-mono bg-[var(--bg)] px-1.5 py-0.5 rounded border border-[var(--border)]">
                failed
              </code>{" "}
              and you will receive an in-app notification. Failed events can be
              manually replayed from Dashboard → Webhooks → Event log.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-[var(--bg-soft)] border-t border-[var(--border)] text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-black text-[var(--fg)] mb-4 tracking-tight">
            Ready to connect your systems?
          </h2>
          <p className="text-[var(--fg-muted)] mb-8">
            Set up your first webhook in under 2 minutes from the dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold hover:from-violet-500 hover:to-purple-500 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/30"
            >
              Get started <ArrowRight size={16} />
            </Link>
            <Link
              href="/api-reference"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-[var(--border)] text-[var(--fg)] font-bold hover:border-violet-500/40 hover:bg-[var(--bg)] transition-all duration-300"
            >
              API Reference
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
