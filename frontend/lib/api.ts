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

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refresh_token");
}

function saveToken(token: string) {
  localStorage.setItem("access_token", token);
}

function saveRefreshToken(token: string) {
  localStorage.setItem("refresh_token", token);
}

function clearToken() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("auth_user");
}

// Prevent concurrent refresh attempts
let _refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = (async () => {
    const rt = getRefreshToken();
    if (!rt) return false;
    try {
      const res = await fetch(`${API}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: rt }),
      });
      if (!res.ok) { clearToken(); return false; }
      const data = await res.json() as { access_token: string; refresh_token: string };
      saveToken(data.access_token);
      saveRefreshToken(data.refresh_token);
      return true;
    } catch {
      return false;
    } finally {
      _refreshPromise = null;
    }
  })();
  return _refreshPromise;
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
      // Try to refresh the token once
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        // Retry the original request with the new token
        const newToken = getToken();
        const retryHeaders: Record<string, string> = { ...headers };
        if (newToken) retryHeaders["Authorization"] = `Bearer ${newToken}`;
        const retryRes = await fetch(`${API}${path}`, {
          ...options,
          headers: { ...retryHeaders, ...(options.headers as Record<string, string> ?? {}) },
        });
        if (retryRes.status === 401) {
          clearToken();
          if (typeof window !== "undefined") window.location.href = "/login";
          return { data: null, error: "Session expired. Please log in again." };
        }
        if (!retryRes.ok) {
          const body = await retryRes.json().catch(() => ({}));
          let err: any = body?.detail ?? `HTTP ${retryRes.status}`;
          if (Array.isArray(err)) err = err.map((e) => e?.msg ?? JSON.stringify(e)).join("; ");
          else if (typeof err === "object" && err !== null) err = err.msg ?? err.error ?? JSON.stringify(err);
          return { data: null, error: String(err) };
        }
        const data: T = await retryRes.json();
        return { data, error: null };
      }
      clearToken();
      if (typeof window !== "undefined") window.location.href = "/login";
      return { data: null, error: "Session expired. Please log in again." };
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
    try {
      const token = getToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers,
        body: JSON.stringify({ email, password }),
      });
      if (res.status === 403) {
        const body = await res.json().catch(() => ({}));
        const detail = body?.detail;
        if (detail?.code === "2fa_required" || detail === "2fa_required") {
          return { data: null, error: "2fa_required", userId: detail?.user_id ?? "" };
        }
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return { data: null, error: String(body?.detail ?? `HTTP ${res.status}`), userId: "" };
      }
      const data = await res.json() as { access_token: string; refresh_token: string; token_type: string };
      if (data?.access_token) saveToken(data.access_token);
      if (data?.refresh_token) saveRefreshToken(data.refresh_token);
      return { data, error: null, userId: "" };
    } catch {
      return { data: null, error: "Cannot reach server — is the backend running?", userId: "" };
    }
  },

  async loginWith2FA(userId: string, code: string) {
    const res = await request<{ access_token: string; token_type: string }>(
      "/auth/2fa/validate",
      { method: "POST", body: JSON.stringify({ user_id: userId, code }) },
    );
    if (res.data?.access_token) saveToken(res.data.access_token);
    return res;
  },

  async register(payload: {
    email: string; password: string; full_name: string;
    company_name?: string; country?: string; industry?: string;
    account_type?: "company" | "individual";
  }) {
    return request<{ id: string; email: string; full_name: string; role: string; account_type: string }>(
      "/auth/register",
      { method: "POST", body: JSON.stringify(payload) },
    );
  },

  async me() {
    return request<{ id: string; email: string; full_name: string; role: string; account_type?: string; permissions?: string[]; company?: { name: string } }>(
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

  async forgotPassword(email: string) {
    return request<{ message: string; reset_token?: string }>(
      "/auth/forgot-password",
      { method: "POST", body: JSON.stringify({ email }) },
    );
  },

  async resetPassword(token: string, newPassword: string) {
    return request<{ message: string }>(
      "/auth/reset-password",
      { method: "POST", body: JSON.stringify({ token, new_password: newPassword }) },
    );
  },

  logout() {
    clearToken();
  },

  // ── 2FA ────────────────────────────────────────────────────────────────────
  async twoFaStatus() {
    return request<{ otp_enabled: boolean; has_secret: boolean }>("/auth/2fa/status");
  },
  async twoFaSetup() {
    return request<{ secret: string; otpauth_uri: string; qr_code_base64: string }>(
      "/auth/2fa/setup", { method: "POST" },
    );
  },
  async twoFaVerify(code: string) {
    return request<{ message: string }>("/auth/2fa/verify", { method: "POST", body: JSON.stringify({ code }) });
  },
  async twoFaDisable(code: string) {
    return request<{ message: string }>("/auth/2fa/disable", { method: "POST", body: JSON.stringify({ code }) });
  },

  // ── API Keys ───────────────────────────────────────────────────────────────
  async listApiKeys() {
    return request<Array<{ id: string; name: string; key_prefix: string; scopes: string[]; is_active: boolean; last_used_at: string | null; expires_at: string | null; created_at: string }>>("/auth/api-keys");
  },
  async createApiKey(name: string, scopes: string[], expires_days?: number) {
    return request<{ id: string; name: string; key: string; key_prefix: string; scopes: string[]; expires_at: string | null; created_at: string }>(
      "/auth/api-keys", { method: "POST", body: JSON.stringify({ name, scopes, expires_days }) },
    );
  },
  async revokeApiKey(id: string) {
    return request<{ status: string }>(`/auth/api-keys/${id}`, { method: "DELETE" });
  },

  // ── Sessions ───────────────────────────────────────────────────────────────
  async listSessions() {
    return request<Array<{ id: string; ip_address: string; device_hint: string; created_at: string; last_seen_at: string }>>("/auth/sessions");
  },
  async revokeSession(id: string) {
    return request<{ status: string }>(`/auth/sessions/${id}`, { method: "DELETE" });
  },
  async revokeAllSessions() {
    return request<{ sessions_revoked: number }>("/auth/sessions", { method: "DELETE" });
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

  async getKnowledge(id: string) {
    return request<Array<{ id: string; title: string; content: string; knowledge_type: string; risk_level: string; deadline?: string; tags: string[] }>>(`/documents/${id}/knowledge`);
  },

  async getProcessingStatus() {
    return request<{ total: number; uploaded: number; processing: number; processed: number; failed: number }>("/documents/processing-status");
  },

  async bulkUpload(files: File[]) {
    const form = new FormData();
    files.forEach(f => form.append("files", f));
    const token = getToken();
    const res = await fetch(`${API}/documents/bulk-upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!res.ok) { const b = await res.json().catch(() => ({})); return { data: null, error: b.detail ?? `HTTP ${res.status}` }; }
    return { data: await res.json(), error: null };
  },

  async delete(id: string) {
    return request<{ message: string }>(`/documents/${id}`, { method: "DELETE" });
  },

  async reprocess(id: string) {
    return request<{ status: string; document_id: string; filename: string }>(
      `/documents/${id}/reprocess`,
      { method: "POST" },
    );
  },
};

// ── Advisor (RAG chat) ────────────────────────────────────────────────────────
export interface AskResponse {
  answer: string;
  sources?: Array<{ document_name: string; chunk: string; score: number }>;
  session_id?: string;
}

export const advisor = {
  async ask(question: string) {
    return request<AskResponse>("/advisor/ask", {
      method: "POST",
      body: JSON.stringify({ query: question }),
    });
  },

  async askAgent(question: string) {
    return request<AskResponse>("/advisor/ask-agent", {
      method: "POST",
      body: JSON.stringify({ query: question }),
    });
  },

  // Server-Sent Events streaming — returns a ReadableStream
  stream(question: string): EventSource {
    const token = getToken();
    const url = `${API}/advisor/stream?query=${encodeURIComponent(question)}${token ? `&token=${token}` : ""}`;
    return new EventSource(url);
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

  async rateMessage(sessionId: string, messageId: string, rating: number, comment?: string) {
    return request<{ status: string }>(
      `/chatbot/sessions/${sessionId}/messages/${messageId}/feedback`,
      { method: "POST", body: JSON.stringify({ rating, comment }) },
    );
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

  async activity(days: 7 | 14 | 30 = 14) {
    return request<{
      days: number;
      series: Array<{ date: string; label: string; uploaded: number; processed: number; entries: number }>;
    }>(`/analytics/activity?days=${days}`);
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

  async exportKnowledge(format: "csv" | "excel" = "csv") {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const url = `${API}/analytics/export-knowledge?format=${format}`;
    const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) return { data: null, error: `Export failed (${res.status})` };
    const blob = await res.blob();
    return { data: { url: URL.createObjectURL(blob) }, error: null };
  },

  async scheduleReport(payload: { report_type: string; report_format: string; schedule: string; schedule_email: string }) {
    return request<{ id: string; next_run_at: string }>("/analytics/schedule", { method: "POST", body: JSON.stringify(payload) });
  },

  async listSchedules() {
    return request<Array<{ id: string; report_type: string; schedule: string; schedule_email: string; next_run_at: string }>>("/analytics/schedules");
  },

  async deleteSchedule(id: string) {
    return request<{ status: string }>(`/analytics/schedules/${id}`, { method: "DELETE" });
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
    return request<{ status: string; email: string; role: string }>("/companies/me/invite", {
      method: "POST",
      body: JSON.stringify({ email, role }),
    });
  },

  async getInviteInfo(token: string) {
    return request<{ email: string; company_name: string; role: string; valid: boolean }>(
      `/companies/invite/${token}`,
    );
  },

  async removeUser(userId: string) {
    return request<{ message: string }>(`/companies/me/users/${userId}`, { method: "DELETE" });
  },

  async updateUserRole(userId: string, role: string) {
    return request<{ status: string; user_id: string; new_role: string }>(
      `/companies/me/users/${userId}/role`,
      { method: "PATCH", body: JSON.stringify({ role }) },
    );
  },
};


// -- Integrations (Webhooks) --------------------------------------------------
export const integrations = {
  async list() {
    return request<Array<{ id: string; name: string; webhook_url: string; events: string[]; is_active: boolean; last_triggered_at: string | null; created_at: string }>>("/integrations/");
  },
  async get(id: string) {
    return request<{ id: string; name: string; webhook_url: string; events: string[]; is_active: boolean }>(`/integrations/${id}`);
  },
  async create(payload: { name: string; webhook_url: string; events: string[]; secret?: string }) {
    return request<{ id: string; name: string; webhook_url: string }>("/integrations/", { method: "POST", body: JSON.stringify(payload) });
  },
  async update(id: string, payload: { name?: string; webhook_url?: string; events?: string[]; is_active?: boolean }) {
    return request<{ id: string; name: string }>(`/integrations/${id}`, { method: "PUT", body: JSON.stringify(payload) });
  },
  async delete(id: string) {
    return request<{ status: string }>(`/integrations/${id}`, { method: "DELETE" });
  },
  async test(id: string) {
    return request<{ status: string; response_code?: number }>(`/integrations/${id}/test`, { method: "POST" });
  },
  async logs(id: string) {
    return request<Array<{ id: string; event: string; status: string; response_code: number; created_at: string }>>(`/integrations/${id}/logs`);
  },
};

// ── Share Links ───────────────────────────────────────────────────────────────
export const shareLinks = {
  async create(payload: { document_id: string; password?: string; expires_hours?: number; max_views?: number }) {
    return request<{ id: string; token: string; share_url: string; expires_at: string | null }>("/share-links/", { method: "POST", body: JSON.stringify(payload) });
  },
  async list() {
    return request<Array<{ id: string; token: string; document_id: string; share_url: string; expires_at: string | null; view_count: number; is_active: boolean; created_at: string }>>("/share-links/");
  },
  async revoke(id: string) {
    return request<{ status: string }>(`/share-links/${id}`, { method: "DELETE" });
  },
};

// ── Document Comments ─────────────────────────────────────────────────────────
export const docComments = {
  async list(docId: string) {
    return request<Array<{ id: string; user_id: string; user_name: string; parent_id: string | null; content: string; is_edited: boolean; created_at: string }>>(`/documents/${docId}/comments`);
  },
  async create(docId: string, content: string, parentId?: string) {
    return request<{ id: string; content: string; user_name: string; created_at: string }>(`/documents/${docId}/comments`, { method: "POST", body: JSON.stringify({ content, parent_id: parentId }) });
  },
  async update(docId: string, commentId: string, content: string) {
    return request<{ id: string; content: string }>(`/documents/${docId}/comments/${commentId}`, { method: "PUT", body: JSON.stringify({ content }) });
  },
  async remove(docId: string, commentId: string) {
    return request<{ status: string }>(`/documents/${docId}/comments/${commentId}`, { method: "DELETE" });
  },
};

// ── Templates ─────────────────────────────────────────────────────────────────
export const templates = {
  async list(params?: { category?: string; country_code?: string; search?: string }) {
    const qs = new URLSearchParams();
    if (params?.category) qs.set("category", params.category);
    if (params?.country_code) qs.set("country_code", params.country_code);
    if (params?.search) qs.set("search", params.search);
    const q = qs.toString();
    return request<Array<{ id: string; name: string; description: string; category: string; country_code: string; fields: any[]; tags: string[]; usage_count: number }>>(`/templates/${q ? `?${q}` : ""}`);
  },
  async get(id: string) {
    return request<{ id: string; name: string; content: string; fields: any[]; category: string }>(`/templates/${id}`);
  },
  async use(id: string, fieldValues: Record<string, string>) {
    return request<{ rendered_content: string; unfilled_fields: string[] }>(`/templates/${id}/use`, { method: "POST", body: JSON.stringify({ field_values: fieldValues }) });
  },
  async create(payload: { name: string; category: string; content: string; fields?: any[]; tags?: string[]; country_code?: string; is_public?: boolean }) {
    return request<{ id: string; name: string }>("/templates/", { method: "POST", body: JSON.stringify(payload) });
  },
};

// ── Subscriptions ─────────────────────────────────────────────────────────────
export const subscriptions = {
  async plans() {
    return request<Array<{ tier: string; name: string; price_monthly_usd: number; price_annual_usd: number; features: string[] }>>("/subscriptions/plans");
  },
  async me() {
    return request<{ plan: string; status: string; max_documents: number; max_users: number; max_ai_queries_per_month: number; ai_queries_used: number; current_period_end: string | null }>("/subscriptions/me");
  },
  async checkout(plan: string, billing_cycle: string, success_url: string, cancel_url: string) {
    return request<{ checkout_url: string }>("/subscriptions/checkout", { method: "POST", body: JSON.stringify({ plan, billing_cycle, success_url, cancel_url }) });
  },
  async portal(return_url: string) {
    return request<{ portal_url: string }>("/subscriptions/portal", { method: "POST", body: JSON.stringify({ return_url }) });
  },
  async cancel() {
    return request<{ canceled_at: string }>("/subscriptions/me/cancel", { method: "PUT" });
  },
};

// ── Connectors ────────────────────────────────────────────────────────────────
export const connectors = {
  async list() {
    return request<Array<{ id: string; name: string; type: string; status: string; last_triggered_at: string | null }>>("/connectors/");
  },
  async connectQuickBooks(payload: { name?: string; access_token: string; refresh_token: string; realm_id: string; client_id?: string; client_secret?: string }) {
    return request<{ status: string; id: string }>("/connectors/quickbooks/connect", { method: "POST", body: JSON.stringify(payload) });
  },
  async quickbooksInvoices(limit = 20) {
    return request<any>(`/connectors/quickbooks/invoices?limit=${limit}`);
  },
  async connectXero(payload: { name?: string; access_token: string; refresh_token: string; tenant_id: string; client_id?: string }) {
    return request<{ status: string; id: string }>("/connectors/xero/connect", { method: "POST", body: JSON.stringify(payload) });
  },
  async xeroContacts(limit = 20) {
    return request<any>(`/connectors/xero/contacts?limit=${limit}`);
  },
};

// ── Bulk Documents ────────────────────────────────────────────────────────────
export const bulkDocuments = {
  async delete(ids: string[]) {
    return request<{ deleted: string[]; count: number }>("/documents/bulk-delete", { method: "POST", body: JSON.stringify({ document_ids: ids }) });
  },
  async tag(ids: string[], tags: string[]) {
    return request<{ updated: string[]; count: number }>("/documents/bulk-tag", { method: "PATCH", body: JSON.stringify({ document_ids: ids, tags }) });
  },
  async signature(ids: string[], status: string, provider?: string) {
    return request<{ updated: string[]; count: number }>("/documents/bulk-signature", { method: "PATCH", body: JSON.stringify({ document_ids: ids, signature_status: status, signature_provider: provider }) });
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

  async systemStats() {
    return request<{ companies: number; users: { total: number; active: number }; documents: number; knowledge_entries: number }>(
      "/admin/stats",
    );
  },

  async listUsers(params?: { company_id?: string; is_active?: boolean; limit?: number; offset?: number }) {
    const qs = new URLSearchParams();
    if (params?.company_id) qs.set("company_id", params.company_id);
    if (params?.is_active !== undefined) qs.set("is_active", String(params.is_active));
    if (params?.limit)  qs.set("limit",  String(params.limit));
    if (params?.offset) qs.set("offset", String(params.offset));
    const q = qs.toString();
    return request<{
      items: Array<{
        id: string; email: string; full_name: string; role: string;
        company_id: string | null; is_active: boolean; permissions: string[];
        account_type: string; created_at: string; last_login: string | null;
      }>;
      total: number;
    }>(`/admin/users${q ? `?${q}` : ""}`);
  },

  async getUserPermissions(userId: string) {
    return request<{ user_id: string; permissions: string[]; all_permissions: string[] }>(
      `/admin/users/${userId}/permissions`,
    );
  },

  async updateUserPermissions(userId: string, permissions: string[]) {
    return request<{ user_id: string; permissions: string[] }>(
      `/admin/users/${userId}/permissions`,
      { method: "PUT", body: JSON.stringify({ permissions }) },
    );
  },

  async createUser(payload: { email: string; full_name: string; password: string; role: string; company_id?: string }) {
    return request<{ id: string; email: string; full_name: string; role: string }>(
      "/admin/users",
      { method: "POST", body: JSON.stringify(payload) },
    );
  },

  async updateUserRole(userId: string, role: string) {
    return request<{ id: string; role: string }>(
      `/admin/users/${userId}/role`,
      { method: "PUT", body: JSON.stringify({ role }) },
    );
  },

  async toggleUserStatus(userId: string, isActive: boolean) {
    return request<{ id: string; is_active: boolean }>(
      `/admin/users/${userId}/status`,
      { method: "PUT", body: JSON.stringify({ is_active: isActive }) },
    );
  },

  async deleteUser(userId: string) {
    return request<{ status: string; user_id: string }>(`/admin/users/${userId}`, { method: "DELETE" });
  },

  async listCompanies() {
    return request<{
      items: Array<{
        id: string; name: string; country: string; industry?: string;
        is_active: boolean; user_count: number; document_count: number;
        created_at: string; health_score?: number;
      }>;
      total: number;
    }>("/admin/companies");
  },

  async healthAlerts() {
    return request<{ alerts: Array<{ company_id: string; company_name: string; alert_type: string; severity: string; detail: string }> }>(
      "/admin/health-alerts",
    );
  },

  async auditLogs(params?: { user_id?: string; limit?: number; offset?: number }) {
    const qs = new URLSearchParams();
    if (params?.user_id) qs.set("user_id", params.user_id);
    if (params?.limit)   qs.set("limit",   String(params.limit));
    if (params?.offset)  qs.set("offset",  String(params.offset));
    const q = qs.toString();
    return request<{ items: Array<{ id: string; user_id: string; action: string; resource_type: string; created_at: string; details?: string }>; total: number }>(
      `/admin/audit-logs${q ? `?${q}` : ""}`,
    );
  },
};
