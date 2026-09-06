import React from "react";
import { ArrowRight, Info, Plus } from "lucide-react";
import { cn } from "../../lib/utils";
import { landingAccent } from "./landingTheme";

export function PhoneScreen({ data, dark }) {
  const acc = landingAccent(dark);
  return (
    <div className="px-3.5 pb-10">
      <div className="mb-4 flex items-center justify-between px-1">
        <h3 className="text-[28px] font-extrabold tracking-tight text-neutral-950">{data.title}</h3>
        <span className={cn("grid size-8 place-items-center rounded-full border border-white/70 bg-white/35 shadow-[0_4px_16px_rgba(0,0,0,0.06)] backdrop-blur-xl", acc.text)}>
          <Plus className="size-4" />
        </span>
      </div>

      <div className="relative overflow-hidden rounded-[1.7rem] border border-white/20 bg-neutral-950/55 p-5 text-white shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(rgba(255,255,255,0.45)_0.7px,transparent_0.7px)] [background-size:10px_10px]" />
        <p className="relative text-[17px] font-semibold leading-snug">{data.hey}</p>
        <div className="relative mt-5 space-y-3.5 pb-8">
          {data.rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2.5 text-[13px] text-white/80">
                <span className={cn("grid size-6 place-items-center rounded-md text-white", row.tint)}>
                  <row.icon className="size-3.5" />
                </span>
                {row.label}
              </span>
              <span className="text-[13px] font-semibold">{row.value}</span>
            </div>
          ))}
        </div>
        <span className={cn("absolute bottom-4 right-4 grid size-10 place-items-center rounded-full text-white shadow-lg", acc.bg)}>
          <ArrowRight className="size-4" />
        </span>
      </div>

      <div className="mt-3 rounded-[1.5rem] border border-white/70 bg-white/40 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-2xl">
        <p className="text-[13px] font-bold text-neutral-950">{data.asideTitle}</p>
        <div className="mt-3 space-y-3">
          {data.extras.map((line) => (
            <p key={line} className="text-[13px] leading-relaxed text-neutral-700">
              {line}
            </p>
          ))}
        </div>
        <p className="mt-4 flex items-center gap-1 text-[10px] text-neutral-400">
          <Info className="size-3" />
          Live preview for illustration only.
        </p>
      </div>
    </div>
  );
}
