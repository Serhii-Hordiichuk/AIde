import { useState } from "react";
import { PROVIDERS, KIND_LABEL, type ProviderInfo } from "../data/providers";
import { MODELS } from "../data/models";
import type { ProviderCfg } from "../lib/store";
import { testConnection, type ConnState } from "../lib/llm";
import { useReveal } from "../lib/useReveal";
import { KeyIcon, ServerIcon, GlobeIcon, BoltIcon, ExtIcon, CheckIcon } from "../components/Icons";

interface Props {
  cfgs: Record<string, ProviderCfg>;
  onCfgs: (next: Record<string, ProviderCfg>) => void;
}

export default function ProvidersPage({ cfgs, onCfgs }: Props) {
  const ref = useReveal<HTMLDivElement>([]);
  const cloud = PROVIDERS.filter((p) => !p.local);
  const local = PROVIDERS.filter((p) => p.local);
  const keyed = Object.values(cfgs).filter((c) => c.key?.trim()).length;

  return (
    <div ref={ref} className="relative z-10 mx-auto w-full max-w-6xl px-5 py-8 max-md:px-4">
      <div className="reveal">
        <p className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ember">
          <KeyIcon className="h-3.5 w-3.5" /> ключі та ендпоінти
        </p>
        <h1 className="font-display text-[clamp(26px,3.4vw,40px)] font-bold leading-tight text-fog">Провайдери</h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-dim">
          {PROVIDERS.length} бекендів: {cloud.length} хмарних агрегаторів і API + {local.length} локальних рантаймів.
          Ключі зберігаються <strong className="text-fog">лише у твоєму браузері</strong> (localStorage) і нікуди не надсилаються, крім офіційних API провайдерів.
        </p>
      </div>

      <div className={`reveal mt-5 flex items-start gap-3 rounded-xl border px-4 py-3.5 ${keyed > 0 ? "border-mint/30 bg-mint/6" : "border-ember/30 bg-ember/6"}`}>
        {keyed > 0 ? <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-mint" /> : <BoltIcon className="mt-0.5 h-4 w-4 shrink-0 text-ember" />}
        <p className="text-[13px] leading-relaxed text-dim">
          {keyed > 0 ? (
            <>Підключено ключів: <strong className="text-mint">{keyed}</strong>. Моделі цих провайдерів відповідатимуть наживо, решта — у демо-режимі.</>
          ) : (
            <>Поки ключів немає — студія працює в <strong className="text-ember">демо-режимі</strong>: вбудований симулятор чесно відповідає замість моделі. Додай хоча б один ключ (або запусти Ollama) — і чат оживе по-справжньому.</>
          )}
        </p>
      </div>

      {/* хмара */}
      <SectionHead
        icon={<GlobeIcon className="h-4 w-4" />}
        title="Хмарні агрегатори та API"
        sub={`${cloud.length} провайдерів · OpenAI-сумісні, Anthropic Messages API, Google streamGenerateContent`}
        accent="#ffb454"
      />
      <div className="mt-4 grid grid-cols-3 gap-3.5 max-xl:grid-cols-2 max-md:grid-cols-1">
        {cloud.map((p, i) => (
          <ProviderCard key={p.id} p={p} cfgs={cfgs} onCfgs={onCfgs} delay={Math.min(i, 8) * 40} />
        ))}
      </div>

      {/* локальні */}
      <div className="mt-10">
        <SectionHead
          icon={<ServerIcon className="h-4 w-4" />}
          title="Локальні рантайми"
          sub={`${local.length} серверів · ключ не потрібен, достатньо запущеного процесу · всі відповіді коштують $0`}
          accent="#2dd4bf"
        />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3.5 max-xl:grid-cols-2 max-md:grid-cols-1">
        {local.map((p, i) => (
          <ProviderCard key={p.id} p={p} cfgs={cfgs} onCfgs={onCfgs} delay={Math.min(i, 6) * 40} />
        ))}
      </div>

      <p className="mt-8 rounded-xl border border-line bg-ink-900/70 px-4 py-3.5 font-mono text-[11.5px] leading-relaxed text-faint">
        <span className="text-ember">// порада</span> — один ключ OpenRouter дає доступ до більшості хмарних моделей одразу.
        Для приватності комбінуй: чутливі дані → Ollama/vLLM локально, решта → хмара.
      </p>
    </div>
  );
}

function SectionHead({ icon, title, sub, accent }: { icon: React.ReactNode; title: string; sub: string; accent: string }) {
  return (
    <div className="reveal mt-10 first:mt-7">
      <div className="flex items-center gap-2.5">
        <span style={{ color: accent }}>{icon}</span>
        <h2 className="font-display text-[19px] font-bold text-fog">{title}</h2>
      </div>
      <p className="mt-1 text-[12.5px] text-dim">{sub}</p>
    </div>
  );
}

function ProviderCard({
  p, cfgs, onCfgs, delay,
}: {
  p: ProviderInfo;
  cfgs: Record<string, ProviderCfg>;
  onCfgs: (next: Record<string, ProviderCfg>) => void;
  delay: number;
}) {
  const cfg: ProviderCfg = cfgs[p.id] ?? { key: "", baseUrl: p.baseUrl };
  const [status, setStatus] = useState<ConnState>("idle");
  const [flash, setFlash] = useState(false);
  const modelsCount = MODELS.filter((m) => m.providerId === p.id).length;

  const update = (patch: Partial<ProviderCfg>) => {
    onCfgs({ ...cfgs, [p.id]: { ...cfg, ...patch } });
    setFlash(true);
    setTimeout(() => setFlash(false), 900);
  };

  const check = async () => {
    setStatus("checking");
    const r = await testConnection(p, cfg);
    setStatus(r);
  };

  return (
    <div
      className="reveal group flex flex-col rounded-xl border border-line bg-ink-900/70 p-4 transition-all hover:-translate-y-0.5 hover:bg-ink-850"
      style={{ transitionDelay: `${delay}ms`, borderLeft: `2px solid ${p.accent}55` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-[14.5px] font-semibold text-fog">{p.name}</h3>
          <span className="mt-1 inline-block rounded border px-1.5 py-px font-mono text-[9.5px] uppercase tracking-wider" style={{ color: p.accent, borderColor: `${p.accent}44`, background: `${p.accent}0d` }}>
            {KIND_LABEL[p.kind]}
          </span>
        </div>
        <span className="font-mono text-[10.5px] text-faint">
          {modelsCount > 0 ? `${modelsCount} моделей` : "свій ендпоінт"}
        </span>
      </div>

      <p className="mt-2.5 text-[12.5px] leading-relaxed text-dim">{p.note}</p>

      <div className="mt-3 space-y-2.5">
        <div>
          <label className="mb-1 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-faint">
            base url
            <span className={`transition-opacity ${flash ? "opacity-100 text-mint" : "opacity-0"}`}>збережено ✓</span>
          </label>
          <input
            value={cfg.baseUrl}
            onChange={(e) => update({ baseUrl: e.target.value })}
            className="field field-mono"
            spellCheck={false}
          />
        </div>
        {!p.local && (
          <div>
            <label className="mb-1 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-faint">
              api key · {p.keyName}
              {p.keyUrl && (
                <a href={p.keyUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 normal-case tracking-normal text-cyanic hover:underline">
                  де взяти <ExtIcon className="h-2.5 w-2.5" />
                </a>
              )}
            </label>
            <input
              type="password"
              value={cfg.key}
              onChange={(e) => update({ key: e.target.value })}
              placeholder={p.local ? "" : "sk-…"}
              className="field field-mono"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        )}
      </div>

      <div className="mt-auto flex items-center gap-2.5 pt-3.5">
        <button
          onClick={check}
          disabled={status === "checking" || (!p.local && !cfg.key.trim())}
          title={!p.local && !cfg.key.trim() ? "Спершу додай ключ" : undefined}
          className="rounded-lg border border-line bg-ink-800 px-3 py-1.5 text-[12px] text-dim transition-all enabled:hover:border-line2 enabled:hover:text-fog disabled:cursor-not-allowed disabled:opacity-40"
        >
          {status === "checking" ? "перевірка…" : "перевірити"}
        </button>
        <StatusBadge status={status} />
        <a
          href={p.docs}
          target="_blank"
          rel="noreferrer"
          className="ml-auto flex items-center gap-1 font-mono text-[10.5px] text-faint transition-colors hover:text-cyanic"
        >
          docs <ExtIcon className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ConnState }) {
  if (status === "ok")
    return (
      <span className="flex items-center gap-1.5 rounded-md border border-mint/40 bg-mint/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-mint">
        <span className="pulse-live h-1.5 w-1.5 rounded-full bg-mint" /> з'єднано
      </span>
    );
  if (status === "fail")
    return (
      <span className="flex items-center gap-1.5 rounded-md border border-coral/40 bg-coral/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-coral">
        <span className="h-1.5 w-1.5 rounded-full bg-coral" /> немає відповіді
      </span>
    );
  if (status === "checking")
    return (
      <span className="flex items-center gap-1.5 rounded-md border border-ember/40 bg-ember/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-ember">
        <span className="h-1.5 w-1.5 animate-ping rounded-full bg-ember" /> пінг…
      </span>
    );
  return <span className="font-mono text-[10px] uppercase tracking-wider text-faint">статус: —</span>;
}
