import React from "react";
import { Phone } from "lucide-react";
import { useAseTransfer } from "../../hooks/useAseTransfer";

export default function AseTransferAlert() {
  const { incoming, missed, clear } = useAseTransfer();
  if (!incoming && !missed) return null;

  if (incoming) {
    return (
      <div className="rounded-lg border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Phone className="w-4 h-4 text-emerald-600 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Live warm transfer</p>
            <p className="text-xs text-muted-foreground">
              {incoming.leadName || "A prospect"} is on the line
              {incoming.company ? ` · ${incoming.company}` : ""}. Answer to join the conference.
            </p>
          </div>
        </div>
        <button type="button" className="text-[11px] text-muted-foreground" onClick={clear}>
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-semibold">Transfer missed — callback queued</p>
        <p className="text-xs text-muted-foreground">
          {missed.leadName || "The prospect"} was promised a human. 30-minute SLA. No second bot call.
        </p>
      </div>
      <button type="button" className="text-[11px] text-muted-foreground" onClick={clear}>
        Dismiss
      </button>
    </div>
  );
}
