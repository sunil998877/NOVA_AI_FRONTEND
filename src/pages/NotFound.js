import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Home, LayoutDashboard, Compass, Mail } from "lucide-react";
import { NovaMark } from "../components/landing/NovaMark";
import { useAuth } from "../lib/AuthContext";

export default function NotFound() {
  const navigate = useNavigate();
  const { authed } = useAuth();

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background px-4 py-16 select-none">
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 size-[500px] sm:size-[650px] rounded-full bg-primary/20 blur-[130px] dark:bg-primary/25 animate-pulse" />
      <div className="pointer-events-none absolute -bottom-32 left-1/2 -translate-x-1/2 size-[420px] rounded-full bg-amber-500/15 blur-[120px] dark:bg-teal-500/15" />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-40 dark:bg-[radial-gradient(#1f293d_1px,transparent_1px)] dark:opacity-30" />

      <div className="relative z-10 flex max-w-xl flex-col items-center text-center">



        <h1 className="text-7xl sm:text-8xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-400 to-amber-300 dark:from-primary dark:via-teal-300 dark:to-cyan-400 drop-shadow-[0_8px_32px_rgba(239,90,46,0.35)] select-none">
          404
        </h1>

        <h2 className="mt-2 text-[50px] sm:text-[60px] font-extrabold tracking-tight text-foreground ">
          Page Not Found
        </h2>



        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/80 px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm backdrop-blur-md transition-all hover:bg-muted hover:border-border/80 active:scale-95"
          >
            <ArrowLeft className="size-4" />
            Go Back
          </button>

          {authed ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:opacity-95 hover:shadow-xl hover:shadow-primary/35 active:scale-95"
            >
              <LayoutDashboard className="size-4" />
              Return to Dashboard
            </Link>
          ) : (
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:opacity-95 hover:shadow-xl hover:shadow-primary/35 active:scale-95"
            >
              <Home className="size-4" />
              Back to Home
            </Link>
          )}

          {authed && (
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/80 px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm backdrop-blur-md transition-all hover:bg-muted hover:border-border/80 active:scale-95"
            >
              <Home className="size-4" />
              Home
            </Link>
          )}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 border-t border-border/60 pt-6 text-xs text-muted-foreground">
          <Link to={authed ? "/campaigns" : "/login"} className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground">
            <Mail className="size-3.5 text-primary" />
            <span>{authed ? "Campaigns" : "Sign In"}</span>
          </Link>
          <span className="text-border">•</span>
          <Link to={authed ? "/dashboard-view" : "/signup"} className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground">
            <Compass className="size-3.5 text-primary" />
            <span>{authed ? "Overview" : "Get Started"}</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
