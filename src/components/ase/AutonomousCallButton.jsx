import React, { useState } from "react";
import { Phone } from "lucide-react";
import { Button } from "../ui/button";
import { CadenceEnrollDialog } from "./CadenceEnrollDialog";

export function AutonomousCallButton({
  lead,
  variant = "icon",
  disabled = false,
  className = "",
  onStarted,
}) {
  const [open, setOpen] = useState(false);
  const leadId = Number(lead?.id);
  const blocked = Boolean(disabled || lead?.do_not_contact || !lead?.phone);

  const onClick = (event) => {
    event?.stopPropagation?.();
    if (!leadId || blocked) return;
    setOpen(true);
  };

  const dialog = (
    <span className="contents" onClick={(e) => e.stopPropagation()}>
      <CadenceEnrollDialog lead={lead} open={open} onOpenChange={setOpen} onEnrolled={onStarted} />
    </span>
  );

  if (variant === "header") {
    return (
      <>
        <button
          type="button"
          disabled={blocked}
          onClick={onClick}
          className={`h-10 px-4 rounded-xl bg-[#f0edff] hover:bg-[#e4ddff] text-[#5b21b6] text-sm font-medium transition-colors disabled:opacity-50 ${className}`}
        >
          Autonomous call
        </button>
        {dialog}
      </>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        title="Start autonomous call cadence"
        disabled={blocked}
        className={`text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 h-8 w-8 p-0 ${className}`}
        onClick={onClick}
      >
        <Phone className="w-3.5 h-3.5" />
      </Button>
      {dialog}
    </>
  );
}
