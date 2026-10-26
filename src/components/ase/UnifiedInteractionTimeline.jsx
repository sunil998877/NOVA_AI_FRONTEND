import React, { useState, useMemo, useEffect } from "react";
import { followUpService } from "../../services/followUp.service";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Mail,
  Settings,
  PhoneCall,
  Bot,
  Users,
  Sparkles,
  AlertTriangle,
  Activity,
  ExternalLink,
  CheckCircle,
  Clock,
  Send,
  MousePointerClick,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";

function getEventDate(ev) {
  const ts = ev.created_at || ev.timestamp || ev.payload?.timestamp || ev.payload?.recordedAt;
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d;
}

function formatIndianDateTime(val) {
  if (!val) return "";
  const d = typeof val === "string" || typeof val === "number" ? new Date(val) : val;
  if (!(d instanceof Date) || isNaN(d.getTime())) return String(val);

  return (
    d.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }) + " IST"
  );
}

function formatEventTime(d) {
  const dateObj = typeof d === "string" || typeof d === "number" ? new Date(d) : d;
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return "";
  return dateObj.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function isIsoDateString(val) {
  if (typeof val !== "string") return false;
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val) && !isNaN(new Date(val).getTime());
}

function isDateKey(key) {
  if (typeof key !== "string") return false;
  const lower = key.toLowerCase();
  return (
    lower.includes("time") ||
    lower.includes("date") ||
    lower.endsWith("_at") ||
    lower.endsWith("at")
  );
}

function getDateKey(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "unknown";
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

const DAY_OFFSET_BY_STEP = { 1: 2, 2: 7, 3: 14, 4: 28, 5: 42 };
const STEP_TITLE_BY_NUMBER = {
  1: "Helpful in-thread follow-up",
  2: "Insight & practical benchmark",
  3: "Addressing objections",
  4: "Personalized video concept",
  5: "Polite final check-in",
};

function formatFollowUpCalendarDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "long",
  });
}

function normalizeCadenceSteps(steps) {
  if (!Array.isArray(steps) || steps.length === 0) return [];
  return steps
    .map((s) => {
      const stepNumber = Number(s.stepNumber || s.step_number || s.step);
      const dayOffset = Number(
        s.dayOffset ?? s.day_offset ?? DAY_OFFSET_BY_STEP[stepNumber] ?? stepNumber
      );
      return {
        stepNumber,
        dayOffset,
        scheduledAt: s.scheduledAt || s.scheduled_at,
        title: s.title || STEP_TITLE_BY_NUMBER[stepNumber] || `Follow-up touch ${stepNumber}`,
        status: s.status,
        subject: s.subject,
      };
    })
    .filter((s) => s.dayOffset || s.scheduledAt)
    .sort((a, b) => (a.dayOffset || 0) - (b.dayOffset || 0));
}

function formatCadenceLine(steps) {
  const normalized = normalizeCadenceSteps(steps);
  if (normalized.length === 0) return null;
  return normalized
    .map((s) => {
      const dateLabel = formatFollowUpCalendarDate(s.scheduledAt);
      return dateLabel ? `Day ${s.dayOffset}: ${dateLabel}` : `Day ${s.dayOffset}`;
    })
    .join(" · ");
}

function formatDateGroupHeader(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) {
    return { label: "Unknown date", sub: "" };
  }
  const now = new Date();
  const isSameDay = (d1, d2) => {
    const s1 = d1.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const s2 = d2.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    return s1 === s2;
  };

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const formattedDate = d.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  if (isSameDay(d, now)) {
    return {
      label: `Today — ${formattedDate}`,
      badge: "Today",
      tone: "blue",
    };
  }

  if (isSameDay(d, yesterday)) {
    return {
      label: `Yesterday — ${formattedDate}`,
      badge: null,
      tone: "emerald",
    };
  }

  const dayOfWeek = d.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
  });
  const diffDays = Math.round((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  const tone = diffDays <= 3 ? "rose" : "slate";

  return {
    label: `${dayOfWeek} — ${formattedDate}`,
    badge: null,
    tone,
  };
}

function formatCandidateProbabilities(rawProb) {
  if (!rawProb || typeof rawProb !== "object") return null;
  const entries = Object.entries(rawProb).filter(
    ([_, v]) => typeof v === "number" && Number.isFinite(v) && v >= 0
  );
  if (entries.length === 0) return null;
  const sum = entries.reduce((acc, [_, v]) => acc + v, 0);
  if (sum <= 0) return null;

  return entries
    .map(([action, val]) => {
      const pct = Math.round((val / sum) * 100);
      return `${action} ${pct}%`;
    })
    .join(", ");
}

function normalizeEventDisplay(ev, lead = {}, followUpTasks = []) {
  const p = ev.payload || {};
  const t = String(ev.event_type || "");
  const channel = String(ev.channel || "").toUpperCase();
  const eventDate = getEventDate(ev);
  const timeFormatted = formatEventTime(eventDate);

  let type = "system";
  let title = "System Event";
  let badgeText = "System";
  let badgeClass = "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200/60";
  let primary = "";
  let secondary = "";
  let rightTop = "";
  let rightBottom = "";
  let hasLink = false;

  if (t === "ActionCompleted" || t === "EMAIL_SENT" || t === "DELIVERY_CONFIRMED") {
    type = "email_sent";
    title = "Email Sent";
    badgeText = "SMTP Accepted";
    badgeClass = "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300/60";
    const sub = p.metadata?.subject || p.subject || lead.metadata?.outreach_email?.subject;
    primary = sub ? `Subject: ${sub}` : `Subject: Outreach Email`;
    secondary = `To: ${p.metadata?.to || p.to || p.recipient || lead.email || "recipient"}`;
    rightTop = p.campaignName || p.campaign || "Outreach Sequence";
    const msgId = p.metadata?.messageId || p.messageId || p.providerMessageId;
    rightBottom = msgId ? `Message ID: ${msgId.slice(0, 18)}...` : `From: ${p.from || "sales@novaai.com"}`;
    hasLink = Boolean(msgId);
  } else if (t === "ActionDispatched" || t === "OUTREACH_DISPATCHED") {
    type = "dispatched";
    title = `Outreach Dispatched (${channel || p.action || "EMAIL"})`;
    badgeText = "Dispatched";
    badgeClass = "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200/60";
    primary = `Dispatched to mail delivery queue for delivery processing`;
    secondary = p.execution_id ? `Execution ID: ${p.execution_id}` : `Target: ${lead.email || "lead"}`;
    rightTop = "ASE Scheduler Dispatch";
    rightBottom = `Dispatched at: ${timeFormatted}`;
  } else if (t === "EMAIL_OPENED" || t === "ActionOpened" || p.status === "OPENED" || p.eventType === "opened") {
    type = "email_opened";
    title = "Email Opened";
    badgeText = "Opened";
    badgeClass = "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300/60";
    const sub = p.subject || lead.metadata?.outreach_email?.subject;
    primary = sub ? `Subject: ${sub}` : "Prospect opened outreach email";
    secondary = `To: ${p.recipient || lead.email || "prospect"}`;
    rightTop = p.campaignName || "Campaign: Follow-up Sequence";
    rightBottom = `Opened at: ${p.openedAt || timeFormatted}`;
  } else if (t === "EMAIL_CLICKED" || t === "ActionClicked" || p.eventType === "click") {
    type = "email_clicked";
    title = "Email Link Clicked";
    badgeText = "Clicked";
    badgeClass = "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300/60";
    primary = p.url ? `Clicked link: ${p.url}` : "Prospect clicked link in outreach email";
    secondary = `Recipient: ${p.recipient || lead.email || "prospect"}`;
    rightTop = "Link Engagement";
    rightBottom = `Clicked at: ${timeFormatted}`;
  } else if (t === "EMAIL_DRAFTED") {
    type = "draft";
    title = "Professional Email Drafted";
    badgeText = "Drafted";
    badgeClass = "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200/60";
    primary = p.subject ? `Subject: ${p.subject}` : "Drafted from corporate profile analysis";
    secondary = `To: ${p.recipient || lead.email || "prospect"}`;
    rightTop = "Autonomous Drafter";
    rightBottom = "Model: Gemini 2.5";
  } else if (t === "ActionScheduled" || t === "OUTREACH_SCHEDULED") {
    type = "scheduled";
    title = `Outreach Scheduled (${p.action || channel || "EMAIL"})`;
    const isPastDue = p.scheduled_time && new Date(p.scheduled_time) <= new Date();
    const isCompleted = Boolean(p.status === "SUCCEEDED" || p.dispatched || p.completed);

    if (isCompleted) {
      badgeText = "Completed";
      badgeClass = "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300/60";
      primary = p.scheduled_time
        ? `Dispatched at ${formatEventTime(new Date(p.scheduled_time))}`
        : "Outreach processed";
      rightTop = "Cadence Queue";
      rightBottom = "Status: Processed";
    } else if (isPastDue) {
      badgeText = "Due";
      badgeClass = "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200/60";
      primary = p.scheduled_time
        ? `Ready for dispatch since ${formatEventTime(new Date(p.scheduled_time))}`
        : "Due for dispatch";
      rightTop = "Cadence Queue";
      rightBottom = "Status: Ready";
    } else {
      badgeText = "Queued";
      badgeClass = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200/60";
      primary = p.scheduled_time
        ? `Queued for dispatch at ${formatEventTime(new Date(p.scheduled_time))}`
        : "Queued by the Autonomous Engine";
      rightTop = "Cadence Queue";
      rightBottom = "Status: Pending";
    }
    secondary = `Channel: ${p.action || channel || "EMAIL"}`;
  } else if (t === "LeadStateChanged" || t === "LEAD_STATE_CHANGED" || t === "LEAD_STATUS_UPDATED" || t === "LEAD_DEDUPLICATED") {
    type = "state_changed";
    title = "Lead Status Updated";
    badgeText = "System";
    badgeClass = "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200/60";
    primary = p.from_state && p.to_state
      ? `Lead moved from ${p.from_state} to ${p.to_state}`
      : `Status updated to ${p.status || lead.status || "In Progress"}`;
    secondary = p.reason ? `Reason: ${p.reason}` : (p.email ? `Matched Email: ${p.email}` : "Lifecycle state transition");
    rightTop = `By: ${p.by || "NOVA System"}`;
    rightBottom = p.to_state ? `State: ${p.to_state}` : "";
  } else if (channel === "VOICE" || t === "VOICE_CALL" || t === "CallDispatched" || t === "OUTBOUND_CALL" || t === "CALL_COMPLETED") {
    type = "call";
    title = "Outbound Call";
    const statusVal = String(p.status || p.callStatus || "NO_ANSWER").toUpperCase();
    badgeText = statusVal === "COMPLETED" ? "Answered" : statusVal === "ANSWERED" ? "Answered" : statusVal === "BUSY" ? "Busy" : "No Answer";
    badgeClass = statusVal === "COMPLETED" || statusVal === "ANSWERED"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300/60"
      : "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200/60";
    primary = `Call to ${p.phone || lead.phone || "phone"}`;
    secondary = `Duration: ${p.duration || "00:00"}`;
    rightTop = "Via: Voice Channel";
    rightBottom = `Call ID: ${p.callId || p.call_id || "call_session"}`;
  } else if (t === "ORCHESTRATOR_DECISION" || t === "DECISION_EVALUATED" || t === "NOVA_BRAIN_DECISION") {
    type = "brain_decision";
    title = "NOVA Brain Decision";
    badgeText = p.isAssistedByMl ? "AI Decision" : "Rules Baseline";
    badgeClass = p.isAssistedByMl
      ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200/60"
      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200/60";

    const executedAction = p.action || "NONE";
    const confVal = typeof p.confidence === "number" && Number.isFinite(p.confidence)
      ? Math.round(p.confidence > 1 ? p.confidence : p.confidence * 100)
      : null;

    const probBreakdown = formatCandidateProbabilities(p.probabilities);

    if (p.reasonSummary) {
      primary = p.reasonSummary;
      secondary = probBreakdown
        ? `Probabilities: ${probBreakdown}`
        : (p.reasonCodes ? `Reason Codes: ${Array.isArray(p.reasonCodes) ? p.reasonCodes.join(", ") : p.reasonCodes}` : "");
    } else {
      primary = confVal !== null
        ? `Selected ${executedAction} at ${confVal}% confidence.`
        : `Selected action: ${executedAction}`;
      secondary = probBreakdown
        ? `Probabilities: ${probBreakdown}`
        : (p.explanation || (p.reasonCode ? `Reason: ${p.reasonCode}` : "Evaluated lead progression rules"));
    }

    rightTop = p.modelVersion ? `Model: ${p.modelVersion}` : (p.isAssistedByMl ? "Model: ONNX v2.1" : "Rules Engine");
    rightBottom = confVal !== null ? `Confidence: ${confVal}%` : "Deterministic";
  } else if (t === "OUTCOME_RECORDED" || t === "OutcomeRecorded") {
    type = "outcome";
    title = "Outcome Recorded";
    badgeText = p.outcome || "Recorded";
    badgeClass = "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300/60";
    primary = p.notes || p.description || p.rawPayload?.note || `Outcome status: ${p.outcome || "RECORDED"}`;
    secondary = p.nextStep ? `Next Step: ${p.nextStep}` : (p.rawPayload?.subject ? `Subject: ${p.rawPayload.subject}` : "");
    rightTop = `By: ${p.recordedBy || lead.assigned_rep_name || "Autonomous Engine"}`;
    rightBottom = p.nextStep ? `Next Step: ${p.nextStep}` : `Recorded at: ${timeFormatted}`;
  } else if (t === "COMPANY_RESEARCHED") {
    type = "research";
    title = "AI Company Research Completed";
    badgeText = "AI Research";
    badgeClass = "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200/60";
    primary = p.summary || `Researched corporate profile for ${p.company || lead.company || "lead"}`;
    secondary = p.industry ? `Industry: ${p.industry}` : (p.coreServices ? `Services: ${p.coreServices}` : "");
    rightTop = "Agent: Corporate Scout";
    rightBottom = `Domain: ${p.domain || (lead.email ? lead.email.split("@")[1] : "verified")}`;
  } else if (t === "ActionFailed" || t === "EMAIL_FAILED") {
    type = "failed";
    title = "Outreach Attempt Failed";
    badgeText = "Failed";
    badgeClass = "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-300/60";
    primary = p.error || p.reason || p.metadata?.error || "Action blocked or rejected by mail transport";
    secondary = `Recipient: ${p.recipient || lead.email || "recipient"}`;
    rightTop = `Channel: ${channel}`;
    rightBottom = "Status: Permanent Error";
  } else if (t === "ACTION_BLOCKED_BY_COMPLIANCE" || t === "LEAD_SUPPRESSED") {
    type = "failed";
    title = "Blocked by Compliance Guard";
    badgeText = "Blocked";
    badgeClass = "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-300/60";
    primary = p.reason || "Dispatch withheld by safety and suppression rules";
    secondary = `Recipient: ${lead.email}`;
    rightTop = "Rule: DNC & Suppression Gate";
    rightBottom = "State: Blocked";
  } else if (t === "FOLLOW_UP_SCHEDULED") {
    type = "email_sent";
    title = `Follow-Up Sequence Scheduled (${p.totalSteps || 5} Touches)`;
    badgeText = "Scheduled";
    badgeClass = "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200/60";
    const cadenceSteps = normalizeCadenceSteps(
      p.scheduledSteps?.length ? p.scheduledSteps : followUpTasks
    );
    const cadenceLine = formatCadenceLine(cadenceSteps);
    const firstDate = formatFollowUpCalendarDate(cadenceSteps[0]?.scheduledAt || p.firstScheduledAt);
    const firstDay = cadenceSteps[0]?.dayOffset ?? p.scheduledSteps?.[0]?.dayOffset ?? 2;
    primary = cadenceLine || "Date-wise cadence: Day 2, Day 7, Day 14, Day 28, Day 42";
    secondary = firstDate ? `Day ${firstDay} first touch: ${firstDate}` : "Automated multi-touch outreach";
    rightTop = `Enrollment #${p.enrollmentId || ""}`;
    rightBottom = "Follow-Up Engine";
  } else if (t === "FOLLOW_UP_TOUCH_SCHEDULED") {
    type = "scheduled";
    const dayOffset = p.dayOffset ?? DAY_OFFSET_BY_STEP[p.stepNumber] ?? p.stepNumber;
    title = `Day ${dayOffset}: ${p.title || STEP_TITLE_BY_NUMBER[p.stepNumber] || "Follow-up touch"}`;
    badgeText = "Scheduled";
    badgeClass = "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200/60";
    const dateLabel = formatFollowUpCalendarDate(p.scheduledAt);
    primary = dateLabel ? `Due ${dateLabel}` : `Day ${dayOffset} follow-up queued`;
    secondary = p.subject ? `Subject: ${p.subject}` : "Automated cadence touch";
    rightTop = `Step ${p.stepNumber || ""} of 5`;
    rightBottom = "Follow-Up Engine";
  } else if (t === "FOLLOW_UP_SENT") {
    type = "email_sent";
    title = `Follow-Up Touch ${p.stepNumber} Sent`;
    badgeText = p.threadMode === "REPLY_THREAD" ? "In-Thread Reply" : "New Thread Touch";
    badgeClass = "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300/60";
    primary = p.subject ? `Subject: ${p.subject}` : `Follow-up step ${p.stepNumber} successfully delivered`;
    secondary = `Recipient: ${lead.email || "prospect"}`;
    rightTop = `Step ${p.stepNumber} of 5`;
    rightBottom = p.messageId ? `Message ID: ${String(p.messageId).slice(0, 16)}...` : `Sent at: ${timeFormatted}`;
    hasLink = Boolean(p.messageId);
  } else if (t === "FOLLOW_UP_PAUSED") {
    type = "outcome";
    title = "Follow-Up Sequence Paused";
    badgeText = "Sequence Paused";
    badgeClass = "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300/60";
    primary = p.reason || "Pending touches paused to prevent unwanted outreach";
    secondary = p.replySubject ? `Triggered by reply: ${p.replySubject}` : "Awaiting manual review or sales handoff";
    rightTop = "Reply Detection Guard";
    rightBottom = `Paused at: ${timeFormatted}`;
  } else if (t === "FOLLOW_UP_COMPLETED") {
    type = "outcome";
    title = "Follow-Up Sequence Completed";
    badgeText = "Concluded";
    badgeClass = "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300/60";
    primary = p.reason || "All scheduled follow-up touches successfully delivered";
    secondary = `Lead: ${lead.email || "prospect"}`;
    rightTop = "Sequence Concluded";
    rightBottom = "Journey Complete";
  } else if (t === "FOLLOW_UP_BLOCKED") {
    type = "outcome";
    title = "Follow-Up Touch Blocked";
    badgeText = "Blocked (Reply)";
    badgeClass = "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300/60";
    primary = p.reason || "Outreach touch withheld because prospect replied or safety rule triggered";
    secondary = `Touch #${p.stepNumber || ""} cancelled before dispatch`;
    rightTop = "Pre-Dispatch Eligibility Gate";
    rightBottom = `Blocked at: ${timeFormatted}`;
  } else if (t === "FOLLOW_UP_RESUMED") {
    type = "system";
    title = "Follow-Up Sequence Resumed";
    badgeText = "Resumed";
    badgeClass = "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300/60";
    primary = p.reason || "Sequence manually reviewed and re-activated for outreach";
    secondary = p.resumedBy ? `Resumed by: ${p.resumedBy}` : "Eligibility rules re-verified";
    rightTop = "Sequence Control";
    rightBottom = `Resumed at: ${timeFormatted}`;
  } else if (t === "FOLLOW_UP_STOPPED") {
    type = "failed";
    title = "Follow-Up Sequence Stopped";
    badgeText = "Stopped";
    badgeClass = "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-300/60";
    primary = p.reason || "Automated outreach permanently halted";
    secondary = p.outcome ? `Trigger: ${p.outcome}` : `Lead: ${lead.email || "prospect"}`;
    rightTop = "Compliance / Meeting Gate";
    rightBottom = `Stopped at: ${timeFormatted}`;
  } else if (t === "AI_RESPONSE_DRAFTED") {
    type = "research";
    title = "AI Contextual Response Drafted";
    badgeText = "AI Draft";
    badgeClass = "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200/60";
    primary = p.subject ? `Subject: ${p.subject}` : "Contextual response drafted for sales rep review";
    secondary = p.bodyText ? (p.bodyText.length > 90 ? `${p.bodyText.slice(0, 90)}...` : p.bodyText) : "Prepared based on prospect inquiry";
    rightTop = "Response Crafter";
    rightBottom = `Drafted at: ${timeFormatted}`;
  } else if (t === "AI_RESPONSE_SENT") {
    type = "email";
    title = "AI Reply Sent";
    badgeText = "Sent";
    badgeClass = "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200/60";
    primary = p.subject ? `Subject: ${p.subject}` : "Contextual reply delivered to prospect";
    secondary = p.bodyText ? (p.bodyText.length > 90 ? `${p.bodyText.slice(0, 90)}...` : p.bodyText) : "Sent in reply to prospect message";
    rightTop = "Reply dispatched";
    rightBottom = `Sent at: ${timeFormatted}`;
  } else if (t === "REPLY_MATCH_AMBIGUOUS") {
    type = "outcome";
    title = "Ambiguous Reply Flagged for Review";
    badgeText = "Review Needed";
    badgeClass = "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300/60";
    primary = p.reason || "Incoming reply could not be unambiguously mapped to a single sequence";
    secondary = `From: ${p.from || "unknown"}`;
    rightTop = "Threading Guard";
    rightBottom = `Flagged at: ${timeFormatted}`;
  } else if (t === "EMAIL_REPLY_RECEIVED") {
    type = "email_opened";
    title = "Prospect Email Reply Received";
    badgeText = p.outcome || "Reply Received";
    badgeClass = "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200/60";
    primary = p.subject ? `Re: ${p.subject}` : (p.replyText ? p.replyText.slice(0, 80) : "Incoming prospect reply");
    secondary = `From: ${p.from || lead.email}`;
    rightTop = `Detected Intent: ${p.outcome || "INTERESTED"}`;
    rightBottom = `Received at: ${timeFormatted}`;
  } else if (t === "LEAD_CREATED") {
    type = "system";
    title = "Lead Ingested & Validated";
    badgeText = "Ingested";
    badgeClass = "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200/60";
    primary = `Source: ${p.source ? String(p.source).replace(/_/g, " ") : "CSV / API"} • Priority: ${p.priority || lead.priority || 50}`;
    secondary = p.isSuppressed ? "Lead flagged as suppressed on DNC list" : "Passed deduplication & compliance screening";
    rightTop = "By: NOVA Ingestion";
    rightBottom = `State: ${lead.status || "QUEUED"}`;
  } else if (t === "FOLLOWUP_ENROLLED") {
    type = "system";
    title = `Follow-Up Cadence Enrolled (${p.totalSteps || 5} Touches)`;
    badgeText = "Active Cadence";
    badgeClass = "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300/60";
    const enrolledSteps = normalizeCadenceSteps(
      p.scheduledSteps?.length ? p.scheduledSteps : followUpTasks
    );
    const enrolledLine = formatCadenceLine(enrolledSteps);
    const enrolledFirst = formatFollowUpCalendarDate(enrolledSteps[0]?.scheduledAt || p.firstScheduledAt);
    primary = enrolledLine || (p.enrollmentId || p.enrollment_id
      ? `Enrolled in automated cadence (Enrollment #${p.enrollmentId || p.enrollment_id})`
      : "Enrolled in automated cadence");
    const enrolledDay = enrolledSteps[0]?.dayOffset ?? p.scheduledSteps?.[0]?.dayOffset ?? 2;
    secondary = enrolledFirst ? `Day ${enrolledDay} first touch: ${enrolledFirst}` : "Cadence scheduled relative to initial email";
    rightTop = "Follow-Up Engine";
    rightBottom = `Enrolled at: ${timeFormatted}`;
  } else {
    type = "system";
    title = t.replace(/_/g, " ");
    badgeText = channel || "SYSTEM";
    badgeClass = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200/60";
    if (p.description || p.message) {
      primary = p.description || p.message;
    } else if (typeof p === "object" && p !== null) {
      const keys = Object.keys(p);
      primary = keys.length > 0 ? keys.map((k) => `${k.replace(/_/g, " ")}: ${p[k]}`).join(" • ") : "System activity logged";
    } else {
      primary = String(p);
    }
    secondary = "";
    rightTop = `By: ${p.by || "NOVA System"}`;
    rightBottom = "";
  }

  return {
    type,
    title,
    badgeText,
    badgeClass,
    primary,
    secondary,
    rightTop,
    rightBottom,
    hasLink,
    timeFormatted,
    rawPayload: p,
  };
}

function getVisuals(type) {
  switch (type) {
    case "email_sent":
      return {
        icon: Mail,
        iconBg: "bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400",
        dotColor: "border-orange-500 bg-orange-100 dark:bg-orange-950",
      };
    case "dispatched":
      return {
        icon: Send,
        iconBg: "bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400",
        dotColor: "border-blue-500 bg-blue-100 dark:bg-blue-950",
      };
    case "email_opened":
      return {
        icon: Mail,
        iconBg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
        dotColor: "border-emerald-500 bg-emerald-100 dark:bg-emerald-950",
      };
    case "email_clicked":
      return {
        icon: MousePointerClick,
        iconBg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
        dotColor: "border-emerald-600 bg-emerald-100 dark:bg-emerald-950",
      };
    case "draft":
      return {
        icon: Mail,
        iconBg: "bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400",
        dotColor: "border-blue-400 bg-blue-100 dark:bg-blue-950",
      };
    case "scheduled":
      return {
        icon: Clock,
        iconBg: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
        dotColor: "border-slate-400 bg-slate-100 dark:bg-slate-800",
      };
    case "state_changed":
      return {
        icon: Settings,
        iconBg: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
        dotColor: "border-slate-500 bg-slate-100 dark:bg-slate-800",
      };
    case "call":
      return {
        icon: PhoneCall,
        iconBg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
        dotColor: "border-emerald-500 bg-emerald-100 dark:bg-emerald-950",
      };
    case "brain_decision":
      return {
        icon: Bot,
        iconBg: "bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400",
        dotColor: "border-purple-500 bg-purple-100 dark:bg-purple-950",
      };
    case "outcome":
      return {
        icon: Users,
        iconBg: "bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400",
        dotColor: "border-blue-500 bg-blue-100 dark:bg-blue-950",
      };
    case "research":
      return {
        icon: Sparkles,
        iconBg: "bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400",
        dotColor: "border-indigo-500 bg-indigo-100 dark:bg-indigo-950",
      };
    case "failed":
      return {
        icon: AlertTriangle,
        iconBg: "bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400",
        dotColor: "border-rose-500 bg-rose-100 dark:bg-rose-950",
      };
    default:
      return {
        icon: Activity,
        iconBg: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
        dotColor: "border-slate-400 bg-slate-100 dark:bg-slate-800",
      };
  }
}

function getHeaderTheme(tone) {
  switch (tone) {
    case "blue":
      return {
        container: "bg-blue-50/70 dark:bg-blue-950/30 border-blue-200/80 dark:border-blue-900/60 text-blue-950 dark:text-blue-100",
        chevron: "text-blue-600 dark:text-blue-400",
        calendar: "text-blue-600 dark:text-blue-400",
      };
    case "emerald":
      return {
        container: "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-900/60 text-emerald-950 dark:text-emerald-100",
        chevron: "text-emerald-600 dark:text-emerald-400",
        calendar: "text-emerald-600 dark:text-emerald-400",
      };
    case "rose":
      return {
        container: "bg-rose-50/70 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-900/60 text-rose-950 dark:text-rose-100",
        chevron: "text-rose-600 dark:text-rose-400",
        calendar: "text-rose-600 dark:text-rose-400",
      };
    default:
      return {
        container: "bg-slate-50/80 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100",
        chevron: "text-slate-600 dark:text-slate-400",
        calendar: "text-slate-600 dark:text-slate-400",
      };
  }
}

export default function UnifiedInteractionTimeline({ timeline = [], lead = {} }) {
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [expandedRowIds, setExpandedRowIds] = useState(new Set());
  const [followUpTasks, setFollowUpTasks] = useState([]);

  useEffect(() => {
    let cancelled = false;
    if (!lead?.id) {
      setFollowUpTasks([]);
      return undefined;
    }
    followUpService.getLeadJourney(lead.id).then((data) => {
      if (!cancelled) setFollowUpTasks(data?.tasks || []);
    });
    return () => {
      cancelled = true;
    };
  }, [lead?.id]);

  const uniqueTimeline = useMemo(() => {
    const source = Array.isArray(timeline) ? timeline : [];
    const seen = new Set();
    const result = [];
    for (const item of source) {
      if (!item) continue;
      const key = item.id ? `id_${item.id}` : `evt_${item.event_type}_${item.created_at}_${JSON.stringify(item.payload || {})}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(item);
    }
    return result;
  }, [timeline]);

  const groups = useMemo(() => {
    const map = new Map();
    const sorted = [...uniqueTimeline].sort(
      (a, b) => (getEventDate(b)?.getTime() || 0) - (getEventDate(a)?.getTime() || 0)
    );

    for (const ev of sorted) {
      const d = getEventDate(ev);
      const key = getDateKey(d);
      if (!map.has(key)) {
        map.set(key, { d, events: [] });
      }
      map.get(key).events.push(ev);
    }

    const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    return Array.from(map.entries())
      .map(([key, data]) => ({
        key,
        dateInfo: formatDateGroupHeader(data.d),
        events: data.events,
      }))
      .sort((a, b) => {
        const aToday = a.key === todayKey;
        const bToday = b.key === todayKey;
        if (aToday !== bToday) return aToday ? -1 : 1;
        const aFuture = a.key > todayKey;
        const bFuture = b.key > todayKey;
        if (aFuture !== bFuture) return aFuture ? -1 : 1;
        if (aFuture && bFuture) return a.key.localeCompare(b.key);
        return b.key.localeCompare(a.key);
      });
  }, [uniqueTimeline]);

  const toggleGroup = (key) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const expandAll = () => {
    setCollapsedGroups({});
  };

  const collapseAll = () => {
    const all = {};
    for (const g of groups) {
      all[g.key] = true;
    }
    setCollapsedGroups(all);
  };

  const toggleRow = (id) => {
    setExpandedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalActivities = uniqueTimeline.length;

  return (
    <Card className="shadow-xs border-border/80">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Unified Interaction Timeline ({totalActivities} {totalActivities === 1 ? "activity" : "activities"} across {groups.length} {groups.length === 1 ? "day" : "days"})
            </CardTitle>
            <CardDescription className="mt-0.5">
              Chronological audit record of every email, voice call, outcome, and rep action.
            </CardDescription>
          </div>

          {groups.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                onClick={expandAll}
              >
                Expand All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                onClick={collapseAll}
              >
                Collapse All
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {groups.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-xs">
            No interaction history logged yet for this lead.
          </div>
        ) : (
          groups.map(({ key, dateInfo, events }) => {
            const isCollapsed = Boolean(collapsedGroups[key]);
            const theme = getHeaderTheme(dateInfo.tone);

            return (
              <div key={key} className="space-y-2">
                <div
                  onClick={() => toggleGroup(key)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all cursor-pointer select-none ${theme.container}`}
                >
                  <div className="flex items-center gap-3">
                    {isCollapsed ? (
                      <ChevronRight className={`w-5 h-5 ${theme.chevron}`} />
                    ) : (
                      <ChevronDown className={`w-5 h-5 ${theme.chevron}`} />
                    )}
                    <Calendar className={`w-5 h-5 ${theme.calendar}`} />
                    <div>
                      <div className="text-sm font-bold tracking-tight">{dateInfo.label}</div>
                      <div className="text-xs opacity-75 font-medium">{events.length} activities</div>
                    </div>
                  </div>

                  <div>
                    {dateInfo.badge ? (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/40">
                        {dateInfo.badge}
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-background/80 text-foreground/80 border border-border/50">
                        {events.length} events
                      </span>
                    )}
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="relative pl-24 pr-1 py-3 space-y-3">
                    <div className="absolute left-[78px] top-6 bottom-6 w-0.5 bg-border/70" />

                    {events.map((ev) => {
                      const item = normalizeEventDisplay(ev, lead, followUpTasks);
                      const visuals = getVisuals(item.type);
                      const IconComp = visuals.icon;
                      const isExpanded = expandedRowIds.has(ev.id);

                      return (
                        <div key={ev.id || `${ev.event_type}_${ev.created_at}`} className="relative">
                          <div className="absolute -left-24 w-[68px] text-right text-[11px] font-semibold text-muted-foreground pt-4">
                            {item.timeFormatted}
                          </div>

                          <div
                            className={`absolute -left-[19px] top-[22px] w-2.5 h-2.5 rounded-full border-2 bg-background z-10 transition-transform ${visuals.dotColor}`}
                          />

                          <div className="w-full bg-card hover:bg-muted/10 border border-border/75 rounded-xl p-3.5 shadow-xs transition-all">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                                <div
                                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${visuals.iconBg}`}
                                >
                                  <IconComp className="w-5 h-5" />
                                </div>
                                <div className="space-y-1 min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-sm text-foreground tracking-tight">
                                      {item.title}
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${item.badgeClass}`}
                                    >
                                      {item.badgeText}
                                    </span>
                                  </div>

                                  {item.primary && (
                                    <p className="text-xs text-foreground/90 font-medium leading-snug">
                                      {item.primary}
                                    </p>
                                  )}

                                  {item.secondary && (
                                    <p className="text-xs text-muted-foreground leading-snug">
                                      {item.secondary}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-start gap-3 shrink-0">
                                <div className="text-right space-y-1 hidden sm:block">
                                  {item.rightTop && (
                                    <p className="text-xs font-semibold text-foreground/80">{item.rightTop}</p>
                                  )}
                                  {item.rightBottom && (
                                    <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                                      <span>{item.rightBottom}</span>
                                      {item.hasLink && <ExternalLink className="w-3 h-3 text-muted-foreground/70" />}
                                    </p>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => toggleRow(ev.id)}
                                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mt-0.5"
                                  aria-label="Toggle details"
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="mt-3 pt-3 border-t border-border/50 text-xs space-y-2.5">
                                <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground px-0.5">
                                  <span className="font-semibold text-foreground/80">Event Details & Timetable</span>
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-semibold text-[10px]">
                                    IST (Indian Standard Time, UTC+5:30)
                                  </span>
                                </div>
                                {item.rawPayload && Object.keys(item.rawPayload).length > 0 && (
                                  <div className="rounded-lg border border-border/70 bg-muted/30 overflow-hidden font-mono text-[11px] shadow-2xs">
                                    <table className="w-full text-left border-collapse">
                                      <tbody>
                                        {Object.entries(item.rawPayload).map(([k, v], idx) => {
                                          const isTime = isIsoDateString(v) || (isDateKey(k) && typeof v === "string" && !isNaN(new Date(v).getTime()));
                                          return (
                                            <tr
                                              key={k}
                                              className={idx % 2 === 0 ? "bg-muted/40" : "bg-transparent"}
                                            >
                                              <td className="py-2 px-3 font-semibold text-foreground/80 whitespace-nowrap w-1/3 border-b border-border/40 align-top">
                                                {k}:
                                              </td>
                                              <td className="py-2 px-3 text-foreground/90 border-b border-border/40 break-all align-top">
                                                {isTime ? (
                                                  <div className="space-y-0.5">
                                                    <div className="font-bold text-primary flex items-center gap-1.5 flex-wrap">
                                                      <span>{formatIndianDateTime(v)}</span>
                                                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-sans font-semibold">
                                                        IST
                                                      </span>
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground font-mono">
                                                      UTC: {new Date(v).toISOString()}
                                                    </div>
                                                  </div>
                                                ) : typeof v === "object" ? (
                                                  JSON.stringify(v)
                                                ) : (
                                                  String(v)
                                                )}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
