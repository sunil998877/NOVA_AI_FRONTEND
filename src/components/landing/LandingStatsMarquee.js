import React from "react";
import { cn } from "../../lib/utils";
import { Marquee } from "../ui/marquee";

const stats = [
  { value: "54%", label: "Avg. open rate" },
  { value: "16%", label: "Avg. click rate" },
  { value: "4 steps", label: "From idea to send" },
  { value: "Live", label: "Tracking & analytics" },
];

function StatCard({ value, label, acc }) {
  return (
    <div className="flex min-w-[70vw] shrink-0 flex-col items-center justify-center px-8 text-center sm:min-w-[45vw] md:min-w-[33vw] lg:min-w-[25vw]">
      <p className={cn("text-2xl font-bold md:text-3xl", acc.text)}>{value}</p>
      <p className="mt-1 text-xs text-neutral-500 md:text-sm">{label}</p>
    </div>
  );
}

export function LandingStatsMarquee({ dark, acc }) {
  return (
    <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
      <Marquee reverse pauseOnHover className="w-full p-0 [--duration:20s] [--gap:0px]">
        {stats.map((item) => (
          <StatCard key={item.label} {...item} acc={acc} />
        ))}
      </Marquee>
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r",
          dark ? "from-[#0A0E16]" : "from-[#f7f5f0]"
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l",
          dark ? "from-[#0A0E16]" : "from-[#f7f5f0]"
        )}
      />
    </div>
  );
}
