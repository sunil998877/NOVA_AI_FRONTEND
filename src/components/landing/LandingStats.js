import React from "react";
import { cn } from "../../lib/utils";
import { LandingStatsMarquee } from "./LandingStatsMarquee";

export function LandingStats({ dark, acc }) {
  return (
    <section
      className={cn(
        "w-full overflow-hidden border-y  relative bottom-8",
        dark ? "border-white/10 bg-[#0A0E16]" : "border-neutral-100 bg-[#f7f5f0]"
      )}
    >
      <div className="relative py-10  ">
        <LandingStatsMarquee dark={dark} acc={acc} />
      </div>
    </section>
  );
}
