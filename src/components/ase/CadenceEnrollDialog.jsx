import React, { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, ShieldOff } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { useToast } from "../ui/toast";
import { cadenceApi } from "../../lib/api";
import { ELIGIBILITY_META, formatDue, formatWindow, planLines } from "../../lib/cadence";

const ICONS = { ELIGIBLE: CheckCircle2, NEEDS_REVIEW: AlertTriangle, SUPPRESSED: ShieldOff };

export function CadenceEnrollDialog({ lead, open, onOpenChange, onEnrolled }) {
  const { success, error: toastError } = useToast();
  const [state, setState] = useState({ loading: false, data: null, error: null });
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const leadId = Number(lead?.id);

  useEffect(() => {
    if (!open || !leadId) return undefined;
    let cancelled = false;
    setConfirmed(false);
    setState({ loading: true, data: null, error: null });
    cadenceApi.getEligibility(leadId)
      .then((res) => !cancelled && setState({ loading: false, data: res?.data || null, error: null }))
      .catch((err) => !cancelled && setState({ loading: false, data: null, error: err.message || "Could not check eligibility" }));
    return () => {
      cancelled = true;
    };
  }, [open, leadId]);

  const eligibility = state.data?.eligibility;
  const result = eligibility?.result || "ELIGIBLE";
  const alreadyEnrolled = eligibility?.reasons?.some((r) => r.code === "ALREADY_ENROLLED");
  const meta = ELIGIBILITY_META[result] || ELIGIBILITY_META.ELIGIBLE;
  const Icon = ICONS[result] || CheckCircle2;
  const needsConfirm = result === "NEEDS_REVIEW" && !alreadyEnrolled;
  const canSubmit = Boolean(state.data) && result !== "SUPPRESSED" && !alreadyEnrolled && (!needsConfirm || confirmed) && !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await cadenceApi.enroll(leadId, { startNow: true, confirmReview: needsConfirm && confirmed });
      const data = res?.data || {};
      if (!data.enrolled) {
        toastError("Not started", data.reason === "ALREADY_ENROLLED" ? "This lead already has an open cadence." : data.reason || "Cadence was not started.");
        return;
      }
      const first = data.steps?.[0];
      const dueNow = first && new Date(first.due_at).getTime() <= Date.now() + 60000;
      success(
        "Cadence started",
        dueNow
          ? `AI is calling ${lead?.name || "the lead"} now.`
          : `First touch scheduled for ${formatDue(first?.due_at, state.data?.timezone)} (next allowed window in the lead's timezone).`
      );
      onOpenChange(false);
      onEnrolled?.(data);
    } catch (err) {
      const payload = err?.payload?.data;
      if (payload?.requiresConfirmation) {
        toastError("Confirmation needed", "Review the reasons and tick the confirmation box.");
      } else {
        toastError("Could not start cadence", err.message || "Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent className="max-w-lg" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Start smart cadence</DialogTitle>
          <DialogDescription>
            {lead?.name || lead?.email} {lead?.company ? `· ${lead.company}` : ""}
          </DialogDescription>
        </DialogHeader>

        {state.loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" /> Checking consent, suppression and phone…
          </div>
        )}
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        {state.data && (
          <div className="space-y-4 text-sm">
            <div className={`rounded-lg border px-3 py-2.5 ${meta.tone}`}>
              <div className="flex items-center gap-2 font-semibold">
                <Icon className="w-4 h-4" /> {alreadyEnrolled ? "Already in a cadence" : meta.label}
              </div>
              {eligibility.reasons?.length > 0 && (
                <ul className="mt-1.5 space-y-0.5 text-xs list-disc pl-5">
                  {eligibility.reasons.map((reason) => (
                    <li key={`${reason.code}-${reason.channel || ""}`}>{reason.message}</li>
                  ))}
                </ul>
              )}
              <p className="mt-1.5 text-[11px] opacity-80">
                Calls: {eligibility.channels?.call ? "allowed" : "blocked"} · Email: {eligibility.channels?.email ? "allowed" : "blocked"} · Voice consent {eligibility.consent?.voice} · Email consent {eligibility.consent?.email}
              </p>
            </div>

            {result !== "SUPPRESSED" && !alreadyEnrolled && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                  Plan · {state.data.policy?.name} · calls {formatWindow(state.data.preview?.callingWindow)} ({state.data.timezone})
                </p>
                <ol className="space-y-1 text-xs list-decimal pl-5 text-foreground/90">
                  {planLines(state.data.preview).map((line) => <li key={line}>{line}</li>)}
                </ol>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  A reply, opt-out, bounce or answered call stops or changes the remaining steps automatically.
                </p>
              </div>
            )}

            {needsConfirm && (
              <label className="flex items-start gap-2 text-xs cursor-pointer">
                <input type="checkbox" className="mt-0.5" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
                I reviewed the reasons above and want to start the cadence anyway.
              </label>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
            Start cadence
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CadenceEnrollDialog;
