import React, { useMemo } from "react";
import { aseService } from "../../services/ase.service";

const OUTBOUND = new Set(["EMAIL", "CALL"]);

function primaryLabel(action, mode, pending) {
  if (action === "CALL") {
    if (mode === "AI_RECOMMENDED") return pending ? "Approve & call" : "Approve & call";
    if (mode === "HUMAN_ESCALATION") return "Send call now";
    return "Start AI voice call";
  }
  if (action === "WAIT") return "Hold for now";
  if (action === "REP_CALLBACK") return "Open callback queue";
  if (mode === "AI_RECOMMENDED") return "Approve & send";
  if (mode === "HUMAN_ESCALATION") return "Send now";
  return "Send follow-up email";
}

export default function LeadNextActionButtons({
  leadId,
  recommendedAction,
  operatingMode = "FULLY_AUTOMATED",
  pendingApproval = null,
  doNotContact = false,
  updating = false,
  onHold,
  onPreview,
  onExecuted,
  onOpenCallbacks,
  onChooseAnother,
  onError,
  onBusy,
}) {
  const action = String(recommendedAction || "").toUpperCase();
  const mode = String(operatingMode || "FULLY_AUTOMATED").toUpperCase();
  const pending = pendingApproval?.status === "PENDING";
  const canOutbound = OUTBOUND.has(action);

  const label = useMemo(
    () => primaryLabel(action, mode, pending),
    [action, mode, pending]
  );

  const run = async (fn) => {
    try {
      onBusy?.(true);
      await fn();
    } catch (err) {
      onError?.(err);
    } finally {
      onBusy?.(false);
    }
  };

  const handlePrimary = () => {
    if (action === "REP_CALLBACK") {
      onOpenCallbacks?.();
      return;
    }
    if (action === "WAIT" || !canOutbound) {
      onHold?.();
      return;
    }
    if (mode === "AI_RECOMMENDED") {
      run(async () => {
        await aseService.approveLeadAction(leadId, { action });
        await onExecuted?.();
      });
      return;
    }
    run(async () => {
      await aseService.executeAction(leadId);
      await onExecuted?.();
    });
  };

  const handleHold = () => {
    run(async () => {
      await aseService.holdLeadAction(leadId);
      onHold?.();
    });
  };

  return (
    <div className="mt-3.5 flex items-center gap-2.5 flex-wrap">
      <button
        type="button"
        disabled={updating || doNotContact}
        onClick={handlePrimary}
        className="px-4 py-2 rounded-xl bg-[#c2410c] hover:bg-[#9a3412] text-white text-xs sm:text-sm font-semibold shadow-xs disabled:opacity-50 transition-colors"
      >
        {label}
      </button>
      <button
        type="button"
        onClick={() => onPreview?.()}
        className="px-4 py-2 rounded-xl border border-gray-300 dark:border-border bg-white dark:bg-card text-xs sm:text-sm font-medium text-gray-800 dark:text-foreground hover:bg-gray-50 dark:hover:bg-muted/50 shadow-xs transition-colors"
      >
        {mode === "AI_RECOMMENDED" ? "Preview / Edit" : "Preview draft"}
      </button>
      {action !== "WAIT" && (
        <button
          type="button"
          disabled={updating}
          onClick={handleHold}
          className="px-4 py-2 rounded-xl border border-gray-300 dark:border-border bg-white dark:bg-card text-xs sm:text-sm font-medium text-gray-800 dark:text-foreground hover:bg-gray-50 dark:hover:bg-muted/50 shadow-xs disabled:opacity-50 transition-colors"
        >
          Hold
        </button>
      )}
      <button
        type="button"
        onClick={() => onChooseAnother?.()}
        className="text-xs sm:text-sm font-medium text-gray-600 dark:text-muted-foreground hover:text-gray-900 dark:hover:text-foreground cursor-pointer transition-colors"
      >
        Choose another action
      </button>
    </div>
  );
}
