import { useEffect, useRef, useState } from "react";
import { PROVIDERS, providerById } from "../data/providers";
import {
  dynId, getModelInfo, isAutoModel, resolveAutoModel, AUTO_LABEL,
} from "../data/models";
import type { LiveCatalog } from "../lib/modelFetch";
import type { ProviderCfg } from "../lib/store";
import {
  ChevronDown, CheckIcon, BoltIcon, GiftIcon, ServerIcon, RefreshIcon, KeyIcon,
} from "./Icons";

const LIST_CAP = 60;

interface Props {
  modelId: string;
  onChange: (id: string) => void;
  cfgs: Record<string, ProviderCfg>;
  catalog: LiveCatalog;
  onRefresh: (pid: string) => Promise<void>;
  onRefreshAll: () => void;
}

export default function ModelPicker({ modelId, onChange, cfgs, catalog, onRefresh, onRefreshAll }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  const auto = isAutoModel(modelId);
  const resolved = auto ? resolveAutoModel(modelId, cfgs, catalog) : getModelInfo(modelId);
  const provider = providerById.get(resolved.providerId);

  const live = freshOf(catalog);

  /* click-outside */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, []);

  /* when the dropdown opens, pull catalogs for every reachable provider that has none yet */
  useEffect(() => {
    if (!open) return;
    PROVIDERS.forEach((p) => {
      const reachable = p.keyless || p.local || !!cfgs[p.id]?.key?.trim();
      if (reachable && !(catalog[p.id]?.models?.length)) void refresh(p.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function refresh(pid: string) {
    setBusy((s) => new Set(s).add(pid));
    try {
      await onRefresh(pid);
    } catch {
      /* provider offline — the row shows a "load models" retry */
    } finally {
      setBusy((s) => {
        const n = new Set(s);
        n.delete(pid);
        return n;
      });
    }
  }

  return (
    <div ref={ref} className="relative min-w-0">
      {/* trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="row-hl flex max-w-[min(300px,44vw)] items-center gap-2 rounded-xl px-2.5 py-2 text-[14px] font-extrabold text-text transition-all"
        title="Change model"
      >
        {auto ? (
          <span className={modelId === "auto-free" ? "text-gold" : "text-cyanic"}>
            {modelId === "auto-free" ? <GiftIcon className="h-4 w-4" /> : <ServerIcon className="h-4 w-4" />}
          </span>
        ) : (
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: provider?.accent ?? "#888" }} />
        )}
        <span className="truncate">{auto ? AUTO_LABEL[modelId] : resolved.name}</span>
        {auto && (
          <span className="hidden truncate font-mono text-[11px] font-medium text-faint sm:inline">
            → {resolved.name}
          </span>
        )}
        <ChevronDown className={`h-4 w-4 shrink-0 text-faint transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
        {/* mobile backdrop */}
        <div className="backdrop-in fixed inset-0 z-40 bg-ink/60 md:hidden" onClick={() => setOpen(false)} />
        <div className="md-picker-pop sheet-in fixed inset-x-2 bottom-2 z-50 flex max-h-[70vh] flex-col overflow-hidden rounded-3xl border border-line2 bg-panel shadow-[0_24px_70px_-12px_rgba(0,0,0,0.85)] md:absolute md:inset-auto md:left-0 md:top-full md:mt-2 md:w-[420px] md:max-w-[92vw] md:rounded-2xl">
          <div className="flex items-center justify-between border-b border-line/70 px-4 py-2.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">models · fetched live</span>
            <button
              onClick={() => {
                PROVIDERS.forEach((p) => {
                  const reachable = p.keyless || p.local || !!cfgs[p.id]?.key?.trim();
                  if (reachable) void refresh(p.id);
                });
              }}
              className="flex items-center gap-1.5 rounded-lg border border-line px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-dim transition-all hover:border-violet/50 hover:text-violet3"
              title="Re-fetch every reachable provider"
            >
              <RefreshIcon className="h-3 w-3" />
              refresh all
            </button>
          </div>

          <div className="max-h-[380px] overflow-y-auto py-1.5">
            {/* smart routing */}
            <div className="border-b border-line/70 pb-1.5">
              <p className="flex items-center gap-2 px-4 pb-1 pt-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
                <BoltIcon className="h-3 w-3 text-violet3" />
                smart routing
              </p>
              <AutoRow
                id="auto-free"
                icon={<GiftIcon className="h-3.5 w-3.5" />}
                desc="cheapest route: your keys → keyless"
                tint="text-gold"
                border="border-gold/45"
                bg="bg-gold/10"
                active={modelId === "auto-free"}
                resolvedName={resolveAutoModel("auto-free", cfgs, catalog).name}
                onPick={(id) => {
                  onChange(id);
                  setOpen(false);
                }}
              />
              <AutoRow
                id="auto-local"
                icon={<ServerIcon className="h-3.5 w-3.5" />}
                desc="Ollama · LM Studio · vLLM · llama.cpp"
                tint="text-cyanic"
                border="border-cyanic/45"
                bg="bg-cyanic/10"
                active={modelId === "auto-local"}
                resolvedName={resolveAutoModel("auto-local", cfgs, catalog).name}
                onPick={(id) => {
                  onChange(id);
                  setOpen(false);
                }}
              />
            </div>

            {/* per-provider live models */}
            {PROVIDERS.map((p) => {
              const cfg = cfgs[p.id];
              const hasKey = !!cfg?.key?.trim();
              const reachable = p.keyless || p.local || hasKey;
              const models = live[p.id] ?? [];
              const isLoading = busy.has(p.id);

              return (
                <div key={p.id}>
                  <div className="flex items-center gap-2 px-4 pb-1 pt-3">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.accent }} />
                    <span className="text-[12px] font-extrabold text-text">{p.name}</span>
                    {isLoading ? (
                      <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] text-faint">
                        <span className="h-2.5 w-2.5 animate-spin rounded-full border border-line2 border-t-violet3" />
                        fetching…
                      </span>
                    ) : models.length > 0 ? (
                      <span className="ml-auto flex items-center gap-2">
                        <span className="rounded bg-panel2 px-1.5 py-0.5 font-mono text-[9.5px] text-mint">
                          {models.length} live
                        </span>
                        <button
                          onClick={() => void refresh(p.id)}
                          className="rounded p-1 text-faint transition-colors hover:text-violet3"
                          title={`Refresh ${p.name} models`}
                        >
                          <RefreshIcon className="h-3 w-3" />
                        </button>
                      </span>
                    ) : reachable ? (
                      <button
                        onClick={() => void refresh(p.id)}
                        className="ml-auto flex items-center gap-1.5 rounded-lg border border-line px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wider text-dim transition-all hover:border-violet/50 hover:text-violet3"
                      >
                        load models
                      </button>
                    ) : (
                      <span className="ml-auto flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-wider text-faint">
                        <KeyIcon className="h-3 w-3" />
                        add key
                      </span>
                    )}
                  </div>

                  {models.length === 0 && reachable && !isLoading && (
                    <p className="px-4 pb-1 text-[11px] text-faint">
                      {p.local ? "server not reachable — check the base URL" : "nothing loaded yet"}
                    </p>
                  )}
                  {!reachable && (
                    <p className="px-4 pb-1 text-[11px] text-faint">
                      {p.keyless ? "keyless" : "free key in Settings → models appear here"}
                    </p>
                  )}

                  {models.slice(0, LIST_CAP).map((apiId) => {
                    const id = dynId(p.id, apiId);
                    const active = modelId === id;
                    return (
                      <button
                        key={id}
                        onClick={() => {
                          onChange(id);
                          setOpen(false);
                        }}
                        className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors ${
                          active ? "bg-violet/10" : "hover:bg-panel2"
                        }`}
                      >
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate font-mono text-[12px] ${active ? "font-bold text-violet3" : "text-text"}`}>
                            {apiId}
                          </span>
                        </span>
                        <span className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center ${active ? "text-violet3" : "opacity-0"}`}>
                          <CheckIcon className="h-3.5 w-3.5" />
                        </span>
                      </button>
                    );
                  })}
                  {models.length > LIST_CAP && (
                    <p className="px-4 py-1 font-mono text-[10px] text-faint">
                      + {models.length - LIST_CAP} more — type the exact id in a request if needed
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        </>
      )}
    </div>
  );
}

function freshOf(catalog: LiveCatalog): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [pid, entry] of Object.entries(catalog)) {
    if (entry?.models?.length) out[pid] = entry.models;
  }
  return out;
}

function AutoRow({
  id, icon, desc, tint, border, bg, active, resolvedName, onPick,
}: {
  id: string;
  icon: React.ReactNode;
  desc: string;
  tint: string;
  border: string;
  bg: string;
  active: boolean;
  resolvedName: string;
  onPick: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onPick(id)}
      className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors ${active ? bg : "hover:bg-panel2"}`}
    >
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${border} ${tint}`}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[13px] ${active ? `font-bold ${tint}` : "font-semibold text-text"}`}>
          {AUTO_LABEL[id]}
        </span>
        <span className="block truncate font-mono text-[10.5px] text-faint">
          {desc} · now → <span className="text-dim">{resolvedName}</span>
        </span>
      </span>
      <span className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center ${active ? tint : "opacity-0"}`}>
        <CheckIcon className="h-3.5 w-3.5" />
      </span>
    </button>
  );
}
