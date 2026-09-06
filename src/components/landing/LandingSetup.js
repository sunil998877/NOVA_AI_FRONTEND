import React from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";
import { setupContent } from "./setupContent";
import { LandingSetupCard } from "./LandingSetupCard";

export function LandingSetup({ dark, acc, authed }) {
  const { label, headline, body, steps } = setupContent;

  return (
    <section
      id="setup"
      className={cn(
        "relative pt-[calc(2rem+105px)] sm:pt-[calc(2.5rem+105px)] md:pt-[calc(2rem+105px)]",
        dark ? "bg-[#0A0E16]" : "bg-[#f7f5f0]"
      )}
      style={{ paddingBottom: 40 }}
    >
      <div className="w-full px-0">
        <div className="flex w-full flex-col items-center justify-center lg:flex-row lg:items-center" style={{ gap: 65 }}>
          <div className="min-w-0 w-full lg:w-auto lg:max-w-xl lg:shrink-0">
            <p className={cn("text-sm font-bold uppercase tracking-[0.18em]", acc.text)}>{label}</p>
            <h2
              className={cn(
                "mt-4 text-[3.15rem] font-extrabold leading-[0.95] tracking-tight sm:text-[4.1rem] md:text-[5rem] lg:text-[5.5rem]",
                dark ? "text-white" : "text-neutral-950"
              )}
            >
              {headline.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h2>
            <p
              className={cn(
                "mt-6 max-w-lg text-[19px] leading-[1.65] sm:text-xl",
                dark ? "text-slate-400" : "text-[#666666]"
              )}
            >
              {body}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {steps.map((step) => (
                <Link
                  key={step.n}
                  to={authed ? step.href : "/signup"}
                  className={cn(
                    "inline-flex items-center gap-2.5 rounded-full px-4 py-2.5 shadow-sm",
                    dark ? "bg-[#161B26] text-white" : "bg-white text-neutral-950"
                  )}
                >
                  <span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold text-white",
                      acc.bg
                    )}
                  >
                    {step.n}
                  </span>
                  <span className="text-base font-medium">{step.text}</span>
                </Link>
              ))}
            </div>
          </div>

          <LandingSetupCard dark={dark} acc={acc} />
        </div>
      </div>
    </section>
  );
}
