"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Search, Copy, Check, Menu, X, ChevronDown, ChevronRight,
  Zap, Lock, FileText, Brain, MessageSquare, BarChart2,
  Heart, Globe, AlertTriangle, Book, ArrowLeft, ExternalLink,
  Terminal, Code2, Sun, Moon,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────
type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
type Lang   = "curl" | "python" | "typescript";

interface Param  { name: string; type: string; required: boolean; description: string; }
interface CodeEx { curl: string; python: string; typescript: string; }
interface Endpoint {
  id: string; method: Method; path: string; title: string;
  description: string; params?: Param[]; body?: Param[];
  responseExample: string; code: CodeEx;
}
interface Section {
  id: string; title: string; icon: React.ElementType;
  intro: string; endpoints: Endpoint[];
}

// ── Method badge colours ──────────────────────────────────────────
const METHOD: Record<Method, string> = {
  GET:    "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  POST:   "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  PUT:    "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  DELETE: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
  PATCH:  "bg-orange-500/15 text-orange-400 border border-orange-500/30",
};

const STATUS: Record<number, string> = {
  200: "bg-blue-500/15 text-blue-400",
  201: "bg-emerald-500/15 text-emerald-400",
  204: "bg-slate-500/15 text-slate-400",
  400: "bg-amber-500/15 text-amber-400",
  401: "bg-rose-500/15 text-rose-400",
  403: "bg-orange-500/15 text-orange-400",
  404: "bg-slate-500/15 text-slate-400",
  429: "bg-purple-500/15 text-purple-400",
  500: "bg-rose-500/15 text-rose-400",
};

// ── API data ──────────────────────────────────────────────────────
const BASE_URL = "https://api.advisorai.app";

const SECTIONS: Section[] = [
  // ── Introduction (no endpoints, rendered separately) ───────────
  {
    id: "introduction", title: "Introduction", icon: Book,
    intro: "Welcome to the AdvisorAI API. Build powerful compliance and document intelligence features into any application.",
    endpoints: [],
  },
  {
    id: "quickstart", title: "Quick Start", icon: Zap,
    intro: "Get up and running in under 5 minutes. Authenticate, upload a document, and query your AI advisor.",
    endpoints: [],
  },
  // ── Authentication ──────────────────────────────────────────────
  {
    id: "auth", title: "Authentication", icon: Lock,
    intro: "AdvisorAI uses JWT bearer tokens. All requests (except /auth/login and /auth/register) require an Authorization header.",
    endpoints: [
      {
        id: "auth-register", method: "POST", path: "/api/v1/auth/register",
        title: "Register",
        description: "Create a new user account. Returns the created user object.",
        body: [
          { name: "email",      type: "string", required: true,  description: "Valid email address"              },
          { name: "password",   type: "string", required: true,  description: "Minimum 8 characters"             },
          { name: "full_name",  type: "string", required: true,  description: "User's full name"                 },
          { name: "company_id", type: "uuid",   required: false, description: "Associate with existing company"  },
        ],
        responseExample: `{\n  "id": "a1b2c3d4-...",\n  "email": "alice@acme.com",\n  "full_name": "Alice Smith",\n  "role": "employee",\n  "is_active": true,\n  "created_at": "2026-03-26T10:00:00Z"\n}`,
        code: {
          curl: `curl -X POST ${BASE_URL}/api/v1/auth/register \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "email": "alice@acme.com",\n    "password": "securepass123",\n    "full_name": "Alice Smith"\n  }'`,
          python: `import requests\n\nresponse = requests.post(\n    "${BASE_URL}/api/v1/auth/register",\n    json={\n        "email": "alice@acme.com",\n        "password": "securepass123",\n        "full_name": "Alice Smith",\n    }\n)\nuser = response.json()\nprint(user["id"])`,
          typescript: `const response = await fetch("${BASE_URL}/api/v1/auth/register", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({\n    email: "alice@acme.com",\n    password: "securepass123",\n    full_name: "Alice Smith",\n  }),\n});\nconst user = await response.json();\nconsole.log(user.id);`,
        },
      },
      {
        id: "auth-login", method: "POST", path: "/api/v1/auth/login",
        title: "Login",
        description: "Authenticate with email and password. Returns an access token (30 min TTL) and a refresh token (7 days TTL). After 5 failed attempts the account is locked for 15 minutes.",
        body: [
          { name: "email",    type: "string", required: true, description: "Registered email address" },
          { name: "password", type: "string", required: true, description: "Account password"         },
        ],
        responseExample: `{\n  "access_token": "eyJhbGciOiJIUzI1NiIs...",\n  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",\n  "token_type": "bearer"\n}`,
        code: {
          curl: `curl -X POST ${BASE_URL}/api/v1/auth/login \\\n  -H "Content-Type: application/json" \\\n  -d '{"email":"alice@acme.com","password":"securepass123"}'`,
          python: `import requests\n\nresp = requests.post(\n    "${BASE_URL}/api/v1/auth/login",\n    json={"email": "alice@acme.com", "password": "securepass123"},\n)\ntokens = resp.json()\naccess_token = tokens["access_token"]`,
          typescript: `const resp = await fetch("${BASE_URL}/api/v1/auth/login", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({ email: "alice@acme.com", password: "securepass123" }),\n});\nconst { access_token } = await resp.json();`,
        },
      },
      {
        id: "auth-me", method: "GET", path: "/api/v1/auth/me",
        title: "Get current user",
        description: "Returns the authenticated user's profile. Requires a valid Bearer token.",
        responseExample: `{\n  "id": "a1b2c3d4-...",\n  "email": "alice@acme.com",\n  "full_name": "Alice Smith",\n  "role": "admin",\n  "company_id": "c9d8e7f6-...",\n  "last_login": "2026-03-26T09:30:00Z"\n}`,
        code: {
          curl: `curl ${BASE_URL}/api/v1/auth/me \\\n  -H "Authorization: Bearer <access_token>"`,
          python: `import requests\n\nheaders = {"Authorization": f"Bearer {access_token}"}\nme = requests.get("${BASE_URL}/api/v1/auth/me", headers=headers).json()\nprint(me["email"])`,
          typescript: `const me = await fetch("${BASE_URL}/api/v1/auth/me", {\n  headers: { Authorization: \`Bearer \${accessToken}\` },\n}).then(r => r.json());\nconsole.log(me.email);`,
        },
      },
      {
        id: "auth-refresh", method: "POST", path: "/api/v1/auth/refresh",
        title: "Refresh token",
        description: "Exchange a valid refresh token for a new access token and refresh token pair. The old refresh token is immediately invalidated (rotation).",
        body: [{ name: "refresh_token", type: "string", required: true, description: "Valid refresh token" }],
        responseExample: `{\n  "access_token": "eyJhbGciOiJIUzI1NiIs...",\n  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",\n  "token_type": "bearer"\n}`,
        code: {
          curl: `curl -X POST ${BASE_URL}/api/v1/auth/refresh \\\n  -H "Content-Type: application/json" \\\n  -d '{"refresh_token":"<refresh_token>"}'`,
          python: `tokens = requests.post(\n    "${BASE_URL}/api/v1/auth/refresh",\n    json={"refresh_token": refresh_token},\n).json()\naccess_token = tokens["access_token"]`,
          typescript: `const tokens = await fetch("${BASE_URL}/api/v1/auth/refresh", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({ refresh_token: refreshToken }),\n}).then(r => r.json());`,
        },
      },
    ],
  },
  // ── Documents ───────────────────────────────────────────────────
  {
    id: "documents", title: "Documents", icon: FileText,
    intro: "Upload, manage, and search your business documents. Supported formats: PDF, DOCX, XLSX, TXT (max 50 MB).",
    endpoints: [
      {
        id: "docs-upload", method: "POST", path: "/api/v1/documents/upload",
        title: "Upload document",
        description: "Upload a file using multipart/form-data. The document is asynchronously processed — text extracted, chunked, embedded, and indexed for semantic search.",
        body: [
          { name: "file",          type: "File",   required: true,  description: "The document file (PDF, DOCX, XLSX, TXT)"    },
          { name: "document_type", type: "string", required: false, description: "contract | invoice | policy | report | other" },
          { name: "tags",          type: "string", required: false, description: "Comma-separated tags, e.g. hr,2026"           },
        ],
        responseExample: `{\n  "id": "d3e4f5a6-...",\n  "filename": "service-agreement.pdf",\n  "status": "processing",\n  "document_type": "contract",\n  "file_size": 204800,\n  "created_at": "2026-03-26T10:05:00Z"\n}`,
        code: {
          curl: `curl -X POST ${BASE_URL}/api/v1/documents/upload \\\n  -H "Authorization: Bearer <access_token>" \\\n  -F "file=@./service-agreement.pdf" \\\n  -F "document_type=contract"`,
          python: `with open("service-agreement.pdf", "rb") as f:\n    resp = requests.post(\n        "${BASE_URL}/api/v1/documents/upload",\n        headers={"Authorization": f"Bearer {access_token}"},\n        files={"file": f},\n        data={"document_type": "contract"},\n    )\ndoc = resp.json()\nprint(doc["id"], doc["status"])`,
          typescript: `const form = new FormData();\nform.append("file", file);          // File from <input>\nform.append("document_type", "contract");\n\nconst doc = await fetch("${BASE_URL}/api/v1/documents/upload", {\n  method: "POST",\n  headers: { Authorization: \`Bearer \${accessToken}\` },\n  body: form,\n}).then(r => r.json());`,
        },
      },
      {
        id: "docs-list", method: "GET", path: "/api/v1/documents",
        title: "List documents",
        description: "Returns a paginated list of all documents belonging to your company.",
        params: [
          { name: "page",     type: "integer", required: false, description: "Page number, default 1"       },
          { name: "per_page", type: "integer", required: false, description: "Items per page, default 20"   },
          { name: "status",   type: "string",  required: false, description: "Filter: processed | uploaded" },
          { name: "type",     type: "string",  required: false, description: "Filter by document_type"      },
        ],
        responseExample: `{\n  "items": [\n    {\n      "id": "d3e4f5a6-...",\n      "filename": "service-agreement.pdf",\n      "document_type": "contract",\n      "status": "processed",\n      "file_size": 204800,\n      "created_at": "2026-03-26T10:05:00Z"\n    }\n  ],\n  "total": 42,\n  "page": 1,\n  "per_page": 20\n}`,
        code: {
          curl: `curl "${BASE_URL}/api/v1/documents?page=1&per_page=20" \\\n  -H "Authorization: Bearer <access_token>"`,
          python: `docs = requests.get(\n    "${BASE_URL}/api/v1/documents",\n    headers={"Authorization": f"Bearer {access_token}"},\n    params={"page": 1, "per_page": 20},\n).json()\nprint(f"{docs['total']} documents found")`,
          typescript: `const docs = await fetch(\n  "${BASE_URL}/api/v1/documents?page=1&per_page=20",\n  { headers: { Authorization: \`Bearer \${accessToken}\` } }\n).then(r => r.json());\nconsole.log(\`\${docs.total} documents\`);`,
        },
      },
      {
        id: "docs-delete", method: "DELETE", path: "/api/v1/documents/{id}",
        title: "Delete document",
        description: "Permanently deletes a document and all its extracted knowledge entries. This action cannot be undone.",
        responseExample: `{\n  "status": "deleted",\n  "id": "d3e4f5a6-..."\n}`,
        code: {
          curl: `curl -X DELETE ${BASE_URL}/api/v1/documents/d3e4f5a6-... \\\n  -H "Authorization: Bearer <access_token>"`,
          python: `requests.delete(\n    "${BASE_URL}/api/v1/documents/d3e4f5a6-...",\n    headers={"Authorization": f"Bearer {access_token}"},\n)`,
          typescript: `await fetch(\`${BASE_URL}/api/v1/documents/\${docId}\`, {\n  method: "DELETE",\n  headers: { Authorization: \`Bearer \${accessToken}\` },\n});`,
        },
      },
    ],
  },
  // ── AI Advisor ──────────────────────────────────────────────────
  {
    id: "advisor", title: "AI Advisor", icon: Brain,
    intro: "Ask natural language questions about your documents. The RAG pipeline retrieves relevant chunks, re-ranks them, and generates a cited answer using Groq (Llama 3.1 70B).",
    endpoints: [
      {
        id: "advisor-ask", method: "POST", path: "/api/v1/advisor/ask",
        title: "Ask a question",
        description: "Submit a natural language query. Returns an AI-generated answer with source citations and a risk level assessment.",
        body: [
          { name: "question", type: "string",  required: true,  description: "The question to ask your knowledge base"           },
          { name: "top_k",    type: "integer", required: false, description: "Number of source chunks to retrieve (default 8)"   },
          { name: "session_id", type: "uuid",  required: false, description: "Attach to a chatbot session for conversation context" },
        ],
        responseExample: `{\n  "answer": "Your data processing agreement must include...",\n  "risk_level": "medium",\n  "confidence": 0.91,\n  "sources": [\n    {\n      "document_id": "d3e4f5a6-...",\n      "filename": "gdpr-policy.pdf",\n      "page": 4,\n      "relevance": 0.95,\n      "excerpt": "Article 28 requires that processors..."\n    }\n  ],\n  "query_id": "q7r8s9t0-..."\n}`,
        code: {
          curl: `curl -X POST ${BASE_URL}/api/v1/advisor/ask \\\n  -H "Authorization: Bearer <access_token>" \\\n  -H "Content-Type: application/json" \\\n  -d '{"question":"What are our GDPR obligations for data processors?"}'`,
          python: `answer = requests.post(\n    "${BASE_URL}/api/v1/advisor/ask",\n    headers={"Authorization": f"Bearer {access_token}"},\n    json={\n        "question": "What are our GDPR obligations for data processors?",\n        "top_k": 8,\n    },\n).json()\n\nprint(answer["answer"])\nfor src in answer["sources"]:\n    print(f"  Source: {src['filename']} p.{src['page']}")`,
          typescript: `const answer = await fetch("${BASE_URL}/api/v1/advisor/ask", {\n  method: "POST",\n  headers: {\n    Authorization: \`Bearer \${accessToken}\`,\n    "Content-Type": "application/json",\n  },\n  body: JSON.stringify({\n    question: "What are our GDPR obligations for data processors?",\n  }),\n}).then(r => r.json());\n\nconsole.log(answer.answer);\nanswer.sources.forEach(s => console.log(s.filename));`,
        },
      },
      {
        id: "advisor-history", method: "GET", path: "/api/v1/advisor/history",
        title: "Query history",
        description: "Returns the last N questions asked by the authenticated user, with their answers and sources.",
        params: [
          { name: "limit", type: "integer", required: false, description: "Number of records to return (default 20, max 100)" },
        ],
        responseExample: `{\n  "queries": [\n    {\n      "id": "q7r8s9t0-...",\n      "question": "What are our GDPR obligations?",\n      "answer": "...",\n      "risk_level": "medium",\n      "created_at": "2026-03-26T10:10:00Z"\n    }\n  ],\n  "total": 15\n}`,
        code: {
          curl: `curl "${BASE_URL}/api/v1/advisor/history?limit=10" \\\n  -H "Authorization: Bearer <access_token>"`,
          python: `history = requests.get(\n    "${BASE_URL}/api/v1/advisor/history",\n    headers={"Authorization": f"Bearer {access_token}"},\n    params={"limit": 10},\n).json()`,
          typescript: `const history = await fetch(\n  "${BASE_URL}/api/v1/advisor/history?limit=10",\n  { headers: { Authorization: \`Bearer \${accessToken}\` } }\n).then(r => r.json());`,
        },
      },
    ],
  },
  // ── Chatbot ─────────────────────────────────────────────────────
  {
    id: "chatbot", title: "Chatbot", icon: MessageSquare,
    intro: "Multi-turn conversational AI that maintains context across messages within a session. Each company can have multiple sessions.",
    endpoints: [
      {
        id: "chatbot-sessions", method: "GET", path: "/api/v1/chatbot/sessions",
        title: "List sessions",
        description: "Returns all chat sessions for the authenticated user.",
        responseExample: `{\n  "sessions": [\n    {\n      "id": "s1t2u3v4-...",\n      "title": "GDPR Compliance Review",\n      "message_count": 12,\n      "created_at": "2026-03-25T09:00:00Z",\n      "last_message_at": "2026-03-26T10:15:00Z"\n    }\n  ]\n}`,
        code: {
          curl: `curl ${BASE_URL}/api/v1/chatbot/sessions \\\n  -H "Authorization: Bearer <access_token>"`,
          python: `sessions = requests.get(\n    "${BASE_URL}/api/v1/chatbot/sessions",\n    headers={"Authorization": f"Bearer {access_token}"},\n).json()`,
          typescript: `const sessions = await fetch("${BASE_URL}/api/v1/chatbot/sessions", {\n  headers: { Authorization: \`Bearer \${accessToken}\` },\n}).then(r => r.json());`,
        },
      },
      {
        id: "chatbot-message", method: "POST", path: "/api/v1/chatbot/sessions/{id}/messages",
        title: "Send message",
        description: "Send a message in a session and get an AI reply. Previous messages in the session are included as context.",
        body: [
          { name: "content", type: "string", required: true, description: "The user message text" },
        ],
        responseExample: `{\n  "id": "m5n6o7p8-...",\n  "role": "assistant",\n  "content": "Based on your uploaded policies, you need to...",\n  "sources": [\n    { "filename": "gdpr-policy.pdf", "page": 7 }\n  ],\n  "created_at": "2026-03-26T10:20:00Z"\n}`,
        code: {
          curl: `curl -X POST ${BASE_URL}/api/v1/chatbot/sessions/s1t2u3v4-.../messages \\\n  -H "Authorization: Bearer <access_token>" \\\n  -H "Content-Type: application/json" \\\n  -d '{"content":"What consent mechanisms do we need?"}'`,
          python: `reply = requests.post(\n    "${BASE_URL}/api/v1/chatbot/sessions/{session_id}/messages",\n    headers={"Authorization": f"Bearer {access_token}"},\n    json={"content": "What consent mechanisms do we need?"},\n).json()\nprint(reply["content"])`,
          typescript: `const reply = await fetch(\n  \`${BASE_URL}/api/v1/chatbot/sessions/\${sessionId}/messages\`,\n  {\n    method: "POST",\n    headers: {\n      Authorization: \`Bearer \${accessToken}\`,\n      "Content-Type": "application/json",\n    },\n    body: JSON.stringify({ content: "What consent mechanisms do we need?" }),\n  }\n).then(r => r.json());`,
        },
      },
    ],
  },
  // ── Analytics ───────────────────────────────────────────────────
  {
    id: "analytics", title: "Analytics", icon: BarChart2,
    intro: "Retrieve dashboard metrics and export reports in PDF or Excel format.",
    endpoints: [
      {
        id: "analytics-overview", method: "GET", path: "/api/v1/analytics/overview",
        title: "Dashboard overview",
        description: "Returns aggregate stats: document counts, compliance score, AI query volume, and risk distribution.",
        responseExample: `{\n  "total_documents": 248,\n  "processed_documents": 241,\n  "compliance_score": 94,\n  "total_queries": 876,\n  "critical_risks": 2,\n  "high_risks": 8,\n  "medium_risks": 14,\n  "period": "last_30_days"\n}`,
        code: {
          curl: `curl ${BASE_URL}/api/v1/analytics/overview \\\n  -H "Authorization: Bearer <access_token>"`,
          python: `stats = requests.get(\n    "${BASE_URL}/api/v1/analytics/overview",\n    headers={"Authorization": f"Bearer {access_token}"},\n).json()\nprint(f"Compliance score: {stats['compliance_score']}%")`,
          typescript: `const stats = await fetch("${BASE_URL}/api/v1/analytics/overview", {\n  headers: { Authorization: \`Bearer \${accessToken}\` },\n}).then(r => r.json());`,
        },
      },
      {
        id: "analytics-export", method: "GET", path: "/api/v1/analytics/export",
        title: "Export report",
        description: "Generates and returns a presigned download URL for a PDF or Excel compliance report.",
        params: [
          { name: "format", type: "string", required: true,  description: "pdf or excel"                           },
          { name: "period", type: "string", required: false, description: "last_7d | last_30d | last_90d (default)" },
        ],
        responseExample: `{\n  "download_url": "https://storage.advisorai.app/reports/report-2026-03.pdf?sig=...",\n  "expires_at": "2026-03-27T10:00:00Z",\n  "format": "pdf"\n}`,
        code: {
          curl: `curl "${BASE_URL}/api/v1/analytics/export?format=pdf&period=last_30d" \\\n  -H "Authorization: Bearer <access_token>"`,
          python: `report = requests.get(\n    "${BASE_URL}/api/v1/analytics/export",\n    headers={"Authorization": f"Bearer {access_token}"},\n    params={"format": "pdf", "period": "last_30d"},\n).json()\nprint(report["download_url"])`,
          typescript: `const report = await fetch(\n  "${BASE_URL}/api/v1/analytics/export?format=pdf&period=last_30d",\n  { headers: { Authorization: \`Bearer \${accessToken}\` } }\n).then(r => r.json());\nwindow.open(report.download_url);`,
        },
      },
    ],
  },
  // ── Insights ────────────────────────────────────────────────────
  {
    id: "insights", title: "Business Insights", icon: Heart,
    intro: "Health scores, compliance calendars, and document expiry tracking — proactive intelligence for your business.",
    endpoints: [
      {
        id: "insights-health", method: "GET", path: "/api/v1/insights/health",
        title: "Business health score",
        description: "Aggregate health score (0–100) based on document coverage, processing rate, document freshness, and compliance posture. Includes component breakdown and recommendations.",
        responseExample: `{\n  "score": 78,\n  "grade": "C",\n  "trend": "+3",\n  "trend_direction": "up",\n  "components": [\n    { "label": "Document Coverage", "score": 82, "status": "good" },\n    { "label": "Processing Rate",   "score": 95, "status": "good" },\n    { "label": "Document Freshness","score": 70, "status": "warning" }\n  ],\n  "recommendations": [\n    { "priority": "medium", "action": "Review 3 documents older than 1 year" }\n  ]\n}`,
        code: {
          curl: `curl ${BASE_URL}/api/v1/insights/health \\\n  -H "Authorization: Bearer <access_token>"`,
          python: `health = requests.get(\n    "${BASE_URL}/api/v1/insights/health",\n    headers={"Authorization": f"Bearer {access_token}"},\n).json()\nprint(f"Health: {health['score']}/100 ({health['grade']})")`,
          typescript: `const health = await fetch("${BASE_URL}/api/v1/insights/health", {\n  headers: { Authorization: \`Bearer \${accessToken}\` },\n}).then(r => r.json());\nconsole.log(\`Health: \${health.score}/100\`);`,
        },
      },
      {
        id: "insights-calendar", method: "GET", path: "/api/v1/insights/calendar",
        title: "Compliance calendar",
        description: "Returns upcoming statutory deadlines (VAT, payroll, corporate tax, GDPR reviews, etc.) for the next N months.",
        params: [
          { name: "months_ahead", type: "integer", required: false, description: "1–12, default 3" },
        ],
        responseExample: `{\n  "events": [\n    {\n      "id": "corp-tax-20260331",\n      "title": "Corporate Tax Return",\n      "category": "tax",\n      "priority": "critical",\n      "due_date": "2026-03-31",\n      "days_until": 5,\n      "urgent": true\n    }\n  ],\n  "total": 9\n}`,
        code: {
          curl: `curl "${BASE_URL}/api/v1/insights/calendar?months_ahead=3" \\\n  -H "Authorization: Bearer <access_token>"`,
          python: `calendar = requests.get(\n    "${BASE_URL}/api/v1/insights/calendar",\n    headers={"Authorization": f"Bearer {access_token}"},\n    params={"months_ahead": 3},\n).json()\nfor event in calendar["events"]:\n    print(f"{event['due_date']} — {event['title']}")`,
          typescript: `const calendar = await fetch(\n  "${BASE_URL}/api/v1/insights/calendar?months_ahead=3",\n  { headers: { Authorization: \`Bearer \${accessToken}\` } }\n).then(r => r.json());`,
        },
      },
      {
        id: "insights-expiry", method: "GET", path: "/api/v1/insights/expiry",
        title: "Document expiry tracker",
        description: "Returns documents expiring within the next N days. Flags contracts and policies with no renewal record older than 2 years.",
        params: [
          { name: "days_ahead", type: "integer", required: false, description: "7–365, default 90" },
        ],
        responseExample: `{\n  "documents": [\n    {\n      "id": "d3e4f5a6-...",\n      "filename": "service-agreement.pdf",\n      "document_type": "contract",\n      "expiry_date": "2026-04-10",\n      "days_until": 15,\n      "status": "warning"\n    }\n  ],\n  "total": 3,\n  "overdue": 1,\n  "urgent": 1\n}`,
        code: {
          curl: `curl "${BASE_URL}/api/v1/insights/expiry?days_ahead=90" \\\n  -H "Authorization: Bearer <access_token>"`,
          python: `expiry = requests.get(\n    "${BASE_URL}/api/v1/insights/expiry",\n    headers={"Authorization": f"Bearer {access_token}"},\n    params={"days_ahead": 90},\n).json()\nprint(f"{expiry['overdue']} overdue, {expiry['urgent']} urgent")`,
          typescript: `const expiry = await fetch(\n  "${BASE_URL}/api/v1/insights/expiry?days_ahead=90",\n  { headers: { Authorization: \`Bearer \${accessToken}\` } }\n).then(r => r.json());`,
        },
      },
    ],
  },
  // ── Webhooks ────────────────────────────────────────────────────
  {
    id: "webhooks", title: "Webhooks", icon: Globe,
    intro: "Receive real-time event notifications via HTTP POST to your endpoint. Payloads are signed with HMAC-SHA256 for verification.",
    endpoints: [],
  },
  // ── Errors ──────────────────────────────────────────────────────
  {
    id: "errors", title: "Errors & Rate Limits", icon: AlertTriangle,
    intro: "All errors return consistent JSON with a machine-readable error code. Rate limits are applied per IP and per endpoint.",
    endpoints: [],
  },
];

// ── Copy button ───────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="absolute top-3 right-3 p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/80 transition-all"
      title="Copy to clipboard"
      aria-label="Copy code"
    >
      {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
    </button>
  );
}

// ── Code block ────────────────────────────────────────────────────
function CodeBlock({ code, lang }: { code: string; lang: Lang }) {
  const langLabel: Record<Lang, string> = { curl: "cURL", python: "Python", typescript: "TypeScript" };
  return (
    <div className="relative">
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] rounded-t-xl border-b border-white/5">
        <div className="flex items-center gap-2">
          <Terminal size={12} className="text-white/30" />
          <span className="text-white/40 text-[11px] font-mono">{langLabel[lang]}</span>
        </div>
      </div>
      <div className="relative bg-[#0d1117] rounded-b-xl overflow-x-auto">
        <CopyButton text={code} />
        <pre className="p-4 text-[12.5px] leading-[1.7] font-mono text-[#c9d1d9] overflow-x-auto">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

// ── Tabbed code block ─────────────────────────────────────────────
function TabbedCode({ code }: { code: CodeEx }) {
  const [lang, setLang] = useState<Lang>("curl");
  const tabs: { id: Lang; label: string }[] = [
    { id: "curl",       label: "cURL"       },
    { id: "python",     label: "Python"     },
    { id: "typescript", label: "TypeScript" },
  ];
  return (
    <div className="rounded-xl overflow-hidden border border-white/8 mt-4">
      <div className="flex items-center bg-[#161b22] px-1 pt-1 gap-0.5">
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setLang(t.id)}
            className={cn(
              "px-3 py-1.5 text-[11px] font-medium rounded-t-lg transition-all",
              lang === t.id
                ? "bg-[#0d1117] text-white"
                : "text-white/40 hover:text-white/70"
            )}
          >{t.label}</button>
        ))}
      </div>
      <div className="relative bg-[#0d1117]">
        <CopyButton text={code[lang]} />
        <pre className="p-4 text-[12.5px] leading-[1.7] font-mono text-[#c9d1d9] overflow-x-auto pr-10">
          <code>{code[lang]}</code>
        </pre>
      </div>
    </div>
  );
}

// ── Param table ───────────────────────────────────────────────────
function ParamTable({ params, title }: { params: Param[]; title: string }) {
  return (
    <div className="mt-4">
      <p className="text-[var(--fg-muted)] text-[11px] font-semibold uppercase tracking-widest mb-2">{title}</p>
      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[var(--surface)] border-b border-[var(--border)]">
              <th className="text-left px-4 py-2.5 text-[var(--fg-muted)] font-semibold">Name</th>
              <th className="text-left px-4 py-2.5 text-[var(--fg-muted)] font-semibold">Type</th>
              <th className="text-left px-4 py-2.5 text-[var(--fg-muted)] font-semibold">Required</th>
              <th className="text-left px-4 py-2.5 text-[var(--fg-muted)] font-semibold">Description</th>
            </tr>
          </thead>
          <tbody>
            {params.map((p, i) => (
              <tr key={p.name} className={cn("border-b border-[var(--border)] last:border-0", i % 2 === 0 ? "bg-transparent" : "bg-[var(--surface)]")}>
                <td className="px-4 py-2.5 font-mono text-violet-400 font-medium">{p.name}</td>
                <td className="px-4 py-2.5 text-[var(--fg-muted)] font-mono">{p.type}</td>
                <td className="px-4 py-2.5">
                  {p.required
                    ? <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">required</span>
                    : <span className="text-[10px] text-[var(--fg-muted)] bg-[var(--surface)] px-2 py-0.5 rounded-full border border-[var(--border)]">optional</span>
                  }
                </td>
                <td className="px-4 py-2.5 text-[var(--fg-soft)]">{p.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Endpoint card ─────────────────────────────────────────────────
function EndpointCard({ ep }: { ep: Endpoint }) {
  const [tab, setTab] = useState<"request" | "response">("request");
  return (
    <div id={ep.id} className="mb-10 scroll-mt-24">
      <div className="flex items-center gap-3 mb-3">
        <span className={cn("text-[11px] font-black px-2.5 py-1 rounded-md font-mono tracking-wide", METHOD[ep.method])}>
          {ep.method}
        </span>
        <code className="text-sm font-mono text-[var(--fg-soft)] bg-[var(--surface)] border border-[var(--border)] px-3 py-1 rounded-lg">
          {ep.path}
        </code>
      </div>

      <h3 className="text-[var(--fg)] font-bold text-base mb-1.5">{ep.title}</h3>
      <p className="text-[var(--fg-muted)] text-sm leading-relaxed mb-4">{ep.description}</p>

      {/* Params / body */}
      {ep.params && ep.params.length > 0 && <ParamTable params={ep.params} title="Query parameters" />}
      {ep.body   && ep.body.length   > 0 && <ParamTable params={ep.body}   title="Request body"     />}

      {/* Code + Response tabs */}
      <div className="mt-5">
        <div className="flex items-center gap-1 mb-3">
          {[
            { id: "request" as const,  label: "Code example" },
            { id: "response" as const, label: "Response"      },
          ].map(t => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-medium transition-all",
                tab === t.id
                  ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                  : "text-[var(--fg-muted)] hover:text-[var(--fg)] border border-transparent"
              )}>{t.label}</button>
          ))}
        </div>

        {tab === "request"
          ? <TabbedCode code={ep.code} />
          : (
            <div className="relative rounded-xl overflow-hidden border border-white/8">
              <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full", STATUS[200])}>200 OK</span>
                  <span className="text-white/30 text-[11px] font-mono">application/json</span>
                </div>
              </div>
              <div className="relative bg-[#0d1117]">
                <CopyButton text={ep.responseExample} />
                <pre className="p-4 text-[12.5px] leading-[1.7] font-mono text-[#c9d1d9] overflow-x-auto pr-10">
                  <code>{ep.responseExample}</code>
                </pre>
              </div>
            </div>
          )
        }
      </div>

      <div className="mt-6 border-b border-[var(--border)]" />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────
export default function DocsPage() {
  const { theme, toggle: toggleTheme } = useTheme();
  const dark = theme === "dark";
  const [search,      setSearch]      = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeId,    setActiveId]    = useState("introduction");
  const [collapsed,   setCollapsed]   = useState<Record<string, boolean>>({});
  const mainRef = useRef<HTMLDivElement>(null);

  // Active section tracking on scroll
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const handler = () => {
      const sections = el.querySelectorAll("[data-section]");
      let current = "introduction";
      sections.forEach(s => {
        if (s.getBoundingClientRect().top <= 120) current = s.getAttribute("data-section") ?? current;
      });
      setActiveId(current);
    };
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, []);

  const scrollTo = useCallback((id: string) => {
    const el = mainRef.current?.querySelector(`[data-section="${id}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    setSidebarOpen(false);
  }, []);

  const toggleCollapse = (id: string) =>
    setCollapsed(p => ({ ...p, [id]: !p[id] }));

  // Filter sections/endpoints by search
  const filtered = SECTIONS.filter(s =>
    !search ||
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.endpoints.some(e =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.path.toLowerCase().includes(search.toLowerCase())
    )
  );

  const QUICK_START_STEPS = [
    {
      step: 1, title: "Get your access token",
      desc: "Register an account or log in to receive a JWT access token.",
      code: { curl: `curl -X POST ${BASE_URL}/api/v1/auth/login \\\n  -H "Content-Type: application/json" \\\n  -d '{"email":"you@company.com","password":"yourpassword"}'`, python: `import requests\n\ntokens = requests.post(\n    "${BASE_URL}/api/v1/auth/login",\n    json={"email": "you@company.com", "password": "yourpassword"},\n).json()\naccess_token = tokens["access_token"]`, typescript: `const { access_token } = await fetch(\n  "${BASE_URL}/api/v1/auth/login",\n  {\n    method: "POST",\n    headers: { "Content-Type": "application/json" },\n    body: JSON.stringify({ email: "you@company.com", password: "yourpassword" }),\n  }\n).then(r => r.json());` },
    },
    {
      step: 2, title: "Upload a document",
      desc: "Upload any PDF, DOCX, or XLSX. It will be processed and indexed automatically.",
      code: { curl: `curl -X POST ${BASE_URL}/api/v1/documents/upload \\\n  -H "Authorization: Bearer <access_token>" \\\n  -F "file=@./contract.pdf" \\\n  -F "document_type=contract"`, python: `with open("contract.pdf", "rb") as f:\n    doc = requests.post(\n        "${BASE_URL}/api/v1/documents/upload",\n        headers={"Authorization": f"Bearer {access_token}"},\n        files={"file": f},\n        data={"document_type": "contract"},\n    ).json()\nprint(doc["id"])  # save this`, typescript: `const form = new FormData();\nform.append("file", file);\nform.append("document_type", "contract");\n\nconst doc = await fetch("${BASE_URL}/api/v1/documents/upload", {\n  method: "POST",\n  headers: { Authorization: \`Bearer \${access_token}\` },\n  body: form,\n}).then(r => r.json());` },
    },
    {
      step: 3, title: "Ask the AI advisor",
      desc: "Query your uploaded documents with natural language. Get cited, grounded answers.",
      code: { curl: `curl -X POST ${BASE_URL}/api/v1/advisor/ask \\\n  -H "Authorization: Bearer <access_token>" \\\n  -H "Content-Type: application/json" \\\n  -d '{"question":"What are the key obligations in this contract?"}'`, python: `answer = requests.post(\n    "${BASE_URL}/api/v1/advisor/ask",\n    headers={"Authorization": f"Bearer {access_token}"},\n    json={"question": "What are the key obligations in this contract?"},\n).json()\n\nprint(answer["answer"])\nfor src in answer["sources"]:\n    print(f"  → {src['filename']} (p.{src['page']})")`, typescript: `const answer = await fetch("${BASE_URL}/api/v1/advisor/ask", {\n  method: "POST",\n  headers: {\n    Authorization: \`Bearer \${access_token}\`,\n    "Content-Type": "application/json",\n  },\n  body: JSON.stringify({\n    question: "What are the key obligations in this contract?",\n  }),\n}).then(r => r.json());\n\nconsole.log(answer.answer);` },
    },
  ];

  const ERROR_CODES = [
    { code: 400, name: "bad_request",         description: "Invalid request body or parameters"            },
    { code: 401, name: "unauthorized",         description: "Missing or invalid Bearer token"               },
    { code: 403, name: "forbidden",            description: "Insufficient role for this action"             },
    { code: 404, name: "not_found",            description: "Resource does not exist"                       },
    { code: 429, name: "rate_limit_exceeded",  description: "Too many requests; check Retry-After header"   },
    { code: 429, name: "account_locked",       description: "5 failed logins → 15-minute lockout"           },
    { code: 500, name: "internal_server_error",description: "Unexpected server error; includes request_id"  },
  ];

  const WEBHOOK_EVENTS = [
    { event: "document.processed",  desc: "Document finished OCR + embedding"  },
    { event: "compliance.alert",     desc: "New compliance gap detected"         },
    { event: "advisor.query",        desc: "AI advisor query completed"          },
    { event: "document.expiring",    desc: "Document expires within 14 days"     },
  ];

  return (
    <div className={cn("min-h-screen flex flex-col", dark ? "dark" : "")} style={{ background: "var(--bg)", color: "var(--fg)" }}>

      {/* ── Top navbar ── */}
      <header className="sticky top-0 z-50 h-14 flex items-center px-4 border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-sm">
        <div className="flex items-center gap-3 flex-1">
          {/* Mobile menu */}
          <button type="button" onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-1.5 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] transition-all"
            aria-label="Toggle menu" title="Toggle menu">
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Brain size={14} className="text-white" />
            </div>
            <span className="font-bold text-[var(--fg)] text-sm">AdvisorAI</span>
          </Link>

          <span className="text-[var(--border)] mx-1 text-lg font-light select-none">/</span>
          <span className="text-[var(--fg-muted)] text-sm font-medium">API Reference</span>
        </div>

        <div className="flex items-center gap-2">
          <a href="/register"
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all">
            Get started <ExternalLink size={11} />
          </a>
          <button type="button" onClick={toggleTheme}
            className="p-2 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] transition-all"
            aria-label="Toggle theme" title="Toggle theme">
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ── */}
        <aside className={cn(
          "fixed lg:sticky top-14 z-40 h-[calc(100vh-3.5rem)] w-64 flex-shrink-0 flex flex-col border-r border-[var(--border)] overflow-y-auto transition-transform duration-200",
          "bg-[var(--bg-soft)]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}>
          {/* Search */}
          <div className="p-3 border-b border-[var(--border)]">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search endpoints..."
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)] text-xs placeholder:text-[var(--fg-muted)] focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Back to home */}
          <div className="px-3 pt-3 pb-1">
            <Link href="/" className="flex items-center gap-2 text-[var(--fg-muted)] hover:text-[var(--fg)] text-xs transition-colors group">
              <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
              Back to home
            </Link>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-3 space-y-0.5">
            {filtered.map(section => {
              const Icon = section.icon;
              const isActive = activeId === section.id || section.endpoints.some(e => e.id === activeId);
              const isCollapsed = collapsed[section.id];
              const hasEndpoints = section.endpoints.length > 0;

              return (
                <div key={section.id}>
                  <button
                    type="button"
                    onClick={() => {
                      scrollTo(section.id);
                      if (hasEndpoints) toggleCollapse(section.id);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                      isActive
                        ? "bg-violet-500/12 text-violet-400 border-l-2 border-violet-500 pl-2.5"
                        : "text-[var(--fg-soft)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)]"
                    )}
                  >
                    <Icon size={13} className="flex-shrink-0" />
                    <span className="flex-1 text-left">{section.title}</span>
                    {hasEndpoints && (
                      isCollapsed
                        ? <ChevronRight size={11} className="text-[var(--fg-muted)]" />
                        : <ChevronDown  size={11} className="text-[var(--fg-muted)]" />
                    )}
                  </button>

                  {/* Sub-items */}
                  {hasEndpoints && !isCollapsed && (
                    <div className="ml-4 pl-3 border-l border-[var(--border)] mt-0.5 mb-1 space-y-0.5">
                      {section.endpoints.map(ep => (
                        <button
                          key={ep.id}
                          type="button"
                          onClick={() => scrollTo(ep.id)}
                          className={cn(
                            "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] transition-all",
                            activeId === ep.id
                              ? "text-violet-400 bg-violet-500/8"
                              : "text-[var(--fg-muted)] hover:text-[var(--fg-soft)] hover:bg-[var(--surface-hover)]"
                          )}
                        >
                          <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded font-mono flex-shrink-0", METHOD[ep.method])}>
                            {ep.method}
                          </span>
                          <span className="truncate font-mono">{ep.path.split("/").pop()}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Base URL callout */}
          <div className="p-3 border-t border-[var(--border)]">
            <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
              <p className="text-[10px] text-[var(--fg-muted)] font-semibold uppercase tracking-widest mb-1.5">Base URL</p>
              <code className="text-[11px] text-violet-400 font-mono break-all">{BASE_URL}</code>
            </div>
          </div>
        </aside>

        {/* ── Backdrop (mobile) ── */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── Main content ── */}
        <main ref={mainRef} className="flex-1 overflow-y-auto h-[calc(100vh-3.5rem)]">
          <div className="max-w-3xl mx-auto px-6 py-12">

            {/* Introduction */}
            <div data-section="introduction" className="mb-16 scroll-mt-24">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold mb-4">
                <Code2 size={12} /> API Reference v1
              </div>
              <h1 className="text-4xl font-black text-[var(--fg)] tracking-tight mb-4 leading-tight">
                AdvisorAI<br />API Documentation
              </h1>
              <p className="text-[var(--fg-soft)] text-base leading-relaxed mb-6">
                The AdvisorAI REST API lets you build compliance, document intelligence, and AI advisor features
                directly into your applications. All endpoints return JSON, use Bearer token auth,
                and follow standard HTTP semantics.
              </p>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                {[
                  { label: "Base URL",       value: BASE_URL,              mono: true  },
                  { label: "Auth",           value: "Bearer JWT",          mono: false },
                  { label: "Content-Type",   value: "application/json",    mono: true  },
                  { label: "Rate Limit",     value: "200 req / 60s",       mono: false },
                ].map(({ label, value, mono }) => (
                  <div key={label} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-soft)]">
                    <p className="text-[10px] text-[var(--fg-muted)] font-semibold uppercase tracking-widest mb-1">{label}</p>
                    <p className={cn("text-sm text-[var(--fg)]", mono ? "font-mono text-violet-400" : "font-medium")}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Token usage note */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/8 border border-blue-500/20">
                <Lock size={15} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-400 text-sm font-semibold mb-0.5">Authentication</p>
                  <p className="text-[var(--fg-muted)] text-xs leading-relaxed">
                    Every request (except <code className="text-blue-400 font-mono">/auth/login</code> and <code className="text-blue-400 font-mono">/auth/register</code>) requires:
                    <br />
                    <code className="text-blue-300 font-mono">Authorization: Bearer &lt;access_token&gt;</code>
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Start */}
            <div data-section="quickstart" className="mb-16 scroll-mt-24">
              <div className="flex items-center gap-3 mb-2">
                <Zap size={20} className="text-amber-400" />
                <h2 className="text-2xl font-black text-[var(--fg)]">Quick Start</h2>
              </div>
              <p className="text-[var(--fg-muted)] text-sm mb-8">Get your first AI answer in under 5 minutes.</p>

              {QUICK_START_STEPS.map((s, i) => (
                <div key={s.step} className="relative pl-10 mb-10">
                  {/* Step number */}
                  <div className="absolute left-0 top-0 w-7 h-7 rounded-full bg-violet-500/20 border border-violet-500/40 text-violet-400 text-xs font-black flex items-center justify-center">
                    {s.step}
                  </div>
                  {/* Connector line */}
                  {i < QUICK_START_STEPS.length - 1 && (
                    <div className="absolute left-3.5 top-8 bottom-[-24px] w-px bg-[var(--border)]" />
                  )}
                  <h3 className="text-[var(--fg)] font-bold text-base mb-1">{s.title}</h3>
                  <p className="text-[var(--fg-muted)] text-sm mb-3">{s.desc}</p>
                  <TabbedCode code={s.code} />
                </div>
              ))}
            </div>

            {/* API sections */}
            {SECTIONS.filter(s => s.endpoints.length > 0).map(section => (
              <div key={section.id} data-section={section.id} className="mb-16 scroll-mt-24">
                <div className="flex items-center gap-3 mb-2">
                  <section.icon size={20} className="text-violet-400" />
                  <h2 className="text-2xl font-black text-[var(--fg)]">{section.title}</h2>
                </div>
                <p className="text-[var(--fg-muted)] text-sm mb-8 leading-relaxed">{section.intro}</p>

                {section.endpoints.map(ep => (
                  <EndpointCard key={ep.id} ep={ep} />
                ))}
              </div>
            ))}

            {/* Webhooks */}
            <div data-section="webhooks" className="mb-16 scroll-mt-24">
              <div className="flex items-center gap-3 mb-2">
                <Globe size={20} className="text-violet-400" />
                <h2 className="text-2xl font-black text-[var(--fg)]">Webhooks</h2>
              </div>
              <p className="text-[var(--fg-muted)] text-sm mb-6 leading-relaxed">
                Receive real-time HTTP POST notifications when events happen in your account.
                Register a webhook URL in your company settings and we'll send signed payloads.
              </p>

              {/* Events table */}
              <div className="rounded-xl border border-[var(--border)] overflow-hidden mb-6">
                <div className="bg-[var(--surface)] border-b border-[var(--border)] px-4 py-2.5">
                  <p className="text-[11px] text-[var(--fg-muted)] font-semibold uppercase tracking-widest">Event types</p>
                </div>
                <table className="w-full text-xs">
                  <tbody>
                    {WEBHOOK_EVENTS.map((e, i) => (
                      <tr key={e.event} className={cn("border-b border-[var(--border)] last:border-0", i % 2 === 0 ? "" : "bg-[var(--surface)]")}>
                        <td className="px-4 py-3 font-mono text-emerald-400 font-medium">{e.event}</td>
                        <td className="px-4 py-3 text-[var(--fg-soft)]">{e.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signature verification */}
              <div className="mb-4">
                <h3 className="text-[var(--fg)] font-bold text-sm mb-2">Verify webhook signatures</h3>
                <p className="text-[var(--fg-muted)] text-xs mb-3 leading-relaxed">
                  Every webhook includes an <code className="text-violet-400 font-mono">X-AdvisorAI-Signature</code> header.
                  Validate it using your webhook secret to prevent spoofing.
                </p>
              </div>
              <CodeBlock lang="python" code={`import hmac, hashlib\n\ndef verify_signature(payload: bytes, signature: str, secret: str) -> bool:\n    expected = "sha256=" + hmac.new(\n        secret.encode(),\n        payload,\n        hashlib.sha256,\n    ).hexdigest()\n    return hmac.compare_digest(expected, signature)\n\n# In your Flask/FastAPI handler:\n# sig = request.headers["X-AdvisorAI-Signature"]\n# assert verify_signature(request.body, sig, WEBHOOK_SECRET)`} />
            </div>

            {/* Errors & Rate Limits */}
            <div data-section="errors" className="mb-16 scroll-mt-24">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle size={20} className="text-violet-400" />
                <h2 className="text-2xl font-black text-[var(--fg)]">Errors & Rate Limits</h2>
              </div>
              <p className="text-[var(--fg-muted)] text-sm mb-6">
                All errors return a consistent JSON body with a machine-readable <code className="text-violet-400 font-mono">error</code> code.
              </p>

              {/* Error format */}
              <div className="mb-6">
                <h3 className="text-[var(--fg)] font-bold text-sm mb-3">Error response format</h3>
                <CodeBlock lang="typescript" code={`// Every error response follows this shape:\n{\n  "error": "unauthorized",          // machine-readable code\n  "message": "Missing Bearer token", // human-readable detail\n  "request_id": "7f3a2b1c-..."      // for support / debugging\n}`} />
              </div>

              {/* Error codes table */}
              <div className="rounded-xl border border-[var(--border)] overflow-hidden mb-8">
                <div className="bg-[var(--surface)] border-b border-[var(--border)] px-4 py-2.5">
                  <p className="text-[11px] text-[var(--fg-muted)] font-semibold uppercase tracking-widest">HTTP status codes</p>
                </div>
                <table className="w-full text-xs">
                  <tbody>
                    {ERROR_CODES.map((e, i) => (
                      <tr key={`${e.code}-${e.name}`} className={cn("border-b border-[var(--border)] last:border-0", i % 2 === 0 ? "" : "bg-[var(--surface)]")}>
                        <td className="px-4 py-3">
                          <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full font-mono", STATUS[e.code] ?? "bg-slate-500/15 text-slate-400")}>{e.code}</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-rose-400">{e.name}</td>
                        <td className="px-4 py-3 text-[var(--fg-soft)]">{e.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Rate limits */}
              <div>
                <h3 className="text-[var(--fg)] font-bold text-sm mb-3">Rate limits</h3>
                <p className="text-[var(--fg-muted)] text-xs mb-4 leading-relaxed">
                  Rate limits use a sliding window and are tracked per IP address. When exceeded,
                  the response includes a <code className="text-violet-400 font-mono">Retry-After</code> header
                  with seconds to wait.
                </p>
                <div className="rounded-xl border border-[var(--border)] overflow-hidden mb-6">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[var(--surface)] border-b border-[var(--border)]">
                        <th className="text-left px-4 py-2.5 text-[var(--fg-muted)] font-semibold">Endpoint</th>
                        <th className="text-left px-4 py-2.5 text-[var(--fg-muted)] font-semibold">Limit</th>
                        <th className="text-left px-4 py-2.5 text-[var(--fg-muted)] font-semibold">Window</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { ep: "/auth/login",           limit: "20 requests",  window: "60 seconds" },
                        { ep: "/auth/register",        limit: "20 requests",  window: "60 seconds" },
                        { ep: "/auth/forgot-password", limit: "10 requests",  window: "60 seconds" },
                        { ep: "/advisor/ask",          limit: "60 requests",  window: "60 seconds" },
                        { ep: "/chatbot/*",            limit: "120 requests", window: "60 seconds" },
                        { ep: "All other endpoints",   limit: "200 requests", window: "60 seconds" },
                      ].map((r, i) => (
                        <tr key={r.ep} className={cn("border-b border-[var(--border)] last:border-0", i % 2 === 0 ? "" : "bg-[var(--surface)]")}>
                          <td className="px-4 py-3 font-mono text-[var(--fg-soft)]">{r.ep}</td>
                          <td className="px-4 py-3 text-[var(--fg)]">{r.limit}</td>
                          <td className="px-4 py-3 text-[var(--fg-muted)]">{r.window}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Rate limit headers */}
                <CodeBlock lang="curl" code={`# Response headers on every request:\nX-RateLimit-Limit: 200\nX-RateLimit-Remaining: 187\n\n# When rate limited (HTTP 429):\nRetry-After: 60\n{\n  "error": "rate_limit_exceeded",\n  "message": "Too many requests. Limit: 200 per 60s.",\n  "retry_after": 60\n}`} />
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-[var(--border)] pt-8 pb-16">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[var(--fg-muted)] text-xs">AdvisorAI API Reference · v1</p>
                  <p className="text-[var(--fg-muted)] text-[11px] mt-0.5">All requests over HTTPS. TLS 1.2+ required in production.</p>
                </div>
                <div className="flex gap-3">
                  <Link href="/" className="text-[var(--fg-muted)] hover:text-violet-400 text-xs transition-colors">Home</Link>
                  <Link href="/register" className="text-[var(--fg-muted)] hover:text-violet-400 text-xs transition-colors">Sign up</Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
