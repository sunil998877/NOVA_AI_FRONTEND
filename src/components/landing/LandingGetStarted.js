import React, { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";
import { NovaMark } from "./NovaMark";

export function LandingGetStarted({ acc, authed }) {
  const [hovering, setHovering] = useState(false);

  return (
    <section
      id="get-started"
      className="relative flex flex-1 flex-col items-center justify-center px-5 py-12 text-center sm:px-8 sm:py-14"
    >
      <div className="translate-y-[10px]">
        <h2
          className={cn(
            "landing-cta-title cursor-pointer select-none text-[2.85rem] font-extrabold leading-[0.92] tracking-tight sm:text-6xl md:text-7xl lg:text-[6.75rem] xl:text-[7.75rem]",
            acc.text
          )}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          <span className="flex items-center justify-center gap-[0.14em]">
            <span>Open</span>
            <span className="relative inline-flex shrink-0">
              <span className="pointer-events-none absolute inset-[-22%] rounded-[0.32em] bg-sky-300/45 blur-2xl" aria-hidden />
              <span
                className="relative inline-flex"
                style={{
                  transform: hovering ? "rotate(45deg)" : "rotate(0deg)",
                  transition: "transform 0.5s ease-out",
                }}
              >
                <NovaMark className="size-[0.78em] rounded-[0.2em]" dark={false} />
              </span>
            </span>
            <span>NOVA</span>
          </span>
          <span className="mt-[0.08em] block">to get Started</span>
        </h2>

        <div className="mt-10 flex justify-center sm:mt-12 lg:mt-14">
          <Link
            to={authed ? "/dashboard" : "/signup"}
            className="inline-flex h-12 items-center rounded-full bg-white px-8 text-base font-semibold text-black ring-1 ring-white/15 transition-colors hover:bg-black hover:text-white sm:h-14 sm:px-10 sm:text-lg lg:h-16"
          >
            {authed ? "Open admin dashboard" : "Get started free"}
          </Link>
        </div>

        <p className="mt-5 text-[13px] text-white/40 sm:mt-6 sm:text-sm">Campaigns · AI copy · Tracking · Influencers</p>
      </div>
    </section>
  );
}
