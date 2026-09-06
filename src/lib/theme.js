import { useEffect, useState } from "react";

const THEME_KEY = "nova-theme";

function cssHsl(name) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value ? `hsl(${value})` : "";
}

export function getTheme() {
  try {
    return window.localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "light") {
    root.classList.remove("dark");
  } else {
    root.classList.add("dark");
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", theme === "light" ? "#f7f5f0" : "#0A0E16");
  }
}

export function setTheme(theme) {
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {

  }
  applyTheme(theme);
}

export function toggleTheme() {
  const next = getTheme() === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
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
