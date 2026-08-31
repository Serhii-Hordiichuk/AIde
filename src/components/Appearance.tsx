import { useEffect, useRef, useState } from "react";
import type { ThemeMode } from "../lib/theme";
import { LANG_OPTIONS, useI18n, type Lang } from "../lib/i18n";
import { SunIcon, MoonIcon, MonitorIcon, CheckIcon, GlobeIcon } from "./Icons";

/** Theme cycler: auto → light → dark. */
export function ThemeToggle({ mode, setMode }: { mode: ThemeMode; setMode: (m: ThemeMode) => void }) {
  const next: Record<ThemeMode, ThemeMode> = { auto: "light", light: "dark", dark: "auto" };
  const Icon = mode === "light" ? SunIcon : mode === "dark" ? MoonIcon : MonitorIcon;
  const label = mode === "light" ? "ui.themeLight" : mode === "dark" ? "ui.themeDark" : "ui.themeAuto";
  return (
    <button
      onClick={() => setMode(next[mode])}
      className="row-hl flex h-8 items-center gap-1.5 rounded-lg border border-line px-2 text-dim transition-all hover:border-line2 hover:text-text"
      title={`Theme: ${label}`}
      aria-label={`Theme: ${label}`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden text-[11.5px] font-bold sm:inline">{label === "ui.themeLight" ? "☀" : label === "ui.themeDark" ? "☾" : "⚙"} </span>
    </button>
  );
}

/** Language picker popover. */
export function LangPicker({ compact }: { compact?: boolean }) {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANG_OPTIONS.find((l) => l.code === lang) ?? LANG_OPTIONS[0];

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, []);

  const pick = (code: Lang) => {
    setLang(code);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="row-hl flex h-8 items-center gap-1.5 rounded-lg border border-line px-2 text-dim transition-all hover:border-line2 hover:text-text"
        title={t("ui.language")}
        aria-label={t("ui.language")}
      >
        <GlobeIcon className="h-3.5 w-3.5" />
        <span className={`text-[11.5px] font-bold ${compact ? "hidden" : ""}`}>{current.native}</span>
      </button>
      {open && (
        <>
          <div className="backdrop-in fixed inset-0 z-40 md:hidden" onClick={() => setOpen(false)} />
          <div className="anim-rise absolute end-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl border border-line2 bg-panel py-1 shadow-xl">
            {LANG_OPTIONS.map((l) => (
              <button
                key={l.code}
                onClick={() => pick(l.code)}
                className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-[13px] transition-colors ${
                  l.code === lang ? "font-bold text-violet3" : "text-dim hover:bg-panel2 hover:text-text"
                }`}
              >
                <span>
                  {l.native}
                  <span className="ms-2 text-[10.5px] text-faint">{l.label}</span>
                </span>
                {l.code === lang && <CheckIcon className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
