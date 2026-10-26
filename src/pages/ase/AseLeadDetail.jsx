import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  Mail,
  Clock,
  Activity,
  Calendar,
  Building2,
  MapPin,
  Send,
  Sparkles,
  LayoutGrid,
  FileText,
  CheckSquare,
  Paperclip,
  Copy,
  Check,
  Link2,
  User,
  Users,
  Briefcase,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { useToast } from "../../components/ui/toast";
import { aseService } from "../../services/ase.service";
import { voiceApi } from "../../lib/api";
import { useAuth } from "../../lib/AuthContext";
import { useSocket } from "../../context/SocketContext";
import UnifiedInteractionTimeline from "../../components/ase/UnifiedInteractionTimeline";
import AiGeneratedEmailCard from "../../components/ase/AiGeneratedEmailCard";
import LeadFollowUpSequenceCard from "../../components/ase/LeadFollowUpSequenceCard";
import AssignedRepDropdown from "../../components/ase/AssignedRepDropdown";

const BRAIN_EVENT_TYPES = new Set([
  "NOVA_BRAIN_DECISION",
  "DECISION_EVALUATED",
  "ORCHESTRATOR_DECISION",
]);

function parseEventPayload(event) {
  const raw = event?.payload;
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return typeof raw === "object" ? raw : {};
}

function getLatestLoggedDecision(timeline) {
  const events = Array.isArray(timeline) ? timeline : [];
  const latest = events
    .filter((event) => BRAIN_EVENT_TYPES.has(String(event.event_type || event.type || "").toUpperCase()))
    .sort((a, b) => {
      const left = new Date(a.created_at || a.createdAt || a.timestamp || 0).getTime();
      const right = new Date(b.created_at || b.createdAt || b.timestamp || 0).getTime();
      return right - left;
    })[0];
  return latest ? parseEventPayload(latest) : null;
}

function toFraction(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return null;
  return number > 1 ? number / 100 : number;
}

function readProbability(source, keys) {
  if (!source || typeof source !== "object") return null;
  const normalized = Object.fromEntries(
    Object.entries(source).map(([key, value]) => [String(key).toUpperCase(), value])
  );
  for (const key of keys) {
    const value = toFraction(normalized[String(key).toUpperCase()]);
    if (value != null) return value;
  }
  return null;
}

function rankedToMap(ranked) {
  if (!Array.isArray(ranked)) return {};
  return Object.fromEntries(
    ranked
      .filter((item) => item && item.action != null)
      .map((item) => [item.action, item.probability])
  );
}

function probsFromExplanation(text) {
  if (!text) return null;
  const email = text.match(/email\s+(\d+(?:\.\d+)?)%/i);
  const call = text.match(/call\s+(\d+(?:\.\d+)?)%/i);
  const wait = text.match(/wait\s+(\d+(?:\.\d+)?)%/i);
  if (!email && !call && !wait) return null;
  return {
    EMAIL: email ? Number(email[1]) / 100 : 0,
    CALL: call ? Number(call[1]) / 100 : 0,
    WAIT: wait ? Number(wait[1]) / 100 : 0,
  };
}

function actionFromExplanation(text) {
  const match = String(text || "").match(/selected\s+(EMAIL|CALL|WAIT)\b/i);
  return match ? match[1].toUpperCase() : null;
}

function formatClock(date, timeZone) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  });
}

function hourInTimeZone(date, timeZone) {
  return Number(new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    hour12: false,
  }).format(date)) % 24;
}

function snapToBusinessHours(date, timeZone, action) {
  if (action === "WAIT") return date;
  const hour = hourInTimeZone(date, timeZone);
  if (hour >= 9 && hour < 20) return date;
  const hoursToAdd = hour < 9 ? (9 - hour) : (24 - hour + 9);
  return new Date(date.getTime() + hoursToAdd * 3600 * 1000);
}

function formatOptimalSendWindow(mlDecision, lead, action) {
  const tz = mlDecision?.sendWindow?.timezone || lead?.metadata?.timezone || lead?.timezone || "Asia/Kolkata";
  const hasExactWindow = mlDecision?.sendWindow?.start && mlDecision?.sendWindow?.end;
  const startRaw = mlDecision?.sendWindow?.start || mlDecision?.scheduledTime;
  const delayHours = Number(mlDecision?.delayHours ?? mlDecision?.delay_hours);
  let start = startRaw ? new Date(startRaw) : null;
  if (!start || Number.isNaN(start.getTime())) {
    start = new Date(Date.now() + (Number.isFinite(delayHours) ? delayHours : 0) * 3600 * 1000);
  }
  let end = hasExactWindow ? new Date(mlDecision.sendWindow.end) : null;
  if (!hasExactWindow) {
    start = snapToBusinessHours(start, tz, action);
    const spanHours = action === "CALL" ? 1 : 2.5;
    end = new Date(start.getTime() + spanHours * 3600 * 1000);
  }
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "Updating…";
  const soon = start.getTime() - Date.now() < 12 * 3600 * 1000;
  const day = soon ? "" : `${start.toLocaleDateString("en-US", { weekday: "short", timeZone: tz })} `;
  const zone = tz === "Asia/Kolkata" ? "IST" : tz.split("/").pop().replace(/_/g, " ");
  return `${day}${formatClock(start, tz)} – ${formatClock(end, tz)} (${zone})`;
}

function countTouchpoints(lead, timeline, metrics) {
  const rawCounters = lead?.attempt_counters;
  const counters = typeof rawCounters === "string"
    ? (() => { try { return JSON.parse(rawCounters); } catch { return {}; } })()
    : (rawCounters || {});
  const events = Array.isArray(timeline) ? timeline : [];
  const emailsFromTimeline = events.filter((event) => {
    const type = String(event.event_type || "");
    const channel = String(event.channel || "").toUpperCase();
    return type === "EMAIL_SENT" || type === "DELIVERY_CONFIRMED" || (type === "ActionCompleted" && channel === "EMAIL");
  }).length;
  const callsFromTimeline = events.filter((event) => {
    const type = String(event.event_type || "");
    const channel = String(event.channel || "").toUpperCase();
    return channel === "VOICE" || type === "VOICE_CALL" || type === "OUTBOUND_CALL" || type === "CallDispatched" || type === "CALL_COMPLETED";
  }).length;
  const emails = Math.max(Number(counters.email || 0), Number(metrics?.emailAttempts || 0), emailsFromTimeline);
  const calls = Math.max(Number(counters.voice || 0), Number(metrics?.voiceAttempts || 0), callsFromTimeline);
  return { emails, calls };
}

function intentFromDecision(lead, action, conversionPct, engagement) {
  const status = String(lead?.status || "").toUpperCase();
  if (status === "QUALIFIED" || status === "CALLBACK_SCHEDULED") return "High intent — handoff";
  if (status === "INTERESTED") return "High intent";
  if (status === "ENGAGED" || Number(engagement) >= 50) return "Receptive";
  if (action === "WAIT") return "Cooling — wait";
  if (Number(conversionPct) >= 8) return "Warm";
  return "Low intent";
}

function channelPercents(decision) {
  const source = {
    ...probsFromExplanation(decision?.explanation || decision?.reasonSummary),
    ...rankedToMap(decision?.rankedActions || decision?.ranked_actions),
    ...(decision?.probabilities && typeof decision.probabilities === "object" ? decision.probabilities : {}),
  };
  const email = readProbability(source, ["EMAIL"]) ?? 0;
  const wait = readProbability(source, ["WAIT"]) ?? 0;
  const call = readProbability(source, ["CALL", "VOICE"]) ?? 0;
  const sum = email + wait + call;
  if (sum <= 0) {
    return { email: 0, wait: 0, call: 0, hasData: false };
  }
  const raw = {
    email: Math.round((email / sum) * 100),
    wait: Math.round((wait / sum) * 100),
    call: Math.round((call / sum) * 100),
  };
  const drift = 100 - (raw.email + raw.wait + raw.call);
  const winner = email >= wait && email >= call ? "email" : wait >= call ? "wait" : "call";
  raw[winner] += drift;
  return { ...raw, hasData: true };
}

export default function AseLeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const { success, error: toastError } = useToast();
  const [data, setData] = useState(null);
  const [brainDecision, setBrainDecision] = useState(null);
  const [teamReps, setTeamReps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [copiedField, setCopiedField] = useState(null);

  const fetchLead = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    }
    try {
      const res = await aseService.getLead(id);
      setData(res);
      aseService.getLeadDecision(id).then((dRes) => setBrainDecision(dRes?.decision || null)).catch(() => { });
    } catch (err) {
      if (isInitial) toastError("Error", "Could not load lead detail");
    } finally {
      setLoading(false);
    }
  }, [id, toastError]);

  useEffect(() => {
    fetchLead(true);
    aseService.getTeamReps().then(setTeamReps).catch(() => { });
  }, [id, fetchLead]);

  useEffect(() => {
    if (!id) return undefined;
    const writing = data?.lead?.metadata?.outreach_status === "writing"
      && !data?.lead?.metadata?.outreach_email?.subject;
    const timer = setInterval(() => {
      fetchLead(false);
    }, writing ? 3000 : 8000);
    return () => clearInterval(timer);
  }, [id, fetchLead, data?.lead?.metadata?.outreach_status, data?.lead?.metadata?.outreach_email?.subject]);

  useEffect(() => {
    if (!socket || !id) return undefined;
    const onLeadEvent = (envelope) => {
      const leadId = envelope?.lead_id ?? envelope?.leadId ?? envelope?.payload?.lead_id;
      if (leadId != null && String(leadId) !== String(id)) return;
      const type = String(envelope?.event_type || envelope?.eventType || "").toUpperCase();
      if (
        BRAIN_EVENT_TYPES.has(type)
        || type.includes("DECISION")
        || type === "ACTIONCOMPLETED"
        || type === "ACTIONDISPATCHED"
        || type === "CHANNELOUTCOMERECEIVED"
        || type === "EMAIL_OPENED"
        || type === "EMAILOPENED"
      ) {
        fetchLead(false);
      }
    };
    socket.on("ase:lead_event", onLeadEvent);
    return () => socket.off("ase:lead_event", onLeadEvent);
  }, [socket, id, fetchLead]);

  const handleStateChange = async (newStatus) => {
    try {
      setUpdating(true);
      await aseService.updateLead(id, { status: newStatus });
      success("State Updated", `Lead transitioned to ${newStatus}`);
      fetchLead();
    } catch (err) {
      toastError("Error", err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleRepAssign = async (repId) => {
    try {
      setUpdating(true);
      await aseService.updateLead(id, { assigned_rep_id: repId });
      const repObj = teamReps.find((r) => r.id === repId);
      success("Rep Assigned", repObj ? `Assigned to ${repObj.fullName}` : "Lead marked as Unassigned");
      fetchLead();
    } catch (err) {
      toastError("Error", err.message || "Failed to update assigned rep");
    } finally {
      setUpdating(false);
    }
  };

  const handleDncToggle = async () => {
    if (!data?.lead) return;
    const nextVal = !data.lead.do_not_contact;
    try {
      setUpdating(true);
      await aseService.updateLead(id, {
        do_not_contact: nextVal ? 1 : 0,
        status: nextVal ? "SUPPRESSED_DNC" : "CONTACTED",
      });
      success("Updated", nextVal ? "Lead marked DNC" : "Lead removed from DNC");
      fetchLead();
    } catch (err) {
      toastError("Error", err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleExecuteNow = async () => {
    if (!data?.lead) return;
    try {
      setUpdating(true);
      const result = await aseService.executeAction(id);
      const lag = Number(result?.elapsedMs);
      success(
        "Action Executed",
        Number.isFinite(lag)
          ? `Next action ran immediately in ${lag}ms (timing gates bypassed).`
          : "Next action has been executed successfully."
      );
      await fetchLead();
    } catch (err) {
      toastError("Execution Failed", err.message || "Failed to execute next action.");
    } finally {
      setUpdating(false);
    }
  };

  const handleQuickCall = async () => {
    if (!data?.lead?.phone) return;
    try {
      setUpdating(true);
      const res = await voiceApi.callLead({
        leadId: Number(id),
        phone: data.lead.phone,
        name: data.lead.name,
      });
      if (res?.data?.status === "SUCCEEDED") {
        success("Call Placed", `Outbound voice call placed to ${data.lead.phone} via Plivo.`);
        await fetchLead();
      } else {
        toastError("Call Failed", res?.data?.error || "Could not place call.");
      }
    } catch (err) {
      toastError("Calling Error", err.message || "Failed to initiate call.");
    } finally {
      setUpdating(false);
    }
  };

  const handleAutonomousCall = async () => {
    if (!data?.lead?.phone) return;
    try {
      setUpdating(true);
      await voiceApi.triggerAutonomousCall({ leadId: Number(id) });
      success("Autonomous Call Fired", `ASE Engine initiated voice call for ${data.lead.name || data.lead.email}`);
      await fetchLead();
    } catch (err) {
      toastError("Autonomous Call Failed", err.message || "Failed to trigger call.");
    } finally {
      setUpdating(false);
    }
  };

  const handleCopy = (text, field) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    success("Copied", `${field === "email" ? "Email" : "Phone"} copied to clipboard`);
  };

  const getInitials = (name) => {
    if (!name) return "LD";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  };

  if (!data?.lead && loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Activity className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const { lead, timeline = [] } = data || {};
  if (!lead) return null;

  const initials = getInitials(lead.name);
  const firstName = (lead.name || "this lead").trim().split(/\s+/)[0];
  const locationText = lead.location || (lead.city ? `${lead.city}${lead.state ? `, ${lead.state}` : ""}` : "San Francisco, CA");
  const loggedDecision = getLatestLoggedDecision(timeline);
  const mlDecision = {
    ...(brainDecision || {}),
    ...(loggedDecision || {}),
    probabilities: loggedDecision?.probabilities || brainDecision?.probabilities,
    rankedActions: loggedDecision?.rankedActions || loggedDecision?.ranked_actions || brainDecision?.rankedActions || brainDecision?.ranked_actions,
    action: loggedDecision?.action
      || brainDecision?.action
      || brainDecision?.recommendedAction
      || actionFromExplanation(loggedDecision?.reasonSummary || brainDecision?.explanation),
    confidence: loggedDecision?.confidence ?? brainDecision?.confidence,
    explanation: loggedDecision?.reasonSummary || loggedDecision?.explanation || brainDecision?.explanation,
    conversionPrediction: brainDecision?.conversionPrediction,
    delayHours: brainDecision?.delayHours ?? loggedDecision?.delayHours,
    scheduledTime: brainDecision?.scheduledTime ?? loggedDecision?.scheduledTime,
    sendWindow: brainDecision?.sendWindow ?? loggedDecision?.sendWindow,
    supportingMetrics: brainDecision?.supportingMetrics || {
      emailAttempts: loggedDecision?.emailAttempts,
      voiceAttempts: loggedDecision?.voiceAttempts,
    },
  };
  const channel = channelPercents(mlDecision);
  const emailPct = channel.email;
  const waitPct = channel.wait;
  const callPct = channel.call;
  const winningChannel = !channel.hasData
    ? "EMAIL"
    : emailPct >= waitPct && emailPct >= callPct
      ? "EMAIL"
      : waitPct >= callPct
        ? "WAIT"
        : "CALL";
  const recommendedAction = String(mlDecision.action || winningChannel || "WAIT").toUpperCase();
  const confidencePct = channel.hasData
    ? (winningChannel === "EMAIL" ? emailPct : winningChannel === "WAIT" ? waitPct : callPct)
    : Math.round(Number(mlDecision.confidence != null ? mlDecision.confidence : 0) * (Number(mlDecision.confidence) > 1 ? 1 : 100));
  const conversionSource = mlDecision.conversionPrediction?.probability ?? loggedDecision?.conversionProbability;
  const rawConversion = conversionSource != null
    ? (Number(conversionSource) > 1 ? Number(conversionSource) / 100 : Number(conversionSource))
    : 0.02;
  const conversionNeedsLift = rawConversion <= 0.04 && ["INTERESTED", "CALLBACK_SCHEDULED", "QUALIFIED", "ENGAGED"].includes(String(lead.status || "").toUpperCase());
  const conversionFraction = conversionNeedsLift
    ? Math.min(
        0.85,
        Math.max(
          0.08,
          rawConversion
            + (String(lead.status).toUpperCase() === "QUALIFIED" || String(lead.status).toUpperCase() === "CALLBACK_SCHEDULED" ? 0.16 : String(lead.status).toUpperCase() === "ENGAGED" ? 0.06 : 0.10)
            + (recommendedAction === "EMAIL" ? 0.045 * Math.max(emailPct / 100, 0.35) : recommendedAction === "CALL" ? 0.035 * Math.max(callPct / 100, 0.35) : -0.012 * Math.max(waitPct / 100, 0.4))
        )
      )
    : rawConversion;
  const conversionProb = (conversionFraction * 100).toFixed(1);
  const conversionTone = Number(conversionProb) >= 20
    ? "Promising — prioritize"
    : Number(conversionProb) >= 8
      ? "Moderate — stay on it"
      : "Low — keep nurturing";
  const sendWindowLabel = formatOptimalSendWindow(mlDecision, lead, recommendedAction);
  const touchpoints = countTouchpoints(lead, timeline, mlDecision.supportingMetrics);
  const intentLabel = intentFromDecision(
    lead,
    recommendedAction,
    conversionProb,
    mlDecision.supportingMetrics?.engagementScore
  );
  const recommendedTitle = recommendedAction === "CALL"
    ? "Start an AI voice call"
    : recommendedAction === "WAIT"
      ? "Wait before the next touch"
      : "Send a follow-up email";
  const recommendedBody = mlDecision.explanation
    || (recommendedAction === "WAIT"
      ? `The model selected wait for ${firstName}. Email and call are weaker than holding the cadence.`
      : recommendedAction === "CALL"
        ? `A voice call is the strongest channel for ${firstName} right now.`
        : `Email is the strongest channel for ${firstName} right now. Her follow-up cadence is active, and a call is unlikely to land.`);

  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutGrid },
    { id: "timeline", label: "Interaction Timeline", icon: Clock },
    { id: "sequence", label: "Follow-Up Sequence", icon: Send },
    { id: "insights", label: "AI Insights", icon: Sparkles },
    { id: "notes", label: "Notes (0)", icon: FileText },
    { id: "tasks", label: "Tasks (0)", icon: CheckSquare },
    { id: "meetings", label: "Meetings (0)", icon: Calendar },
    { id: "files", label: "Files (0)", icon: Paperclip },
  ];

  const reasonList = brainDecision?.reasonCodes && brainDecision.reasonCodes.length > 0
    ? brainDecision.reasonCodes
    : ["ML_MODEL_DECISION", "FOLLOW_UP_CADENCE_ACTIVE", "AI_RECOMMENDATION"];

  return (
    <div className="flex flex-col gap-4 w-full min-w-0">
      <div className="rounded-2xl border border-gray-200/90 dark:border-border bg-white dark:bg-card px-6 py-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-full bg-[#e0e2fd] text-[#4338ca] font-semibold flex items-center justify-center text-base shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-[22px] leading-tight font-bold tracking-tight text-gray-900 dark:text-foreground">
                {lead.name}
              </h1>
              <span className="inline-flex items-center rounded-full bg-[#dcfce7] dark:bg-emerald-950/40 px-3 py-0.5 text-xs font-medium text-[#15803d] dark:text-emerald-400">
                {lead.status === "INTERESTED" ? "Interested" : lead.status?.replace(/_/g, " ")?.toLowerCase()?.replace(/^\w/, (c) => c.toUpperCase())}
              </span>
              <span className="inline-flex items-center rounded-full bg-[#f1f3f5] dark:bg-muted px-3 py-0.5 text-xs font-medium text-[#4b5563] dark:text-muted-foreground">
                Active
              </span>
              <span className="inline-flex items-center rounded-full bg-[#f1f3f5] dark:bg-muted px-3 py-0.5 text-xs font-medium text-[#4b5563] dark:text-muted-foreground">
                Priority {lead.priority ?? 90}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-x-5 gap-y-1 text-sm text-gray-600 dark:text-muted-foreground flex-wrap">
              {lead.company && <span className="font-normal">{lead.company}</span>}
              {lead.email && (
                <a href={`mailto:${lead.email}`} className="underline hover:text-gray-900 dark:hover:text-foreground">
                  {lead.email}
                </a>
              )}
              {lead.phone && (
                <a href={`tel:${lead.phone}`} className="underline hover:text-gray-900 dark:hover:text-foreground">
                  {lead.phone}
                </a>
              )}
              {locationText && <span>{locationText}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap lg:flex-nowrap shrink-0">
          {lead.phone && (
            <>
              <button
                type="button"
                disabled={updating || lead.do_not_contact}
                onClick={handleQuickCall}
                className="h-10 px-5 rounded-xl bg-[#0d5e54] hover:bg-[#09473f] text-white text-sm font-semibold shadow-xs disabled:opacity-50 transition-colors"
              >
                Call lead (Plivo)
              </button>
              <button
                type="button"
                disabled={updating || lead.do_not_contact}
                onClick={handleAutonomousCall}
                className="h-10 px-4 rounded-xl bg-[#f0edff] hover:bg-[#e4ddff] text-[#5b21b6] text-sm font-medium transition-colors disabled:opacity-50"
              >
                Autonomous call
              </button>
            </>
          )}
          <div className="inline-flex rounded-xl border border-gray-200 dark:border-border bg-white dark:bg-card overflow-hidden shadow-xs divide-x divide-gray-200 dark:divide-border">
            <button
              type="button"
              disabled={updating}
              onClick={() => handleStateChange("INTERESTED")}
              className="h-10 px-4 text-sm font-medium text-gray-700 dark:text-foreground hover:bg-gray-50 dark:hover:bg-muted/50 transition-colors"
            >
              Interested
            </button>
            <button
              type="button"
              disabled={updating}
              onClick={() => handleStateChange("CLOSED_WON")}
              className="h-10 px-4 text-sm font-medium text-gray-700 dark:text-foreground hover:bg-gray-50 dark:hover:bg-muted/50 transition-colors"
            >
              Won
            </button>
            <button
              type="button"
              disabled={updating}
              onClick={() => handleStateChange("CLOSED_LOST")}
              className="h-10 px-4 text-sm font-medium text-[#ef4444] hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              Lost
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full items-stretch">
        <div className="lg:col-span-7 xl:col-span-8 rounded-2xl border border-gray-200/90 dark:border-border bg-white dark:bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-[#ffedd5] text-[#c2410c]">
                RECOMMENDED NEXT STEP
              </span>
              <span className="text-xs text-gray-500 dark:text-muted-foreground font-normal">
                AI-assisted · {Number.isFinite(confidencePct) ? confidencePct : 98}% confidence
              </span>
            </div>
            <h2 className="mt-2 text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-foreground">
              {recommendedTitle}
            </h2>
            <div className="mt-3.5 flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                disabled={updating || lead.do_not_contact}
                onClick={handleExecuteNow}
                className="px-4 py-2 rounded-xl bg-[#c2410c] hover:bg-[#9a3412] text-white text-xs sm:text-sm font-semibold shadow-xs disabled:opacity-50 transition-colors"
              >
                {recommendedAction === "CALL" ? "Start AI voice call" : recommendedAction === "WAIT" ? "Hold for now" : "Send follow-up email"}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-border bg-white dark:bg-card text-xs sm:text-sm font-medium text-gray-800 dark:text-foreground hover:bg-gray-50 dark:hover:bg-muted/50 shadow-xs transition-colors"
              >
                Preview draft
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("insights")}
                className="text-xs sm:text-sm font-medium text-gray-600 dark:text-muted-foreground hover:text-gray-900 dark:hover:text-foreground underline underline-offset-4 ml-1 cursor-pointer transition-colors"
              >
                Choose another action
              </button>
            </div>

            <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="rounded-xl bg-gray-50/80 dark:bg-muted/40 p-2.5 border border-gray-100 dark:border-border/60">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-gray-400 block">
                  Optimal Send Window
                </span>
                <span className="font-semibold text-gray-800 dark:text-foreground mt-0.5 block truncate">
                  {sendWindowLabel}
                </span>
              </div>
              <div className="rounded-xl bg-gray-50/80 dark:bg-muted/40 p-2.5 border border-gray-100 dark:border-border/60">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-gray-400 block">
                  Touchpoint History
                </span>
                <span className="font-semibold text-gray-800 dark:text-foreground mt-0.5 block truncate">
                  {touchpoints.emails} {touchpoints.emails === 1 ? "Email" : "Emails"} · {touchpoints.calls} {touchpoints.calls === 1 ? "Call" : "Calls"}
                </span>
              </div>
              <div className="rounded-xl bg-gray-50/80 dark:bg-muted/40 p-2.5 border border-gray-100 dark:border-border/60">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-gray-400 block">
                  Lead Intent Signal
                </span>
                <span className={`font-semibold mt-0.5 block truncate ${intentLabel === "Low intent" || intentLabel === "Cooling — wait" ? "text-gray-600 dark:text-muted-foreground" : "text-emerald-600 dark:text-emerald-400"}`}>
                  {intentLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3">
            <div className="border-t border-gray-100 dark:border-border/60 mb-3" />
            <div className="flex items-center gap-2.5 flex-wrap text-xs sm:text-sm">
              <span className="font-bold text-gray-900 dark:text-foreground">Why this?</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-muted text-gray-600 dark:text-muted-foreground">
                Model decision
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-muted text-gray-600 dark:text-muted-foreground">
                Follow-up cadence active
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 xl:col-span-4 rounded-2xl border border-gray-200/90 dark:border-border bg-white dark:bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-medium text-gray-500 dark:text-muted-foreground">
              Conversion chance, next 14 days
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl sm:text-[34px] font-bold tracking-tight text-gray-900 dark:text-foreground leading-none">
                {conversionProb}%
              </span>
              <span className="text-xs text-gray-500 dark:text-muted-foreground font-normal">
                {conversionTone}
              </span>
            </div>
            <div className="mt-2.5 h-1.5 w-full bg-gray-100 dark:bg-muted rounded-full relative overflow-hidden">
              <div
                className="h-full rounded-full bg-[#ea580c]"
                style={{ width: `${Math.max(2, Math.min(100, Number(conversionProb)))}%` }}
              />
            </div>

            <div className="mt-4 text-xs font-semibold text-gray-700 dark:text-foreground">
              Model&apos;s channel preference
            </div>
            <div className="mt-2 space-y-2">
              {[
                { key: "EMAIL", label: "Email", value: emailPct },
                { key: "WAIT", label: "Wait", value: waitPct },
                { key: "CALL", label: "AI voice call", value: callPct },
              ].map((row) => {
                const isWinner = winningChannel === row.key && channel.hasData;
                return (
                  <div key={row.key}>
                    <div className={`flex items-center justify-between text-xs ${isWinner ? "font-semibold text-gray-800 dark:text-foreground" : "font-normal text-gray-600 dark:text-muted-foreground"}`}>
                      <span>{row.label}</span>
                      <span className={isWinner ? "font-bold text-gray-900 dark:text-foreground" : ""}>{row.value}%</span>
                    </div>
                    {isWinner ? (
                      <div className="mt-1 h-1.5 w-full bg-gray-100 dark:bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#c2410c]"
                          style={{ width: `${Math.max(2, Math.min(100, row.value))}%` }}
                        />
                      </div>
                    ) : (
                      <div className="mt-1 h-1 w-full bg-gray-100 dark:bg-muted rounded-full relative">
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#475569]"
                          style={{ left: `calc(${Math.max(0, Math.min(100, row.value))}% - 3px)` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3.5 text-[11px] text-gray-400 font-normal">
            Updated automatically by the ML pipeline
          </div>
        </div>
      </div>

      <div className="border-b border-border/70 flex items-center gap-1 overflow-x-auto no-scrollbar w-full">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? "border-violet-600 text-violet-600 dark:text-violet-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-5 w-full">
          <div className="space-y-0.5">
            <h2 className="text-lg font-bold tracking-tight text-foreground">Lead Overview</h2>
            <p className="text-xs text-muted-foreground">Key information and current status</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full overflow-visible">
            <div className="rounded-2xl border border-border/80 bg-card p-3.5 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-orange-500/10 dark:bg-orange-950/40 text-orange-500 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-medium text-muted-foreground block">Email</span>
                  <span className="text-xs font-bold text-foreground truncate block">{lead.email}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(lead.email, "email")}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/50 transition-colors shrink-0"
              >
                {copiedField === "email" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-3.5 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-blue-500/10 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-medium text-muted-foreground block">Company</span>
                  <span className="text-xs font-bold text-foreground truncate block">{lead.company || "BrightPath Analytics"}</span>
                </div>
              </div>
              {lead.company_domain ? (
                <a
                  href={lead.company_domain.startsWith("http") ? lead.company_domain : `https://${lead.company_domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/50 transition-colors shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/50 transition-colors shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-3.5 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-blue-500/10 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-medium text-muted-foreground block">Phone</span>
                  <span className="text-xs font-bold text-foreground font-mono block">{lead.phone || "+91 9000012004"}</span>
                </div>
              </div>
              {lead.phone && (
                <button
                  type="button"
                  onClick={() => handleCopy(lead.phone, "phone")}
                  className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/50 transition-colors shrink-0"
                >
                  {copiedField === "phone" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-3.5 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-rose-500/10 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-medium text-muted-foreground block">Location</span>
                  <span className="text-xs font-bold text-foreground truncate block">{locationText}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-3.5 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-purple-500/10 dark:bg-purple-950/40 text-purple-500 flex items-center justify-center shrink-0">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-medium text-muted-foreground block">Job Title</span>
                  <span className="text-xs font-bold text-foreground truncate block">{lead.job_title || `P-${lead.priority || 50}`}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-3.5 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-purple-500/10 dark:bg-purple-950/40 text-purple-500 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-medium text-muted-foreground block">Lead Status</span>
                </div>
              </div>
              <div className="relative">
                <select
                  value={lead.status}
                  onChange={(e) => handleStateChange(e.target.value)}
                  disabled={updating}
                  className="appearance-none bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60 rounded-full pl-6 pr-8 py-1.5 text-xs font-bold cursor-pointer focus:outline-none shadow-2xs"
                >
                  <option value="NEW">New</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="ENGAGED">Engaged</option>
                  <option value="INTERESTED">Interested</option>
                  <option value="CLOSED_WON">Closed Won</option>
                  <option value="CLOSED_LOST">Closed Lost</option>
                </select>
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-500 pointer-events-none" />
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 pointer-events-none" />
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-3.5 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center shrink-0">
                  <Link2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-medium text-muted-foreground block">Source</span>
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider block">{lead.source || "CSV_IMPORT"}</span>
                </div>
              </div>
            </div>

            <div className="relative z-20 rounded-2xl border border-border/80 bg-card p-3.5 flex items-center justify-between shadow-2xs overflow-visible">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-medium text-muted-foreground block">Assigned Rep</span>
                </div>
              </div>
              <AssignedRepDropdown
                value={lead.assigned_rep_id}
                reps={teamReps}
                onChange={handleRepAssign}
                disabled={updating}
              />
            </div>
          </div>

          <AiGeneratedEmailCard lead={lead} onLeadUpdated={fetchLead} />

          <LeadFollowUpSequenceCard lead={lead} onUpdated={fetchLead} />

          <UnifiedInteractionTimeline timeline={timeline} lead={lead} />
        </div>
      )}

      {activeTab === "timeline" && (
        <div className="w-full">
          <UnifiedInteractionTimeline timeline={timeline} lead={lead} />
        </div>
      )}

      {activeTab === "sequence" && (
        <div className="w-full">
          <LeadFollowUpSequenceCard lead={lead} onUpdated={fetchLead} />
        </div>
      )}

      {activeTab === "insights" && (
        <div className="w-full space-y-6">
          {lead.metadata?.company_research ? (
            <Card className="border-primary/30 bg-primary/5 w-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2 text-primary">
                    <Sparkles className="w-4 h-4 text-primary" />
                    AI Company Intelligence
                  </CardTitle>
                  <div className="flex items-center gap-1.5">
                    {lead.metadata.company_research.qualityStatus && (
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {lead.metadata.company_research.qualityStatus}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {lead.metadata.company_research.source || "ai_analyzed"}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="text-xs">
                  Target organization researched prior to email drafting & dispatch.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                {lead.metadata.company_research.domain && (
                  <div>
                    <span className="font-semibold text-muted-foreground block text-[11px]">Resolved Domain</span>
                    <p className="mt-0.5 text-foreground/90">{lead.metadata.company_research.domain}</p>
                  </div>
                )}
                {lead.metadata.company_research.qualityStatus === "INSUFFICIENT_EVIDENCE" && (
                  <p className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-amber-800">
                    Public evidence was insufficient. Personalized claims were withheld.
                  </p>
                )}
                <div>
                  <span className="font-semibold text-muted-foreground block text-[11px]">Executive Summary</span>
                  <p className="mt-0.5 text-foreground/90">{lead.metadata.company_research.summary || "No verified company summary is available."}</p>
                </div>
                {lead.metadata.company_research.coreServices && (
                  <div>
                    <span className="font-semibold text-muted-foreground block text-[11px]">Core Offerings & Solutions</span>
                    <p className="mt-0.5 text-foreground/90">{lead.metadata.company_research.coreServices}</p>
                  </div>
                )}
                {lead.metadata.company_research.targetAudience && (
                  <div>
                    <span className="font-semibold text-muted-foreground block text-[11px]">Target Market</span>
                    <p className="mt-0.5 text-foreground/90">{lead.metadata.company_research.targetAudience}</p>
                  </div>
                )}
                {lead.metadata.company_research.growthOpportunity && (
                  <div className="rounded-md p-2.5 bg-background/60 border border-primary/20">
                    <span className="font-semibold text-primary block text-[11px]">Autonomous Outreach Hook</span>
                    <p className="mt-0.5 text-foreground">{lead.metadata.company_research.growthOpportunity}</p>
                  </div>
                )}
                {Array.isArray(lead.metadata.company_research.sources) && lead.metadata.company_research.sources.length > 0 && (
                  <div>
                    <span className="font-semibold text-muted-foreground block text-[11px]">Evidence Sources</span>
                    <ul className="mt-1 space-y-1">
                      {lead.metadata.company_research.sources.map((source) => (
                        <li key={source.url}>
                          <a href={source.url} target="_blank" rel="noreferrer" className="text-primary underline-offset-2 hover:underline">
                            {source.title || source.url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="p-8 text-center text-muted-foreground border border-dashed rounded-xl bg-card">
              No company intelligence records generated yet for this prospect.
            </div>
          )}
        </div>
      )}

      {(activeTab === "notes" || activeTab === "tasks" || activeTab === "meetings" || activeTab === "files") && (
        <div className="p-12 text-center text-muted-foreground border border-dashed rounded-2xl bg-card">
          <p className="text-sm font-semibold capitalize">No {activeTab} yet</p>
          <p className="text-xs text-muted-foreground mt-1">Items added to {activeTab} will appear here.</p>
        </div>
      )}
    </div>
  );
}
