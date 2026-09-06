import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { frame } from "./landingTheme";

export function LandingOpenDashboard({ dark, acc, authed }) {
  return (
    <section id="open-dashboard" className={`relative py-8 pb-16 sm:py-12 sm:pb-20 ${frame}`}>
      <div
        className={cn(
          "rounded-[2.5rem] px-6 py-14 text-center sm:px-10 sm:py-[4.5rem]",
          dark ? "bg-black ring-1 ring-white/10" : "bg-neutral-950"
        )}
      >
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Ready to run your next campaign?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[#A0A0A0] sm:text-base">
          Sign in and the admin dashboard opens — campaigns, message crafter, tracking, and influencers all in one place.
        </p>
        <Button asChild size="lg" className={cn("mt-8 h-12 rounded-full px-8 text-[15px] font-semibold shadow-none", acc.btn)}>
          <Link to={authed ? "/dashboard" : "/login"}>
            Open admin dashboard
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
