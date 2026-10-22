import { followUpApi } from "../lib/api";

export const followUpService = {
  async getSequences() {
    try {
      const res = await followUpApi.listSequences();
      return res?.data || [];
    } catch (_) {
      return [];
    }
  },

  async getEnrollments(params = {}) {
    try {
      const res = await followUpApi.listEnrollments(params);
      return res?.data || [];
    } catch (_) {
      return [];
    }
  },

  async getLeadJourney(leadId) {
    try {
      const res = await followUpApi.getLeadJourney(leadId);
      return res?.data || { enrollments: [], tasks: [] };
    } catch (_) {
      return { enrollments: [], tasks: [] };
    }
  },

  async enrollLead(leadId, initialContext = {}) {
    const res = await followUpApi.enrollLead({ leadId, initialContext });
    return res?.data;
  },

  async pauseEnrollment(id, reason) {
    const res = await followUpApi.pauseEnrollment(id, { reason });
    return res?.data;
  },

  async resumeEnrollment(id) {
    const res = await followUpApi.resumeEnrollment(id);
    return res?.data;
  },

  async stopEnrollment(id, reason) {
    const res = await followUpApi.stopEnrollment(id, { reason });
    return res?.data;
  },

  async cancelEnrollment(id, reason) {
    const res = await followUpApi.cancelEnrollment(id, { reason });
    return res?.data;
  },

  async markReplyProcessed(id) {
    const res = await followUpApi.markReplyProcessed(id);
    return res?.data;
  },

  async getReplies(params = {}) {
    try {
      const res = await followUpApi.listReplies(params);
      return res?.data || [];
    } catch (_) {
      return [];
    }
  },

  async getBlockedTasks(params = {}) {
    try {
      const res = await followUpApi.listBlockedTasks(params);
      return res?.data || [];
    } catch (_) {
      return [];
    }
  },

  async previewTask(id) {
    const res = await followUpApi.previewTask(id);
    return res?.data;
  },

  async updateTask(id, data) {
    const res = await followUpApi.updateTask(id, data);
    return res?.data;
  },

  async retryTask(id) {
    const res = await followUpApi.retryTask(id);
    return res?.data;
  },
  async getAutomationStatus() {
    try {
      const res = await followUpApi.getAutomationStatus();
      return res?.data || { settings: { status: "active", auto_enroll_enabled: 1 }, counts: {} };
    } catch (_) {
      return { settings: { status: "active", auto_enroll_enabled: 1 }, counts: {} };
    }
  },
  async startAutomation(params = {}) {
    const res = await followUpApi.startAutomation(params);
    return res?.data;
  },
  async pauseAutomation(params = {}) {
    const res = await followUpApi.pauseAutomation(params);
    return res?.data;
  },
  async resumeAutomation(params = {}) {
    const res = await followUpApi.resumeAutomation(params);
    return res?.data;
  },
  async stopAutomation(params = {}) {
    const res = await followUpApi.stopAutomation(params);
    return res?.data;
  },
};
