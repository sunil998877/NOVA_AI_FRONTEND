import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneForwarded,
  Bot,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCw,
  Search,
  Filter,
  DollarSign,
  Play,
  Calendar,
  Sparkles,
  Zap,
  Volume2,
  Building,
  Mail,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Radio,
  Activity,
  X,
  SlidersHorizontal,
  Mic,
  Hash,
  Delete,
  Info,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { useToast } from "../../components/ui/toast";
import { voiceApi, leadApi } from "../../lib/api";

const PRESET_SCRIPTS = [
  {
    id: "intro",
    label: "Autonomous Intro Pitch",
    text: "Hello! This is NOVA's autonomous sales assistant calling. Did I catch you at a convenient moment to speak about your outbound sales automation?",
  },
  {
    id: "followup",
    label: "Email Follow-up Touch",
    text: "Hi there! I am following up on the email we sent you earlier regarding NOVA's AI Sales Engine. I wanted to see if you had any questions on scaling your outbound pipeline.",
  },
  {
    id: "demo",
    label: "Product Demo Invitation",
    text: "Hello! We noticed your company has been expanding sales outreach. Would you be open to a quick 10-minute demo to see how autonomous agents book qualified meetings on autopilot?",
  },
  {
    id: "callback",
    label: "Callback Follow-up",
    text: "Hi! You requested a callback from our team regarding NOVA. I'm connecting you right now with our solutions desk.",
  },
];

const DIALPAD_KEYS = [
  { key: "1", sub: "" },
  { key: "2", sub: "ABC" },
  { key: "3", sub: "DEF" },
  { key: "4", sub: "GHI" },
  { key: "5", sub: "JKL" },
  { key: "6", sub: "MNO" },
  { key: "7", sub: "PQRS" },
  { key: "8", sub: "TUV" },
  { key: "9", sub: "WXYZ" },
  { key: "*", sub: "" },
  { key: "0", sub: "+" },
  { key: "#", sub: "" },
];

function formatCallDuration(seconds) {
  const sec = Number(seconds) || 0;
  if (sec <= 0) return "0s";
  const mins = Math.floor(sec / 60);
  const remainingSecs = sec % 60;
  if (mins === 0) return `${remainingSecs}s`;
  if (remainingSecs === 0) return `${mins}m`;
  return `${mins}m ${remainingSecs}s`;
}

function formatCallDisposition(val) {
  if (!val) return "No Disposition";
  const s = String(val).trim();
  const lower = s.toLowerCase();

  if (lower.includes("ring timeout") || lower.includes("timeout")) return "Ring Timeout Reached";
  if (lower.includes("early media") || lower.includes("early_media")) return "Early Media Signal";
  if (lower.includes("user_busy") || lower.includes("busy")) return "Line Busy";
  if (lower.includes("no_answer") || lower.includes("no answer")) return "No Answer";
  if (lower.includes("rejected") || lower.includes("call_rejected")) return "Call Rejected";
  if (lower.includes("canceled") || lower.includes("cancelled")) return "Call Canceled";
  if (lower.includes("interested") && !lower.includes("not")) return "Interested";
  if (lower.includes("not_interested") || lower.includes("not interested")) return "Not Interested";
  if (lower.includes("callback")) return "Callback Requested";
  if (lower.includes("dnc") || lower.includes("do not call")) return "Do Not Call (DNC)";
  if (lower.includes("voicemail") || lower.includes("answering machine")) return "Voicemail Detected";
  if (lower === "answer" || lower.includes("answered") || lower.includes("connected")) return "Call Connected";
  if (lower.includes("normal hangup") || lower.includes("normal_clearing") || lower === "completed") return "Call Completed";
  if (lower === "actiondispatched") return "Call Dispatched";
  if (lower === "actionfailed") return "Call Failed";

  return s
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function renderDispositionBadge(disposition) {
  const text = formatCallDisposition(disposition);
  const lower = text.toLowerCase();

  if (lower.includes("interested") && !lower.includes("not")) {
    return (
      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200/90 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 whitespace-nowrap text-xs px-2.5 py-0.5 font-semibold rounded-md shadow-none">
        {text}
      </Badge>
    );
  }
  if (lower.includes("callback")) {
    return (
      <Badge className="bg-amber-50 text-amber-700 border border-amber-200/90 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 whitespace-nowrap text-xs px-2.5 py-0.5 font-semibold rounded-md shadow-none">
        {text}
      </Badge>
    );
  }
  if (lower.includes("connected")) {
    return (
      <Badge className="bg-blue-50 text-blue-700 border border-blue-200/90 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60 whitespace-nowrap text-xs px-2.5 py-0.5 font-semibold rounded-md shadow-none">
        {text}
      </Badge>
    );
  }
  if (lower.includes("not interested") || lower.includes("dnc") || lower.includes("rejected")) {
    return (
      <Badge className="bg-rose-50 text-rose-700 border border-rose-200/90 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60 whitespace-nowrap text-xs px-2.5 py-0.5 font-semibold rounded-md shadow-none">
        {text}
      </Badge>
    );
  }
  if (lower.includes("timeout") || lower.includes("busy") || lower.includes("no answer") || lower.includes("early media")) {
    return (
      <Badge variant="outline" className="bg-amber-50/50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800 whitespace-nowrap text-xs px-2.5 py-0.5 font-medium rounded-md shadow-none">
        {text}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground whitespace-nowrap text-xs px-2.5 py-0.5 font-medium border-border rounded-md shadow-none">
      {text}
    </Badge>
  );
}

function renderStatusBadge(statusVal, isAnswered) {
  const s = String(statusVal || "").toLowerCase().trim();

  if (isAnswered || s === "answered" || s === "answer" || s === "in_progress" || s === "in-progress") {
    return (
      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-xs px-2.5 py-1 font-semibold rounded-md inline-flex items-center gap-1.5 shadow-none">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        Connected
      </Badge>
    );
  }

  if (s.includes("early_media") || s.includes("early media") || s.includes("early-media")) {
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 text-xs px-2.5 py-1 font-medium rounded-md shadow-none">
        Early Media
      </Badge>
    );
  }

  if (s.includes("timeout") || s.includes("ring_timeout")) {
    return (
      <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 text-xs px-2.5 py-1 font-medium rounded-md shadow-none">
        Ring Timeout
      </Badge>
    );
  }

  if (s.includes("busy")) {
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 text-xs px-2.5 py-1 font-medium rounded-md shadow-none">
        Line Busy
      </Badge>
    );
  }

  if (s.includes("ringing")) {
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 text-xs px-2.5 py-1 font-medium rounded-md shadow-none">
        Ringing
      </Badge>
    );
  }

  if (s.includes("initiated") || s.includes("queued")) {
    return (
      <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800 text-xs px-2.5 py-1 font-medium rounded-md shadow-none">
        Initiated
      </Badge>
    );
  }

  if (s.includes("failed") || s.includes("rejected")) {
    return (
      <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 text-xs px-2.5 py-1 font-medium rounded-md shadow-none">
        Failed
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="bg-muted/40 text-muted-foreground border-border text-xs px-2.5 py-1 font-medium rounded-md shadow-none">
      Completed (Unanswered)
    </Badge>
  );
}

export default function AseCalls() {
  const [activeTab, setActiveTab] = useState("history");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [historyData, setHistoryData] = useState({
    plivoCalls: [],
    leadCalls: [],
    scheduledCalls: [],
    stats: {
      totalCalls: 0,
      answeredCalls: 0,
      answerRate: 0,
      totalMinutes: 0,
      totalSeconds: 0,
      totalCost: 0,
      balance: "12.77",
      fromNumber: "+918035087884",
      configured: true,
    },
  });

  const [leadsList, setLeadsList] = useState([]);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [customPhone, setCustomPhone] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [callMessage, setCallMessage] = useState(PRESET_SCRIPTS[0].text);
  const [callingState, setCallingState] = useState(false);
  const [autoQueueDelay, setAutoQueueDelay] = useState("0");
  const [autoRunning, setAutoRunning] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [selectedCallDetails, setSelectedCallDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const handleOpenDetails = async (call) => {
    setSelectedCallDetails(call);
    if (!call?.id) return;
    setLoadingDetails(true);
    try {
      const res = await voiceApi.getCallDetails(call.id);
      if (res?.data?.call) {
        setSelectedCallDetails((prev) => ({
          ...prev,
          ...res.data.call,
          webhookEvents: res.data.webhookEvents || [],
          callback: res.data.callback || null,
          lead: res.data.lead || null,
        }));
      }
    } catch {
    } finally {
      setLoadingDetails(false);
    }
  };

  const { success, error: toastError } = useToast();

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    try {
      const [historyRes, leadsRes] = await Promise.allSettled([
        voiceApi.getHistory(),
        leadApi.list({ limit: 100 }),
      ]);

      if (historyRes.status === "fulfilled" && historyRes.value?.data) {
        setHistoryData(historyRes.value.data);
      }
      if (leadsRes.status === "fulfilled" && leadsRes.value?.data) {
        const items = leadsRes.value.data.leads || leadsRes.value.data || [];
        setLeadsList(Array.isArray(items) ? items : []);
      }
    } catch (err) {
      toastError("Load Failed", err.message || "Failed to load call history.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLeadSelect = (e) => {
    const id = e.target.value;
    setSelectedLeadId(id);
    if (!id) {
      setCustomPhone("");
      setRecipientName("");
      return;
    }
    const found = leadsList.find((l) => String(l.id) === String(id));
    if (found) {
      setCustomPhone(found.phone || "");
      setRecipientName(found.name || [found.first_name, found.last_name].filter(Boolean).join(" ") || "");
      setCallMessage(
        `Hello ${found.first_name || found.name || "there"}! This is NOVA's autonomous sales assistant calling for ${found.company || "your team"}. Did I catch you at a good time?`
      );
    }
  };

  const handleDialpadPress = (digit) => {
    setCustomPhone((prev) => prev + digit);
  };

  const handleDialpadBackspace = () => {
    setCustomPhone((prev) => prev.slice(0, -1));
  };

  const handleDirectCall = async (e) => {
    if (e) e.preventDefault();
    const phoneToCall = customPhone.trim();
    if (!phoneToCall) {
      toastError("Missing Number", "Please provide a valid phone number to call.");
      return;
    }

    setCallingState(true);
    try {
      const payload = {
        phone: phoneToCall,
        leadId: selectedLeadId ? Number(selectedLeadId) : null,
        name: recipientName || "Prospect",
        message: callMessage,
      };

      const res = await voiceApi.callNumber(payload);
      if (res?.data?.status === "SUCCEEDED") {
        success("Call Placed", `Plivo live call dispatched to ${phoneToCall}. Request UUID: ${res.data.metadata?.providerCallId || "Dispatched"}`);
        loadData(true);
      } else {
        toastError("Call Failed", res?.data?.error || "Could not dispatch call.");
      }
    } catch (err) {
      toastError("Calling Error", err.message || "Plivo request failed.");
    } finally {
      setCallingState(false);
    }
  };

  const handleTriggerAutonomousCall = async (leadId) => {
    try {
      const res = await voiceApi.triggerAutonomousCall({ leadId });
      success("Autonomous Call Fired", `ASE Engine initiated voice call for Lead #${leadId}`);
      loadData(true);
    } catch (err) {
      toastError("Autonomous Call Failed", err.message || "Error running autonomous call.");
    }
  };

  const handleQueueAutonomousCall = async () => {
    if (!selectedLeadId) {
      toastError("Select Lead", "Please select a lead to queue for autonomous calling.");
      return;
    }

    try {
      await voiceApi.queueAutonomousCall({
        leadId: Number(selectedLeadId),
        delayMinutes: Number(autoQueueDelay),
      });
      success("Autonomous Call Queued", `Lead #${selectedLeadId} has been added to the Autonomous Calling pipeline.`);
      loadData(true);
    } catch (err) {
      toastError("Queue Failed", err.message || "Could not queue autonomous call.");
    }
  };

  const handleRunSchedulerCycle = async () => {
    setAutoRunning(true);
    try {
      await voiceApi.runSchedulerCycle();
      success("Scheduler Cycle Triggered", "ASE scheduler is now evaluating and dispatching all due calls.");
      setTimeout(() => loadData(true), 2000);
    } catch (err) {
      toastError("Cycle Trigger Failed", err.message || "Failed to trigger cycle.");
    } finally {
      setAutoRunning(false);
    }
  };

  const combinedCalls = useMemo(() => {
    const rawList = historyData.calls || historyData.plivoCalls || [];
    return rawList.map((c) => {
      const isAnswered = Boolean(c.is_answered || c.isAnswered || c.status === "ANSWERED" || c.call_state === "ANSWER");
      const durationSec = Number(c.duration ?? c.duration_sec ?? c.call_duration ?? 0);
      const costStr = c.cost !== null && c.cost !== undefined
        ? (String(c.cost).startsWith("$") || c.cost === "Pending" ? c.cost : `$${Number(c.cost).toFixed(4)}`)
        : (c.cost_status === "PENDING" ? "Pending" : "$0.0000");

      return {
        id: c.id || c.call_uuid || `call_${Math.random()}`,
        internalId: c.call_id || c.id,
        callUuid: c.call_uuid || c.callUuid || c.provider_call_uuid,
        source: c.initiation_source === "MANUAL" ? "manual" : (c.is_autonomous || c.isAutonomous ? "autonomous" : (c.source || "plivo")),
        direction: c.call_type?.toLowerCase() || c.call_direction || "outbound",
        from: c.from || c.from_number,
        to: c.to || c.phone_number || c.to_number,
        status: c.status || c.provider_status || (isAnswered ? "ANSWERED" : "COMPLETED"),
        providerStatus: c.provider_status || c.call_state || c.status,
        normalizedOutcome: c.normalized_outcome || c.normalizedOutcome || c.status,
        duration: durationSec,
        billableDuration: Number(c.billable_duration || c.billable_duration_sec || c.billed_duration || 0),
        cost: costStr,
        rawCost: c.rawCost !== undefined ? c.rawCost : (c.total_amount ? Number(c.total_amount) : (c.cost && !isNaN(c.cost) ? Number(c.cost) : null)),
        costStatus: c.cost_status || (costStr === "Pending" ? "PENDING" : "FINAL"),
        timestamp: c.timestamp || c.answered_at || c.created_at || c.initiation_time || new Date().toISOString(),
        disposition: c.disposition || c.business_disposition || c.hangup_cause_name || "Completed",
        carrier: c.carrier || c.to_number_carrier || null,
        carrierType: c.carrierType || c.to_number_type || "Mobile",
        isAutonomous: Boolean(c.isAutonomous ?? c.is_autonomous ?? (c.initiation_source === "AUTONOMOUS_AI")),
        isAnswered,
        leadName: c.leadName || c.lead_name || null,
        leadId: c.leadId || c.lead_id || null,
        leadCompany: c.leadCompany || c.lead_company || null,
        leadEmail: c.leadEmail || c.lead_email || null,
        leadPriority: c.leadPriority || c.lead_priority || null,
        hangupCause: c.hangupCause || c.hangup_cause || c.hangup_cause_name || "NORMAL_CLEARING",
        failureReason: c.failureReason || c.failure_reason || null,
        callbackId: c.callbackId || c.callback_id || null,
      };
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [historyData]);

  const filteredCalls = useMemo(() => {
    return combinedCalls.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (c.to && c.to.toLowerCase().includes(q)) ||
        (c.leadName && c.leadName.toLowerCase().includes(q)) ||
        (c.leadCompany && c.leadCompany.toLowerCase().includes(q)) ||
        (c.carrier && c.carrier.toLowerCase().includes(q)) ||
        (c.disposition && c.disposition.toLowerCase().includes(q)) ||
        (c.callUuid && c.callUuid.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "answered" && c.isAnswered) ||
        (statusFilter === "completed" && !c.isAnswered && !c.status?.toLowerCase().includes("failed")) ||
        (statusFilter === "failed" && (c.status?.toLowerCase().includes("failed") || c.status?.toLowerCase().includes("timeout") || c.status?.toLowerCase().includes("busy")));

      const matchesSource =
        sourceFilter === "all" ||
        (sourceFilter === "autonomous" && c.isAutonomous) ||
        (sourceFilter === "manual" && !c.isAutonomous) ||
        (sourceFilter === "plivo" && c.source === "plivo");

      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [combinedCalls, searchQuery, statusFilter, sourceFilter]);

  return (
    <div className="space-y-6 max-w-7xl w-full min-w-0 mx-auto pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/60 pb-5 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20 shrink-0">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Calling & Autonomous Dialer Console
                </h1>
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-500/30 gap-1.5 px-2.5 py-0.5 shadow-none shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Plivo Live Line
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
                Real-time carrier CDR records, AI autonomous calling dispatch, and direct telephony dialer.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            disabled={refreshing || loading}
            className="gap-1.5 shadow-none hover:bg-muted font-medium text-xs sm:text-sm"
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-violet-600" : ""}`} />
            Refresh Data
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRunSchedulerCycle}
            disabled={autoRunning}
            className="gap-1.5 border-violet-200 text-violet-700 bg-violet-50/50 hover:bg-violet-100 dark:border-violet-800 dark:text-violet-300 dark:bg-violet-950/30 shadow-none font-medium text-xs sm:text-sm"
          >
            <Zap className={`w-3.5 h-3.5 ${autoRunning ? "animate-spin text-violet-600" : ""}`} />
            Run ASE Auto-Cycle
          </Button>

          <Button
            size="sm"
            onClick={() => setActiveTab("dialer")}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white gap-2 shadow-sm font-medium px-3.5 text-xs sm:text-sm"
          >
            <Phone className="w-3.5 h-3.5" />
            Open Dialer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full min-w-0">
        <Card className="border border-border/80 shadow-sm rounded-xl overflow-hidden relative group hover:border-violet-500/40 transition-all min-w-0">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-3">
            <div className="space-y-1 min-w-0 flex-1">
              <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground truncate">Total Outbound Placed</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight truncate">{historyData.stats.totalCalls}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                <Radio className="w-3 h-3 text-blue-500 shrink-0" />
                <span className="truncate">Live network telemetry</span>
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 shrink-0">
              <PhoneOutgoing className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-sm rounded-xl overflow-hidden relative group hover:border-emerald-500/40 transition-all min-w-0">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-3">
            <div className="space-y-1 min-w-0 flex-1">
              <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground truncate">Answer / Connect Rate</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight truncate">
                {historyData.stats.answerRate}%
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                <span className="truncate">{historyData.stats.answeredCalls} calls connected</span>
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 shrink-0">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-sm rounded-xl overflow-hidden relative group hover:border-amber-500/40 transition-all min-w-0">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-3">
            <div className="space-y-1 min-w-0 flex-1">
              <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground truncate">Talk Time Logged</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight truncate">
                {historyData.stats.totalMinutes} min
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                <span className="truncate">Cost: ${historyData.stats.totalCost}</span>
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 shrink-0">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-sm rounded-xl overflow-hidden relative group hover:border-violet-500/40 transition-all bg-gradient-to-br from-violet-500/[0.03] to-transparent min-w-0">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 to-indigo-600"></div>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-3">
            <div className="space-y-1 min-w-0 flex-1">
              <p className="text-[11px] font-semibold tracking-wider uppercase text-violet-700 dark:text-violet-300 truncate">
                Plivo Balance & Line
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-violet-700 dark:text-violet-300 tracking-tight truncate">
                ${historyData.stats.balance}
              </h3>
              <p className="text-xs font-mono font-medium text-muted-foreground flex items-center gap-1 truncate">
                <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                <span className="truncate">{historyData.stats.fromNumber}</span>
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 shrink-0">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex border-b border-border/80 gap-2 overflow-x-auto min-w-0">
        <button
          onClick={() => setActiveTab("history")}
          className={`pb-3.5 px-4 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === "history"
              ? "border-violet-600 text-violet-600 dark:text-violet-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock className="w-4 h-4" />
          Call History & CDRs
          <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 font-bold">
            {filteredCalls.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("dialer")}
          className={`pb-3.5 px-4 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === "dialer"
              ? "border-violet-600 text-violet-600 dark:text-violet-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Phone className="w-4 h-4" />
          Direct Call & Pitch Studio
        </button>

        <button
          onClick={() => setActiveTab("autonomous")}
          className={`pb-3.5 px-4 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === "autonomous"
              ? "border-violet-600 text-violet-600 dark:text-violet-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Bot className="w-4 h-4" />
          Autonomous Calling Queue
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-foreground font-bold">
            {historyData.scheduledCalls?.length || 0}
          </span>
        </button>
      </div>

      {activeTab === "history" && (
        <div className="space-y-4 w-full min-w-0">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-3 rounded-xl border border-border/80 shadow-sm w-full min-w-0">
            <div className="relative w-full sm:w-80 md:w-96 min-w-0">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by lead name, phone, carrier, outcome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9.5 h-9 bg-background text-sm w-full"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap sm:flex-nowrap">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-3 rounded-lg border border-input bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring flex-1 sm:flex-initial"
              >
                <option value="all">All Outcomes</option>
                <option value="answered">Connected / Answered</option>
                <option value="completed">Completed / Hangup</option>
                <option value="failed">Failed / Busy</option>
              </select>

              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="h-9 px-3 rounded-lg border border-input bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring flex-1 sm:flex-initial"
              >
                <option value="all">All Channels</option>
                <option value="autonomous">Autonomous AI</option>
                <option value="manual">Direct / Manual</option>
                <option value="plivo">Plivo Network CDRs</option>
              </select>
            </div>
          </div>

          <Card className="border border-border/80 shadow-sm rounded-xl overflow-hidden w-full min-w-0">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold border-b border-border">
                  <tr>
                    <th className="px-4 py-3.5 min-w-[200px] whitespace-nowrap">Recipient / Lead</th>
                    <th className="px-3 py-3.5 min-w-[130px] whitespace-nowrap">Call Type</th>
                    <th className="px-3 py-3.5 min-w-[110px] whitespace-nowrap">Status</th>
                    <th className="px-3 py-3.5 min-w-[90px] whitespace-nowrap">Duration</th>
                    <th className="px-3 py-3.5 min-w-[160px] whitespace-nowrap">Disposition / Result</th>
                    <th className="px-3 py-3.5 min-w-[80px] whitespace-nowrap">Cost</th>
                    <th className="px-3 py-3.5 min-w-[140px] whitespace-nowrap">Date & Time</th>
                    <th className="px-4 py-3.5 min-w-[150px] text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-16 text-center text-muted-foreground">
                        <RotateCw className="w-7 h-7 animate-spin mx-auto mb-3 text-violet-600" />
                        <p className="font-medium text-foreground">Synchronizing live records from Plivo & Database...</p>
                        <p className="text-xs text-muted-foreground mt-1">Cross-referencing phone numbers with leads</p>
                      </td>
                    </tr>
                  ) : filteredCalls.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-16 text-center text-muted-foreground">
                        <Phone className="w-10 h-10 mx-auto mb-3 opacity-30 text-muted-foreground" />
                        <p className="font-semibold text-foreground text-base">No call records found</p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                          Place a direct call or trigger the Autonomous Voice Cycle to start recording calls.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredCalls.map((call) => (
                      <tr
                        key={call.id}
                        className="hover:bg-muted/40 transition-colors group cursor-pointer"
                        onClick={() => setSelectedCallDetails(call)}
                      >
                        <td className="px-4 py-3.5">
                          <div className="space-y-1">
                            {call.leadId ? (
                              <Link
                                to={`/ase/leads/${call.leadId}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-violet-600 dark:text-violet-400 hover:underline inline-flex items-center gap-1.5 font-bold text-sm"
                              >
                                {call.leadName || `Lead #${call.leadId}`}
                                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                              </Link>
                            ) : (
                              <span className="text-sm font-bold text-foreground">
                                {call.leadName || "Direct Callee"}
                              </span>
                            )}

                            <div className="text-xs font-mono font-medium text-muted-foreground">
                              {call.to}
                            </div>

                            {call.leadCompany && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                                <Building className="w-3.5 h-3.5 opacity-60 text-slate-500" />
                                {call.leadCompany}
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap">
                          {call.isAutonomous ? (
                            <Badge className="bg-violet-50 text-violet-700 border border-violet-200/90 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/60 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 font-semibold rounded-md shadow-none">
                              <Bot className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                              Autonomous AI
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-800 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 font-semibold rounded-md shadow-none">
                              <User className="w-3.5 h-3.5 text-slate-500" />
                              Direct / Manual
                            </Badge>
                          )}
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap">
                          {renderStatusBadge(call.status, call.isAnswered)}
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap">
                          {call.isAnswered && call.duration > 0 ? (
                            <div className="inline-flex items-center gap-1.5 font-semibold text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200/80 dark:border-emerald-800/60 font-mono">
                              <Clock className="w-3 h-3" />
                              {formatCallDuration(call.duration)}
                            </div>
                          ) : call.isAnswered ? (
                            <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 px-2 py-1 font-semibold">Connected (0s)</span>
                          ) : (
                            <span className="font-mono text-xs text-muted-foreground/60 px-2 py-1">0s (Unanswered)</span>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <div>{renderDispositionBadge(call.disposition)}</div>
                            {call.carrier && (
                              <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
                                <Radio className="w-3 h-3 text-violet-500" />
                                {call.carrier}
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4 font-mono text-xs font-semibold text-foreground whitespace-nowrap">
                          <span className={call.cost === "Pending" ? "text-amber-600 dark:text-amber-400 font-sans text-xs italic" : ""}>
                            {call.cost}
                          </span>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-xs font-semibold text-foreground">
                            {new Date(call.timestamp).toLocaleDateString(undefined, {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                          <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                            {new Date(call.timestamp).toLocaleTimeString(undefined, {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5 flex-nowrap" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDetails(call)}
                              className="h-8 text-xs font-medium px-2.5 hover:bg-muted border-border shadow-none"
                            >
                              <Info className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                              Details
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setCustomPhone(call.to);
                                if (call.leadName) setRecipientName(call.leadName);
                                if (call.leadId) setSelectedLeadId(String(call.leadId));
                                setActiveTab("dialer");
                              }}
                              className="h-8 text-xs font-medium px-2.5 hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-950/40 dark:hover:text-violet-300 border-border shadow-none"
                            >
                              <PhoneCall className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                              Redial
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "dialer" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full min-w-0">
          <div className="lg:col-span-7 space-y-6 min-w-0">
            <Card className="border border-border/80 shadow-sm rounded-xl overflow-hidden min-w-0">
              <CardHeader className="border-b border-border/60 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Phone className="w-5 h-5 text-violet-600" />
                  Outbound Direct Telephony
                </CardTitle>
                <CardDescription>
                  Make instant voice calls over Plivo carrier infrastructure with verified Caller ID ({historyData.stats.fromNumber}).
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5">
                <form onSubmit={handleDirectCall} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                        Select Existing Lead (Auto-fill)
                      </label>
                      <select
                        value={selectedLeadId}
                        onChange={handleLeadSelect}
                        className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-medium"
                      >
                        <option value="">-- Manual Number Entry --</option>
                        {leadsList.map((lead) => (
                          <option key={lead.id} value={lead.id}>
                            {lead.name || lead.email} {lead.company ? `(${lead.company})` : ""} - {lead.phone || "No phone"}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                        Recipient Name
                      </label>
                      <Input
                        placeholder="e.g. Sunil Kumar"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        className="h-10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                      Destination Phone Number (E.164 Standard)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="e.g. +917352575923 or +14158901204"
                        value={customPhone}
                        onChange={(e) => setCustomPhone(e.target.value)}
                        className="pl-10 h-11 text-base font-mono font-bold tracking-wide"
                        required
                      />
                      {customPhone && (
                        <button
                          type="button"
                          onClick={() => setCustomPhone("")}
                          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Requires international country prefix (e.g. +91 for India, +1 for US/Canada).
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Voice Speech Script / Prompt
                      </label>
                      <span className="text-xs text-muted-foreground">TTS Neutral Female Voice</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {PRESET_SCRIPTS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setCallMessage(preset.text)}
                          className="text-xs px-2.5 py-1 rounded-md border border-input bg-muted/40 hover:bg-muted text-foreground transition-colors font-medium"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={4}
                      value={callMessage}
                      onChange={(e) => setCallMessage(e.target.value)}
                      className="w-full p-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring leading-relaxed"
                      placeholder="Enter the message or conversation prompt spoken by the Plivo TTS voice..."
                    />
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/60">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Verified Caller ID: <strong className="font-mono text-foreground">{historyData.stats.fromNumber}</strong></span>
                    </div>

                    <Button
                      type="submit"
                      disabled={callingState || !customPhone.trim()}
                      className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white gap-2 px-8 h-11 font-semibold shadow-sm"
                    >
                      <PhoneCall className={`w-4 h-4 ${callingState ? "animate-pulse" : ""}`} />
                      {callingState ? "Placing Plivo Call..." : "Call Number Now"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-5 space-y-6 min-w-0">
            <Card className="border border-border/80 shadow-sm rounded-xl overflow-hidden min-w-0">
              <CardHeader className="border-b border-border/60 pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-violet-600" />
                    Interactive DTMF Dialpad
                  </span>
                  <button
                    type="button"
                    onClick={handleDialpadBackspace}
                    disabled={!customPhone}
                    className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 disabled:opacity-40"
                  >
                    <Delete className="w-3.5 h-3.5" />
                    Backspace
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
                  {DIALPAD_KEYS.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleDialpadPress(item.key)}
                      className="h-14 rounded-xl border border-border/80 bg-background hover:bg-violet-50 hover:border-violet-300 dark:hover:bg-violet-950/40 dark:hover:border-violet-800 transition-all flex flex-col items-center justify-center group active:scale-95"
                    >
                      <span className="text-xl font-bold text-foreground group-hover:text-violet-600">
                        {item.key}
                      </span>
                      {item.sub && (
                        <span className="text-[10px] font-semibold tracking-widest text-muted-foreground -mt-1 group-hover:text-violet-500">
                          {item.sub}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/80 shadow-sm rounded-xl bg-gradient-to-br from-violet-500/[0.02] to-transparent">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                  Telephony Carrier Diagnostics
                </CardTitle>
                <CardDescription>Live Plivo API connectivity & active credentials</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/60">
                  <span className="text-muted-foreground font-medium">Provider Service:</span>
                  <span className="font-bold text-foreground">Plivo Cloud Voice</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/60">
                  <span className="text-muted-foreground font-medium">Outbound Caller ID:</span>
                  <span className="font-mono font-bold text-foreground">{historyData.stats.fromNumber}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/60">
                  <span className="text-muted-foreground font-medium">Credit Balance:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ${historyData.stats.balance}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/60">
                  <span className="text-muted-foreground font-medium">Text-to-Speech Engine:</span>
                  <span className="font-medium text-foreground">Amazon Polly / Neutral Female</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "autonomous" && (
        <div className="space-y-6 w-full min-w-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full min-w-0">
            <div className="lg:col-span-8 min-w-0">
              <Card className="border border-border/80 shadow-sm rounded-xl overflow-hidden min-w-0">
                <CardHeader className="border-b border-border/60 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Bot className="w-5 h-5 text-violet-600" />
                        Autonomous Voice Calling Pipeline
                      </CardTitle>
                      <CardDescription>
                        Leads queued for automated voice touchpoints by the Autonomous Sales Engine.
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleRunSchedulerCycle}
                      disabled={autoRunning}
                      className="bg-violet-600 hover:bg-violet-700 text-white gap-2 font-medium shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Dispatch All Due Calls
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="w-full overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold border-b border-border">
                        <tr>
                          <th className="px-5 py-3.5">Lead / Company</th>
                          <th className="px-4 py-3.5">Phone Number</th>
                          <th className="px-4 py-3.5">Priority</th>
                          <th className="px-4 py-3.5">Scheduled Touch</th>
                          <th className="px-5 py-3.5 text-right">Instant Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {(historyData.scheduledCalls || []).length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-5 py-14 text-center text-muted-foreground">
                              <Bot className="w-9 h-9 mx-auto mb-2 opacity-30 text-violet-600" />
                              <p className="font-semibold text-foreground">No leads in the immediate voice queue</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Queue any prospect using the panel on the right.
                              </p>
                            </td>
                          </tr>
                        ) : (
                          historyData.scheduledCalls.map((lead) => (
                            <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                              <td className="px-5 py-4 font-medium">
                                <Link to={`/ase/leads/${lead.id}`} className="text-violet-600 dark:text-violet-400 hover:underline font-bold text-sm">
                                  {lead.name || lead.email}
                                </Link>
                                <div className="text-xs text-muted-foreground font-medium">{lead.company || "No company"}</div>
                              </td>

                              <td className="px-4 py-4 font-mono text-xs font-semibold">
                                {lead.phone || <span className="text-rose-500">No Phone</span>}
                              </td>

                              <td className="px-4 py-4">
                                <Badge variant="outline" className="text-xs font-semibold">
                                  P{lead.priority || 50}
                                </Badge>
                              </td>

                              <td className="px-4 py-4 text-xs font-medium">
                                {lead.next_action_time ? (
                                  new Date(lead.next_action_time) <= new Date() ? (
                                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-semibold">
                                      Ready to Call
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      {new Date(lead.next_action_time).toLocaleTimeString(undefined, {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  )
                                ) : (
                                  <span className="text-emerald-600 font-bold">Immediate</span>
                                )}
                              </td>

                              <td className="px-5 py-4 text-right">
                                <Button
                                  size="sm"
                                  onClick={() => handleTriggerAutonomousCall(lead.id)}
                                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-semibold px-3 shadow-none"
                                >
                                  <PhoneCall className="w-3.5 h-3.5" />
                                  Call Now
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-4 min-w-0">
              <Card className="border border-border/80 shadow-sm rounded-xl overflow-hidden min-w-0">
                <CardHeader className="border-b border-border/60 pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="w-4 h-4 text-violet-600" />
                    Queue Lead for Auto-Calling
                  </CardTitle>
                  <CardDescription>
                    Schedule an autonomous outbound touchpoint for any database lead.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                      Select Target Lead
                    </label>
                    <select
                      value={selectedLeadId}
                      onChange={(e) => setSelectedLeadId(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-medium"
                    >
                      <option value="">-- Choose Lead --</option>
                      {leadsList.map((lead) => (
                        <option key={lead.id} value={lead.id}>
                          {lead.name || lead.email} {lead.company ? `(${lead.company})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                      Cadence Delay
                    </label>
                    <select
                      value={autoQueueDelay}
                      onChange={(e) => setAutoQueueDelay(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-medium"
                    >
                      <option value="0">Immediate Dispatch (0 min)</option>
                      <option value="15">15 Minutes Cool-off</option>
                      <option value="60">1 Hour Delay</option>
                      <option value="120">2 Hours (Standard Multi-touch)</option>
                    </select>
                  </div>

                  <Button
                    onClick={handleQueueAutonomousCall}
                    disabled={!selectedLeadId}
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-2 h-10 font-semibold shadow-sm"
                  >
                    <Bot className="w-4 h-4" />
                    Enqueue for Autonomous Outreach
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {selectedCallDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-background border border-border/80 shadow-2xl rounded-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-border/80 flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-violet-600/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    Call Record Inspector
                    {selectedCallDetails.isAutonomous ? (
                      <Badge className="bg-violet-50 text-violet-700 border-violet-200 text-[11px] shadow-none">
                        Autonomous AI
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[11px] shadow-none">
                        Direct Call
                      </Badge>
                    )}
                    {selectedCallDetails.isAnswered ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 text-[11px] shadow-none">
                        Confirmed Answer
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-muted text-muted-foreground text-[11px] shadow-none">
                        Unanswered / Non-connected
                      </Badge>
                    )}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    Provider UUID: {selectedCallDetails.callUuid || selectedCallDetails.provider_call_uuid || "Pending Provider Dispatch"} &bull; Internal ID: #{selectedCallDetails.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCallDetails(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              {loadingDetails && (
                <div className="p-3 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 rounded-lg text-xs flex items-center gap-2">
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  Loading authoritative provider records and webhook audit log...
                </div>
              )}

              <div className="p-4 rounded-xl bg-muted/40 border border-border/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-bold text-foreground">
                      {selectedCallDetails.leadName || "Direct Callee"}
                    </h4>
                    <p className="text-xs font-mono font-medium text-muted-foreground">
                      {selectedCallDetails.to || selectedCallDetails.phone_number}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderStatusBadge(selectedCallDetails.status || selectedCallDetails.normalized_outcome || "")}
                    {renderDispositionBadge(selectedCallDetails.disposition || selectedCallDetails.business_disposition || "")}
                  </div>
                </div>

                {selectedCallDetails.leadCompany && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 opacity-60" />
                    <span>Company: <strong className="text-foreground">{selectedCallDetails.leadCompany}</strong></span>
                  </div>
                )}
              </div>

              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Authoritative Telephony Diagnostics & Metrics
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg border border-border/80 bg-background space-y-1">
                    <span className="text-muted-foreground block text-[11px]">Conversation Duration</span>
                    <span className="font-bold font-mono text-sm text-foreground">
                      {formatCallDuration(selectedCallDetails.duration ?? selectedCallDetails.duration_seconds ?? 0)}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-border/80 bg-background space-y-1">
                    <span className="text-muted-foreground block text-[11px]">Billable Duration</span>
                    <span className="font-bold font-mono text-sm text-foreground">
                      {formatCallDuration(selectedCallDetails.billable_duration_seconds ?? selectedCallDetails.duration ?? 0)}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-border/80 bg-background space-y-1">
                    <span className="text-muted-foreground block text-[11px]">Provider Cost</span>
                    <span className="font-bold font-mono text-sm text-emerald-600 dark:text-emerald-400">
                      {selectedCallDetails.cost || (selectedCallDetails.provider_cost ? `$${Number(selectedCallDetails.provider_cost).toFixed(4)}` : "Pending")}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-border/80 bg-background space-y-1">
                    <span className="text-muted-foreground block text-[11px]">Hangup Disposition</span>
                    <span className="font-mono text-foreground font-medium truncate block">
                      {selectedCallDetails.hangupCause || selectedCallDetails.hangup_cause || "Carrier Normal Clearing"}
                    </span>
                  </div>
                </div>
              </div>

              {selectedCallDetails.callback && (
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Associated Callback Lifecycle Task
                    </span>
                    <Badge variant="outline" className="border-amber-500/40 text-amber-700 text-xs">
                      {selectedCallDetails.callback.status || "REQUESTED"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">SLA Status</span>
                      <span className="font-medium text-foreground">{selectedCallDetails.callback.sla_status || "PENDING"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Requested Due At</span>
                      <span className="font-medium text-foreground">
                        {selectedCallDetails.callback.requested_at ? new Date(selectedCallDetails.callback.requested_at).toLocaleString() : "As soon as possible"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Assigned Agent</span>
                      <span className="font-medium text-foreground">{selectedCallDetails.callback.owner_name || "Autonomous Queue"}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedCallDetails.webhookEvents && selectedCallDetails.webhookEvents.length > 0 && (
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center justify-between">
                    <span>Provider Webhook Audit Trail (Deduplicated)</span>
                    <span className="text-muted-foreground text-[11px] font-mono">{selectedCallDetails.webhookEvents.length} events logged</span>
                  </h5>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedCallDetails.webhookEvents.map((evt, idx) => (
                      <div key={evt.id || idx} className="p-2.5 rounded-lg border border-border/80 bg-background text-xs flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground uppercase tracking-wide">{evt.event_type}</span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {evt.provider_status || "received"}
                            </Badge>
                          </div>
                          <span className="text-[11px] font-mono text-muted-foreground">
                            {evt.created_at ? new Date(evt.created_at).toLocaleTimeString() : ""} &bull; Fingerprint: {(evt.event_fingerprint || "").slice(0, 12)}...
                          </span>
                        </div>
                        <div className="text-right font-mono text-[11px] text-muted-foreground">
                          {evt.duration_seconds != null ? `${evt.duration_seconds}s` : ""}
                          {evt.hangup_cause ? ` &bull; ${evt.hangup_cause}` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center justify-between">
                  <span>Audio Waveform Activity</span>
                  <span className="text-emerald-600 font-mono text-[11px] font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Synthesized Polly TTS Audio
                  </span>
                </h5>
                <div className="p-4 rounded-xl border border-border/80 bg-slate-950 flex items-center justify-center gap-1 h-16">
                  {[24, 40, 16, 50, 65, 30, 80, 45, 90, 70, 35, 60, 85, 40, 75, 55, 30, 95, 60, 40, 20, 50, 35, 15].map((h, i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-gradient-to-t from-violet-500 to-cyan-400 rounded-full"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Conversation Speech Prompt
                </h5>
                <div className="p-3.5 rounded-xl border border-border/80 bg-muted/30 text-xs text-foreground leading-relaxed">
                  {selectedCallDetails.prompt || PRESET_SCRIPTS[0].text}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border/80 bg-muted/20 flex items-center justify-between gap-3">
              {selectedCallDetails.leadId ? (
                <Link
                  to={`/ase/leads/${selectedCallDetails.leadId}`}
                  className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline inline-flex items-center gap-1"
                >
                  Open Lead in CRM
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <span className="text-xs text-muted-foreground">Direct Telephony Log</span>
              )}

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCallDetails(null)}
                  className="h-9 text-xs"
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setCustomPhone(selectedCallDetails.to || selectedCallDetails.phone_number || "");
                    if (selectedCallDetails.leadName) setRecipientName(selectedCallDetails.leadName);
                    if (selectedCallDetails.leadId) setSelectedLeadId(String(selectedCallDetails.leadId));
                    setSelectedCallDetails(null);
                    setActiveTab("dialer");
                  }}
                  className="h-9 text-xs bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  Redial Callee
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
