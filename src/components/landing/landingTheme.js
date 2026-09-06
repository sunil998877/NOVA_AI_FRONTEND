export const LANDING_THEME_KEY = "nova-landing-theme";

export const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

export const frame = "mx-auto w-full max-w-[1120px] px-5 sm:px-8 md:px-10";
export const navFrame = "mx-auto w-full max-w-[1120px] px-5 sm:px-8 md:px-10 lg:max-w-[1360px]";

export function landingAccent(dark) {
  return {
    btn: dark ? "bg-[#14b8a6] text-white hover:bg-[#0d9488]" : "bg-[#ef5a2e] text-white hover:bg-[#dc4c22]",
    text: dark ? "text-[#14b8a6]" : "text-[#ef5a2e]",
    bg: dark ? "bg-[#14b8a6]" : "bg-[#ef5a2e]",
    glow: dark ? "bg-[#14b8a6]/25" : "bg-[#ef5a2e]/25",
  };
}
