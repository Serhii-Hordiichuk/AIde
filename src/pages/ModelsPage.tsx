import { useMemo, useState } from "react";
import { MODELS, modelById, fmtCtx, fmtPrice, type ModelInfo } from "../data/models";
import { providerById } from "../data/providers";
import { useReveal } from "../lib/useReveal";
import { SearchIcon, BoltIcon, GlobeIcon } from "../components/Icons";

interface Props {
  modelId: string;
  onPick: (id: string) => void;
}

type Filter = "all" | "cloud" | "local" | "reasoning" | "vision" | "open";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Усі" },
  { id: "cloud", label: "Хмарні" },
  { id: "local", label: "Локальні" },
  { id: "reasoning", label: "Reasoning" },
  { id: "vision", label: "Vision" },
  { id: "open", label: "Open weights" },
];

export default function ModelsPage({ modelId, onPick }: Props) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const ref = useReveal<HTMLDivElement>([filter, q]);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return MODELS.filter((m) => {
      const p = providerById.get(m.providerId)!;
      if (filter === "cloud" && p.local) return false;
      if (filter === "local" && !p.local) return false;
      if (filter === "reasoning" && !m.reasoning) return false;
      if (filter === "vision" && !m.vision) return false;
      if (filter === "open" && !m.open) return false;
      if (!query) return true;
      return (
        m.name.toLowerCase().includes(query) ||
        m.apiId.toLowerCase().includes(query) ||
        p.name.toLowerCase().includes(query) ||
        m.tags.some((t) => t.toLowerCase().includes(query))
      );
    });
  }, [q, filter]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: MODELS.length, cloud: 0, local: 0, reasoning: 0, vision: 0, open: 0 };
    for (const m of MODELS) {
      const p = providerById.get(m.providerId)!;
      if (!p.local) c.cloud++; else c.local++;
      if (m.reasoning) c.reasoning++;
      if (m.vision) c.vision++;
      if (m.open) c.open++;
    }
    return c;
  }, []);

  const cheapest = useMemo(() => {
    const priced = MODELS.filter((m) => m.priceIn !== null && m.priceIn > 0);
    return priced.reduce((a, b) => ((a.priceIn! + (a.priceOut ?? 0)) <= (b.priceIn! + (b.priceOut ?? 0)) ? a : b), priced[0]);
  }, []);

  return (
    <div ref={ref} className="relative z-10 mx-auto w-full max-w-6xl px-5 py-8 max-md:px-4">
      <div className="reveal flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ember">
            <GlobeIcon className="h-3.5 w-3.5" /> реєстр моделей
          </p>
          <h1 className="font-display text-[clamp(26px,3.4vw,40px)] font-bold leading-tight text-fog">
            Каталог моделей
          </h1>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-dim">
            {MODELS.length} моделей на {new Set(MODELS.map((m) => m.providerId)).size} провайдерах — від флагманів за ${" "}
            до локальних GGUF за $0. Клікни рядок, щоб одразу відкрити модель у чаті.
          </p>
        </div>
        <div className="reveal flex gap-3" style={{ transitionDelay: "80ms" }}>
          <Stat label="найдешевша" value={cheapest ? `${cheapest.name}` : "—"} sub={cheapest ? fmtPrice(cheapest) + " / 1M" : ""} accent="#3ecf8e" />
          <Stat label="max контекст" value="2M tok" sub="Grok 4 Fast" accent="#54c8ff" />
          <Stat label="локально" value={`$0 · ${counts.local}`} sub="Ollama / vLLM / llama.cpp" accent="#2dd4bf" />
        </div>
      </div>

      {/* фільтри */}
      <div className="reveal mt-7 flex flex-wrap items-center gap-2" style={{ transitionDelay: "120ms" }}>
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-md border px-3 py-1.5 text-[12.5px] transition-all ${
              filter === f.id
                ? "border-ember/60 bg-ember/12 font-semibold text-ember"
                : "border-line bg-ink-850 text-dim hover:border-line2 hover:text-fog"
            }`}
          >
            {f.label} <span className="ml-1 font-mono text-[10.5px] opacity-70">{counts[f.id]}</span>
          </button>
        ))}
        <div className="ml-auto flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-line bg-ink-900 px-3 py-2 transition-colors focus-within:border-ember/50 max-md:min-w-full">
          <SearchIcon className="h-3.5 w-3.5 shrink-0 text-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Пошук за назвою, API-id, тегом…"
            className="w-full bg-transparent text-[13px] text-fog outline-none placeholder:text-faint"
          />
        </div>
      </div>

      {/* таблиця */}
      <div className="reveal mt-5 overflow-hidden rounded-xl border border-line bg-ink-900/70" style={{ transitionDelay: "160ms" }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-ink-850/80">
                {["Модель", "Провайдер", "Контекст", "Ціна / 1M tok", "Можливості", ""].map((h, i) => (
                  <th key={i} className="px-4 py-3 font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-faint">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((m) => (
                <Row key={m.id} m={m} active={m.id === modelId} onPick={() => onPick(m.id)} />
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[13.5px] text-faint">
                    Нічого не знайдено. Спробуй інший запит — наприклад, «код» або «мислення».
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 font-mono text-[11px] text-faint">
        Ціни — орієнтовні, за 1 мільйон токенів (вхід / вихід). Актуальні — у документації провайдера.
      </p>
    </div>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  return (
    <div className="min-w-[150px] rounded-xl border border-line bg-ink-900/70 px-4 py-3 transition-colors hover:border-line2">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">{label}</p>
      <p className="mt-1 truncate text-[14px] font-semibold" style={{ color: accent }}>{value}</p>
      <p className="truncate font-mono text-[10.5px] text-dim">{sub}</p>
    </div>
  );
}

function Row({ m, active, onPick }: { m: ModelInfo; active: boolean; onPick: () => void }) {
  const p = providerById.get(m.providerId)!;
  return (
    <tr
      onClick={onPick}
      className={`group cursor-pointer border-b border-line/60 transition-colors last:border-0 ${
        active ? "bg-ember/8" : "hover:bg-ink-800/70"
      }`}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.accent }} />
          <div>
            <p className={`text-[13.5px] font-semibold ${active ? "text-ember" : "text-fog"}`}>{m.name}</p>
            <p className="font-mono text-[10.5px] text-faint">{m.apiId}</p>
          </div>
          {active && (
            <span className="rounded border border-ember/40 px-1.5 py-px font-mono text-[9.5px] uppercase text-ember">активна</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-[13px] text-dim">{p.name}</td>
      <td className="px-4 py-3 font-mono text-[12.5px] text-cyanic">{fmtCtx(m.ctx)}</td>
      <td className="px-4 py-3">
        <span className={`font-mono text-[12px] ${m.priceIn === null || (m.priceIn === 0 && m.priceOut === 0) ? "text-tealic" : "text-dim"}`}>
          {fmtPrice(m)}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {m.reasoning && <Tag c="#b795ff">мислення</Tag>}
          {m.vision && <Tag c="#54c8ff">vision</Tag>}
          {m.open && <Tag c="#2dd4bf">open</Tag>}
          {m.tags.slice(0, 2).map((t) => (
            <Tag key={t} c="#5e6c82">{t}</Tag>
          ))}
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="inline-flex items-center gap-1 rounded-md border border-line bg-ink-850 px-2.5 py-1.5 font-mono text-[11px] text-dim transition-all group-hover:border-ember/50 group-hover:text-ember">
          <BoltIcon className="h-3 w-3" /> у чат
        </span>
      </td>
    </tr>
  );
}

function Tag({ c, children }: { c: string; children: React.ReactNode }) {
  return (
    <span className="rounded border px-1.5 py-px font-mono text-[10px]" style={{ color: c, borderColor: `${c}44`, background: `${c}0d` }}>
      {children}
    </span>
  );
}
