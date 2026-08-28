import { DEFAULT_PARAMS, type GenParams } from "../lib/store";
import { GearIcon, RefreshIcon, SparkIcon } from "./Icons";

interface Props {
  params: GenParams;
  onChange: (p: GenParams) => void;
}

function Slider({
  label, value, min, max, step, display, onChange, hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
  hint: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="font-mono text-[11px] uppercase tracking-wider text-dim">{label}</span>
        <span className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-[11px] text-ember">{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <p className="mt-1 text-[11px] leading-snug text-faint">{hint}</p>
    </div>
  );
}

export default function ParamsPanel({ params, onChange }: Props) {
  const set = (patch: Partial<GenParams>) => onChange({ ...params, ...patch });
  return (
    <aside className="flex h-full w-[264px] shrink-0 flex-col border-l border-line bg-ink-900/60">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <GearIcon className="h-4 w-4 text-ember" />
        <h2 className="font-display text-[12px] font-semibold tracking-wide text-fog">Параметри генерації</h2>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
        <Slider
          label="temperature" value={params.temperature} min={0} max={2} step={0.05}
          display={params.temperature.toFixed(2)} onChange={(v) => set({ temperature: v })}
          hint="0 — детерміновано, 1+ — креативно й непередбачувано."
        />
        <Slider
          label="top_p" value={params.topP} min={0} max={1} step={0.01}
          display={params.topP.toFixed(2)} onChange={(v) => set({ topP: v })}
          hint="Ядро вибірки: яка частка ймовірностей розглядається."
        />
        <Slider
          label="max_tokens" value={params.maxTokens} min={128} max={32768} step={128}
          display={params.maxTokens.toLocaleString("uk-UA")} onChange={(v) => set({ maxTokens: v })}
          hint="Стеля довжини відповіді у токенах."
        />

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider text-dim">system prompt</span>
            <span className="font-mono text-[10px] text-faint">{params.system.length} симв.</span>
          </div>
          <textarea
            value={params.system}
            onChange={(e) => set({ system: e.target.value })}
            rows={7}
            placeholder="Системна інструкція для моделі…"
            className="field field-mono resize-y leading-relaxed"
          />
        </div>

        <div className="rounded-lg border border-line bg-ink-850 p-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-ember">
            <SparkIcon className="h-3.5 w-3.5" />
            <span className="font-mono text-[10px] uppercase tracking-[0.14em]">Пресети</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { n: "Точно", p: { temperature: 0.1, topP: 0.9 } },
              { n: "Збалансовано", p: { temperature: 0.7, topP: 0.95 } },
              { n: "Креативно", p: { temperature: 1.3, topP: 1 } },
            ].map((pr) => (
              <button
                key={pr.n}
                onClick={() => set(pr.p)}
                className="rounded-md border border-line bg-ink-800 px-2 py-1 text-[11px] text-dim transition-all hover:border-ember/50 hover:text-ember"
              >
                {pr.n}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-line p-3">
        <button
          onClick={() => onChange({ ...DEFAULT_PARAMS })}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-ink-850 py-2 text-[12.5px] text-dim transition-all hover:border-coral/50 hover:text-coral"
        >
          <RefreshIcon className="h-3.5 w-3.5" />
          Скинути до дефолтів
        </button>
      </div>
    </aside>
  );
}
