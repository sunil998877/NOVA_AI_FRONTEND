import React from "react";
import { Check } from "lucide-react";
import { cn } from "../../lib/utils";
import { frame } from "./landingTheme";

export function LandingOverview({ dark, acc }) {
  return (
    <section id="campaigns" className={cn("relative left-[calc(-2rem-2px)] sm:left-[calc(-2rem-2px)] md:left-[calc(-2.5rem-2px)] lg:left-[calc(-3rem-2px)] xl:left-[calc(-3.5rem-2px)] pt-6 pb-16 sm:pt-8 sm:pb-20 md:pt-28 md:pb-24", dark ? "bg-[#0A0E16]" : "bg-[#f7f5f0]")}>
      <div className={frame}>
        <p className={cn("text-xs font-bold uppercase tracking-[0.18em]", acc.text)}>Overview</p>
        <h2
          className={cn(
            "landing-overview-title mt-2 w-max max-w-none text-[2.85rem] font-extrabold leading-[0.95] tracking-tight sm:text-[3.75rem] md:text-[4.6rem] lg:text-[5.5rem] xl:text-[6rem]",
            dark ? "text-white" : "text-neutral-950"
          )}
        >
          See how your campaigns
          <br />
          really perform.
        </h2>

        <div className="mt-[9px] grid items-center gap-10 sm:mt-[13px] lg:mt-[17px] lg:grid-cols-[1.15fr_0.85fr] lg:gap-[7%]">
          <div style={{ marginTop: 35 }}>
            <img
              src="/landing/overview-dashboard.jpg"
              alt="NOVA 3D AI Neural Core in brand coral-orange — holographic campaign analytics, 68.4% open rate, active campaigns, and live telemetry matching Open Dashboard theme"
              className="block h-auto w-full shadow-2xl transition hover:scale-[1.02] duration-300"
              style={{ objectFit: "contain", borderRadius: 40 }}
            />
          </div>

          <div className="pt-5 lg:pt-8">
            <p
              className={cn(
                "max-w-md text-[17px] leading-[1.65] sm:text-lg",
                dark ? "text-slate-400" : "text-[#3d3d3d]"
              )}
            >
              Open the dashboard and the numbers are already there. How many you sent, who opened, who clicked — no spreadsheet in sight. The next campaign lines up below, nearest first, so nothing sits in draft too long.
            </p>
            <ul className={cn("mt-8 space-y-5 text-[15px] sm:text-base", dark ? "text-slate-400" : "text-[#6b6b6b]")}>
              {[
                "Live open and click rates",
                "A countdown to every scheduled send",
                "Lists, drafts, and sent campaigns in one view",
              ].map((line) => (
                <li key={line} className="flex items-center gap-3.5">
                  <span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-full",
                      dark ? "bg-[#14b8a6]/20 text-[#14b8a6]" : "bg-[#f4d0c4] text-[#e23c1a]"
                    )}
                  >
                    <Check className="size-3.5" strokeWidth={2.75} />
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
