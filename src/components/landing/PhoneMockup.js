import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Battery,
  Bell,
  CalendarDays,
  ChartBar,
  Eye,
  List,
  Mail,
  MousePointerClick,
  Newspaper,
  Send,
  Signal,
  Star,
  Users,
  Wifi,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { landingAccent } from "./landingTheme";
import { PhoneDock } from "./PhoneDock";
import { PhoneFeed } from "./PhoneFeed";

const phoneScreens = [
  {
    title: "Overview",
    hey: "Hey! Your last send reached 12.4k inboxes.",
    rows: [
      { icon: List, label: "Campaigns sent", value: "12", tint: "bg-violet-500" },
      { icon: Eye, label: "Opened", value: "71.6%", tint: "bg-emerald-500" },
      { icon: MousePointerClick, label: "Clicked", value: "26%", tint: "bg-orange-500" },
    ],
    asideTitle: "That's roughly:",
    extras: ["8.9k people opened Summer Sale", "3.2k clicked through to shop", "VIP list at 64% open rate"],
  },
  {
    title: "Campaigns",
    hey: "Summer Sale is your top performer this week.",
    rows: [
      { icon: Mail, label: "Summer Sale sent", value: "12.4k", tint: "bg-violet-500" },
      { icon: CalendarDays, label: "Scheduled next", value: "Aug 30", tint: "bg-emerald-500" },
      { icon: ChartBar, label: "Best click rate", value: "26%", tint: "bg-orange-500" },
    ],
    asideTitle: "In the queue:",
    extras: ["Weekly Newsletter #42 · scheduled", "Nova Pro launch · draft", "Holiday Early Access · sent"],
  },
  {
    title: "Tracking",
    hey: "216 clicks landed in the last 24 hours.",
    rows: [
      { icon: MousePointerClick, label: "Clicks today", value: "216", tint: "bg-orange-500" },
      { icon: Eye, label: "Unique opens", value: "842", tint: "bg-emerald-500" },
      { icon: Mail, label: "Bounces", value: "9", tint: "bg-violet-500" },
    ],
    asideTitle: "Latest events:",
    extras: ["priya@atelier.co opened Summer Sale", "marcus@northline.io clicked CTA", "lena@brightlab.com opened #41"],
  },
  {
    title: "Network",
    hey: "4 creators are ready for your next collab.",
    rows: [
      { icon: Users, label: "Saved influencers", value: "18", tint: "bg-violet-500" },
      { icon: Star, label: "Active outreach", value: "4", tint: "bg-emerald-500" },
      { icon: Newspaper, label: "Newsletter list", value: "6.1k", tint: "bg-orange-500" },
    ],
    asideTitle: "This week:",
    extras: ["Maya @studiohue replied to pitch", "VIP list grew by 214 subscribers", "Draft: Creator drop with Arjun"],
  },
];

const phonePopups = [
  { title: "Campaign sent", body: "Summer Sale reached 12.4k inboxes.", icon: Send },
  { title: "New open", body: "priya@atelier.co opened Newsletter #42.", icon: Eye },
  { title: "Click tracked", body: "marcus@northline.io hit the shop CTA.", icon: MousePointerClick },
  { title: "Reminder", body: "Nova Pro launch is still in draft.", icon: Bell },
];

const phoneSwipe = {
  enter: (dir) => ({ x: dir > 0 ? "110%" : "-110%", opacity: 0.55 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? "-110%" : "110%", opacity: 0.55 }),
};

export function PhoneMockup({ dark }) {
  const acc = landingAccent(dark);
  const [page, setPage] = useState(0);
  const [dir, setDir] = useState(1);
  const [popup, setPopup] = useState(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      setDir((current) => current * -1);
      setPage((current) => (current + 1) % phoneScreens.length);
    }, 5600);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let hideTimer;
    const showPopup = () => {
      setPopup((current) => {
        let next = phonePopups[Math.floor(Math.random() * phonePopups.length)];
        if (current && next.title === current.title) {
          next = phonePopups[(phonePopups.findIndex((item) => item.title === current.title) + 1) % phonePopups.length];
        }
        return { ...next, id: Date.now() };
      });
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => setPopup(null), 2800);
    };

    const start = window.setTimeout(showPopup, 3800);
    const loop = window.setInterval(showPopup, 9200);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(hideTimer);
      window.clearInterval(loop);
    };
  }, []);

  const data = phoneScreens[page];

  return (
    <div className="relative mx-auto w-[min(100%,320px)] sm:w-[352px] lg:w-[384px]">
      <span className="absolute -left-[3px] top-[86px] h-6 w-[3px] rounded-l-sm bg-[#e56a18]" />
      <span className="absolute -left-[3px] top-[118px] h-[46px] w-[3px] rounded-l-sm bg-[#e56a18]" />
      <span className="absolute -left-[3px] top-[172px] h-[46px] w-[3px] rounded-l-sm bg-[#e56a18]" />
      <span className="absolute -right-[3px] top-[136px] h-[64px] w-[3px] rounded-r-sm bg-[#e56a18]" />

      <div className="rounded-[2.7rem] bg-[#f77e2d] p-[7px] shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_28px_60px_rgba(231,106,24,0.35)] sm:rounded-[2.9rem]">
        <div className="rounded-[2.28rem] bg-black p-[9px] sm:rounded-[2.48rem]">
          <div className="relative overflow-hidden rounded-[1.7rem] sm:rounded-[1.85rem]">
            <div className="relative h-[560px] sm:h-[620px] lg:h-[660px]">
              <div className="absolute inset-0 bg-[#efe8dc]" />
              <div className={cn("pointer-events-none absolute -left-10 top-16 size-48 rounded-full blur-3xl", acc.glow)} />
              <div className="pointer-events-none absolute -right-8 bottom-24 size-56 rounded-full bg-[#f4c7a8]/70 blur-3xl" />
              <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:radial-gradient(rgba(80,50,30,0.55)_0.6px,transparent_0.6px)] [background-size:9px_9px]" />

              <div className="absolute inset-0 overflow-hidden">
                <AnimatePresence initial={false} custom={dir}>
                  <motion.div
                    key={data.title}
                    custom={dir}
                    variants={phoneSwipe}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "spring", stiffness: 260, damping: 30 }}
                    className="absolute inset-0 overflow-hidden"
                  >
                    <div className="phone-feed-scroll no-scrollbar overflow-hidden hover:[animation-play-state:paused]">
                      <PhoneFeed data={data} dark={dark} />
                      <div aria-hidden="true">
                        <PhoneFeed data={data} dark={dark} />
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <AnimatePresence>
                {popup && (
                  <motion.div
                    key={popup.id}
                    initial={{ y: -28, opacity: 0, scale: 0.94 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -18, opacity: 0, scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 380, damping: 28 }}
                    className="absolute inset-x-3 top-[46px] z-50"
                  >
                    <div className="flex items-start gap-3 rounded-[1.15rem] border border-white/70 bg-white/80 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.16)] backdrop-blur-2xl">
                      <span className={cn("grid size-9 shrink-0 place-items-center rounded-full text-white", acc.bg)}>
                        {(() => {
                          const PopupIcon = popup.icon;
                          return <PopupIcon className="size-4" />;
                        })()}
                      </span>
                      <div className="min-w-0 pt-0.5">
                        <p className="text-[12px] font-semibold text-neutral-950">{popup.title}</p>
                        <p className="text-[11px] leading-snug text-neutral-600">{popup.body}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="pointer-events-none absolute left-1/2 top-[10px] z-40 h-[22px] w-[104px] -translate-x-1/2 rounded-full bg-neutral-950 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]" />

              <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between px-7 pt-3 text-[12px] font-semibold text-neutral-950">
                <span>9:41</span>
                <div className="flex items-center gap-1">
                  <Signal className="size-3.5" />
                  <Wifi className="size-3.5" />
                  <Battery className="size-4" />
                </div>
              </div>

              <PhoneDock dark={dark} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
