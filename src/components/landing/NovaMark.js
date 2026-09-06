import React from "react";
import { cn } from "../../lib/utils";

export function NovaMark({ className = "size-9", dark = false }) {
  return (
    <div className={cn("flex items-center justify-center rounded-lg text-white", dark ? "bg-[#14b8a6]" : "bg-[#ef5a2e]", className)}>
      <svg className="size-[58%]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    </div>
  );
}
