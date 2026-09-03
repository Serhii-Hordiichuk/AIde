import { useI18n, UI_LANGS } from "../lib/i18n";
import type { ThemeMode } from "../lib/theme";
import { SunIcon, MoonIcon, MonitorIcon } from "./Icons";

export function ThemeToggle({ mode, setMode }: { mode: ThemeMode; setMode: (m: ThemeMode) => void }) {
  const { t } = useI18n();
  const opts: { id: ThemeMode; icon: React.ReactNode; label: string }[] = [
    { id: "auto", icon: <MonitorIcon className="h-3.5 w-3.5" />, label: t("ui.themeAuto") },
    { id: "light", icon: <SunIcon className="h-3.5 w-3.5" />, label: t("ui.themeLight") },
    { id: "dark", icon: <MoonIcon className="h-3.5 w-3.5" />, label: t("ui.themeDark") },
  ];
  return (
    <div className="flex items-center gap-0.5 rounded-full border border-line bg-panel p-0.5" role="radiogroup" aria-label={t("ui.theme")}>
      {opts.map((o) => (
        <button
          key={o.id}
          role="radio"
          aria-checked={mode === o.id}
          onClick={() => setMode(o.id)}
          title={o.label}
          className={`flex h-7 w-7 items-center justify-center rounded-full transition-all ${
            mode === o.id ? "bg-violet/20 text-violet2" : "text-faint hover:text-dim"
          }`}
        >
          {o.icon}
        </button>
      ))}
    </div>
  );
}

export function LangPicker({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, t } = useI18n();
  return (
    <select
      value={lang}
      onChange={(e) => setLang(e.target.value as typeof lang)}
      aria-label={t("ui.language")}
      title={t("ui.language")}
      className={`cursor-pointer rounded-full border border-line bg-panel text-[12px] font-bold text-dim outline-none transition-colors hover:border-line2 hover:text-text ${
        compact ? "h-7 px-2" : "px-2.5 py-1.5"
      }`}
    >
      {UI_LANGS.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  );
}
