import { leadApi, callbackApi, suppressionApi, playbookApi, aseOperatingApi } from "../lib/api";

export const aseService = {
  async getDashboardMetrics() {
    const res = await leadApi.stats();
    if (res?.data?.total === undefined) {
      throw new Error("Dashboard metrics unavailable");
    }
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
      conversionRate: res.data.total
        ? `${((Number(res.data.byStatus?.CLOSED_WON || 0) / Number(res.data.total)) * 100).toFixed(1)}%`
        : "0%",
    };
  },

  async getLeads(params = {}) {
    const res = await leadApi.list(params);
    if (res?.data !== undefined && Array.isArray(res.data)) {
      return { items: res.data, total: res.pagination?.total ?? res.data.length };
    }
    throw new Error("Leads unavailable");
  },

  async getLead(id) {
    const res = await leadApi.get(id);
    if (res?.data?.lead) {
      return res.data;
    }
    throw new Error("Lead not found");
  },

  async updateLead(id, data) {
    const res = await leadApi.update(id, data);
    return res.data;
  },

  async draftLeadEmail(id, options = {}) {
    const res = await leadApi.draftEmail(id, options);
    return res.data;
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
    const res = await callbackApi.list(params);
    if (res && Array.isArray(res.data)) {
      return { items: res.data, stats: res.stats || { open_count: 0, overdue_count: 0, completed_count: 0 } };
    }
    return { items: [], stats: { open_count: 0, overdue_count: 0, completed_count: 0 } };
  },

  async updateCallback(id, data) {
    const res = await callbackApi.update(id, data);
    return res.data;
  },

  async startCallbackCall(id) {
    const res = await callbackApi.startCall(id);
    return res?.data || res;
  },

  async getCallbackCall(id) {
    const res = await callbackApi.getCall(id);
    return res?.data || res;
  },

  async getSuppressions() {
    const res = await suppressionApi.list();
    return res?.data || [];
  },

  async addSuppression(data) {
    const res = await suppressionApi.add(data);
    return res.data;
  },

  async removeSuppression(id) {
    const res = await suppressionApi.remove(id);
    return res.data;
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

  async getOperatingMode() {
    return await aseOperatingApi.getMode();
  },

  async setOperatingMode(mode) {
    return await aseOperatingApi.setMode(mode);
  },

  async getLeadApproval(leadId) {
    const res = await aseOperatingApi.getLeadApproval(leadId);
    return res?.data || null;
  },

  async approveLeadAction(leadId, body = {}) {
    const res = await aseOperatingApi.approveLead(leadId, body);
    return res?.data || res;
  },

  async holdLeadAction(leadId) {
    const res = await aseOperatingApi.holdLead(leadId);
    return res?.data || res;
  },

  async unholdLeadAction(leadId) {
    const res = await aseOperatingApi.unholdLead(leadId);
    return res?.data || res;
  },

  async listInvites() {
    const res = await aseOperatingApi.listInvites();
    if (!Array.isArray(res?.data)) throw new Error("Invites unavailable");
    return res.data;
  },

  async createInvite(body) {
    const res = await aseOperatingApi.createInvite(body);
    if (!res?.data) throw new Error("Could not create invite");
    return res.data;
  },

  async getReports() {
    const res = await leadApi.getReports();
    if (!res?.data) throw new Error("Reports unavailable");
    return res.data;
  },

  async getSegments() {
    const res = await leadApi.getSegments();
    if (!Array.isArray(res?.data)) throw new Error("Segments unavailable");
    return res.data;
  },

  async getComplianceLog(params = {}) {
    const res = await leadApi.getComplianceLog(params);
    if (!Array.isArray(res?.data)) throw new Error("Compliance log unavailable");
    return res.data;
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

  async getQueueStatus() {
    const res = await aseOperatingApi.getQueueStatus();
    return res?.data || null;
  },
};
