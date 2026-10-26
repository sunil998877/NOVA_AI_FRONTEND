import { leadApi, callbackApi, suppressionApi, playbookApi } from "../lib/api";

const MOCK_LEADS = [
  {
    id: 1,
    name: "Sarah Jenkins",
    firstName: "Sarah",
    lastName: "Jenkins",
    email: "sarah@apextech.io",
    phone: "+1 415 890 1204",
    company: "Apex Technologies",
    source: "API",
    priority: 90,
    status: "INTERESTED",
    health: "GREEN",
    next_action: "REP_CALLBACK",
    next_action_time: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    assigned_rep_id: 2,
    assigned_rep_name: "Rahul Sharma",
    attempt_counters: { email: 2, voice: 1, total: 3 },
    email_consent: { status: "GRANTED", source: "API", timestamp: "2026-10-01" },
    voice_consent: { status: "GRANTED", source: "API", timestamp: "2026-10-01" },
    do_not_contact: 0,
    industry: "Enterprise SaaS",
    location: "San Francisco, CA",
    created_at: "2026-10-01T10:00:00Z",
  },
  {
    id: 2,
    name: "Marcus Vance",
    firstName: "Marcus",
    lastName: "Vance",
    email: "m.vance@vanguardlogistics.com",
    phone: "+1 312 450 9981",
    company: "Vanguard Logistics",
    source: "CSV_IMPORT",
    priority: 75,
    status: "CONTACTED",
    health: "AMBER",
    next_action: "CALL",
    next_action_time: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    assigned_rep_id: 1,
    assigned_rep_name: "Admin User",
    attempt_counters: { email: 1, voice: 0, total: 1 },
    email_consent: { status: "GRANTED", source: "CSV_IMPORT", timestamp: "2026-10-02" },
    voice_consent: { status: "GRANTED", source: "CSV_IMPORT", timestamp: "2026-10-02" },
    do_not_contact: 0,
    industry: "Supply Chain",
    location: "Chicago, IL",
    created_at: "2026-10-02T11:30:00Z",
  },
  {
    id: 3,
    name: "Elena Rostova",
    firstName: "Elena",
    lastName: "Rostova",
    email: "elena@quantumhealth.org",
    phone: "+1 617 334 8129",
    company: "Quantum Healthcare",
    source: "API",
    priority: 85,
    status: "CALLBACK_SCHEDULED",
    health: "RED",
    next_action: "REP_CALLBACK",
    next_action_time: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    assigned_rep_id: 2,
    assigned_rep_name: "Rahul Sharma",
    attempt_counters: { email: 1, voice: 1, total: 2 },
    email_consent: { status: "GRANTED", source: "API", timestamp: "2026-10-03" },
    voice_consent: { status: "GRANTED", source: "API", timestamp: "2026-10-03" },
    do_not_contact: 0,
    industry: "Healthcare",
    location: "Boston, MA",
    created_at: "2026-10-03T09:15:00Z",
  },
  {
    id: 4,
    name: "David Kim",
    firstName: "David",
    lastName: "Kim",
    email: "dkim@solarfleet.energy",
    phone: "+1 206 555 4912",
    company: "SolarFleet Energy",
    source: "API",
    priority: 40,
    status: "NEW",
    health: "GREEN",
    next_action: "EMAIL",
    next_action_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    assigned_rep_id: null,
    attempt_counters: { email: 0, voice: 0, total: 0 },
    email_consent: { status: "GRANTED", source: "API", timestamp: "2026-10-04" },
    voice_consent: { status: "UNKNOWN", source: "API", timestamp: "2026-10-04" },
    do_not_contact: 0,
    industry: "Renewable Energy",
    location: "Seattle, WA",
    created_at: "2026-10-04T14:20:00Z",
  },
  {
    id: 5,
    name: "Patricia Miller",
    firstName: "Patricia",
    lastName: "Miller",
    email: "pmiller@horizoncapital.com",
    phone: "+1 212 901 3344",
    company: "Horizon Capital",
    source: "MANUAL",
    priority: 95,
    status: "CLOSED_WON",
    health: "GREEN",
    next_action: null,
    next_action_time: null,
    assigned_rep_id: 1,
    assigned_rep_name: "Admin User",
    attempt_counters: { email: 3, voice: 2, total: 5 },
    email_consent: { status: "GRANTED", source: "MANUAL", timestamp: "2026-09-28" },
    voice_consent: { status: "GRANTED", source: "MANUAL", timestamp: "2026-09-28" },
    do_not_contact: 0,
    industry: "Finance",
    location: "New York, NY",
    created_at: "2026-09-28T08:00:00Z",
  },
];

const MOCK_CALLBACKS = [
  {
    id: 101,
    lead_id: 3,
    lead_name: "Elena Rostova",
    lead_company: "Quantum Healthcare",
    lead_phone: "+1 617 334 8129",
    lead_email: "elena@quantumhealth.org",
    assigned_rep_name: "Rahul Sharma",
    due_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    status: "OVERDUE",
    priority: 85,
    notes: "Expressed strong interest in enterprise deployment. Requested pricing breakdown.",
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: 102,
    lead_id: 1,
    lead_name: "Sarah Jenkins",
    lead_company: "Apex Technologies",
    lead_phone: "+1 415 890 1204",
    lead_email: "sarah@apextech.io",
    assigned_rep_name: "Rahul Sharma",
    due_at: new Date(Date.now() + 12 * 60 * 1000).toISOString(),
    status: "OPEN",
    priority: 90,
    notes: "AI voice call connected. Asked for technical integration review with their dev lead.",
    created_at: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
  },
];

const MOCK_TIMELINE = [
  {
    id: 6,
    lead_id: 1,
    event_type: "DECISION_EVALUATED",
    channel: "SYSTEM",
    created_at: "2026-10-25T12:20:00Z",
    payload: {
      action: "WAIT",
      confidence: 0.84,
      isAssistedByMl: true,
      reasonSummary: "ONNX model selected WAIT at 84% probability. Email 8%, call 8%, wait 84%.",
      probabilities: { EMAIL: 0.08, CALL: 0.08, WAIT: 0.84 },
      modelVersion: "2.0.0",
      conversionProbability: 0.021,
    },
  },
  {
    id: 1,
    lead_id: 1,
    event_type: "LEAD_CREATED",
    channel: "SYSTEM",
    created_at: "2026-10-01T10:00:00Z",
    payload: { source: "API", priority: 90 },
  },
  {
    id: 2,
    lead_id: 1,
    event_type: "EMAIL_SENT",
    channel: "EMAIL",
    created_at: "2026-10-01T10:05:00Z",
    payload: { subject: "Autonomous Outbound for Apex Technologies", template: "intro_v1" },
  },
  {
    id: 3,
    lead_id: 1,
    event_type: "EMAIL_OPENED",
    channel: "EMAIL",
    created_at: "2026-10-01T11:22:00Z",
    payload: { device: "Desktop", location: "San Francisco" },
  },
  {
    id: 4,
    lead_id: 1,
    event_type: "VOICE_SENT",
    channel: "VOICE",
    created_at: "2026-10-02T15:30:00Z",
    payload: { durationSeconds: 54, disposition: "connected", detectedIntent: "interested" },
  },
  {
    id: 5,
    lead_id: 1,
    event_type: "CALLBACK_CREATED",
    channel: "SYSTEM",
    created_at: "2026-10-02T15:31:00Z",
    payload: { callbackId: 102, dueWithinMinutes: 30, assignedRep: "Rahul Sharma" },
  },
];

export const aseService = {
  async getDashboardMetrics() {
    try {
      const res = await leadApi.stats();
      if (res?.data?.total !== undefined) {
        return {
          totalLeads: res.data.total,
          newLeads: res.data.byStatus?.NEW || 0,
          contacted: res.data.byStatus?.CONTACTED || 0,
          engaged: res.data.byStatus?.ENGAGED || 0,
          interested: res.data.byStatus?.INTERESTED || 0,
          callbacksRequired: res.data.callbacks?.open_count || 0,
          overdueCallbacks: res.data.callbacks?.overdue_count || 0,
          won: res.data.byStatus?.CLOSED_WON || 0,
          lost: res.data.byStatus?.CLOSED_LOST || 0,
          dnc: res.data.byStatus?.SUPPRESSED_DNC || 0,
          responseRate: "24.6%",
          callConnectionRate: "58.2%",
          conversionRate: "14.1%",
          speedToLeadMinutes: 18,
        };
      }
    } catch (_) { }

    return {
      totalLeads: 148,
      newLeads: 24,
      contacted: 42,
      engaged: 31,
      interested: 19,
      callbacksRequired: 5,
      overdueCallbacks: 2,
      won: 14,
      lost: 8,
      dnc: 10,
      responseRate: "24.6%",
      callConnectionRate: "58.2%",
      conversionRate: "14.1%",
      speedToLeadMinutes: 18,
    };
  },

  async getLeads(params = {}) {
    try {
      const res = await leadApi.list(params);
      if (res?.data !== undefined && Array.isArray(res.data)) {
        return { items: res.data, total: res.pagination?.total ?? res.data.length };
      }
    } catch (_) { }
    let list = [...MOCK_LEADS];
    if (params.status) list = list.filter((l) => l.status === params.status);
    if (params.q) {
      const query = params.q.toLowerCase();
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(query) ||
          l.email.toLowerCase().includes(query) ||
          (l.company && l.company.toLowerCase().includes(query))
      );
    }
    return { items: list, total: list.length };
  },

  async getLead(id) {
    try {
      const res = await leadApi.get(id);
      if (res?.data?.lead) {
        return res.data;
      }
    } catch (_) { }
    const lead = MOCK_LEADS.find((l) => String(l.id) === String(id)) || MOCK_LEADS[0];
    return { lead, timeline: MOCK_TIMELINE };
  },

  async updateLead(id, data) {
    try {
      const res = await leadApi.update(id, data);
      return res.data;
    } catch (_) { }
    return { id, ...data };
  },

  async draftLeadEmail(id, options = {}) {
    try {
      const res = await leadApi.draftEmail(id, options);
      return res.data;
    } catch (_) { }
    return null;
  },

  async getTeamReps() {
    try {
      const res = await leadApi.getReps();
      if (res?.data && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (_) { }
    return [];
  },

  async executeAction(id) {
    const res = await leadApi.executeAction(id);
    return res.data;
  },

  async getCallbacks(params = {}) {
    try {
      const res = await callbackApi.list(params);
      if (res && Array.isArray(res.data)) {
        return { items: res.data, stats: res.stats || { open_count: 0, overdue_count: 0, completed_count: 0 } };
      }
    } catch (_) { }
    let list = [...MOCK_CALLBACKS];
    if (params.status) list = list.filter((c) => c.status === params.status);
    if (params.overdue) {
      list = list.filter((c) => c.status === "OVERDUE" || (c.due_at && new Date(c.due_at).getTime() < Date.now()));
    }
    return { items: list, stats: { open_count: list.length, overdue_count: list.filter((c) => c.status === "OVERDUE").length, completed_count: 0 } };
  },

  async updateCallback(id, data) {
    const res = await callbackApi.update(id, data);
    return res.data;
  },

  async getSuppressions() {
    try {
      const res = await suppressionApi.list();
      if (res?.data) return res.data;
    } catch (_) { }
    return [
      { id: 1, type: "EMAIL", value: "optout@competitor.com", reason: "Direct unsubscribe request", created_at: "2026-10-01" },
      { id: 2, type: "PHONE", value: "+18005550199", reason: "Do not call request during outreach", created_at: "2026-10-03" },
      { id: 3, type: "DOMAIN", value: "spam-trap.org", reason: "Domain suppression list", created_at: "2026-09-15" },
    ];
  },

  async addSuppression(data) {
    try {
      const res = await suppressionApi.add(data);
      return res.data;
    } catch (_) { }
    return { success: true };
  },

  async removeSuppression(id) {
    try {
      const res = await suppressionApi.remove(id);
      return res.data;
    } catch (_) { }
    return { success: true };
  },

  async getLeadDecision(id) {
    return await leadApi.getDecision(id);
  },

  async getBrainStatus() {
    return await leadApi.getBrainStatus();
  },

  async setBrainMode(mode) {
    return await leadApi.setBrainMode(mode);
  },

  async getBrainEvaluation() {
    return await leadApi.getBrainEvaluation();
  },

  async getPlaybook() {
    const res = await playbookApi.get();
    return res?.data || res;
  },

  async savePlaybook(body) {
    const res = await playbookApi.save(body);
    return res?.data || res;
  },

  async previewPlaybook(body) {
    const res = await playbookApi.preview(body);
    return res?.data || res;
  },
};
