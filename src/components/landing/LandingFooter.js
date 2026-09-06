import React from "react";
import { ArrowUp } from "lucide-react";
import { navFrame } from "./landingTheme";
import { NovaMark } from "./NovaMark";

const socials = [
  {
    label: "Threads",
    href: "https://www.threads.net",
    icon: (
      <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor" aria-hidden>
        <path d="M16.5 12.1c-.1-2.2-1.3-3.7-3.7-3.8-1.3 0-2.4.5-2.9 1.3l1.2.8c.3-.5.9-.8 1.7-.8 1.3.1 2 1 2.1 2.4-.5-.3-1.1-.4-1.8-.4-1.8 0-3 .9-3 2.4 0 1.4 1.1 2.3 2.6 2.3 1.1 0 2-.5 2.5-1.3.3.8.8 1.5 1.4 2 .7.6 1.6 1 2.6 1.1v-1.5c-.6 0-1.1-.2-1.5-.5-.4-.3-.7-.8-.9-1.4.7-.5 1.1-1.3 1.2-2.6Zm-2.6 1.7c-.3.8-.9 1.2-1.7 1.2-.7 0-1.2-.4-1.2-1.1 0-.8.7-1.3 1.8-1.3.6 0 1.1.1 1.5.3-.1.3-.2.7-.4.9Z" />
        <path d="M12.3 2C6.9 2 3.3 5.7 3.3 12s3.6 10 9 10 8.9-3.7 8.9-10S17.7 2 12.3 2Zm0 18.4c-4.4 0-7.3-3.1-7.3-8.4S7.9 3.6 12.3 3.6s7.2 3.1 7.2 8.4-2.9 8.4-7.2 8.4Z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com",
    icon: (
      <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
        <rect x="4" y="4" width="16" height="16" rx="5" />
        <circle cx="12" cy="12" r="3.4" />
        <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "Telegram",
    href: "https://telegram.org",
    icon: (
      <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor" aria-hidden>
        <path d="M20.7 4.3 3.9 10.8c-1.1.4-1.1 1.1-.2 1.4l4.3 1.3 10.4-6.6c.5-.3.9-.1.6.2l-8.4 7.6-.3 4.3c.5 0 .7-.2 1-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.2-.4-1.8-1.5-1.4Z" />
      </svg>
    ),
  },
  {
    label: "X",
    href: "https://x.com",
    icon: (
      <svg viewBox="0 0 24 24" className="size-[16px]" fill="currentColor" aria-hidden>
        <path d="M17.6 3h2.8l-6.1 7L22 21h-5.5l-4.3-5.6L7 21H4.2l6.6-7.5L2.4 3h5.6l3.9 5.2L17.6 3Zm-1 16.2h1.5L7.5 4.7H5.9l10.7 14.5Z" />
      </svg>
    ),
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com",
    icon: (
      <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor" aria-hidden>
        <path d="M14.2 3c.4 2.6 1.8 4.1 4.3 4.4v2.6c-1.5 0-2.8-.5-4.1-1.4v6.7c0 3.5-2.5 6-6.1 6-3.4 0-6-2.6-6-6s2.6-6.1 6.2-6.1c.3 0 .7 0 1 .1v2.8c-.3-.1-.6-.2-1-.2-1.9 0-3.4 1.5-3.4 3.4s1.4 3.3 3.4 3.3 3.3-1.4 3.3-3.3V3h2.4Z" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com",
    icon: (
      <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor" aria-hidden>
        <path d="M22.5 7.5s-.2-1.6-.9-2.3c-.8-.9-1.8-.9-2.2-1C16.2 4 12 4 12 4h0s-4.2 0-7.4.2c-.4 0-1.4.1-2.2 1-.7.7-.9 2.3-.9 2.3S1.3 9.4 1.3 11.3v1.4c0 1.9.2 3.8.2 3.8s.2 1.6.9 2.3c.8.9 1.9.8 2.4 1 1.7.2 7.2.2 7.2.2s4.2 0 7.4-.2c.4 0 1.4-.1 2.2-1 .7-.7.9-2.3.9-2.3s.2-1.9.2-3.8v-1.4c0-1.9-.2-3.8-.2-3.8ZM10 14.8V8.7l5.5 3.1L10 14.8Z" />
      </svg>
    ),
  },
];

const links = [
  { label: "Help Center", href: "#how-it-works" },
  { label: "Contact us", href: "mailto:hello@nova.app" },
  { label: "Privacy Policy", href: "#features" },
  { label: "Terms of Use", href: "#setup" },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-white/10">
      <div className={`flex flex-col gap-4 py-4 sm:gap-5 sm:py-5 lg:flex-row lg:items-center lg:justify-between lg:py-5 ${navFrame}`}>
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <a href="#top" className="flex items-center gap-2 text-white">
              <NovaMark className="size-7 rounded-md" dark={false} />
              <span className="text-[15px] font-semibold tracking-tight">NOVA</span>
            </a>
            <div className="flex items-center gap-1">
              {socials.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={item.label}
                  className="grid size-9 place-items-center rounded-full text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {item.icon}
                </a>
              ))}
            </div>
          </div>
          <span className="w-fit rounded-md border border-white/10 bg-black px-2.5 py-1 text-[11px] font-medium tracking-wide text-white/70">
            Campaigns · Tracking
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-3 lg:items-end">
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-white/55">
            {links.map((item) => (
              <a key={item.label} href={item.href} className="transition-colors hover:text-white">
                {item.label}
              </a>
            ))}
          </nav>
          <p className="text-[13px] text-white/40">© 2026 NOVA. All rights reserved.</p>
        </div>

        <a
          href="#top"
          aria-label="Back to top"
          className="grid size-10 shrink-0 place-items-center self-start rounded-full border border-white/15 text-white/80 transition-colors hover:bg-white/10 hover:text-white lg:self-center"
        >
          <ArrowUp className="size-4" strokeWidth={2.25} />
        </a>
      </div>
    </footer>
  );
}
