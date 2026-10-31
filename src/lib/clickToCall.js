export const CLICK_TO_CALL_LABELS = {
  idle: "Call",
  initiating: "Initiating",
  calling_you: "Calling you",
  you_answered: "You answered",
  calling_lead: "Calling lead",
  connected: "Connected",
  completed: "Completed",
  busy: "Busy",
  no_answer: "No answer",
  failed: "Failed",
};

const TERMINAL = new Set(["completed", "busy", "no_answer", "failed"]);
const ACTIVE = new Set(["initiating", "calling_you", "you_answered", "calling_lead", "connected"]);

export function isClickToCallActive(state) {
  return ACTIVE.has(String(state || "").toLowerCase());
}

export function isClickToCallTerminal(state) {
  return TERMINAL.has(String(state || "").toLowerCase());
}

export function clickToCallLabel(state, fallback = "Call") {
  return CLICK_TO_CALL_LABELS[String(state || "").toLowerCase()] || fallback;
}
