import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "auto" | "light" | "dark";

const KEY = "aide.theme";

export function systemTheme(): "light" | "dark" {
  try {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function loadThemeMode(): ThemeMode {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "light" || v === "dark" || v === "auto") return v;
  } catch {
    /* ignore */
  }
  return "auto";
}

export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>(loadThemeMode);
  const [resolved, setResolved] = useState<"light" | "dark">(() => {
    const m = loadThemeMode();
    return m === "auto" ? systemTheme() : m;
  });

  const apply = useCallback((m: ThemeMode) => {
    const r = m === "auto" ? systemTheme() : m;
    setResolved(r);
    const el = document.documentElement;
    el.classList.add("theme-anim");
    el.setAttribute("data-theme", r);
    try {
      localStorage.setItem(KEY, m);
    } catch {
      /* ignore */
    }
    window.setTimeout(() => el.classList.remove("theme-anim"), 300);
  }, []);

  useEffect(() => {
    apply(mode);
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      if (loadThemeMode() === "auto") apply("auto");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode, apply]);

  const setMode = useCallback((m: ThemeMode) => setModeState(m), []);

  return { mode, setMode, resolved };
}
