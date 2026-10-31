import React, { useCallback, useEffect, useState } from "react";
import { Loader2, Mail, Pause, Phone, Play, ShieldCheck, Square, UserCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { useToast } from "../ui/toast";
import { cadenceApi } from "../../lib/api";
import { ENROLLMENT_META, STEP_STATUS_META, formatDue, humanize, stepLabel } from "../../lib/cadence";
import { CadenceEnrollDialog } from "./CadenceEnrollDialog";

const PAUSABLE = new Set(["ACTIVE", "NEEDS_REVIEW"]);
const RESUMABLE = new Set(["PAUSED", "NEEDS_REVIEW", "HANDOFF", "CALLBACK", "REPLIED"]);

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/60 px-3 py-2 min-w-0">
      <span className="block text-[11px] text-muted-foreground">{label}</span>
      <span className="block text-xs font-semibold text-foreground truncate" title={typeof value === "string" ? value : undefined}>{value || "—"}</span>
    </div>
  );
}

function EmailApproval({ step, timezone, busy, onApprove, onReject }) {
  const draft = step.draft || {};
  const [subject, setSubject] = useState(draft.subject || "");
  const [text, setText] = useState(draft.text || "");
  const research = draft.research || {};
  const edited = subject !== (draft.subject || "") || text !== (draft.text || "");

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20 p-3 space-y-2.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs font-semibold flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5" /> {stepLabel(step)} waiting for approval
        </span>
        <span className="text-[11px] text-muted-foreground">Sends at {formatDue(step.due_at, timezone)} or now if overdue</span>
      </div>
      {draft.needsReview && Array.isArray(draft.reviewReasons) && draft.reviewReasons.length > 0 && (
        <ul className="text-[11px] text-amber-800 dark:text-amber-300 list-disc pl-5">
          {draft.reviewReasons.map((reason) => <li key={reason}>{reason}</li>)}
        </ul>
      )}
      <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="h-8 text-xs" aria-label="Email subject" />
      <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={7} className="text-xs" aria-label="Email body" />
      <div className="text-[11px] text-muted-foreground space-y-0.5">
        <p>
          Written by {draft.generator === "ai" ? "AI from verified research" : "a conservative template"} · research {research.qualityStatus || "none"}
          {research.researchedAt ? ` · researched ${formatDue(research.researchedAt)}` : ""}
        </p>
        {Array.isArray(research.sources) && research.sources.length > 0 && (
          <p className="truncate">
            Sources:{" "}
            {research.sources.map((source, index) => (
              <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                {index ? ", " : ""}{source.title || source.url}
              </a>
            ))}
          </p>
        )}
      </div>
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="outline" disabled={busy} onClick={() => onReject(step)}>Reject</Button>
        <Button size="sm" disabled={busy || !subject.trim() || !text.trim()} onClick={() => onApprove(step, edited ? { subject, text } : {})}>
          {edited ? "Save & approve" : "Approve & send"}
        </Button>
      </div>
    </div>
  );
}

function ReviewDecision({ step, busy, onDecide }) {
  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20 p-3 space-y-2">
      <p className="text-xs font-semibold flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Human review: {step.decision_reason || "Decide how to continue"}</p>
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" disabled={busy} onClick={() => onDecide(step, "CONTINUE")}>Continue cadence</Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => onDecide(step, "HANDOFF")}>Hand to rep</Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => onDecide(step, "CLOSE")}>Close to nurture</Button>
        <Button size="sm" variant="outline" className="text-red-600" disabled={busy} onClick={() => onDecide(step, "STOP")}>Stop</Button>
      </div>
    </div>
  );
}

export default function LeadCadenceCard({ lead, onUpdated }) {
  const { success, error: toastError } = useToast();
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const leadId = Number(lead?.id);

  const load = useCallback(async () => {
    if (!leadId) return;
    try {
      const res = await cadenceApi.getLead(leadId);
      setState(res?.data || null);
    } catch {
      setState(null);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, [load]);

  const run = async (label, fn) => {
    setBusy(true);
    try {
      await fn();
      success(label);
      await load();
      onUpdated?.();
    } catch (err) {
      const issues = err?.payload?.details?.issues;
      toastError("Action failed", Array.isArray(issues) && issues.length ? issues.map((i) => i.message || i.code || i).join("; ") : err.message);
    } finally {
      setBusy(false);
    }
  };

  const enrollment = state?.enrollment;
  const timezone = state?.timezone;
  const steps = state?.steps || [];
  const status = enrollment?.status;
  const meta = ENROLLMENT_META[status];
  const pendingEmails = steps.filter((s) => s.action === "EMAIL" && s.status === "PENDING_APPROVAL");
  const pendingReview = steps.find((s) => s.action === "HUMAN_REVIEW" && s.status === "PENDING_APPROVAL");

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="w-4 h-4 text-violet-600" /> Smart call cadence
              {meta && <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${meta.tone}`}>{meta.label}</span>}
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              {enrollment
                ? `${humanize(enrollment.stage)} · ${state?.policy?.name || "Default policy"} · lead timezone ${timezone}`
                : "Call first, retry once, then a truthful missed-call email and a Day 3–17 follow-up plan."}
            </CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(!enrollment || !state?.open) && (
              <Button size="sm" disabled={busy || !lead?.phone || lead?.do_not_contact} onClick={() => setEnrollOpen(true)}>
                <Play className="w-3.5 h-3.5" /> {enrollment ? "Start new cadence" : "Start cadence"}
              </Button>
            )}
            {state?.open && PAUSABLE.has(status) && (
              <Button size="sm" variant="outline" disabled={busy} onClick={() => run("Cadence paused", () => cadenceApi.pause(leadId, "Paused from lead profile"))}>
                <Pause className="w-3.5 h-3.5" /> Pause
              </Button>
            )}
            {state?.open && RESUMABLE.has(status) && (
              <Button size="sm" variant="outline" disabled={busy} onClick={() => run("Cadence resumed", () => cadenceApi.resume(leadId, "Resumed from lead profile"))}>
                <Play className="w-3.5 h-3.5" /> Resume
              </Button>
            )}
            {state?.open && (
              <Button size="sm" variant="outline" className="text-red-600" disabled={busy} onClick={() => run("Cadence stopped", () => cadenceApi.stop(leadId, "Stopped from lead profile"))}>
                <Square className="w-3.5 h-3.5" /> Stop
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}

        {enrollment && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <Stat label="Next step" value={state?.nextStep ? `${stepLabel(state.nextStep)} · ${formatDue(state.nextStep.due_at, timezone)}` : "None scheduled"} />
            <Stat label="Call attempts" value={String(enrollment.call_attempts ?? 0)} />
            <Stat label="Emails sent" value={String(enrollment.email_attempts ?? 0)} />
            <Stat label="Latest outcome" value={humanize(enrollment.latest_outcome)} />
            <Stat label="Reason" value={enrollment.status_reason} />
          </div>
        )}

        {pendingEmails.map((step) => (
          <EmailApproval
            key={`${step.id}-${step.updated_at}`}
            step={step}
            timezone={timezone}
            busy={busy}
            onApprove={(s, edits) => run("Email approved", () => cadenceApi.approveStep(s.id, edits))}
            onReject={(s) => run("Email rejected", () => cadenceApi.rejectStep(s.id, "Rejected from lead profile"))}
          />
        ))}

        {pendingReview && (
          <ReviewDecision step={pendingReview} busy={busy} onDecide={(s, decision) => run("Review saved", () => cadenceApi.resolveReview(s.id, decision))} />
        )}

        {steps.length > 0 && (
          <ol className="relative border-l border-border/70 ml-1.5 space-y-2.5">
            {steps.map((step) => (
              <li key={step.id} className="pl-4">
                <span className={`absolute -left-[5px] mt-1.5 w-2.5 h-2.5 rounded-full ${step.status === "DONE" ? "bg-emerald-500" : step.status === "FAILED" ? "bg-red-500" : ["CANCELLED", "SKIPPED"].includes(step.status) ? "bg-slate-300" : "bg-violet-500"}`} />
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-semibold">{stepLabel(step)}</span>
                  <span className="text-muted-foreground">{STEP_STATUS_META[step.status] || humanize(step.status)}</span>
                  {step.channel_state && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono">{step.channel_state}</span>}
                  <span className="text-muted-foreground">{formatDue(step.completed_at || step.due_at, timezone)}</span>
                  {step.approved_by && <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"><UserCheck className="w-3 h-3" /> approved</span>}
                </div>
                {step.decision_reason && <p className="text-[11px] text-muted-foreground">{step.decision_reason}</p>}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
      <CadenceEnrollDialog lead={lead} open={enrollOpen} onOpenChange={setEnrollOpen} onEnrolled={() => { load(); onUpdated?.(); }} />
    </Card>
  );
}
