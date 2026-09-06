import React from "react";
import { cn } from "../../lib/utils";
import { navFrame } from "./landingTheme";
import { howItWorksContent } from "./howItWorksContent";

export function LandingHowItWorks({ dark, acc }) {
  const { label, headline, body, image, imageAlt } = howItWorksContent;

  return (
    <section
      id="how-it-works"
      className={cn(
        "relative top-8 mb-8 py-16 sm:py-20 md:py-2",
        dark ? "bg-[#0A0E16]" : "bg-[#f7f5f0]"
      )}
    >
      <div className={navFrame}>
        <div
          className={cn(
            "relative z-10 grid min-h-[550px] items-center gap-10 overflow-hidden p-6 py-[calc(1.5rem+35px)] sm:gap-12 sm:p-10 sm:py-[calc(2.5rem+35px)] lg:grid-cols-[0.88fr_1.12fr] lg:gap-[53px] lg:p-12 xl:p-14 lg:py-[calc(3.5rem+35px)]",
            dark ? "bg-[#161B26]" : "bg-white"
          )}
          style={{ borderRadius: 40 }}
        >
          <div className="flex flex-col justify-center px-1 sm:px-2 lg:px-4 lg:-translate-x-[20px]">
            <p className={cn("text-xs font-bold uppercase tracking-[0.18em]", acc.text)}>{label}</p>
            <h2
              className={cn(
                "mt-4 text-[2.85rem] font-extrabold leading-[0.95] tracking-tight sm:text-[3.75rem] md:text-[4.6rem] lg:text-[5rem] xl:text-[5.5rem]",
                dark ? "text-white" : "text-neutral-950"
              )}
            >
              {headline.map((line) => (
                <span key={line.text} className={cn("block", line.accent && acc.text)}>
                  {line.text}
                </span>
              ))}
            </h2>
            <p
              className={cn(
                "mt-8 max-w-lg text-[17px] leading-[1.65] sm:text-lg",
                dark ? "text-slate-400" : "text-[#666666]"
              )}
            >
              {body}
            </p>
          </div>

          <div className="flex min-h-[280px] min-w-0 items-center justify-center self-stretch lg:pr-1 lg:translate-x-[20px]">
            <img
              src={image}
              alt={imageAlt}
              className="block h-auto w-full shadow-2xl transition hover:scale-[0.918] duration-300 transform scale-[0.90]"
              style={{ objectFit: "contain", borderRadius: 40 }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
