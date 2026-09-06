import { clearSession, getToken } from "./auth";

export const API_URL = (process.env.REACT_APP_API_URL || "http://localhost:3001").replace(
  /\/$/,
  ""
);

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

const emitUnauthorized = () => {
  clearSession();
  window.dispatchEvent(new Event("nova-auth-expired"));
};

export async function api(path, { method = "GET", body, auth = true, token } = {}) {
  const headers = {};
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const bearer = token ?? (auth ? getToken() : null);
  if (bearer) {
    headers.Authorization = `Bearer ${bearer}`;
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Cannot reach the NOVA backend. Is it running on port 3001?", 0);
  }

  const payload = await response.json().catch(() => ({}));

  if (response.status === 401 && auth) {
    emitUnauthorized();
  }

  if (!response.ok) {
    const proxy = payload.data && typeof payload.data === "object" ? payload.data : {};
    const raw =
      payload.error ||
      payload.message ||
      proxy.message ||
      proxy.error ||
      (typeof payload.data === "string" ? payload.data : "") ||
      "";
    const detail =
      typeof raw === "string" && raw.trim()
        ? raw.trim().replace(/\s+/g, " ").slice(0, 300)
        : `Request failed (${response.status})`;
    throw new ApiError(detail, response.status, payload);
  }

  return payload;
}

export const authApi = {
  config: () => api("/api/auth/config", { auth: false }),
  signup: (body) => api("/api/auth/signup", { method: "POST", body, auth: false }),
  signin: (body) => api("/api/auth/signin", { method: "POST", body, auth: false }),
  google: (idToken) => api("/api/auth/google", { method: "POST", body: { idToken }, auth: false }),
  resetPassword: (body) => api("/api/auth/reset-password", { method: "POST", body, auth: false }),
  completeReset: (body) => api("/api/auth/complete-reset", { method: "POST", body, auth: false }),
  updateUser: (attributes) => api("/api/auth/update-user", { method: "POST", body: { attributes } }),
  signout: () => api("/api/auth/signout", { method: "POST" }),
};

export const campaignApi = {
  list: (params = {}) => {
    const query = new URLSearchParams({
      page: String(params.page || 1),
      limit: String(params.limit || 100),
    });
    return api(`/api/campaigns/list?${query}`);
  },
  get: (id) => api(`/api/campaigns/${id}`),
  create: (body) => api("/api/campaigns/create", { method: "POST", body }),
  update: (id, body) => api(`/api/campaigns/${id}`, { method: "PATCH", body }),
  updateStatus: (id, body) => api(`/api/campaigns/${id}/status`, { method: "PATCH", body }),
  send: (id) => api(`/api/campaigns/${id}/send`, { method: "POST" }),
  complete: (id, body = {}) => api(`/api/campaigns/${id}/complete`, { method: "POST", body }),
  remove: (id) => api(`/api/campaigns/${id}`, { method: "DELETE" }),
};

export const mailApi = {
  list: (campaignId, params = {}) => {
    const query = new URLSearchParams();
    if (campaignId) query.set("campaignId", campaignId);
    query.set("page", String(params.page || 1));
    query.set("limit", String(params.limit || 100));
    return api(`/api/mails?${query}`);
  },
  listByCampaign: (id) => api(`/api/mails/campaign/${id}`),
  batchCreate: (campaignId, mails) =>
    api("/api/mails/batch", { method: "POST", body: { campaignId, mails } }),
  updateStatus: (id, body) => api(`/api/mails/${id}`, { method: "PATCH", body }),
  deleteByCampaign: (id) => api(`/api/mails/campaign/${id}`, { method: "DELETE" }),
};

export const statsApi = {
  performance: () => api("/api/stats/performance"),
};

export const conversationApi = {
  list: () => api("/api/conversations"),
  create: (body = {}) => api("/api/conversations", { method: "POST", body }),
  messages: (id) => api(`/api/conversations/${id}/messages`),
  addMessage: (id, body) => api(`/api/conversations/${id}/messages`, { method: "POST", body }),
  remove: (id) => api(`/api/conversations/${id}`, { method: "DELETE" }),
};

export const openaiApi = {
  generateMessage: (body) => api("/api/openai/generate-message", { method: "POST", body }),
  generateFollowups: (body) => api("/api/openai/generate-followups", { method: "POST", body }),
};

export const influencerApi = {
  list: () => api("/api/influencers"),
  create: (body) => api("/api/influencers", { method: "POST", body }),
  update: (id, body) => api(`/api/influencers/${id}`, { method: "PATCH", body }),
  remove: (id) => api(`/api/influencers/${id}`, { method: "DELETE" }),
};

export const webhookApi = {
  send: (body) => api("/api/webhook", { method: "POST", body }),
};

export const healthApi = {
  ping: () => api("/api/health", { auth: false }),
};
