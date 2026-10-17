import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Edit2,
  Activity,
  Calendar,
  Building,
  MapPin,
  Send,
  Sparkles,
  Bot,
  PhoneCall,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { useToast } from "../../components/ui/toast";
import { aseService } from "../../services/ase.service";
import { voiceApi } from "../../lib/api";
import { useAuth } from "../../lib/AuthContext";

export default function AseLeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [data, setData] = useState(null);
  const [brainDecision, setBrainDecision] = useState(null);
  const [teamReps, setTeamReps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchLead();
    aseService.getTeamReps().then(setTeamReps).catch(() => { });
  }, [id]);

  useEffect(() => {
    const status = data?.lead?.metadata?.outreach_status;
    const hasEmail = Boolean(data?.lead?.metadata?.outreach_email?.subject);
    if (status !== "writing" || hasEmail) return undefined;
    const timer = setInterval(async () => {
      try {
        const res = await aseService.getLead(id);
        setData(res);
      } catch {}
    }, 3000);
    return () => clearInterval(timer);
  }, [id, data?.lead?.metadata?.outreach_status, data?.lead?.metadata?.outreach_email?.subject]);

  async function fetchLead() {
    setLoading(true);
    try {
      const res = await aseService.getLead(id);
      setData(res);
      aseService.getLeadDecision(id).then((dRes) => setBrainDecision(dRes?.decision || null)).catch(() => { });
    } catch (err) {
      toastError("Error", "Could not load lead detail");
    } finally {
      setLoading(false);
    }
  }

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
      await aseService.executeAction(id);
      success("Action Executed", "Next action has been executed successfully.");
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


  if (loading || !data?.lead) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Activity className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const { lead, timeline = [] } = data;
  const counters = lead.attempt_counters || { email: 0, voice: 0, total: 0 };

  return (
    <div className="flex flex-col gap-5 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between pb-1 border-b border-border/60">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2 h-8 text-xs">
          <Link to="/ase/leads">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Leads
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={lead.do_not_contact ? "secondary" : "destructive"}
            className="h-8 text-xs gap-1.5"
            disabled={updating}
            onClick={handleDncToggle}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            {lead.do_not_contact ? "Remove DNC" : "Suppress DNC"}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-foreground whitespace-nowrap">
              {lead.name}
            </h1>
            <Badge variant="outline" className="font-mono text-xs px-2.5 py-0.5 whitespace-nowrap border-border bg-muted/40">
              P-{lead.priority}
            </Badge>
            <Badge variant="secondary" className="text-xs px-2.5 py-0.5 font-medium whitespace-nowrap">
              {lead.status}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            {lead.company && (
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Building className="w-3.5 h-3.5 text-muted-foreground" />
                {lead.company}
              </span>
            )}
            {lead.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                {lead.email}
              </span>
            )}
            {lead.phone && (
              <span className="flex items-center gap-1.5 font-mono">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                {lead.phone}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap xl:flex-nowrap">
          {lead.phone && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-9 px-3.5 shadow-sm whitespace-nowrap"
                disabled={updating || lead.do_not_contact}
                onClick={handleQuickCall}
              >
                <Phone className="w-3.5 h-3.5" />
                Call Lead (Plivo)
              </Button>
              <Button
                size="sm"
                className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5 h-9 px-3.5 shadow-sm whitespace-nowrap"
                disabled={updating || lead.do_not_contact}
                onClick={handleAutonomousCall}
              >
                <Bot className="w-3.5 h-3.5" />
                Autonomous Call
              </Button>
            </div>
          )}

          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs px-2.5 hover:bg-background whitespace-nowrap"
              disabled={updating}
              onClick={() => handleStateChange("INTERESTED")}
            >
              Mark Interested
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs px-2.5 hover:bg-background whitespace-nowrap"
              disabled={updating}
              onClick={() => handleStateChange("CLOSED_WON")}
            >
              Mark Won
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs px-2.5 hover:bg-background whitespace-nowrap text-rose-600 dark:text-rose-400"
              disabled={updating}
              onClick={() => handleStateChange("CLOSED_LOST")}
            >
              Mark Lost
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lead Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">Email</span>
                  <span className="font-medium">{lead.email}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Phone</span>
                  <span className="font-medium">{lead.phone || "-"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Company</span>
                  <span className="font-medium">{lead.company || "-"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Source</span>
                  <Badge variant="outline">{lead.source}</Badge>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Assigned Rep</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <select
                      className="text-xs font-medium bg-background border border-input rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                      value={lead.assigned_rep_id || ""}
                      onChange={(e) => handleRepAssign(e.target.value ? Number(e.target.value) : null)}
                      disabled={updating}
                    >
                      <option value="">Unassigned</option>
                      {teamReps.map((rep) => (
                        <option key={rep.id} value={rep.id}>
                          {rep.fullName} {rep.role ? `(${rep.role})` : ""}
                        </option>
                      ))}
                    </select>
                    {user?.id && lead.assigned_rep_id !== user.id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-[11px] h-7 px-2 text-primary hover:bg-primary/10"
                        onClick={() => handleRepAssign(user.id)}
                        disabled={updating}
                        title="Assign to myself"
                      >
                        Claim
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Attempts</span>
                  <span className="font-medium">✉ {counters.email} • 📞 {counters.voice}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {lead.metadata?.outreach_status === "writing" && !lead.metadata?.outreach_email?.subject && (
            <Card>
              <CardContent className="py-4 text-sm text-muted-foreground">
                Company research and the professional email are being written. This page will update when they are ready.
              </CardContent>
            </Card>
          )}

          {lead.metadata?.company_research && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2 text-primary">
                    <Sparkles className="w-4 h-4 text-primary" />
                    AI Company Intelligence
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {lead.metadata.company_research.source || "ai_analyzed"}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Target organization researched prior to email drafting & dispatch.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-muted-foreground block text-[11px]">Executive Summary</span>
                  <p className="mt-0.5 text-foreground/90">{lead.metadata.company_research.summary}</p>
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
              </CardContent>
            </Card>
          )}

          {lead.metadata?.outreach_email?.subject && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    Professional email
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px]">Written from company research</Badge>
                </div>
                <CardDescription className="text-sm font-medium text-foreground">
                  {lead.metadata.outreach_email.subject}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                  {lead.metadata.outreach_email.text}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Unified Interaction Timeline ({timeline.length} events)
              </CardTitle>
              <CardDescription>
                Chronological audit record of every email, voice call, outcome, and rep action.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeline.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4">No events logged yet.</p>
                ) : (
                  timeline.map((ev) => {
                    const p = ev.payload || {};
                    let title = ev.event_type;
                    let description = null;
                    let statusBadge = null;

                    if (ev.event_type === "ActionScheduled") {
                      title = `Outreach Scheduled (${p.action || ev.channel || "EMAIL"})`;
                      description = p.scheduled_for ? `Queued for dispatch at ${new Date(p.scheduled_for).toLocaleTimeString()}` : "Queued by the Autonomous Engine";
                    } else if (ev.event_type === "ActionDispatched") {
                      title = `Outreach Dispatched (${p.action || ev.channel || "EMAIL"})`;
                      description = `Sent via ${ev.channel || "EMAIL"} channel to prospect`;
                    } else if (ev.event_type === "ActionCompleted" || ev.event_type === "EMAIL_SENT") {
                      title = `Outreach Delivered Successfully`;
                      description = p.subject ? `Subject: "${p.subject}"` : `Delivered to recipient inbox`;
                      statusBadge = <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px]">Success</Badge>;
                    } else if (ev.event_type === "ActionFailed" || ev.event_type === "EMAIL_FAILED") {
                      title = `Outreach Attempt Failed`;
                      description = p.error || p.reason || "Action was blocked or rejected by mail server";
                      statusBadge = <Badge variant="destructive" className="text-[10px]">Failed</Badge>;
                    } else if (ev.event_type === "LeadStateChanged") {
                      title = `Lead Status Updated`;
                      description = p.from_state && p.to_state ? `Moved from ${p.from_state} to ${p.to_state}` : "Lifecycle state changed";
                    } else if (ev.event_type === "EMAIL_DRAFTED") {
                      title = "Professional email written";
                      description = p.subject ? `Subject: "${p.subject}"` : "Drafted from the company analysis";
                    } else if (ev.event_type === "COMPANY_RESEARCHED") {
                      title = `AI Company Research Completed`;
                      description = p.summary || `Researched corporate profile for ${p.company || "lead"}`;
                    } else if (ev.event_type === "ORCHESTRATOR_DECISION" || ev.event_type === "DECISION_EVALUATED") {
                      title = `NOVA Brain Decision (${p.action || "NONE"})`;
                      description = p.reasonSummary || (p.nextAction ? `Next action: ${p.nextAction}` : "Evaluated lead progression rules");
                      if (p.isAssistedByMl) {
                        statusBadge = <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px]">ML {Math.round((p.confidence || 0) * 100)}%</Badge>;
                      } else {
                        statusBadge = <Badge variant="outline" className="text-[10px]">Rules Baseline</Badge>;
                      }
                    } else if (ev.event_type === "ACTION_BLOCKED_BY_COMPLIANCE") {
                      title = `Blocked by Compliance Guard`;
                      description = p.reason || "Dispatch withheld by safety rules";
                      statusBadge = <Badge variant="destructive" className="text-[10px]">Blocked</Badge>;
                    }

                    return (
                      <div key={ev.id} className="flex items-start gap-3 border-l-2 border-primary/30 pl-4 py-2 text-xs">
                        <div className="min-w-[125px] text-[11px] text-muted-foreground pt-0.5">
                          {new Date(ev.created_at).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-foreground text-xs">{title}</span>
                            <Badge variant="outline" className="text-[10px] px-1 py-0">
                              {ev.channel}
                            </Badge>
                            {statusBadge}
                          </div>
                          {description && (
                            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
                          )}
                          {(p.eventId || p.correlationId || p.error) && (
                            <details className="text-[10px] text-muted-foreground cursor-pointer pt-0.5">
                              <summary className="hover:text-foreground">Technical Log Details</summary>
                              <div className="mt-1 p-2 bg-muted/60 rounded font-mono text-[10px] overflow-x-auto space-y-0.5">
                                {p.eventId && <div>Event ID: {p.eventId}</div>}
                                {p.correlationId && <div>Correlation: {p.correlationId}</div>}
                                {p.error && <div className="text-destructive font-semibold">Error: {p.error}</div>}
                                {p.reason && <div>Reason: {p.reason}</div>}
                              </div>
                            </details>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-primary/50 shadow-sm bg-primary/5">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="default" className="text-[10px]">RECOMMENDED NEXT ACTION</Badge>
                {brainDecision?.isAssistedByMl ? (
                  <Badge variant="secondary" className="text-[10px] bg-primary/20 text-primary">ML-Assisted</Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px]">Rules Engine</Badge>
                )}
              </div>
              <CardTitle className="text-lg mt-2">
                {brainDecision?.action || lead.next_action || "Awaiting Evaluation"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {brainDecision?.explanation || "Determined by 24/7 Autonomous Engine based on cadence, working hours, and previous responses."}
              </p>
              {brainDecision?.reasonCodes && brainDecision.reasonCodes.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {brainDecision.reasonCodes.map((code, idx) => (
                    <Badge key={idx} variant="outline" className="text-[9px] font-mono py-0 px-1">
                      {code}
                    </Badge>
                  ))}
                </div>
              )}
              {brainDecision?.conversionPrediction && (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
                  <span className="text-muted-foreground">14-Day Conversion Prob:</span>
                  <Badge variant="outline" className="font-mono text-primary font-semibold">
                    {(brainDecision.conversionPrediction.probability * 100).toFixed(1)}%
                  </Badge>
                </div>
              )}
              {lead.next_action_time && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <Clock className="w-3.5 h-3.5" />
                  Scheduled: {new Date(lead.next_action_time).toLocaleString()}
                </div>
              )}
              <div className="flex items-center gap-2 pt-2">
                <Button
                  size="sm"
                  className="w-full"
                  disabled={updating || lead.do_not_contact}
                  onClick={handleExecuteNow}
                >
                  {updating ? "Executing..." : "Execute Now"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Channel Consents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span>Email Outreach:</span>
                <Badge variant={lead.email_consent?.status === "DENIED" ? "destructive" : "secondary"}>
                  {lead.email_consent?.status || "GRANTED"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>AI Voice Bot:</span>
                <Badge variant={lead.voice_consent?.status === "DENIED" ? "destructive" : "secondary"}>
                  {lead.voice_consent?.status || "GRANTED"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Do Not Contact (DNC):</span>
                <Badge variant={lead.do_not_contact ? "destructive" : "outline"}>
                  {lead.do_not_contact ? "BLOCKED" : "CLEAR"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
