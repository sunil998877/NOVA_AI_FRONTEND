import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Phone,
  Mail,
  Clock,
  Flame,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Calendar,
  User,
  Activity,
  Send,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { useToast } from "../../components/ui/toast";
import { aseService } from "../../services/ase.service";

const STEP_TOUCH_DESCRIPTIONS = {
  1: "Step 1 • In-Thread Follow-Up",
  2: "Step 2 • Value Insight & Benchmark",
  3: "Step 3 • Objection Handling & Case Study",
  4: "Step 4 • Personalized Solution Concept",
  5: "Step 5 • Final Polite Check-In",
};

function getEventBorder(type) {
  const t = String(type || "").toUpperCase();
  if (t.includes("BLOCKED") || t.includes("FAILED") || t.includes("BREACHED") || t.includes("STOPPED")) {
    return "border-rose-500/80";
  }
  if (t.includes("PAUSED") || t.includes("AMBIGUOUS")) {
    return "border-amber-500/80";
  }
  if (t.includes("RESUMED") || t.includes("SENT") || t.includes("OPENED") || t.includes("CLICKED") || t.includes("COMPLETED")) {
    return "border-emerald-500/80";
  }
  return "border-primary/50";
}

function formatEventTitle(type, p) {
  const t = String(type || "");
  if (t === "FOLLOW_UP_BLOCKED") return "Follow-Up Blocked";
  if (t === "FOLLOW_UP_RESUMED") return "Follow-Up Resumed";
  if (t === "FOLLOW_UP_SENT") return `Follow-Up Step ${p?.stepNumber || 1} Sent`;
  if (t === "FOLLOW_UP_PAUSED") return "Sequence Paused";
  if (t === "FOLLOW_UP_SCHEDULED") return "Follow-Up Scheduled";
  if (t === "FOLLOW_UP_STOPPED") return "Sequence Stopped";
  if (t === "EMAIL_SENT") return "Outreach Email Sent";
  if (t === "EMAIL_OPENED") return "Email Opened";
  if (t === "EMAIL_CLICKED") return "Email Link Clicked";
  if (t === "EMAIL_DRAFTED") return "Email Drafted";
  if (t === "CallbackSlaBreached") return "Callback SLA Breached";
  if (t === "VOICE_CALL") return "Outbound Call";
  return t.replace(/_/g, " ");
}

function formatStatusText(type, p) {
  const t = String(type || "").toUpperCase();
  if (t === "FOLLOW_UP_BLOCKED") return "BLOCKED";
  if (t === "FOLLOW_UP_RESUMED") return "ACTIVE";
  if (t === "FOLLOW_UP_SENT") return "SENT";
  if (t === "FOLLOW_UP_PAUSED") return "PAUSED";
  if (t === "FOLLOW_UP_SCHEDULED") return "SCHEDULED";
  if (t === "CallbackSlaBreached") return "OVERDUE";
  if (p?.status) return String(p.status).toUpperCase();
  return null;
}

function renderTimelineEventCard(ev) {
  let p = ev.payload;
  if (typeof p === "string") {
    try {
      p = JSON.parse(p);
    } catch {
      p = { reason: p };
    }
  }
  if (!p || typeof p !== "object") {
    p = p ? { details: String(p) } : {};
  }

  const stepDesc = p.stepNumber ? (STEP_TOUCH_DESCRIPTIONS[p.stepNumber] || `Follow-Up Touch ${p.stepNumber}`) : null;
  const reasonText = p.reason ? String(p.reason).replace(/_/g, " ") : null;
  const channel = ev.channel || (String(ev.event_type || "").includes("EMAIL") || String(ev.event_type || "").includes("FOLLOW_UP") ? "EMAIL" : "SYSTEM");
  const statusBadge = formatStatusText(ev.event_type, p);

  return (
    <div key={ev.id} className={`text-xs border-l-2 ${getEventBorder(ev.event_type)} pl-3 py-1.5 transition-all`}>
      <div className="flex items-center justify-between text-[11px] mb-1">
        <div className="flex items-center gap-1.5 font-bold text-foreground">
          <span>{formatEventTitle(ev.event_type, p)}</span>
        </div>
        <span className="text-[10px] text-muted-foreground font-mono">
          {new Date(ev.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
      </div>

      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-1.5">
        <span className="flex items-center gap-1 font-semibold uppercase tracking-wider text-muted-foreground/80">
          {channel === "EMAIL" ? <Send className="w-2.5 h-2.5" /> : channel === "VOICE" ? <Phone className="w-2.5 h-2.5" /> : <Activity className="w-2.5 h-2.5" />}
          {channel}
        </span>
        {statusBadge && (
          <>
            <span>•</span>
            <span className="font-semibold text-foreground/90">Status: {statusBadge}</span>
          </>
        )}
      </div>

      <div className="rounded-md border border-border/60 bg-muted/30 p-2 text-[11px] space-y-1.5">
        {stepDesc && (
          <div className="flex items-center justify-between font-semibold text-foreground pb-1 border-b border-border/40">
            <div className="flex items-center gap-1.5 text-primary">
              <Mail className="w-3.5 h-3.5" />
              <span>{stepDesc}</span>
            </div>
            {p.mode && (
              <Badge variant="outline" className="text-[9px] uppercase font-mono px-1.5 py-0">
                {p.mode === "REPLY_THREAD" ? "In-Thread Reply" : "New Thread"}
              </Badge>
            )}
          </div>
        )}

        {p.subject && (
          <div className="flex items-start gap-1">
            <span className="text-muted-foreground font-medium shrink-0">Subject:</span>
            <span className="font-semibold text-foreground">"{p.subject}"</span>
          </div>
        )}

        {reasonText && (
          <div className="flex items-start gap-1">
            <span className="text-muted-foreground font-medium shrink-0">Reason:</span>
            <span className="font-medium text-foreground capitalize">{reasonText}</span>
          </div>
        )}

        {p.resumedBy && (
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground font-medium">Resumed by:</span>
            <span className="font-mono text-primary font-medium">{p.resumedBy}</span>
          </div>
        )}

        {p.notes && !reasonText && (
          <div className="text-muted-foreground leading-relaxed">{p.notes}</div>
        )}

        {p.template && (
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Template:</span>
            <Badge variant="outline" className="text-[9px] font-mono">{p.template}</Badge>
          </div>
        )}

        {p.details && (
          <div className="text-muted-foreground font-mono text-[10px]">{p.details}</div>
        )}

        {(p.taskId || p.enrollmentId || p.stepNumber) && (
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono pt-1 border-t border-border/30">
            {p.taskId && <span>Task #{p.taskId}</span>}
            {p.taskId && p.enrollmentId && <span>•</span>}
            {p.enrollmentId && <span>Enrollment #{p.enrollmentId}</span>}
            {p.stepNumber && !p.taskId && !p.enrollmentId && <span>Step {p.stepNumber}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AseTeamConsole() {
  const [callbacks, setCallbacks] = useState([]);
  const [selectedCallback, setSelectedCallback] = useState(null);
  const [leadDetail, setLeadDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionNotes, setActionNotes] = useState("");
  const { success, error: toastError } = useToast();

  useEffect(() => {
    fetchQueue();
  }, []);

  async function fetchQueue() {
    setLoading(true);
    try {
      const res = await aseService.getCallbacks();
      const items = res.items || [];
      setCallbacks(items);
      if (items.length > 0) {
        selectCallbackItem(items[0]);
      } else {
        setSelectedCallback(null);
        setLeadDetail(null);
      }
    } catch (err) {
      toastError("Load Error", err.message || "Could not load the team console.");
      setCallbacks([]);
    } finally {
      setLoading(false);
    }
  }

  async function selectCallbackItem(cb) {
    setSelectedCallback(cb);
    try {
      const l = await aseService.getLead(cb.lead_id);
      setLeadDetail(l);
    } catch (_) {}
  }

  const handleDisposition = async (disposition, status) => {
    if (!selectedCallback) return;
    try {
      await aseService.updateCallback(selectedCallback.id, {
        status: "COMPLETED",
        notes: actionNotes,
        leadDisposition: disposition,
        leadStatus: status,
      });
      success("Logged", `Lead disposition saved as ${disposition}`);
      setActionNotes("");
      fetchQueue();
    } catch (err) {
      toastError("Error", err.message);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full min-w-0 h-[calc(100vh-120px)] min-h-[600px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Salesperson Team Console</h1>
          <p className="text-xs text-muted-foreground">
            Unified human rep cockpit: full lead context, timeline, and recommended next action in one view.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/ase/callbacks">View All Callbacks</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 min-h-0">
        <Card className="md:col-span-3 flex flex-col min-h-0">
          <CardHeader className="py-3 px-4 border-b">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Handoff Queue</span>
              <Badge variant="outline">{callbacks.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 flex-1 overflow-y-auto space-y-2">
            {loading ? (
              <p className="p-3 text-xs text-muted-foreground">Loading the handoff queue…</p>
            ) : callbacks.length === 0 ? (
              <p className="p-3 text-xs text-muted-foreground">
                No leads are waiting for a salesperson. Interested leads and scheduled callbacks appear here.
              </p>
            ) : null}
            {callbacks.map((cb) => {
              const isSelected = selectedCallback?.id === cb.id;
              const isOverdue = cb.status === "OVERDUE";
              return (
                <div
                  key={cb.id}
                  onClick={() => selectCallbackItem(cb)}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : isOverdue
                      ? "border-rose-300 bg-rose-50/20"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs truncate">{cb.lead_name}</span>
                    {isOverdue && (
                      <span className="text-[10px] text-rose-600 font-bold">OVERDUE</span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">{cb.lead_company}</div>
                  <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Due: {cb.due_at ? new Date(cb.due_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Unscheduled"}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="md:col-span-6 flex flex-col min-h-0">
          <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">
                {selectedCallback?.lead_name || "Select a Lead"}
              </CardTitle>
              <CardDescription className="text-xs">
                {selectedCallback?.lead_company} • {selectedCallback?.lead_phone}
              </CardDescription>
            </div>
            {leadDetail?.lead && (
              <Badge variant="secondary">{leadDetail.lead.status}</Badge>
            )}
          </CardHeader>
          <CardContent className="p-4 flex-1 overflow-y-auto space-y-4">
            {selectedCallback?.notes && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-lg text-xs">
                <span className="font-bold text-amber-800 dark:text-amber-300 block mb-1">
                  Reason for Handoff:
                </span>
                {selectedCallback.notes}
              </div>
            )}

            <div>
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Timeline & Past Touches
              </h4>
              <div className="space-y-3">
                {leadDetail?.timeline && leadDetail.timeline.length > 0 ? (
                  leadDetail.timeline.map((ev) => renderTimelineEventCard(ev))
                ) : (
                  <p className="text-xs text-muted-foreground italic py-2">No interactions recorded yet.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 flex flex-col min-h-0">
          <CardHeader className="py-3 px-4 border-b">
            <CardTitle className="text-sm font-semibold">Rep Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 overflow-y-auto space-y-4">
            <div className="p-3 rounded-lg border bg-primary/5 border-primary/30">
              <span className="text-[10px] font-bold text-primary block mb-1">
                RECOMMENDED ACTION
              </span>
              <p className="text-xs font-semibold">
                {{
                  EMAIL: "Send follow-up email",
                  CALL: "Place a voice call",
                  REP_CALLBACK: "Call the prospect back",
                  WAIT: "Wait before the next touch",
                }[leadDetail?.lead?.next_action] || leadDetail?.lead?.next_action || "Review this lead"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {leadDetail?.lead?.next_action === "REP_CALLBACK"
                  ? "Hot prospect requested a phone callback. Aim to qualify within 30 minutes."
                  : leadDetail?.lead?.next_action === "CALL"
                    ? "Place the scheduled voice call when the window opens."
                    : leadDetail?.lead?.next_action === "EMAIL"
                      ? "Send the next outreach email for this lead."
                      : "Review the timeline before taking the next step."}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Call Notes</label>
              <Input
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Log notes from conversation..."
                className="text-xs"
              />
            </div>

            <div className="space-y-2 pt-2">
              <Button
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => handleDisposition("interested", "INTERESTED")}
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-emerald-500" /> Mark Qualified / Interested
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start text-xs"
                onClick={() => handleDisposition("closed_won", "CLOSED_WON")}
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-green-600" /> Mark Deal Won
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start text-xs"
                onClick={() => handleDisposition("not_interested", "CLOSED_LOST")}
              >
                <XCircle className="w-3.5 h-3.5 mr-2 text-slate-500" /> Mark Not Interested
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="w-full justify-start text-xs"
                onClick={() => handleDisposition("dnc", "SUPPRESSED_DNC")}
              >
                <ShieldAlert className="w-3.5 h-3.5 mr-2" /> Mark DNC / Suppress
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
