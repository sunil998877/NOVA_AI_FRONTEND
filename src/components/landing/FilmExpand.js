import React, { useState, useEffect, useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { cn } from "../../lib/utils";

const SCENES_COUNT = 5;
const SCENE_DURATION_MS = 4200; 

export function FilmExpand({ dark }) {
  const containerRef = useRef(null);
  const [scene, setScene] = useState(0);
  const [progress, setProgress] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "center center"],
  });

  const rawScale = useTransform(scrollYProgress, [0, 0.85, 1], [0.82, 0.98, 1.0]);
  const scale = useSpring(rawScale, { stiffness: 85, damping: 24, restDelta: 0.001 });

  const rawOpacity = useTransform(scrollYProgress, [0, 0.6, 1], [0.7, 0.95, 1.0]);
  const opacity = useSpring(rawOpacity, { stiffness: 90, damping: 25, restDelta: 0.001 });

  useEffect(() => {
    const startTime = performance.now();
    let animId;

    const tick = (now) => {
      const elapsed = now - startTime;
      const totalCycle = SCENES_COUNT * SCENE_DURATION_MS;
      const cycleTime = elapsed % totalCycle;
      const currentSceneIndex = Math.floor(cycleTime / SCENE_DURATION_MS);
      const sceneProgress = (cycleTime % SCENE_DURATION_MS) / SCENE_DURATION_MS;

      setScene(currentSceneIndex);
      setProgress(sceneProgress);

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  const typeTextProgress = Math.min(1, progress * 1.5);
  const fullSubject = "Summer Sale 2026: 20% Off VIP Early Access ✨";
  const typedSubject = fullSubject.slice(0, Math.floor(typeTextProgress * fullSubject.length));

  const fullBody =
    "Hey Alex! Your VIP preview is live. We curated this exclusive collection with our best conversion rates.";
  const typedBody = fullBody.slice(0, Math.floor(Math.max(0, (progress - 0.2) * 1.4) * fullBody.length));

  const reachedCount = Math.floor(Math.min(1, progress * 1.3) * 12450);
  const openRate = Math.min(71.6, 25 + progress * 46.6).toFixed(1);
  const revenueCount = (Math.min(1, progress * 1.2) * 8.4).toFixed(1);

  return (
    <section
      id="film"
      ref={containerRef}
      className={cn(
        "relative z-10 top-[25px] mt-12 sm:mt-14 lg:mt-16 py-3 select-none pointer-events-none",
        dark ? "bg-[#0A0E16]" : "bg-[#f7f5f0]"
      )}
    >
      <div className="mx-auto max-w-[1445px] px-4 sm:px-6 md:px-8">

        <motion.div
          style={{ scale, opacity }}
          className="relative h-[595px] sm:h-[655px] md:h-[715px] lg:h-[755px] w-full origin-bottom will-change-transform overflow-hidden rounded-[2.2rem] sm:rounded-[2.8rem] border border-black/[0.07] dark:border-white/10 bg-white dark:bg-[#0a0d15] shadow-[0_40px_120px_rgba(0,0,0,0.12)] dark:shadow-[0_40px_120px_rgba(0,0,0,0.5)] transition-colors duration-1000"
        >

          <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-[#ef5a2e]/25 blur-[120px] transition-all duration-1000" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-amber-500/20 blur-[120px] transition-all duration-1000" />

          <div className="film-hud-left absolute top-6 left-6 sm:top-8 sm:left-9 z-30 flex items-center gap-3">
            <div className="flex size-7 sm:size-8 items-center justify-center rounded-xl bg-[#ef5a2e] text-white shadow-[0_4px_18px_rgba(239,90,46,0.6)]">
              <span className="size-2 sm:size-2.5 rounded-full bg-white animate-pulse" />
            </div>
            <span className="text-xs sm:text-sm font-black uppercase tracking-[0.22em] text-[#ef5a2e]">
              NOVA AI FILM
            </span>
            <span className="film-hud-scene rounded-full bg-white/10 border border-white/10 px-2.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-bold tracking-wider text-white/80">
              SCENE 0{scene + 1} / 05
            </span>
          </div>

          <div className="film-hud-live absolute top-6 right-6 sm:top-8 sm:right-9 z-30 flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#ef5a2e] animate-ping" />
            <span className="film-hud-live-text text-[10px] sm:text-[11px] font-bold tracking-widest text-[#ef5a2e] uppercase">
              LIVE PREVIEW • 60 FPS
            </span>
          </div>

          <div
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center text-center px-6 sm:px-12 lg:px-20 transition-all duration-1000 ease-in-out",
              scene === 0
                ? "opacity-100 scale-100 pointer-events-auto"
                : "opacity-0 scale-[0.97] pointer-events-none"
            )}
          >
            <div className="max-w-3xl lg:max-w-4xl mx-auto flex flex-col items-center">
              <span className="inline-block rounded-full bg-[#ef5a2e]/20 border border-[#ef5a2e]/40 px-4 py-1.5 text-xs sm:text-sm font-extrabold uppercase tracking-widest text-[#ff7a45] mb-4 shadow-sm">
                01 · Intelligent Campaign Launch
              </span>
              <h2 className="film-hero-title text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight text-white drop-shadow-md">
                Launch campaigns. <br />
                <span className="text-[#ef5a2e]">Watch them perform.</span>
              </h2>
              <p className="mt-5 text-base sm:text-xl lg:text-2xl leading-relaxed text-slate-300 max-w-2xl font-medium">
                Self-optimizing AI models crafting magnetic email copy, precision audience segmentation, and live delivery telemetry.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <span className="rounded-full bg-white/10 border border-white/15 px-4 py-1.5 text-xs sm:text-sm font-bold text-white shadow-sm">
                  ✦ 99.8% Deliverability
                </span>
                <span className="rounded-full bg-[#ef5a2e]/25 border border-[#ef5a2e]/50 px-4 py-1.5 text-xs sm:text-sm font-bold text-[#ff8a5b]">
                  ⚡ Real-Time Telemetry
                </span>
                <span className="rounded-full bg-white/10 border border-white/15 px-4 py-1.5 text-xs sm:text-sm font-bold text-white shadow-sm">
                  🎯 Precision AI Targeting
                </span>
              </div>
            </div>
          </div>

          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center px-4 sm:px-12 transition-all duration-1000 ease-in-out",
              scene === 1
                ? "opacity-100 scale-100 pointer-events-auto"
                : "opacity-0 scale-[0.97] pointer-events-none"
            )}
          >
            <div className="w-full max-w-4xl rounded-[2.2rem] bg-[#121622] text-white border border-white/15 p-7 sm:p-10 lg:p-11 shadow-[0_30px_80px_rgba(0,0,0,0.6)]">

              <div className="film-msg-head flex items-center justify-between border-b border-white/10 pb-5">
                <div className="flex items-center gap-3">
                  <span className="size-3.5 rounded-full bg-[#ef5a2e] shadow-[0_0_12px_#ef5a2e]" />
                  <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-300">
                    02 · AI Message Crafter
                  </span>
                </div>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3.5 py-1 text-xs sm:text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  Generative Neural Engine
                </span>
              </div>

              <div className="mt-6">
                <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                  Subject Line
                </p>
                <div className="mt-2.5 min-h-[42px] text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white flex items-center">
                  <span>{typedSubject}</span>
                  <span className="inline-block size-2.5 bg-[#ef5a2e] rounded-full ml-2 animate-ping" />
                </div>
              </div>

              <div className="mt-6 border-t border-white/10 pt-6">
                <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                  Email Body
                </p>
                <div className="mt-2.5 min-h-[58px] text-base sm:text-lg lg:text-xl leading-relaxed text-slate-200 font-medium">
                  {typedBody}
                </div>
              </div>
            </div>
          </div>

          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center px-4 sm:px-12 transition-all duration-1000 ease-in-out",
              scene === 2
                ? "opacity-100 scale-100 pointer-events-auto"
                : "opacity-0 scale-[0.97] pointer-events-none"
            )}
          >
            <div className="grid w-full max-w-4xl gap-5 sm:gap-6 md:grid-cols-3">
              <div className="film-audience-card rounded-[2rem] bg-[#ef5a2e] p-7 text-white shadow-2xl flex flex-col justify-between min-h-[250px]">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider opacity-90">
                    03 · Audience Segments
                  </span>
                  <p className="mt-4 text-2xl sm:text-3xl font-black">VIP Customers</p>
                  <p className="mt-2 text-xs sm:text-sm opacity-95">2,450 contacts • 84% open rate</p>
                </div>
                <div className="mt-5 inline-block rounded-full bg-white/20 px-3.5 py-1 text-xs font-bold w-fit">
                  ✓ Priority SMTP Routing
                </div>
              </div>

              <div className="film-audience-card rounded-[2rem] bg-[#141824] border border-white/15 p-7 text-white shadow-2xl flex flex-col justify-between min-h-[250px]">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Predictive Tagging
                  </span>
                  <p className="mt-4 text-2xl sm:text-3xl font-black">Engaged Leads</p>
                  <p className="mt-2 text-xs sm:text-sm text-slate-300">6,800 contacts • Opened 3+ sends</p>
                </div>
                <div className="mt-5 inline-block rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-[#ff8a5b] w-fit">
                  ✦ Dynamic Variable Tags
                </div>
              </div>

              <div className="film-audience-card rounded-[2rem] bg-[#1a1f2e] border border-white/15 p-7 text-white shadow-2xl flex flex-col justify-between min-h-[250px]">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#ef5a2e]">
                    Smart Retargeting
                  </span>
                  <p className="mt-4 text-2xl sm:text-3xl font-black">At-Risk Winback</p>
                  <p className="mt-2 text-xs sm:text-sm text-slate-300">3,200 contacts • Auto-triggers</p>
                </div>
                <div className="mt-5 inline-block rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-[#ef5a2e] w-fit">
                  ⚡ AI Smart Schedule
                </div>
              </div>
            </div>
          </div>

          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center px-4 sm:px-12 transition-all duration-1000 ease-in-out",
              scene === 3
                ? "opacity-100 scale-100 pointer-events-auto"
                : "opacity-0 scale-[0.97] pointer-events-none"
            )}
          >
            <div className="w-full max-w-4xl rounded-[2.2rem] bg-[#121622] p-7 sm:p-10 lg:p-11 text-white shadow-[0_30px_80px_rgba(0,0,0,0.6)] border border-white/15">
              <div className="film-telemetry-head flex justify-between items-center border-b border-white/10 pb-5">
                <div>
                  <span className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-[#ef5a2e]">
                    04 · Live Performance Telemetry
                  </span>
                  <h3 className="film-telemetry-title mt-1.5 text-2xl sm:text-3xl font-black">Summer Sale VIP Campaign</h3>
                </div>
                <div className="film-telemetry-stream flex items-center gap-2.5 rounded-full bg-emerald-500/20 px-3.5 py-1 text-xs sm:text-sm font-bold text-emerald-400 border border-emerald-500/40">
                  <span className="size-2.5 rounded-full bg-emerald-400 animate-ping" />
                  STREAMING
                </div>
              </div>

              <div className="film-telemetry-grid mt-7 grid grid-cols-3 gap-5 sm:gap-6">
                <div className="rounded-2xl bg-white/5 p-5 sm:p-6 border border-white/10">
                  <p className="text-xs text-slate-400 font-medium">Inboxes Reached</p>
                  <p className="mt-2 text-2xl sm:text-4xl font-black text-white">{reachedCount.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-5 sm:p-6 border border-white/10">
                  <p className="text-xs text-slate-400 font-medium">Open Rate</p>
                  <p className="mt-2 text-2xl sm:text-4xl font-black text-[#ff6b35]">{openRate}%</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-5 sm:p-6 border border-white/10">
                  <p className="text-xs text-slate-400 font-medium">Direct Revenue</p>
                  <p className="mt-2 text-2xl sm:text-4xl font-black text-emerald-400">${revenueCount}k</p>
                </div>
              </div>
            </div>
          </div>

          <div
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center text-center px-6 transition-all duration-1000 ease-in-out",
              scene === 4
                ? "opacity-100 scale-100 pointer-events-auto"
                : "opacity-0 scale-[0.97] pointer-events-none"
            )}
          >
            <div className="size-20 sm:size-24 rounded-3xl bg-[#ef5a2e] flex items-center justify-center text-white text-3xl sm:text-4xl font-black shadow-[0_22px_60px_rgba(239,90,46,0.65)]">
              N
            </div>
            <h2 className="mt-6 text-4xl sm:text-6xl font-black tracking-tight text-white drop-shadow-lg">
              NOVA AI Marketer
            </h2>
            <p className="mt-3 text-base sm:text-xl font-semibold text-slate-300 max-w-lg">
              The high-performance AI engine for automated campaign growth.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#ef5a2e] px-7 py-2.5 text-sm sm:text-base font-bold text-white shadow-xl">
              Continuous Auto-Running Film • 60 FPS
            </div>
          </div>

          <div className="absolute bottom-0 inset-x-0 h-1.5 bg-white/10 z-30">
            <div
              className="h-full bg-gradient-to-r from-[#ef5a2e] via-amber-400 to-[#ef5a2e] transition-all duration-100 ease-linear"
              style={{ width: `${((scene + progress) / SCENES_COUNT) * 100}%` }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
