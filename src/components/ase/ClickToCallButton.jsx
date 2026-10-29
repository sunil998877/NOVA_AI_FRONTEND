import React, { useCallback, useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { Button } from "../ui/button";
import { useToast } from "../ui/toast";
import { voiceApi } from "../../lib/api";
import { useSocket } from "../../context/SocketContext";
import {
  clickToCallLabel,
  isClickToCallActive,
  isClickToCallTerminal,
} from "../../lib/clickToCall";

function normalizeSession(payload) {
  const data = payload?.data || payload || {};
  return {
    callId: data.callId || null,
    leadId: data.leadId || null,
    state: data.state || "idle",
    label: data.label || clickToCallLabel(data.state, "Call"),
    failureReason: data.failureReason || null,
    connectedDurationSec: data.connectedDurationSec || 0,
  };
}

export function ClickToCallButton({ lead, variant = "header", disabled = false, className = "" }) {
  const { success, error: toastError } = useToast();
  const { socket } = useSocket();
  const [session, setSession] = useState({ state: "idle", label: "Call" });
  const [busy, setBusy] = useState(false);
  const leadId = Number(lead?.id);
  const active = isClickToCallActive(session.state);

  const refresh = useCallback(async () => {
    if (!leadId) return;
    try {
      const res = await voiceApi.getClickToCall(leadId);
      const next = normalizeSession(res);
      if (next.state && next.state !== "idle") setSession(next);
    } catch {
      /* no prior session */
    }
  }, [leadId]);

  useEffect(() => {
    if (variant === "icon") return undefined;
    refresh();
  }, [refresh, variant]);

  useEffect(() => {
    if (!active || !leadId) return undefined;
    const timer = setInterval(refresh, 2500);
    return () => clearInterval(timer);
  }, [active, leadId, refresh]);

  useEffect(() => {
    if (!socket || !leadId) return undefined;
    const onEvent = (envelope) => {
      const eventLead = envelope?.lead_id ?? envelope?.leadId ?? envelope?.payload?.lead_id;
      if (eventLead != null && String(eventLead) !== String(leadId)) return;
      const type = String(envelope?.event_type || envelope?.eventType || "");
      if (type === "ClickToCallUpdated" || type === "ClickToCallStarted" || type === "CLICK_TO_CALL_STARTED") {
        const payloadSession = envelope?.payload?.session;
        if (payloadSession?.state) {
          setSession(normalizeSession({ data: { ...payloadSession, label: clickToCallLabel(payloadSession.state) } }));
        } else {
          refresh();
        }
      }
    };
    socket.on("ase:lead_event", onEvent);
    return () => socket.off("ase:lead_event", onEvent);
  }, [socket, leadId, refresh]);

  const onCall = async (event) => {
    event?.stopPropagation?.();
    if (!leadId || !lead?.phone || busy || active || lead.do_not_contact) return;
    try {
      setBusy(true);
      setSession({ state: "initiating", label: "Initiating" });
      const res = await voiceApi.clickToCall(leadId);
      const next = normalizeSession(res);
      setSession(next);
      success("Calling you first", `Answer your phone to connect with ${lead.name || "the lead"}.`);
    } catch (err) {
      setSession({ state: "failed", label: "Failed", failureReason: err.message });
      toastError("Call failed", err.message || "Could not start click-to-call.");
    } finally {
      setBusy(false);
    }
  };

  const label = active || busy
    ? clickToCallLabel(session.state, "Calling...")
    : isClickToCallTerminal(session.state)
      ? "Call again"
      : "Call";
  const blocked = Boolean(disabled || busy || active || lead?.do_not_contact || !lead?.phone);

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="sm"
        title={label}
        disabled={blocked}
        className={`text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 h-8 w-8 p-0 ${className}`}
        onClick={onCall}
      >
        <Phone className={`w-3.5 h-3.5 ${busy || active ? "animate-pulse" : ""}`} />
      </Button>
    );
  }

  return (
    <button
      type="button"
      disabled={blocked}
      onClick={onCall}
      className={`h-10 px-5 rounded-xl bg-[#0d5e54] hover:bg-[#09473f] text-white text-sm font-semibold shadow-xs disabled:opacity-50 transition-colors ${className}`}
    >
      {label}
    </button>
  );
}
