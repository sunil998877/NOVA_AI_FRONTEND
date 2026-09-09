import React, { useEffect, useState } from "react";
import { NovaMark } from "./landing/NovaMark";

export default function LoadingScreen({
  text = "LOADING",
  subtitle = "Preparing your Nova workspace...",
  fullScreen = true,
  duration = 3000,
}) {
  const letters = text.split("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!duration) return;
    const intervalMs = 30;
    const step = 100 / (duration / intervalMs);
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step;
        if (next >= 100) {
          clearInterval(interval);
          return 100;
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [duration]);

  return (
    <div
      className={`relative flex flex-col items-center justify-center overflow-hidden bg-background select-none ${fullScreen ? "fixed inset-0 z-50 min-h-screen w-screen" : "min-h-[60vh] w-full py-16"
        }`}
      role="status"
      aria-label="Loading"
    >
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 size-[450px] sm:size-[550px] rounded-full bg-primary/20 blur-[120px] dark:bg-primary/25 animate-pulse" />
      <div className="pointer-events-none absolute -bottom-24 left-1/2 -translate-x-1/2 size-[350px] rounded-full bg-amber-500/15 blur-[100px] dark:bg-teal-500/15" />

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <div className="relative mb-14 flex items-center justify-center">
          <div className="absolute -inset-4 rounded-3xl border border-primary/25 border-dashed animate-[spin_40s_linear_infinite]" />

          <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-primary via-orange-500 to-amber-400 opacity-40 blur-xl animate-[pulse_6s_ease-in-out_infinite]" />

          <div className="relative transform transition-transform duration-500 hover:scale-105 nova-logo-float">
            <NovaMark className="size-16 sm:size-20 rounded-2xl shadow-2xl shadow-primary/20" />
          </div>
        </div>

        <div className="mb-4 flex items-center justify-center gap-1 sm:gap-2">
          {letters.map((char, index) => (
            <span
              key={index}
              className="inline-block text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-400 to-amber-300 dark:from-primary dark:via-teal-300 dark:to-cyan-400 nova-loading-letter drop-shadow-[0_4px_16px_rgba(239,90,46,0.35)]"
              style={{
                animationDelay: `${index * 0.12}s`,
              }}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}

          <div className="flex items-center gap-1.5 ml-1 self-end pb-2 sm:pb-3">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="size-2.5 sm:size-3 rounded-full bg-primary nova-loading-dot"
                style={{
                  animationDelay: `${(letters.length * 0.12) + (i * 0.2)}s`,
                }}
              />
            ))}
          </div>
        </div>

        {subtitle && (
          <p className="max-w-md text-sm sm:text-base font-medium tracking-wide text-muted-foreground/90 animate-pulse">
            {subtitle}
          </p>
        )}

        <div className="mt-8 flex flex-col items-center gap-2">
          <div className="relative h-2 w-56 sm:w-72 overflow-hidden rounded-full bg-muted/70 border border-border/50 shadow-inner">
            {duration ? (
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary via-orange-400 to-amber-300 shadow-[0_0_12px_rgba(239,90,46,0.6)] transition-all duration-75 ease-linear"
                style={{ width: `${Math.min(100, Math.round(progress))}%` }}
              />
            ) : (
              <div className="absolute inset-0 nova-loading-progress rounded-full bg-gradient-to-r from-transparent via-primary to-transparent" />
            )}
          </div>
          {duration ? (
            <span className="text-xs font-mono font-bold tracking-widest text-primary/80">
              {Math.min(100, Math.round(progress))}%
            </span>
          ) : null}
        </div>

        <div className="mt-8 flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-1.5 text-xs font-semibold tracking-wider text-foreground/80 backdrop-blur-md shadow-sm">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>NOVA INTELLIGENCE</span>
        </div>
      </div>
    </div>
  );
}
