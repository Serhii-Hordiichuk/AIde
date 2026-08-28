import { useEffect, useRef, useState } from "react";
import { MODELS, modelById, fmtCtx, fmtPrice, isAutoModel, resolveAutoModel } from "../data/models";
import { PROVIDERS, providerById } from "../data/providers";
import { ChevronDown, CheckIcon, GiftIcon, BoltIcon } from "./Icons";
import type { ProviderCfg } from "../lib/store";

const AUTO_ROWS = [
  {
    id: "auto-free",
    icon: GiftIcon,
    tint: "text-gold",
    border: "border-gold/40",
    bg: "bg-gold/10",
    desc: "free tiers & local runtimes",
  },
  {
    id: "auto-price",
    icon: BoltIcon,
    tint: "text-brand",
    border: "border-brand/40",
    bg: "bg-brand/10",
    desc: "cheapest $ per 1M tokens",
  },
] as const;

interface Props {
  modelId: string;
  onChange: (id: string) => void;
  cfgs: Record<string, ProviderCfg>;
}

export default function ModelPicker({ modelId, onChange, cfgs }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const model = modelById.get(modelId) ?? MODELS[0];
  const auto = isAutoModel(modelId);
  const resolved = auto ? resolveAutoModel(modelId, cfgs) : model;
  const provider = providerById.get(resolved.providerId) ?? PROVIDERS[0];

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex max-w-[240px] items-center gap-2 rounded-lg border border-line bg-panel px-2.5 py-1.5 text-[12.5px] font-semibold transition-all hover:border-line2 hover:bg-panel3"
        title="Change model"
      >
        {auto ? (
          <span className={`shrink-0 ${modelId === "auto-free" ? "text-gold" : "text-brand"}`}>
            {modelId === "auto-free" ? <GiftIcon className="h-3.5 w-3.5" /> : <BoltIcon className="h-3.5 w-3.5" />}
          </span>
        ) : (
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: provider.accent }} />
        )}
        <span className="truncate">{model.name}</span>
        {auto && <span className="hidden truncate font-mono text-[10px] text-faint sm:inline">→ {resolved.name}</span>}
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-faint transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="anim-rise absolute bottom-full left-0 z-50 mb-2 w-[400px] max-w-[90vw] overflow-hidden rounded-xl border border-line2 bg-panel shadow-[0_24px_70px_-12px_rgba(0,0,0,0.75)]">
          <div className="border-b border-line px-4 py-2.5">
            <p className="overline">model · routed via provider</p>
          </div>
          <div className="max-h-[360px] overflow-y-auto py-1.5">
            {/* smart routing */}
            <div className="border-b border-line/70 pb-1.5">
              <p className="flex items-center gap-2 px-4 pb-1 pt-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
                <BoltIcon className="h-3 w-3 text-brand" />
                smart routing
              </p>
              {AUTO_ROWS.map((r) => {
                const active = modelId === r.id;
                const target = resolveAutoModel(r.id, cfgs);
                const Icon = r.icon;
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      onChange(r.id);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors ${
                      active ? r.bg : "hover:bg-panel2"
                    }`}
                  >
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${r.border} ${r.tint}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-[13px] ${active ? "font-bold " + r.tint : "font-semibold text-text"}`}>
                        {modelById.get(r.id)?.name}
                      </span>
                      <span className="block truncate font-mono text-[10.5px] text-faint">
                        {r.desc} · now → <span className="text-dim">{target.name}</span>
                      </span>
                    </span>
                    <span className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center ${active ? r.tint : "opacity-0"}`}>
                      <CheckIcon className="h-3.5 w-3.5" />
                    </span>
                  </button>
                );
              })}
            </div>

            {PROVIDERS.filter((p) => MODELS.some((m) => m.providerId === p.id)).map((p) => (
              <div key={p.id}>
                <p className="flex items-center gap-2 px-4 pb-1 pt-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
                  <span className="h-1 w-1 rounded-full" style={{ background: p.accent }} />
                  {p.name}
                  {cfgs[p.id]?.key?.trim() ? (
                    <span className="text-mint">· key set</span>
                  ) : p.local ? (
                    <span className="text-cyanic">· local</span>
                  ) : (
                    <span>· no key</span>
                  )}
                </p>
                {MODELS.filter((m) => m.providerId === p.id).map((m) => {
                  const active = m.id === modelId;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        onChange(m.id);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors ${
                        active ? "bg-brand/10" : "hover:bg-panel2"
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-[13px] ${active ? "font-bold text-brand" : "font-semibold text-text"}`}>
                          {m.name}
                        </span>
                        <span className="block truncate font-mono text-[10.5px] text-faint">{m.apiId}</span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block font-mono text-[10.5px] text-dim">{fmtCtx(m.ctx)} ctx</span>
                        <span className="block font-mono text-[10.5px] text-faint">{fmtPrice(m)}</span>
                      </span>
                      {m.reasoning && (
                        <span className="shrink-0 rounded border border-gold/40 px-1 py-px font-mono text-[9px] uppercase text-gold" title="Reasoning model">
                          R
                        </span>
                      )}
                      {m.vision && (
                        <span className="shrink-0 rounded border border-cyanic/40 px-1 py-px font-mono text-[9px] uppercase text-cyanic" title="Vision">
                          V
                        </span>
                      )}
                      <span className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center ${active ? "text-brand" : "opacity-0"}`}>
                        <CheckIcon className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
