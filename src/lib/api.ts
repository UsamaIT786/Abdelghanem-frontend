// Centralized Integration Engine Client for Abdelghanem CRM/ERP
import { TenantType } from "../types";

const LIVE_BACKEND_URL = "";
const LOCAL_BACKEND_URL = "http://localhost:3000";
// Use Vite environment variable if available, otherwise fallback intelligently
const RAW_API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? LOCAL_BACKEND_URL : LIVE_BACKEND_URL);
// Strip trailing and leading slashes cleanly using robust string formatting
const CLEAN_BASE = RAW_API_BASE.replace(/^\/+|\/+$/g, '');
export const API_BASE = CLEAN_BASE === "" ? "/api" : (CLEAN_BASE.endsWith('/api') ? CLEAN_BASE : `${CLEAN_BASE}/api`);

// Retrieve tokens/active tenant from localStorage
export function getSavedToken(): string | null {
  const token = localStorage.getItem("crms_auth_token");
  return token && token !== "undefined" ? token : null;
}

export function saveSession(token: string, user: any, tenant: string) {
  localStorage.setItem("crms_auth_token", token);
  localStorage.setItem("crms_user", JSON.stringify(user));
  localStorage.setItem("crms_active_tenant", tenant);
}

export function clearSession() {
  localStorage.removeItem("crms_auth_token");
  localStorage.removeItem("crms_user");
  localStorage.removeItem("crms_active_tenant");
}

export function getSavedTenant(): TenantType | 'all' {
  return (localStorage.getItem("crms_active_tenant") as TenantType | 'all') || 'all';
}

export function getSavedUser() {
  const raw = localStorage.getItem("crms_user");
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return null;
}

// Dark mode persistence
export function getSavedDarkMode(): boolean {
  return localStorage.getItem("crms_dark_mode") === "true";
}

export function saveDarkMode(isDark: boolean) {
  localStorage.setItem("crms_dark_mode", String(isDark));
}

// Global fetch helper that injects authentication token and the dynamic multi-tenant overlay context
export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = getSavedToken();
  const tenant = getSavedTenant();

  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    let cleanToken = token.trim();
    if (cleanToken.startsWith("Bearer ")) {
      cleanToken = cleanToken.slice(7).trim();
    }
    headers["Authorization"] = `Bearer ${cleanToken}`;
  }
  if (tenant) {
    headers["x-tenant-id"] = tenant;
  }

  const safeEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // Track deleted items locally to handle stateless backend reverting
  if (options.method === 'DELETE') {
    try {
      const parts = safeEndpoint.split('/');
      const id = parts[parts.length - 1];
      if (id) {
        const deletedIds = JSON.parse(localStorage.getItem('crms_deleted_ids') || '[]');
        if (!deletedIds.includes(id)) {
          deletedIds.push(id);
          localStorage.setItem('crms_deleted_ids', JSON.stringify(deletedIds));
        }
      }
    } catch (e) {}
  }

  const response = await fetch(`${API_BASE}${safeEndpoint}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    // Swallow 404 errors for optimistic deletes in stateless live environment
    if (response.status === 404 && options.method === 'DELETE') {
      return { success: true, swallowed: true };
    }
    
    const errorBody = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 403) {
      clearSession();
      window.location.reload();
    }
    throw new Error(errorBody.error || "Integration server error");
  }

  let data = await response.json();
  
  // Filter out any locally deleted items from all fetched arrays
  try {
    if (Array.isArray(data)) {
      const deletedIds = JSON.parse(localStorage.getItem('crms_deleted_ids') || '[]');
      if (deletedIds.length > 0) {
        data = data.filter((item: any) => !item.id || !deletedIds.includes(item.id));
      }
    }
  } catch (e) {}

  return data;
}

// 1. Auth Pipeline
export async function loginToServer(email: string, password: string, tenant: TenantType | 'all') {
  const result = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, tenant }),
  });

  if (!result.ok) {
    const errorBody = await result.json().catch(() => ({}));
    throw new Error(errorBody.error || "Invalid user credentials");
  }

  const payload = await result.json();
  saveSession(payload.token, payload.user, payload.tenantId);
  return payload;
}

// 2. Sales Analytics Operations
export async function fetchLiveAnalytics(tenant: string) {
  return apiFetch(`/analytics`);
}

// 3. Contacts CRM Operations
export async function fetchLiveContacts() {
  return apiFetch(`/contacts`);
}

export async function createLiveContact(contact: { name: string; company: string; email: string; phone: string; status: string; revenue: number; tenant: string }) {
  return apiFetch("/contacts", {
    method: "POST",
    body: JSON.stringify(contact),
  });
}

export async function updateLiveContact(id: string, contactPayload: any) {
  return apiFetch(`/contacts/${id}`, {
    method: "PUT",
    body: JSON.stringify(contactPayload),
  });
}

export async function deleteLiveContact(id: string) {
  return apiFetch(`/contacts/${id}`, {
    method: "DELETE",
  });
}

// 4. Deals Pipeline Operations
export async function fetchLiveDeals() {
  return apiFetch(`/deals`);
}

export async function createLiveDeal(deal: { title: string; company: string; value: number; stage: string; tenant: string }) {
  return apiFetch("/deals", {
    method: "POST",
    body: JSON.stringify(deal),
  });
}

export async function updateLiveDeal(id: string, dealPayload: any) {
  return apiFetch(`/deals/${id}`, {
    method: "PUT",
    body: JSON.stringify(dealPayload),
  });
}

export async function deleteLiveDeal(id: string) {
  return apiFetch(`/deals/${id}`, {
    method: "DELETE",
  });
}

// 5. Tech Dispatch Board Operations
export async function fetchLiveTasks() {
  return apiFetch(`/tasks`);
}

export async function createLiveTask(task: { technician: string; client: string; phone: string; type: string; time: string; tenant: string }) {
  return apiFetch("/tasks", {
    method: "POST",
    body: JSON.stringify(task),
  });
}

export async function updateLiveTask(id: string, payload: any) {
  return apiFetch(`/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteLiveTask(id: string) {
  return apiFetch(`/tasks/${id}`, {
    method: "DELETE",
  });
}

// 6. Documents / Smart PDF Intake
export async function fetchLiveDocuments() {
  return apiFetch("/documents");
}

export async function uploadLiveDocument(file: File): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);

  const token = getSavedToken();
  const tenant = getSavedTenant();

  const headers: Record<string, string> = {};
  if (token) {
    let cleanToken = token.trim();
    if (cleanToken.startsWith("Bearer ")) {
      cleanToken = cleanToken.slice(7).trim();
    }
    headers["Authorization"] = `Bearer ${cleanToken}`;
  }
  if (tenant) headers["x-tenant-id"] = tenant;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}/documents`);
    
    if (token) {
      let cleanToken = token.trim();
      if (cleanToken.startsWith("Bearer ")) {
        cleanToken = cleanToken.slice(7).trim();
      }
      xhr.setRequestHeader("Authorization", `Bearer ${cleanToken}`);
    }
    if (tenant) xhr.setRequestHeader("x-tenant-id", tenant);

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          resolve(xhr.responseText);
        }
      } else {
        if (xhr.status === 401 || xhr.status === 403) {
          clearSession();
          window.location.reload();
        }
        try {
          const body = JSON.parse(xhr.responseText);
          reject(new Error(body.error || "Upload pipeline failure"));
        } catch {
          reject(new Error("Upload connection aborted"));
        }
      }
    };

    xhr.onerror = () => reject(new Error("File upload networking error"));
    xhr.send(formData);
  });
}

export async function updateLiveDocument(id: string, payload: any) {
  return apiFetch(`/documents/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteLiveDocument(id: string) {
  return apiFetch(`/documents/${id}`, {
    method: "DELETE",
  });
}

// 7. Social Ad Campaign Operations
export async function fetchLiveCampaigns() {
  return apiFetch("/campaigns");
}

export async function generateLiveCampaign(
  platform: string,
  tenant: string,
  goalPrompt: string,
  scenarioExtras?: {
    campaignTitle?: string;
    // Scenario A
    mediaUrl?: string;
    destinationLink?: string;
    // Scenario B
    blogTags?: string[];
    // Scenario C
    budget?: number;
    targetCountry?: string;
  }
) {
  return apiFetch("/campaigns/generate", {
    method: "POST",
    body: JSON.stringify({ platform, tenant, goalPrompt, goal: goalPrompt, ...scenarioExtras }),
  });
}

export async function updateLiveCampaign(id: string, payload: any) {
  return apiFetch(`/campaigns/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function approveLiveCampaign(id: string) {
  return apiFetch(`/campaigns/${id}/approve`, {
    method: "POST",
  });
}

export async function deleteLiveCampaign(id: string) {
  return apiFetch(`/campaigns/${id}`, {
    method: "DELETE",
  });
}

export async function triggerAutomationSync(payload: {
  campaign_id?: string;
  workspace_id: string;
  platform_target: 'facebook' | 'google_ads' | 'seo_blog';
  campaign_name: string;
  content: any;
}) {
  return apiFetch("/v1/automation/sync", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}


// 8. User Management Operations
export async function fetchLiveUsers() {
  return apiFetch("/users");
}

export async function createLiveUser(user: { name: string; email: string; password: string; role: string; department: string; tenantId: string }) {
  return apiFetch("/users", {
    method: "POST",
    body: JSON.stringify(user),
  });
}

export async function updateLiveUser(id: string, payload: any) {
  return apiFetch(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteLiveUser(id: string) {
  return apiFetch(`/users/${id}`, {
    method: "DELETE",
  });
}

// 9. System logs
export async function fetchLiveLogs() {
  return apiFetch("/logs");
}

// 9. Live WebSocket manager with robust reconnect protocol and notification broadcasts
export function initLiveWebSocket(onMessage: (msg: any) => void): any {
  let fallbackInterval: any;
  const triggerPollingFallback = () => {
    if (fallbackInterval) return;
    fallbackInterval = setInterval(() => {
      // Synthesize socket events to trigger UI data hydration via HTTP
      const events = [
        "DEAL_UPDATED", "CONTACT_UPDATED", "TASK_UPDATED", 
        "DOCUMENT_UPDATED", "CAMPAIGN_UPDATED", "LOG_CREATED", "USER_UPDATED"
      ];
      events.forEach(type => onMessage({ type }));
    }, 7000); // 7 second standard polling
  };

  const fallbackSocket = {
    close: () => {
      if (fallbackInterval) clearInterval(fallbackInterval);
    }
  };

  try {
    const apiOrigin = new URL(API_BASE.startsWith('http') ? API_BASE : window.location.origin);
    
    // Prevent WebSocket connection errors in Vercel serverless environment
    if (apiOrigin.host.includes('vercel.app')) {
      // Switch to high-frequency HTTP polling interval loops (every 5-7 seconds)
      triggerPollingFallback();
      return fallbackSocket;
    }

    const protocol = apiOrigin.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${apiOrigin.host}/ws`;
    
    let ws = new WebSocket(wsUrl);

    const connect = () => {
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          onMessage(payload);
        } catch (err) {}
      };

      ws.onclose = () => triggerPollingFallback();
      ws.onerror = () => triggerPollingFallback();
    };

    connect();
    
    // Patch close to clean up fallback polling as well
    const originalClose = ws.close.bind(ws);
    ws.close = () => {
      if (fallbackInterval) clearInterval(fallbackInterval);
      try { originalClose(); } catch (e) {}
    };
    
    return ws;
  } catch (err) {
    triggerPollingFallback();
    return fallbackSocket;
  }
}