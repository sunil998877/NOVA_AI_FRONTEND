import React from "react";
import { ChartBar, Eye, Mail, Settings } from "lucide-react";
import { cn } from "../../lib/utils";
import { landingAccent } from "./landingTheme";

export function PhoneDock({ dark }) {
  const acc = landingAccent(dark);
  const items = [
    { label: "Overview", icon: ChartBar, active: false },
    { label: "Campaigns", icon: Mail, active: false },
    { label: "Tracking", icon: Eye, active: true },
    { label: "Settings", icon: Settings, active: false },
  ];

  return (
    <div className="pointer-events-none absolute inset-x-4 bottom-4 z-30 sm:inset-x-5">
      <div className="flex items-end justify-between rounded-full border border-white/70 bg-white/75 px-3 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl">
        {items.map((item) => (
          <span key={item.label} className="flex flex-col items-center gap-0.5 px-1">
            <span
              className={cn(
                "grid size-8 place-items-center rounded-full",
                item.active ? cn(acc.bg, "text-white") : "text-neutral-500"
              )}
            >
              <item.icon className="size-3.5" />
            </span>
            <span className={cn("text-[8px] font-semibold", item.active ? acc.text : "text-neutral-500")}>
              {item.label}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
