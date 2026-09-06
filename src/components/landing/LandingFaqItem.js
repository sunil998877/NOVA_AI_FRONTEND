import React from "react";
import { Plus } from "lucide-react";
import { cn } from "../../lib/utils";

export function LandingFaqItem({ dark, acc, question, answer, open, onToggle }) {
  return (
    <div className={cn("border-b", dark ? "border-white/10" : "border-neutral-200")}>
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-6 py-5 text-left sm:py-6"
      >
        <span className={cn("text-xl font-semibold sm:text-[22px] md:text-2xl", dark ? "text-white" : "text-neutral-950")}>
          {question}
        </span>
        <Plus
          className={cn(
            "size-6 shrink-0 transition-transform duration-300",
            acc.text,
            open && "rotate-45"
          )}
          strokeWidth={2.25}
        />
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <p
            className={cn(
              "pb-5 text-base font-medium leading-relaxed sm:pb-6 sm:text-lg",
              dark ? "text-slate-400" : "text-[#666666]"
            )}
          >
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}
