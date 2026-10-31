import React from "react";
import { CheckCircle2 } from "lucide-react";

export const OPERATING_MODE_OPTIONS = [
  {
    id: "FULLY_AUTOMATED",
    title: "Fully Automated",
    description: "Due email and calls dispatch on their own. Execute Now only skips timing, not consent.",
  },
  {
    id: "AI_RECOMMENDED",
    title: "AI-Recommended",
    description: "Engine queues EMAIL/CALL for Approve & send. Nothing leaves until a row is APPROVED.",
  },
  {
    id: "HUMAN_ESCALATION",
    title: "Human Escalation",
    description: "No auto send or dial. A rep is assigned if missing. A human click on Send is allowed.",
  },
];

export default function OperatingModePicker({ value, onChange, disabled = false }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {OPERATING_MODE_OPTIONS.map((option) => {
        const selected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange?.(option.id)}
            className={`text-left p-3 border rounded-lg transition-all ${
              selected
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "hover:bg-muted/50"
            } disabled:opacity-60`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold text-sm">{option.title}</div>
              {selected && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
          </button>
        );
      })}
    </div>
  );
}
