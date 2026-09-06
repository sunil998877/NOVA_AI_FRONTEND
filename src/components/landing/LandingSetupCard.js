import React from "react";
import { cn } from "../../lib/utils";
import { PhoneMockup } from "./PhoneMockup";

export function LandingSetupCard({ dark, acc }) {
  return (
    <div className="shrink-0">
      <div
        className={cn(
          "w-fit overflow-hidden rounded-[2.5rem] px-[calc(1.5rem+40px)] py-8 sm:rounded-[40px] sm:px-[calc(1.75rem+40px)] sm:py-9",
          acc.bg
        )}
      >
        <PhoneMockup dark={dark} />
      </div>
    </div>
  );
}
