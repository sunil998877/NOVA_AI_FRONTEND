export const CLICK_TO_CALL_LABELS = {
  idle: "Call",
  initiating: "Calling...",
  calling_you: "Calling...",
  you_answered: "Connecting...",
  calling_lead: "Calling lead",
  connected: "Connected",
  completed: "Call",
  busy: "Call",
  no_answer: "Call",
  failed: "Call",
};

const TERMINAL = new Set(["completed", "busy", "no_answer", "failed"]);
const ACTIVE = new Set(["initiating", "calling_you", "you_answered", "calling_lead", "connected"]);

const STALE_MS = {
  initiating: 25_000,
  calling_you: 70_000,
  you_answered: 70_000,
  calling_lead: 90_000,
  connected: 3 * 60 * 1000,
};

export function isClickToCallStale(session) {
  const state = String(session?.state || "").toLowerCase();
  if (!ACTIVE.has(state)) return false;
  const started = Date.parse(session?.initiatedAt || session?.initiated_at || 0);
  if (!Number.isFinite(started) || started <= 0) return true;
  return Date.now() - started > (STALE_MS[state] ?? 70_000);
}

export function isClickToCallActive(state, session) {
  if (session && isClickToCallStale({ ...session, state })) return false;
  return ACTIVE.has(String(state || "").toLowerCase());
}

export function isClickToCallTerminal(state) {
  return TERMINAL.has(String(state || "").toLowerCase());
}

export function clickToCallLabel(state, fallback = "Call") {
  const key = String(state || "").toLowerCase();
  if (!key || key === "idle" || TERMINAL.has(key)) return "Call";
  return CLICK_TO_CALL_LABELS[key] || fallback;
}
