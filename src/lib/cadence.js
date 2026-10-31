export const ELIGIBILITY_META = {
  ELIGIBLE: { label: "Eligible", tone: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900" },
  NEEDS_REVIEW: { label: "Needs review", tone: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900" },
  SUPPRESSED: { label: "Suppressed", tone: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900" },
};

export const ENROLLMENT_META = {
  ACTIVE: { label: "Active", tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" },
  PAUSED: { label: "Paused", tone: "bg-slate-100 text-slate-700 dark:bg-muted dark:text-muted-foreground" },
  NEEDS_REVIEW: { label: "Needs review", tone: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300" },
  HANDOFF: { label: "Handed to rep", tone: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300" },
  CALLBACK: { label: "Callback requested", tone: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300" },
  REPLIED: { label: "Replied", tone: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300" },
  STOPPED: { label: "Stopped", tone: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300" },
  COMPLETED: { label: "Completed", tone: "bg-slate-100 text-slate-700 dark:bg-muted dark:text-muted-foreground" },
};

export const STEP_STATUS_META = {
  SCHEDULED: "Scheduled",
  EXECUTING: "Running",
  AWAITING_OUTCOME: "Waiting for call result",
  PENDING_APPROVAL: "Waiting for approval",
  DONE: "Done",
  SKIPPED: "Skipped",
  CANCELLED: "Cancelled",
  FAILED: "Failed",
};

export const PURPOSE_LABELS = {
  FIRST_CALL: "First AI call",
  RETRY_CALL: "Retry call",
  MISSED_CALL: "Missed-call email",
  VALUE: "Value email",
  FOLLOW_UP_CALL: "Follow-up call",
  INSIGHT: "Insight email",
  REVIEW: "Human review",
  CLOSE: "Close / nurture",
};

export const QUEUE_FILTER_LABELS = {
  retry_due: "Retry due",
  calls_scheduled: "Calls scheduled",
  email_pending_approval: "Email awaiting approval",
  email_scheduled: "Email scheduled",
  no_answer: "No answer",
  replied: "Replied",
  callback_requested: "Callback requested",
  needs_review: "Needs review",
  failed: "Failed",
  suppressed: "Suppressed",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function humanize(value) {
  return String(value || "").replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export function stepLabel(step) {
  if (!step) return "";
  return PURPOSE_LABELS[step.purpose] || humanize(step.purpose || step.action);
}

export function formatMinutes(minutes) {
  const value = Number(minutes) || 0;
  if (value % 1440 === 0 && value >= 1440) return `${value / 1440} day${value === 1440 ? "" : "s"}`;
  if (value % 60 === 0 && value >= 60) return `${value / 60} hour${value === 60 ? "" : "s"}`;
  return `${value} min`;
}

export function formatWindow(window) {
  if (!window) return "";
  const days = Array.isArray(window.days) ? [...window.days].sort((a, b) => a - b) : [];
  const range = days.length === 7 ? "every day" : days.length === 5 && days.join() === "1,2,3,4,5" ? "Mon–Fri" : days.map((d) => DAY_NAMES[d]).join(", ");
  const hours = Number(window.startHour) === 0 && Number(window.endHour) === 24 ? "any time" : `${String(window.startHour).padStart(2, "0")}:00–${String(window.endHour).padStart(2, "0")}:00`;
  return `${hours}, ${range}`;
}

export function formatDue(value, timezone) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  try {
    return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short", ...(timezone ? { timeZone: timezone } : {}) });
  } catch {
    return date.toLocaleString();
  }
}

export function planLines(preview) {
  if (!preview) return [];
  const lines = [];
  lines.push(preview.firstAction === "EMAIL" ? "Send the first email" : "AI calls the lead");
  if (Number(preview.maxInitialCallAttempts) > 1) {
    lines.push(`No answer: one retry after ${formatMinutes(preview.retryIntervalMinutes)} (busy: ${formatMinutes(preview.busyRetryIntervalMinutes)})`);
  }
  lines.push(`Still unreachable: missed-call email ${formatMinutes(preview.emailAfterRetryDelayMinutes)} after the retry — ${preview.emailApprovalMode === "AUTO" ? "sent automatically" : "waits for your approval"}`);
  if (preview.voicemailAction) {
    lines.push(`Voicemail: ${preview.voicemailAction === "EMAIL" ? "follow up by email" : preview.voicemailAction === "RETRY" ? "retry the call" : "send to human review"}`);
  }
  for (const step of preview.followUpSteps || []) {
    lines.push(`Day ${step.day}: ${PURPOSE_LABELS[step.purpose] || humanize(step.action)}`);
  }
  return lines;
}
