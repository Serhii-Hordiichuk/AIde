import { useEffect, useMemo, useRef, useState } from "react";
import { MODELS, modelById, fmtCtx, fmtPrice, type ModelInfo } from "../data/models";
import { PROVIDERS, providerById } from "../data/providers";
import type { ProviderCfg } from "../lib/store";
import { ChevronDown, SearchIcon, BoltIcon, ChipIcon, GlobeIcon } from "./Icons";

interface Props {
  modelId: string;
  onChange: (id: string) => void;
  cfgs: Record<string, ProviderCfg>;
}

function ProviderDot({ providerId, cfgs }: { providerId: string; cfgs: Record<string, ProviderCfg> }) {
  const p = providerById.get(providerId)!;
  const hasKey = !!cfgs[providerId]?.key?.trim();
  const color = p.local ? "#2dd4bf" : hasKey ? "#3ecf8e" : "#3a4a63";
  return <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: color }} title={p.local ? "локальний рантайм" : hasKey ? "ключ підключено" : "демо-режим"} />;
}

function ModelRow({ m, active, onSelect, cfgs }: { m: ModelInfo; active: boolean; onSelect: () => void; cfgs: Record<string, ProviderCfg> }) {
  const p = providerById.get(m.providerId)!;
  return (
    <button
      onClick={onSelect}
      className={`group flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors ${
        active ? "bg-ink-700/70" : "hover:bg-ink-800"
      }`}
    >
      <ProviderDot providerId={m.providerId} cfgs={cfgs} />
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-[13px] font-medium ${active ? "text-ember" : "text-fog"}`}>{m.name}</span>
        <span className="block truncate text-[11px] text-faint">{p.name}</span>
      </span>
      {m.reasoning && <span title="мислення (reasoning)" className="rounded border border-lilac/30 px-1 font-mono text-[9.5px] uppercase text-lilac">R</span>}
      {m.vision && <span title="бачення" className="rounded border border-cyanic/30 px-1 font-mono text-[9.5px] uppercase text-cyanic">V</span>}
      {m.open && <span title="відкриті ваги" className="rounded border border-tealic/30 px-1 font-mono text-[9.5px] uppercase text-tealic">OW</span>}
      <span className="w-14 text-right font-mono text-[11px] text-dim">{fmtCtx(m.ctx)}</span>
      <span className="w-20 text-right font-mono text-[10.5px] text-faint">{fmtPrice(m)}</span>
    </button>
  );
}

export default function ModelPicker({ modelId, onChange, cfgs }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const model = modelById.get(modelId) ?? MODELS[0];
  const provider = providerById.get(model.providerId)!;

  useEffect(() => {
    if (!open) return;
    const h = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", h);
    return () => document.removeEventListener("pointerdown", h);
  }, [open]);

  const groups = useMemo(() => {
    const query = q.trim().toLowerCase();
    const filtered = MODELS.filter(
      (m) =>
        !query ||
        m.name.toLowerCase().includes(query) ||
        m.apiId.toLowerCase().includes(query) ||
        providerById.get(m.providerId)!.name.toLowerCase().includes(query) ||
        m.tags.some((t) => t.toLowerCase().includes(query))
    );
    const cloud = filtered.filter((m) => !providerById.get(m.providerId)!.local);
    const local = filtered.filter((m) => providerById.get(m.providerId)!.local);
    return { cloud, local };
  }, [q]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`group flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-all ${
          open ? "border-ember/50 bg-ink-800 shadow-[0_0_0_3px_rgba(255,180,84,0.1)]" : "border-line bg-ink-850 hover:border-line2 hover:bg-ink-800"
        }`}
      >
        <span className="h-2 w-2 rounded-full transition-transform group-hover:scale-125" style={{ background: provider.accent }} />
        <span className="max-w-[220px] truncate text-left">
          <span className="block text-[13px] font-semibold leading-tight text-fog">{model.name}</span>
          <span className="block font-mono text-[10.5px] leading-tight text-faint">
            {provider.name} · {fmtCtx(model.ctx)}
          </span>
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-faint transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="anim-pop absolute left-0 top-full z-40 mt-2 w-[560px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-line bg-ink-900/98 shadow-2xl shadow-black/60 backdrop-blur">
          <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
            <SearchIcon className="h-3.5 w-3.5 text-faint" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Пошук: назва, провайдер, тег (код, мислення, 1M ctx)…"
              className="w-full bg-transparent text-[13px] text-fog outline-none placeholder:text-faint"
            />
            <span className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-dim">{MODELS.length}</span>
          </div>
          <div className="max-h-[420px] overflow-y-auto py-1">
            <div className="flex items-center gap-2 px-3 pb-1 pt-2.5">
              <GlobeIcon className="h-3 w-3 text-ember" />
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">Хмара · агрегатори та API</span>
            </div>
            {groups.cloud.map((m) => (
              <ModelRow key={m.id} m={m} cfgs={cfgs} active={m.id === modelId} onSelect={() => { onChange(m.id); setOpen(false); }} />
            ))}
            <div className="mt-1.5 flex items-center gap-2 border-t border-line px-3 pb-1 pt-2.5">
              <ChipIcon className="h-3 w-3 text-tealic" />
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">Локальні рантайми · $0</span>
            </div>
            {groups.local.map((m) => (
              <ModelRow key={m.id} m={m} cfgs={cfgs} active={m.id === modelId} onSelect={() => { onChange(m.id); setOpen(false); }} />
            ))}
            {groups.cloud.length === 0 && groups.local.length === 0 && (
              <p className="px-4 py-6 text-center text-[13px] text-faint">Нічого не знайдено за запитом «{q}»</p>
            )}
          </div>
          <div className="flex items-center gap-4 border-t border-line bg-ink-850 px-3 py-2 font-mono text-[10px] text-faint">
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-mint" /> ключ є</span>
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-tealic" /> локально</span>
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-ink-600" /> демо</span>
            <span className="ml-auto flex items-center gap-1 text-ember"><BoltIcon className="h-3 w-3" /> R — reasoning · V — vision · OW — open weights</span>
          </div>
        </div>
      )}
    </div>
  );
}

export { ProviderDot };
export const CLOUD_PROVIDERS = PROVIDERS.filter((p) => !p.local);
