import React, { useState } from "react";
import { cn } from "../../lib/utils";
import { faqContent } from "./faqContent";
import { LandingFaqItem } from "./LandingFaqItem";

export function LandingFaq({ dark, acc }) {
  const { label, headline, items } = faqContent;
  const [open, setOpen] = useState(null);

  return (
    <section
      id="faq"
      className={cn(
        "relative pt-10 pb-[calc(2rem+50px)] sm:pt-12 sm:pb-[calc(2.5rem+50px)] md:pt-16 md:pb-[calc(3rem+50px)]",
        dark ? "bg-[#0A0E16]" : "bg-[#f7f5f0]"
      )}
    >
      <div className="mx-auto w-full max-w-[1260px] px-5 sm:px-8 md:px-10">
        <div className="grid items-start gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
          <div>
            <p className={cn("text-sm font-bold uppercase tracking-[0.18em]", acc.text)}>{label}</p>
            <h2
              className={cn(
                "mt-4 text-[2.85rem] font-extrabold leading-[0.95] tracking-tight sm:text-[3.75rem] md:text-[4.6rem] lg:text-[5rem]",
                dark ? "text-white" : "text-neutral-950"
              )}
            >
              {headline.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h2>
          </div>

          <div className={cn("border-t", dark ? "border-white/10" : "border-neutral-200")}>
            {items.map((item, index) => (
              <LandingFaqItem
                key={item.q}
                dark={dark}
                acc={acc}
                question={item.q}
                answer={item.a}
                open={open === index}
                onToggle={() => setOpen(open === index ? null : index)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
