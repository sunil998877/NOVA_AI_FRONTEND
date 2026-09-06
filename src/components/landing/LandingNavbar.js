import React from "react";
import { Link } from "react-router-dom";
import { Menu, Moon, Sun, X } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { navFrame } from "./landingTheme";
import { NovaMark } from "./NovaMark";

export function LandingNavbar({ dark, acc, authed, toggleTheme, menuOpen, setMenuOpen }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-transparent pt-2 sm:pt-3">
      <div className={`relative ${navFrame}`}>
        <div
          className={cn(
            "flex h-14 w-full items-center justify-between gap-2 rounded-full px-2 pl-3 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl sm:h-[3.75rem] sm:px-3 sm:pl-4 md:gap-4 lg:h-[4.5rem] lg:px-4",
            dark
              ? "border border-white/15 bg-white/[0.92]"
              : "border border-white/50 bg-white/75"
          )}
        >
          <a href="#top" className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-2.5">
            <NovaMark className="size-8 rounded-md sm:size-9" dark={false} />
            <span className="truncate text-sm font-bold tracking-tight text-neutral-950 sm:text-base">NOVA</span>
          </a>

          <div className="hidden min-w-0 flex-1 items-center justify-end gap-1 md:flex">
            <nav className="flex min-w-0 items-center text-[13px] font-medium text-neutral-500 lg:text-sm">
              <a href="#how-it-works" className="rounded-full px-2.5 py-2 whitespace-nowrap transition-colors hover:text-neutral-950 lg:px-3">How it works</a>
              <a href="#campaigns" className="rounded-full px-2.5 py-2 whitespace-nowrap transition-colors hover:text-neutral-950 lg:px-3">Campaigns</a>
              <a href="#features" className="rounded-full px-2.5 py-2 whitespace-nowrap transition-colors hover:text-neutral-950 lg:px-3">Features</a>
              <a href="#faq" className="rounded-full px-2.5 py-2 whitespace-nowrap transition-colors hover:text-neutral-950 lg:px-3">FAQ</a>
              {!authed && (
                <Link to="/login" className="hidden rounded-full px-2.5 py-2 whitespace-nowrap transition-colors hover:text-neutral-950 lg:inline-flex lg:px-3">
                  Log in
                </Link>
              )}
            </nav>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              className="ml-1 grid size-9 shrink-0 place-items-center rounded-full text-neutral-900 hover:bg-black/5 lg:size-10"
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <Button asChild className={cn("ml-1 h-9 shrink-0 rounded-full px-5 text-sm shadow-none lg:ml-2 lg:h-11 lg:px-6", acc.btn)}>
              <Link to={authed ? "/dashboard" : "/signup"}>
                {authed ? "Open dashboard" : "Get started"}
              </Link>
            </Button>
          </div>

          <div className="flex items-center gap-0.5 md:hidden">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              className="grid size-10 shrink-0 place-items-center rounded-full text-neutral-900 hover:bg-black/5"
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="mr-0.5 size-10 shrink-0 rounded-full text-neutral-900 hover:bg-black/5"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        {menuOpen && (
          <div className={cn("mt-2 space-y-1 rounded-3xl p-3 shadow-lg md:hidden", dark ? "border border-white/10 bg-[#161B26]" : "border border-black/[0.06] bg-white")}>
            <a href="#how-it-works" className={cn("block rounded-2xl px-3 py-2.5 text-sm", dark ? "text-slate-200 hover:bg-white/5" : "text-neutral-700 hover:bg-neutral-50")} onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#campaigns" className={cn("block rounded-2xl px-3 py-2.5 text-sm", dark ? "text-slate-200 hover:bg-white/5" : "text-neutral-700 hover:bg-neutral-50")} onClick={() => setMenuOpen(false)}>Campaigns</a>
            <a href="#features" className={cn("block rounded-2xl px-3 py-2.5 text-sm", dark ? "text-slate-200 hover:bg-white/5" : "text-neutral-700 hover:bg-neutral-50")} onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#faq" className={cn("block rounded-2xl px-3 py-2.5 text-sm", dark ? "text-slate-200 hover:bg-white/5" : "text-neutral-700 hover:bg-neutral-50")} onClick={() => setMenuOpen(false)}>FAQ</a>
            {!authed && (
              <Link to="/login" className={cn("block rounded-2xl px-3 py-2.5 text-sm", dark ? "text-slate-200 hover:bg-white/5" : "text-neutral-700 hover:bg-neutral-50")} onClick={() => setMenuOpen(false)}>
                Log in
              </Link>
            )}
            <Button asChild className={cn("mt-2 h-11 w-full rounded-full shadow-none", acc.btn)}>
              <Link to={authed ? "/dashboard" : "/signup"} onClick={() => setMenuOpen(false)}>
                {authed ? "Open dashboard" : "Get started"}
              </Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
