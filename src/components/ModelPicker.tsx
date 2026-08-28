import { useEffect, useRef, useState } from "react";
import { MODELS, modelById } from "../data/models";
import { PROVIDERS, providerById, KIND_LABEL } from "../data/providers";
import { ChevronDown, SearchIcon } from "./Icons";

interface Props {
  modelId: string;
  onChange: (id: string) => void;
}

export default function ModelPicker({ modelId, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const model = modelById.get(modelId) ?? MODELS[0];
  const provider = providerById.get(model.providerId);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const ql = q.trim().toLowerCase();
  const visible = MODELS.filter((m) => {
    if (!ql) return true;
    const p = providerById.get(m.providerId);
    return (m.name + " " + (p?.name ?? "") + " " + (m.tag ?? "")).toLowerCase().includes(ql);
  });

  const groups: { pid: string; pname: string; accent: string; items: typeof MODELS }[] = [];
  for (const m of visible) {
    const p = providerById.get(m.providerId)!;
    let g = groups.find((x) => x.pid === p.id);
    if (!g) {
      g = { pid: p.id, pname: p.name, accent: p.accent, items: [] };
      groups.push(g);
    }
    g.items.push(m);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex max-w-[220px] items-center gap-2 rounded-lg border border-line bg-panel2 px-3 py-1.5 text-[13px] font-semibold text-text transition-all hover:border-violet/50"
        title={`${provider?.name} · ${model.apiId}`}
      >
        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: provider?.accent }} />
        <span className="truncate">{model.name}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-faint transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="anim-rise absolute bottom-full left-0 z-50 mb-2 w-[330px] overflow-hidden rounded-xl border border-line2 bg-panel shadow-[0_24px_60px_-12px_rgba(0,0,0,.7)]">
          <div className="border-b border-line p-2.5">
            <div className="flex items-center gap-2 rounded-lg border border-line bg-panel2 px-2.5 py-1.5">
              <SearchIcon className="h-3.5 w-3.5 text-faint" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Пошук моделі чи провайдера…"
                className="w-full bg-transparent text-[13px] outline-none placeholder:text-faint"
              />
            </div>
          </div>
          <div className="max-h-[320px] overflow-y-auto p-1.5">
            {groups.length === 0 && (
              <p className="px-3 py-6 text-center text-[12.5px] text-faint">Нічого не знайдено</p>
            )}
            {groups.map((g) => (
              <div key={g.pid}>
                <p className="px-2.5 pb-1 pt-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                  {g.pname} · {KIND_LABEL[providerById.get(g.pid)!.kind]}
                </p>
                {g.items.map((m) => {
                  const active = m.id === modelId;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        onChange(m.id);
                        setOpen(false);
                        setQ("");
                      }}
                      className={`row-hl flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left ${active ? "bg-violet/15" : ""}`}
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: g.accent }} />
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-[13px] font-semibold ${active ? "text-violet2" : "text-text"}`}>
                          {m.name}
                        </span>
                        <span className="block truncate font-mono text-[10.5px] text-faint">{m.apiId}</span>
                      </span>
                      {m.tag && (
                        <span className="shrink-0 rounded border border-line px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-wide text-dim">
                          {m.tag}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <p className="border-t border-line bg-panel2 px-3 py-2 font-mono text-[10px] text-faint">
            {MODELS.length} моделей · {PROVIDERS.length} провайдерів · ключі — у ⚙ Налаштуваннях
          </p>
        </div>
      )}
    </div>
  );
}
