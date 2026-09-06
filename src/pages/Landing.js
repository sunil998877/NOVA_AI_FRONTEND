import React, { useEffect, useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { cn } from "../lib/utils";
import {
  FilmExpand,
  LANDING_THEME_KEY,
  LandingFeatures,
  LandingFooter,
  LandingFaq,
  LandingGetStarted,
  LandingHero,
  LandingHowItWorks,
  LandingNavbar,
  LandingOverview,
  LandingSetup,
  LandingStats,
  landingAccent,
} from "../components/landing";

function Landing() {
  const { authed } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      return window.localStorage.getItem(LANDING_THEME_KEY) === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });
  const dark = theme === "dark";
  const acc = landingAccent(dark);

  useEffect(() => {
    const nodes = [document.documentElement, document.body];
    nodes.forEach((node) => node.classList.add("no-scrollbar"));
    return () => nodes.forEach((node) => node.classList.remove("no-scrollbar"));
  }, []);

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      try {
        window.localStorage.setItem(LANDING_THEME_KEY, next);
      } catch {

      }
      return next;
    });
  };

  return (
    <div className={cn("relative min-h-svh overflow-x-clip scroll-smooth no-scrollbar", dark ? "bg-[#0A0E16] text-slate-100" : "bg-[#f7f5f0] text-neutral-900")}>
      <LandingNavbar
        dark={dark}
        acc={acc}
        authed={authed}
        toggleTheme={toggleTheme}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />
      <div className="h-[4.25rem] sm:h-[5rem] lg:h-[5.75rem]" aria-hidden />

      <main id="top">
        <LandingHero dark={dark} acc={acc} authed={authed} />
        <FilmExpand dark={dark} />
        <LandingOverview dark={dark} acc={acc} />
        <LandingStats dark={dark} acc={acc} />
        <LandingHowItWorks dark={dark} acc={acc} />
        <LandingFeatures dark={dark} acc={acc} />
        <LandingSetup dark={dark} acc={acc} authed={authed} />
        <LandingFaq dark={dark} acc={acc} />
      </main>

      <div className={cn("relative", dark ? "bg-[#0A0E16]" : "bg-[#f7f5f0]")}>
        <div
          className="relative z-10 flex min-h-[calc(100svh-2.25rem)] flex-col overflow-hidden bg-[#0A0E16] sm:min-h-[calc(100svh-2.625rem)] lg:min-h-[calc(100svh-3rem)]"
          style={{ borderTopLeftRadius: 55, borderTopRightRadius: 55 }}
        >
          <LandingGetStarted acc={acc} authed={authed} />
          <LandingFooter />
        </div>
      </div>
    </div>
  );
}

export default Landing;
