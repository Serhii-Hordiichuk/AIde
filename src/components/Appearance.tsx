import { useI18n, LANG_OPTIONS, type Lang } from "../lib/i18n";
import type { ThemeMode } from "../lib/theme";
import { SunIcon, MoonIcon, MonitorIcon, GlobeIcon } from "./Icons";

/* Compact cycling theme button: auto → light → dark → auto */
export function ThemeToggle({ mode, setMode }: { mode: ThemeMode; setMode: (m: ThemeMode) => void }) {
  const { t } = useI18n();
  const next: Record<ThemeMode, ThemeMode> = { auto: "light", light: "dark", dark: "auto" };
  const Icon = mode === "auto" ? MonitorIcon : mode === "light" ? SunIcon : MoonIcon;
  const label = mode === "auto" ? t("ui.themeAuto") : mode === "light" ? t("ui.themeLight") : t("ui.themeDark");
  return (
    <button
      onClick={() => setMode(next[mode])}
      className="row-hl flex h-9 w-9 items-center justify-center rounded-xl border border-line text-dim transition-all hover:text-text"
      title={`${t("ui.theme")}: ${label}`}
      aria-label={t("ui.theme")}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

/* Segmented theme control (auto / light / dark) for the settings panel */
export function ThemeSegment({ mode, setMode }: { mode: ThemeMode; setMode: (m: ThemeMode) => void }) {
  const { t } = useI18n();
  const opts: { id: ThemeMode; label: string; icon: typeof SunIcon }[] = [
    { id: "auto", label: t("ui.themeAuto"), icon: MonitorIcon },
    { id: "light", label: t("ui.themeLight"), icon: SunIcon },
    { id: "dark", label: t("ui.themeDark"), icon: MoonIcon },
  ];
  return (
    <div className="flex items-center gap-1 rounded-xl border border-line bg-panel p-1">
      {opts.map((o) => (
        <button
          key={o.id}
          onClick={() => setMode(o.id)}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] font-bold transition-all ${
            mode === o.id ? "bg-panel3 text-text shadow-sm" : "text-faint hover:text-dim"
          }`}
        >
          <o.icon className="h-3.5 w-3.5" />
          <span className="max-[380px]:hidden">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

/* Language dropdown */
export function LangPicker({ compact }: { compact?: boolean }) {
  const { lang, setLang, t } = useI18n();
  const current = LANG_OPTIONS.find((l) => l.code === lang) ?? LANG_OPTIONS[0];
  return (
    <label
      className="row-hl flex cursor-pointer items-center gap-2 rounded-xl border border-line px-2.5 py-2 text-dim transition-all hover:text-text"
      title={t("ui.language")}
    >
      <GlobeIcon className="h-4 w-4 shrink-0" />
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
        className="cursor-pointer bg-transparent text-[12.5px] font-bold text-text outline-none"
        aria-label={t("ui.language")}
      >
        {LANG_OPTIONS.map((l) => (
          <option key={l.code} value={l.code} className="bg-panel text-text">
            {l.native}
          </option>
        ))}
      </select>
      {compact && <span className="sr-only">{current.label}</span>}
    </label>
  );
}
