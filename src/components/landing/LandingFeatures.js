import React from "react";
import { ChartBar, List, Mail, MousePointerClick, Send, Users } from "lucide-react";
import { cn } from "../../lib/utils";
import { navFrame } from "./landingTheme";
import { featuresContent } from "./featuresContent";

const featureIcons = [Send, Mail, MousePointerClick, List, Users, ChartBar];

export function LandingFeatures({ dark, acc }) {
  const { label, headline, body, items } = featuresContent;

  return (
    <section
      id="features"
      className={cn(
        "relative py-16 pb-8 sm:py-20 sm:pb-10 md:pt-28 md:pb-8",
        dark ? "bg-[#0A0E16]" : "bg-[#f7f5f0]"
      )}
    >
      <div className={navFrame}>
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <p className={cn("text-sm font-bold uppercase tracking-[0.18em]", acc.text)}>{label}</p>
          <h2
            className={cn(
              "landing-features-title mt-4 text-[3.15rem] font-extrabold leading-[0.95] tracking-tight sm:text-[4.1rem] md:text-[5.1rem] lg:text-[5.75rem] xl:text-[6.25rem]",
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
              "mt-6 max-w-2xl text-[19px] leading-[1.65] sm:mt-8 sm:text-xl",
              dark ? "text-slate-400" : "text-[#666666]"
            )}
          >
            {body}
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-[1120px] gap-3 sm:mt-14 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-5">
          {items.map((item, index) => {
            const Icon = featureIcons[index];
            return (
              <div
                key={item.title}
                className={cn(
                  "rounded-[1.5rem] p-5 sm:rounded-[1.75rem] sm:p-6",
                  dark ? "bg-[#161B26]" : "bg-white"
                )}
              >
                <span
                  className={cn(
                    "grid size-10 place-items-center rounded-full text-white",
                    acc.bg
                  )}
                >
                  <Icon className="size-4" strokeWidth={2.25} />
                </span>
                <h3 className={cn("mt-4 text-lg font-semibold", dark ? "text-white" : "text-neutral-950")}>
                  {item.title}
                </h3>
                <p className={cn("mt-2 text-[15px] leading-relaxed", dark ? "text-slate-400" : "text-[#666666]")}>
                  {item.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
