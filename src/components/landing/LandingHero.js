import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { fadeUp, frame, stagger } from "./landingTheme";
import { PhoneMockup } from "./PhoneMockup";

export function LandingHero({ dark, acc, authed }) {
  return (
    <section className={`relative grid items-start gap-10 overflow-x-clip pb-0 pt-12 sm:gap-12 sm:pt-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8 lg:pt-14 xl:gap-12 ${frame}`}>
      <motion.div variants={stagger} initial="hidden" animate="show" className="min-w-0 pt-6 sm:pt-8 lg:pt-20">
        <motion.h1
          variants={fadeUp}
          className={cn(
            "landing-hero-title text-[2.6rem] font-extrabold leading-[0.95] tracking-tight sm:text-6xl md:text-7xl lg:text-[4.75rem] xl:text-[5.25rem]",
            dark ? "text-white" : "text-neutral-950"
          )}
        >
          Launch campaigns.
          <span className="mt-1 block">Watch them</span>
          <span className="mt-1 block">perform.</span>
        </motion.h1>
        <motion.p variants={fadeUp} className={cn("mt-6 max-w-md text-base leading-relaxed sm:mt-8 sm:text-lg", dark ? "text-slate-400" : "text-neutral-500")}>
          Write the email, pick a list, and send. Opens, clicks, and the next campaign sit in one admin view — then you log in and keep going.
        </motion.p>
        <motion.div variants={fadeUp} className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className={cn("h-11 w-full rounded-full px-6 shadow-none sm:w-auto", acc.btn)}>
            <Link to={authed ? "/dashboard" : "/signup"}>
              {authed ? "Go to admin dashboard" : "Start sending"}
              <ArrowRight />
            </Link>
          </Button>
          <Button asChild size="lg" className={cn("h-11 w-full rounded-full border px-6 shadow-none sm:w-auto", dark ? "border-white/15 bg-transparent text-white hover:bg-white/10" : "border-black/10 bg-transparent text-neutral-900 hover:bg-white/60")}>
            <a href="#film">See it in motion</a>
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.12 }}
        className="relative mt-0 flex justify-center lg:justify-end"
      >
        <PhoneMockup dark={dark} />
      </motion.div>
    </section>
  );
}
