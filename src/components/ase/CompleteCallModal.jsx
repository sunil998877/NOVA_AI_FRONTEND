import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { useToast } from "../ui/toast";
import { Phone, Building2, User, Calendar, Loader2, CheckCircle2 } from "lucide-react";
import { aseService } from "../../services/ase.service";

const OUTCOME_OPTIONS = [
  { value: "connected_interested", label: "Connected — Interested" },
  { value: "qualified", label: "Connected — Qualified Opportunity" },
  { value: "callback_requested", label: "Connected — Callback Requested" },
  { value: "human_handoff", label: "Connected — Human Handoff Required" },
  { value: "connected_not_interested", label: "Connected — Not Interested" },
  { value: "no_answer", label: "No Answer" },
  { value: "busy", label: "Line Busy" },
  { value: "invalid_number", label: "Invalid / Disconnected Number" },
];

export function CompleteCallModal({ callback, isOpen, onClose, onSuccess }) {
  const { success, error: toastError } = useToast();
  const [outcome, setOutcome] = useState("connected_interested");
  const [notes, setNotes] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const callbackId = Number(callback?.id);
  if (!callback || !Number.isFinite(callbackId) || callbackId <= 0) return null;

  const requiresReschedule = outcome === "callback_requested";

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!outcome) {
      toastError("Validation Error", "Please select a call outcome.");
      return;
    }

    if (requiresReschedule && !rescheduleDate) {
      toastError("Validation Error", "Please choose a future date & time for the next callback.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        status: "COMPLETED",
        leadDisposition: outcome,
        notes: notes.trim() || undefined,
        nextCallbackDue: requiresReschedule ? new Date(rescheduleDate).toISOString() : undefined,
        nextCallbackNotes: requiresReschedule ? `Follow-up: ${notes.trim() || "Lead requested callback"}` : undefined,
      };

      await aseService.updateCallback(callbackId, payload);
      success("Call Logged", `Callback for ${callback.lead_name || "Lead"} marked as completed.`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toastError("Action Failed", err.message || "Failed to update callback.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()} modal={true}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400 rounded-lg">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Complete Call Workflow</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Log the outcome, capture notes, and update lead lifecycle.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="bg-muted/40 rounded-lg p-3 text-xs border border-border/50 space-y-1.5">
            <div className="flex items-center justify-between font-semibold text-foreground text-sm">
              <span>{callback.lead_name || "Prospective Client"}</span>
              <span className="font-mono text-xs px-2 py-0.5 bg-background rounded border border-border">
                P-{callback.priority ?? callback.lead_priority ?? 50}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
              {callback.lead_company && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {callback.lead_company}
                </span>
              )}
              {callback.lead_phone && (
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-3 h-3" />
                  {callback.lead_phone}
                </span>
              )}
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {callback.rep_name || callback.assigned_rep_name || "Rep"}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              Call Outcome <span className="text-rose-500 font-bold">*</span>
            </label>
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {OUTCOME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {requiresReschedule && (
            <div className="space-y-1.5 bg-orange-50/50 dark:bg-orange-950/20 p-3 rounded-lg border border-orange-200 dark:border-orange-900">
              <label className="text-xs font-semibold text-orange-900 dark:text-orange-200 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-orange-600" />
                Next Callback Date & Time <span className="text-rose-500">*</span>
              </label>
              <Input
                type="datetime-local"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="h-8 text-xs bg-background"
                required={requiresReschedule}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Call Summary / Notes
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record details of conversation, buyer objections, or next steps..."
              rows={3}
              className="text-xs resize-none"
            />
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={submitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-semibold text-xs gap-1.5"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Submit Call Result
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
