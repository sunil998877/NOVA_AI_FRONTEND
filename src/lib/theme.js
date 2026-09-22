import { useEffect, useState } from "react";

const THEME_KEY = "nova-theme";

function cssHsl(name) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value ? `hsl(${value})` : "";
}

export function getTheme() {
  return "light";
}

export function applyTheme(_theme) {
  const root = document.documentElement;
  root.classList.remove("dark");
  try { window.localStorage.setItem(THEME_KEY, "light"); } catch { }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", "#f7f5f0");
}

export function setTheme(_theme) {
  applyTheme("light");
}

export function toggleTheme() {
  applyTheme("light");
  return "light";
}

export function readChartColors() {
  return {
    primary: cssHsl("--primary"),
    dim: cssHsl("--chart-2"),
    accent: cssHsl("--chart-3"),
    muted: cssHsl("--muted-foreground"),
    grid: cssHsl("--border"),
    tooltipBg: cssHsl("--popover"),
    tooltipBorder: cssHsl("--border"),
  };
}

export function useChartColors() {
  const [colors, setColors] = useState(readChartColors);
  useEffect(() => {
    const update = () => setColors(readChartColors());
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return colors;
}
