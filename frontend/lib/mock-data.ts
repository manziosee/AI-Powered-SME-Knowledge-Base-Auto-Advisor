// ─────────────────────────────────────────────────────────────────────────────
// All hardcoded/mock data used across the dashboard
// ─────────────────────────────────────────────────────────────────────────────

// Demo users
export const DEMO_USERS = [
  {
    id: "u1",
    name: "Alice Uwimana",
    email: "alice@techventures.rw",
    password: "demo1234",
    role: "Admin",
    company: "TechVentures RW",
    avatar: "AU",
    country: "Rwanda",
  },
  {
    id: "u2",
    name: "James Mwangi",
    email: "james@retailpro.ke",
    password: "demo1234",
    role: "Manager",
    company: "RetailPro Kenya",
    avatar: "JM",
    country: "Kenya",
  },
  {
    id: "u3",
    name: "Fatima Okonkwo",
    email: "fatima@finserve.ng",
    password: "demo1234",
    role: "Admin",
    company: "FinServe Africa",
    avatar: "FO",
    country: "Nigeria",
  },
  {
    id: "u4",
    name: "Sophie Dubois",
    email: "sophie@greenlogistics.fr",
    password: "demo1234",
    role: "Employee",
    company: "GreenLogistics",
    avatar: "SD",
    country: "France",
  },
];

export const CURRENT_USER = DEMO_USERS[0];

// ── Chart data: Document activity (area/line — trading style) ────────────────
export const DOCUMENT_ACTIVITY = [
  { date: "Mar 1",  uploaded: 12, processed: 10, queries: 34 },
  { date: "Mar 3",  uploaded: 8,  processed: 8,  queries: 28 },
  { date: "Mar 5",  uploaded: 24, processed: 20, queries: 51 },
  { date: "Mar 7",  uploaded: 16, processed: 15, queries: 43 },
  { date: "Mar 9",  uploaded: 30, processed: 27, queries: 72 },
  { date: "Mar 11", uploaded: 22, processed: 22, queries: 58 },
  { date: "Mar 13", uploaded: 18, processed: 16, queries: 49 },
  { date: "Mar 15", uploaded: 35, processed: 32, queries: 90 },
  { date: "Mar 17", uploaded: 28, processed: 26, queries: 76 },
  { date: "Mar 19", uploaded: 42, processed: 38, queries: 104 },
  { date: "Mar 21", uploaded: 20, processed: 20, queries: 63 },
  { date: "Mar 23", uploaded: 38, processed: 35, queries: 88 },
  { date: "Mar 24", uploaded: 15, processed: 12, queries: 40 },
];

// ── Compliance score over time (candle-style with open/close/high/low) ────────
export const COMPLIANCE_CANDLES = [
  { date: "Week 1",  open: 72, close: 76, high: 78, low: 70, volume: 12 },
  { date: "Week 2",  open: 76, close: 74, high: 80, low: 73, volume: 18 },
  { date: "Week 3",  open: 74, close: 80, high: 82, low: 73, volume: 22 },
  { date: "Week 4",  open: 80, close: 85, high: 87, low: 79, volume: 15 },
  { date: "Week 5",  open: 85, close: 83, high: 88, low: 81, volume: 20 },
  { date: "Week 6",  open: 83, close: 88, high: 90, low: 82, volume: 25 },
  { date: "Week 7",  open: 88, close: 86, high: 92, low: 85, volume: 17 },
  { date: "Week 8",  open: 86, close: 91, high: 93, low: 85, volume: 30 },
  { date: "Week 9",  open: 91, close: 94, high: 96, low: 90, volume: 28 },
  { date: "Week 10", open: 94, close: 92, high: 97, low: 91, volume: 22 },
  { date: "Week 11", open: 92, close: 95, high: 97, low: 91, volume: 35 },
  { date: "Week 12", open: 95, close: 94, high: 98, low: 93, volume: 40 },
];

// ── Risk distribution (bar chart) ────────────────────────────────────────────
export const RISK_DISTRIBUTION = [
  { month: "Oct", critical: 5,  high: 12, medium: 24, low: 38 },
  { month: "Nov", critical: 4,  high: 10, medium: 28, low: 42 },
  { month: "Dec", critical: 7,  high: 14, medium: 22, low: 36 },
  { month: "Jan", critical: 3,  high: 9,  medium: 30, low: 45 },
  { month: "Feb", critical: 6,  high: 11, medium: 26, low: 40 },
  { month: "Mar", critical: 2,  high: 8,  medium: 20, low: 50 },
];

// ── AI query volume (multi-line sparkline) ────────────────────────────────────
export const QUERY_VOLUME = Array.from({ length: 30 }, (_, i) => ({
  day: `Day ${i + 1}`,
  rag:    Math.round(20 + Math.sin(i * 0.4) * 15 + Math.random() * 10),
  agent:  Math.round(8  + Math.sin(i * 0.3) * 8  + Math.random() * 5),
  stream: Math.round(5  + Math.sin(i * 0.5) * 6  + Math.random() * 4),
}));

// ── Document type pie breakdown ───────────────────────────────────────────────
export const DOC_TYPE_BREAKDOWN = [
  { name: "Contracts",    value: 312, color: "#ffffff" },
  { name: "Invoices",     value: 248, color: "#bbbbbb" },
  { name: "Policies",     value: 187, color: "#888888" },
  { name: "HR Docs",      value: 156, color: "#555555" },
  { name: "Tax Docs",     value: 134, color: "#333333" },
  { name: "Compliance",   value: 98,  color: "#222222" },
  { name: "Other",        value: 113, color: "#111111" },
];

// ── Documents list ────────────────────────────────────────────────────────────
export const DOCUMENTS = [
  {
    id: "d1",
    name: "Q1 Service Agreement — CloudFirst Ltd.pdf",
    type: "contract",
    status: "processed",
    size: "1.2 MB",
    uploadedBy: "Alice Uwimana",
    uploadedAt: "2026-03-20",
    risk: "low",
    pages: 12,
    entities: ["CloudFirst Ltd", "TechVentures RW", "$48,000", "March 31 2027"],
  },
  {
    id: "d2",
    name: "VAT Return Q4 2025.pdf",
    type: "tax_document",
    status: "processed",
    size: "840 KB",
    uploadedBy: "Alice Uwimana",
    uploadedAt: "2026-03-18",
    risk: "high",
    pages: 6,
    entities: ["Rwanda Revenue Authority", "RWF 2,400,000", "April 15 2026"],
  },
  {
    id: "d3",
    name: "Employee Handbook v3.docx",
    type: "hr_document",
    status: "processed",
    size: "2.1 MB",
    uploadedBy: "James Mwangi",
    uploadedAt: "2026-03-15",
    risk: "low",
    pages: 48,
    entities: ["TechVentures RW", "January 1 2026"],
  },
  {
    id: "d4",
    name: "GDPR Data Processing Agreement.pdf",
    type: "compliance",
    status: "processed",
    size: "560 KB",
    uploadedBy: "Alice Uwimana",
    uploadedAt: "2026-03-12",
    risk: "medium",
    pages: 18,
    entities: ["EU", "GDPR Article 28", "May 25 2026"],
  },
  {
    id: "d5",
    name: "Office Lease Renewal.pdf",
    type: "contract",
    status: "processing",
    size: "720 KB",
    uploadedBy: "Fatima Okonkwo",
    uploadedAt: "2026-03-24",
    risk: "medium",
    pages: 24,
    entities: ["Kigali Properties Ltd", "RWF 1,200,000/mo", "June 30 2026"],
  },
  {
    id: "d6",
    name: "Annual Tax Return 2025.xlsx",
    type: "tax_document",
    status: "processed",
    size: "380 KB",
    uploadedBy: "Alice Uwimana",
    uploadedAt: "2026-03-10",
    risk: "critical",
    pages: 3,
    entities: ["Rwanda Revenue Authority", "RWF 18,400,000", "March 31 2026"],
  },
  {
    id: "d7",
    name: "ISO 27001 Compliance Certificate.pdf",
    type: "compliance",
    status: "processed",
    size: "240 KB",
    uploadedBy: "Sophie Dubois",
    uploadedAt: "2026-03-08",
    risk: "low",
    pages: 4,
    entities: ["BSI Group", "ISO 27001:2022", "December 14 2026"],
  },
  {
    id: "d8",
    name: "Supply Agreement — Agri Rwanda.pdf",
    type: "contract",
    status: "uploaded",
    size: "1.8 MB",
    uploadedBy: "James Mwangi",
    uploadedAt: "2026-03-24",
    risk: "medium",
    pages: 32,
    entities: ["Agri Rwanda Ltd", "$120,000", "December 31 2026"],
  },
];

// ── Notifications ─────────────────────────────────────────────────────────────
export const NOTIFICATIONS = [
  {
    id: "n1",
    type: "deadline",
    title: "VAT Return due in 22 days",
    body:  "Your Q4 2025 VAT return must be filed with RRA by April 15, 2026.",
    read:  false,
    createdAt: "2026-03-24T08:00:00Z",
    severity: "high",
  },
  {
    id: "n2",
    type: "deadline",
    title: "Annual Tax Return overdue!",
    body:  "Corporate income tax return for FY2025 was due March 31. File immediately to avoid penalties.",
    read:  false,
    createdAt: "2026-03-24T07:30:00Z",
    severity: "critical",
  },
  {
    id: "n3",
    type: "document",
    title: "Document processed",
    body:  "\"Q1 Service Agreement — CloudFirst Ltd\" has been processed and indexed.",
    read:  true,
    createdAt: "2026-03-23T14:20:00Z",
    severity: "info",
  },
  {
    id: "n4",
    type: "compliance",
    title: "New GDPR guidance published",
    body:  "EU issued updated guidance on AI system transparency requirements. Review your compliance status.",
    read:  false,
    createdAt: "2026-03-22T10:00:00Z",
    severity: "medium",
  },
  {
    id: "n5",
    type: "deadline",
    title: "License renewal in 38 days",
    body:  "Your business operating license expires May 1, 2026. Begin renewal process.",
    read:  true,
    createdAt: "2026-03-21T09:00:00Z",
    severity: "medium",
  },
  {
    id: "n6",
    type: "document",
    title: "8 documents uploaded",
    body:  "Batch upload completed. 8 of 8 documents queued for processing.",
    read:  true,
    createdAt: "2026-03-20T16:45:00Z",
    severity: "info",
  },
];

// ── Compliance rules ──────────────────────────────────────────────────────────
export const COMPLIANCE_RULES = [
  {
    id: "cr1",
    category: "Tax",
    title: "Corporate Income Tax Return",
    jurisdiction: "RW",
    deadline: "2026-03-31",
    status: "overdue",
    severity: "critical",
    description: "Annual CIT return must be filed with RRA within 3 months of fiscal year end.",
  },
  {
    id: "cr2",
    category: "Tax",
    title: "VAT Return Q1 2026",
    jurisdiction: "RW",
    deadline: "2026-04-15",
    status: "upcoming",
    severity: "high",
    description: "Quarterly VAT return and payment due 15 days after quarter end.",
  },
  {
    id: "cr3",
    category: "GDPR",
    title: "Data Protection Impact Assessment",
    jurisdiction: "EU",
    deadline: "2026-05-25",
    status: "upcoming",
    severity: "medium",
    description: "Annual DPIA review required for processing activities involving personal data.",
  },
  {
    id: "cr4",
    category: "HR",
    title: "NSSF/RSSB Monthly Remittance",
    jurisdiction: "RW",
    deadline: "2026-04-05",
    status: "upcoming",
    severity: "high",
    description: "Monthly employee and employer RSSB contributions must be remitted by the 5th.",
  },
  {
    id: "cr5",
    category: "Licensing",
    title: "Business Operating License Renewal",
    jurisdiction: "RW",
    deadline: "2026-05-01",
    status: "upcoming",
    severity: "medium",
    description: "Annual business license renewal with Rwanda Development Board.",
  },
  {
    id: "cr6",
    category: "AML",
    title: "KYC Customer Due Diligence Review",
    jurisdiction: "RW",
    deadline: "2026-06-30",
    status: "on_track",
    severity: "low",
    description: "Annual review of all customer due diligence records per BNR guidelines.",
  },
];

// ── Chat messages ─────────────────────────────────────────────────────────────
export const CHAT_SESSIONS = [
  {
    id: "s1",
    title: "Q2 compliance deadlines",
    updatedAt: "2 hours ago",
    messages: [
      {
        role: "user",
        content: "What are our compliance deadlines for Q2 2026?",
      },
      {
        role: "assistant",
        content:
          "Based on your uploaded documents and company profile (Rwanda jurisdiction), here are your Q2 2026 compliance deadlines:\n\n**Critical / Overdue**\n- 🔴 Corporate Income Tax Return (FY2025) — **overdue** (was March 31)\n\n**High Priority**\n- 🟠 VAT Return Q1 2026 — **April 15** (22 days)\n- 🟠 RSSB/NSSF Monthly Remittance — **April 5** (12 days)\n\n**Medium Priority**\n- 🟡 Business Operating License Renewal — May 1\n- 🟡 GDPR DPIA Review — May 25\n\n**Sources:** VAT Return Q4 2025.pdf, Annual Tax Return 2025.xlsx, GDPR Data Processing Agreement.pdf",
      },
      {
        role: "user",
        content: "What penalties apply for late CIT filing?",
      },
      {
        role: "assistant",
        content:
          "According to the Rwanda Revenue Authority regulations extracted from your tax documents:\n\n**Late CIT Filing Penalties:**\n- **Late filing penalty:** RWF 100,000 per month (up to 6 months = RWF 600,000)\n- **Interest on unpaid tax:** 1.5% per month on outstanding balance\n- **Criminal liability:** Possible after 12 months of non-compliance\n\n**Recommended action:** File immediately using the RRA e-Tax portal. If you cannot pay in full, request a payment plan to stop penalty accumulation.\n\n**Source:** Annual Tax Return 2025.xlsx — RRA Penalty Schedule (Page 2)",
      },
    ],
  },
  {
    id: "s2",
    title: "CloudFirst contract obligations",
    updatedAt: "Yesterday",
    messages: [
      {
        role: "user",
        content: "What are the key obligations in the CloudFirst service agreement?",
      },
      {
        role: "assistant",
        content:
          "From \"Q1 Service Agreement — CloudFirst Ltd.pdf\" (12 pages, processed March 20), the key obligations are:\n\n**Your obligations (TechVentures RW):**\n- Payment of $48,000 annually, due quarterly\n- 30-day written notice for any scope changes\n- Provide access credentials within 5 business days of onboarding\n\n**CloudFirst's obligations:**\n- 99.9% uptime SLA with financial penalties (5% credit per hour)\n- Monthly performance reports by the 5th\n- 24/7 incident response within 4 hours\n\n**Key dates:**\n- Contract term: April 1, 2026 – March 31, 2027\n- Renewal notice deadline: January 31, 2027\n\n**Source:** Q1 Service Agreement — CloudFirst Ltd.pdf, Sections 3, 7, and Schedule A",
      },
    ],
  },
  {
    id: "s3",
    title: "GDPR obligations",
    updatedAt: "3 days ago",
    messages: [
      {
        role: "user",
        content: "Summarise our GDPR obligations",
      },
      {
        role: "assistant",
        content:
          "Based on your GDPR Data Processing Agreement and EU compliance rules:\n\n**Core obligations:**\n1. **Lawful basis** — Document the lawful basis for each processing activity\n2. **Data subject rights** — Respond to access/deletion/portability requests within 30 days\n3. **Breach notification** — Notify supervisory authority within 72 hours of a data breach\n4. **DPO** — Appoint a Data Protection Officer if processing at scale\n5. **DPIA** — Annual Data Protection Impact Assessment (next due: May 25, 2026)\n\n**Source:** GDPR Data Processing Agreement.pdf — Articles 13–22, 33–34",
      },
    ],
  },
];

// ── Company stats (KPI cards) ─────────────────────────────────────────────────
export const KPI_STATS = {
  totalDocuments:    1248,
  processedDocs:     1186,
  processingRate:    95.0,
  complianceScore:   94,
  criticalRisks:     2,
  highRisks:         8,
  upcomingDeadlines: 5,
  aiQueries:         876,
  knowledgeEntries:  3420,
  teamMembers:       18,
};
