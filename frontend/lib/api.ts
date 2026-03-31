// ─────────────────────────────────────────────────────────────────────────────
// AdvisorAI API client — wraps the FastAPI backend at /api/v1
// Falls back gracefully when the backend is not reachable.
// ─────────────────────────────────────────────────────────────────────────────

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const API  = `${BASE}/api/v1`;

// ── Auth token helpers ────────────────────────────────────────────────────────
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

function saveToken(token: string) {
  localStorage.setItem("access_token", token);
}

function clearToken() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("auth_user");
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────
async function request<T>(
  path: string,
  options: RequestInit = {},
  isFormData = false,
): Promise<{ data: T | null; error: string | null }> {
  const token = getToken();
  const headers: Record<string, string> = {};

  if (!isFormData) headers["Content-Type"] = "application/json";
  if (token)       headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers as Record<string, string> ?? {}) },
    });

    if (res.status === 401) {
      clearToken();
      return { data: null, error: "Unauthorized — please log in again." };
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      let err: any = body?.detail ?? `HTTP ${res.status}`;
      if (Array.isArray(err)) {
        // FastAPI validation errors come as an array of objects
        err = err.map((e) => e?.msg ?? JSON.stringify(e)).join("; ");
      } else if (typeof err === "object" && err !== null) {
        err = err.msg ?? err.error ?? JSON.stringify(err);
      }
      return { data: null, error: String(err) };
    }

    const data: T = await res.json();
    return { data, error: null };
  } catch {
    return { data: null, error: "Cannot reach server — is the backend running?" };
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const auth = {
  async login(email: string, password: string) {
    const res = await request<{ access_token: string; token_type: string }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
    );
    if (res.data?.access_token) saveToken(res.data.access_token);
    return res;
  },

  async register(payload: {
    email: string; password: string; full_name: string;
    company_name?: string; country?: string; industry?: string;
  }) {
    return request<{ id: string; email: string; full_name: string }>(
      "/auth/register",
      { method: "POST", body: JSON.stringify(payload) },
    );
  },

  async me() {
    return request<{ id: string; email: string; full_name: string; role: string; company?: { name: string } }>(
      "/auth/me",
    );
  },

  async updateMe(payload: { full_name?: string; email?: string }) {
    return request<{ id: string; email: string; full_name: string }>(
      "/auth/me",
      { method: "PUT", body: JSON.stringify(payload) },
    );
  },

  async changePassword(current: string, next: string) {
    return request<{ message: string }>(
      "/auth/me/password",
      { method: "PUT", body: JSON.stringify({ current_password: current, new_password: next }) },
    );
  },

  logout() {
    clearToken();
  },
};

// ── Documents ─────────────────────────────────────────────────────────────────
export interface ApiDocument {
  id: string;
  name: string;
  type: string;
  risk_level: string;
  status: string;
  file_size: number;
  created_at: string;
  uploaded_by?: string;
  original_filename?: string;
  document_type?: string;
}

export const documents = {
  async list(params?: { search?: string; type?: string }) {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.type && params.type !== "all") qs.set("doc_type", params.type);
    const qStr = qs.toString();
    return request<ApiDocument[]>(`/documents/${qStr ? `?${qStr}` : ""}`);
  },

  async upload(file: File, onProgress?: (pct: number) => void) {
    const form = new FormData();
    form.append("file", file);
    // Use XMLHttpRequest so we can track upload progress
    return new Promise<{ data: ApiDocument | null; error: string | null }>((resolve) => {
      const xhr = new XMLHttpRequest();
      const token = getToken();
      xhr.open("POST", `${API}/documents/upload`);
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ data: JSON.parse(xhr.responseText) as ApiDocument, error: null });
        } else {
          const body = JSON.parse(xhr.responseText || "{}") as { detail?: string };
          resolve({ data: null, error: body.detail ?? `Upload failed (${xhr.status})` });
        }
      };
      xhr.onerror = () => resolve({ data: null, error: "Network error during upload" });
      xhr.send(form);
    });
  },

  async getDownloadUrl(id: string) {
    return request<{ url: string }>(`/documents/${id}/download`);
  },

  async delete(id: string) {
    return request<{ message: string }>(`/documents/${id}`, { method: "DELETE" });
  },
};

// ── Advisor (RAG chat) ────────────────────────────────────────────────────────
export interface AskResponse {
  answer: string;
  sources?: Array<{ document_name: string; chunk: string; score: number }>;
  session_id?: string;
}

export const advisor = {
  async ask(question: string, sessionId?: string) {
    return request<AskResponse>("/advisor/ask", {
      method: "POST",
      body: JSON.stringify({ query: question }),
    });
  },
};

// ── Chatbot sessions ──────────────────────────────────────────────────────────
export interface ChatSession { id: string; title: string; updated_at: string }
export interface ChatMessage { role: "user" | "assistant"; content: string; created_at?: string }

export const chatbot = {
  async sessions() {
    return request<ChatSession[]>("/chatbot/sessions");
  },

  async createSession(title?: string) {
    return request<ChatSession>("/chatbot/sessions", {
      method: "POST",
      body: JSON.stringify({ title: title ?? "New chat" }),
    });
  },

  async getSession(id: string) {
    return request<{ id: string; messages: ChatMessage[] }>(`/chatbot/sessions/${id}`);
  },

  async sendMessage(sessionId: string, content: string) {
    return request<{ message: ChatMessage; session_id: string }>(
      `/chatbot/sessions/${sessionId}/messages`,
      { method: "POST", body: JSON.stringify({ content }) },
    );
  },

  async deleteSession(id: string) {
    return request<{ message: string }>(`/chatbot/sessions/${id}`, { method: "DELETE" });
  },
};

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analytics = {
  async overview() {
    return request<{
      documents: { total: number; processed: number; processing: number; uploaded: number; failed: number; processing_rate_pct: number };
      knowledge_entries: { total: number; by_type: Record<string, number> };
      alerts: { unread_notifications: number; upcoming_deadlines_30d: number; critical_risks: number };
      generated_at: string;
    }>("/analytics/overview");
  },

  async complianceScore(category?: string) {
    const qs = category ? `?category=${encodeURIComponent(category)}` : "";
    return request<{
      compliance_score: number;
      country: string;
      total_rules: number;
      covered_rules: number;
      coverage_percentage: number;
      gap_rules: Array<{ id: string; title: string; category: string; severity: string; deadline?: string; action_required?: string; description?: string }>;
    }>(`/analytics/compliance-score${qs}`);
  },

  async riskDistribution() {
    return request<{
      distribution: Record<string, number>;
      percentages: Record<string, number>;
      total: number;
    }>("/analytics/risk-distribution");
  },

  async documentTypes() {
    return request<{ breakdown: Record<string, number> }>("/analytics/document-types");
  },

  async exportReport(reportType: string, reportFormat: "pdf" | "excel") {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const url = `${API}/analytics/export?report_type=${encodeURIComponent(reportType)}&report_format=${encodeURIComponent(reportFormat)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return { data: null, error: `Export failed (${res.status})` };
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    return { data: { url: objectUrl }, error: null };
  },
};

// ── Notifications ─────────────────────────────────────────────────────────────
export interface ApiNotification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}

export const notifications = {
  async list(unreadOnly = false, limit = 50) {
    return request<{ items: ApiNotification[]; total: number; limit: number; offset: number }>(
      `/notifications/?unread_only=${unreadOnly}&limit=${limit}`,
    );
  },

  async unreadCount() {
    return request<{ unread_count: number }>("/notifications/unread-count");
  },

  async markRead(id: string) {
    return request<{ status: string; id: string }>(`/notifications/${id}/read`, { method: "PATCH" });
  },

  async markAllRead() {
    return request<{ status: string }>("/notifications/read-all", { method: "POST" });
  },

  async delete(id: string) {
    return request<{ status: string }>(`/notifications/${id}`, { method: "DELETE" });
  },
};

// ── Company ───────────────────────────────────────────────────────────────────
export const company = {
  async get() {
    return request<{ id: string; name: string; country: string; industry?: string; employee_count?: number }>(
      "/companies/me",
    );
  },

  async update(payload: { name?: string; country?: string; industry?: string }) {
    return request<{ id: string; name: string }>("/companies/me", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async create(payload: { name: string; country: string; industry?: string }) {
    return request<{ id: string; name: string; country: string }>("/companies/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async users() {
    return request<{ items: Array<{ id: string; full_name: string; email: string; role: string }>; total: number }>(
      "/companies/me/users",
    );
  },

  async inviteUser(email: string, role: string) {
    return request<{ message: string }>("/companies/me/invite", {
      method: "POST",
      body: JSON.stringify({ email, role }),
    });
  },

  async removeUser(userId: string) {
    return request<{ message: string }>(`/companies/me/users/${userId}`, { method: "DELETE" });
  },
};

// ── Search ────────────────────────────────────────────────────────────────────
export interface SearchResult {
  id: string;
  type: "document" | "knowledge";
  title: string;
  filename?: string;
  excerpt?: string;
  document_type?: string;
  status?: string;
  created_at?: string;
}

export const search = {
  async query(q: string, limit = 10) {
    return request<{ query: string; results: SearchResult[]; total: number }>(
      `/search?q=${encodeURIComponent(q)}&limit=${limit}`,
    );
  },
};

// ── Admin — ML Training ───────────────────────────────────────────────────────
export interface TrainingStatus {
  status: "idle" | "training" | "completed" | "failed";
  model_type?: string;
  started_at?: string;
  completed_at?: string;
  accuracy?: number;
  error?: string;
  version?: string;
}

// ── Insights ──────────────────────────────────────────────────────────────────
export interface CalendarEvent {
  id: string; title: string; category: string; color: string;
  priority: "critical" | "high" | "medium" | "low";
  description: string; due_date: string; due_month: string;
  days_until: number; overdue: boolean; urgent: boolean;
}

export const insights = {
  async health() {
    return request<{
      score: number; grade: string; trend: string; trend_direction: string;
      components: Array<{ label: string; score: number; max: number; status: string; detail: string }>;
      recommendations: Array<{ priority: string; action: string }>;
    }>("/insights/health");
  },

  async calendar(monthsAhead = 3) {
    return request<{ events: CalendarEvent[]; total: number; generated_at: string }>(
      `/insights/calendar?months_ahead=${monthsAhead}`,
    );
  },

  async expiry(daysAhead = 90) {
    return request<{
      documents: Array<{ id: string; filename: string; document_type: string; expiry_date: string; days_until: number; overdue: boolean; status: string }>;
      total: number; overdue: number; urgent: number;
    }>(`/insights/expiry?days_ahead=${daysAhead}`);
  },
};

// ── Admin — ML Training ───────────────────────────────────────────────────────
export const admin = {
  async mlStatus() {
    return request<TrainingStatus>("/admin/ml/status");
  },

  async llmStatus() {
    const res = await request<{
      configured: boolean;
      primary: "groq" | "openai" | null;
      groq: { has_key: boolean; model: string };
      openai: { has_key: boolean; model: string };
    }>("/admin/llm/status");
    // Deployed backend may not have this endpoint yet; treat 404 as benign.
    if (res.error === "HTTP 404") return { data: null, error: null };
    return res;
  },

  async trainRiskScorer(trainingData?: Array<{ text: string; label: string }>) {
    return request<{ message: string; task_id?: string; status?: string; stats?: Record<string, unknown> }>("/admin/ml/train-risk-scorer", {
      method: "POST",
      body: JSON.stringify(trainingData && trainingData.length > 0 ? { training_data: trainingData } : {}),
    });
  },

  async predictRisk(text: string) {
    return request<{ risk_level: string; confidence: number }>("/admin/ml/predict-risk", {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  },

  async stats() {
    return request<{
      total_users: number;
      total_documents: number;
      total_companies: number;
      ai_queries_total: number;
    }>("/admin/stats");
  },
};
