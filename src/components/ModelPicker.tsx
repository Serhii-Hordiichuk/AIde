import { useMemo, useState } from "react";
import { MODELS, fmtCtx, modelById, type ModelInfo } from "../data/models";
import { PROVIDERS, providerById, KIND_LABEL } from "../data/providers";
import type { ProviderCfg } from "../lib/store";
import { CheckIcon, ChevronDown, SearchIcon } from "./Icons";

interface Props {
  modelId: string;
  onChange: (id: string) => void;
  cfgs: Record<string, ProviderCfg>;
}

export default function ModelPicker({ modelId, onChange, cfgs }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<string>("all");

  const current = modelById.get(modelId) ?? MODELS[0];
  const provider = providerById.get(current.providerId)!;

  const groups = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const list = MODELS.filter(
      (m) =>
        (group === "all" || m.providerId === group) &&
        (!ql ||
          m.name.toLowerCase().includes(ql) ||
          m.apiId.toLowerCase().includes(ql) ||
          m.tags.some((t) => t.toLowerCase().includes(ql)))
    );
    const map = new Map<string, ModelInfo[]>();
    for (const m of list) {
      if (!map.has(m.providerId)) map.set(m.providerId, []);
      map.get(m.providerId)!.push(m);
    }
    return PROVIDERS.filter((p) => map.has(p.id)).map((p) => ({ p, models: map.get(p.id)! }));
  }, [q, group]);

  function pick(id: string) {
    onChange(id);
    setOpen(false);
    setQ("");
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[12.5px] font-semibold transition-all ${
          open ? "border-aqua/55 bg-aqua/10 text-aqua2" : "border-line text-dim hover:border-line2 hover:text-text"
        }`}
      >
        <span className="h-2 w-2 rounded-full" style={{ background: provider.accent }} />
        <span className="max-w-[150px] truncate">{current.name}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 z-50 mb-2 w-[340px] overflow-hidden rounded-xl border border-line2 bg-panel shadow-2xl shadow-black/60">
            <div className="border-b border-line p-2.5">
              <div className="flex items-center gap-2 rounded-lg border border-line bg-panel2 px-2.5 py-1.5">
                <SearchIcon className="h-3.5 w-3.5 text-faint" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search models or providers…"
                  className="w-full bg-transparent text-[13px] outline-none placeholder:text-faint"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {["all", ...PROVIDERS.filter((p) => MODELS.some((m) => m.providerId === p.id)).map((p) => p.id)].map((id) => (
                  <button
                    key={id}
                    onClick={() => setGroup(id)}
                    className={`rounded-md px-2 py-0.5 font-mono text-[10.5px] transition-all ${
                      group === id ? "bg-aqua/15 text-aqua2" : "text-faint hover:bg-panel2 hover:text-dim"
                    }`}
                  >
                    {id === "all" ? "all" : providerById.get(id)!.name.split(" ")[0].toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="max-h-[320px] overflow-y-auto p-1.5">
              {groups.length === 0 && (
                <p className="px-3 py-6 text-center text-[12.5px] text-faint">Nothing found — try a different query</p>
              )}
              {groups.map(({ p, models }) => (
                <div key={p.id} className="mb-1">
                  <p className="flex items-center gap-2 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.accent }} />
                    {p.name}
                    <span className="normal-case tracking-normal">· {KIND_LABEL[p.kind]}</span>
                  </p>
                  {models.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => pick(m.id)}
                      className="row-hl flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 text-[13px] font-semibold text-text">
                          <span className="truncate">{m.name}</span>
                          {m.reasoning && <Badge tone="aqua">think</Badge>}
                          {m.vision && <Badge tone="cyan">vision</Badge>}
                          {m.open && <Badge tone="mint">open</Badge>}
                        </p>
                        <p className="truncate font-mono text-[10.5px] text-faint">
                          {fmtCtx(m.ctx)} ctx · {m.priceIn === null ? "free tier" : m.priceIn === 0 ? "free tier" : `$${m.priceIn}/$${m.priceOut} per 1M`}
                          {!p.local && !cfgs[p.id]?.key?.trim() && <span className="text-solar"> · no key</span>}
                        </p>
                      </div>
                      {m.id === modelId && <CheckIcon className="h-4 w-4 shrink-0 text-aqua" />}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Badge({ tone, children }: { tone: "aqua" | "mint" | "cyan"; children: React.ReactNode }) {
  const map = {
    aqua: "border-aqua/40 text-aqua2",
    mint: "border-mint/40 text-mint",
    cyan: "border-cyanic/40 text-cyanic",
  };
  return (
    <span className={`rounded border px-1 py-px font-mono text-[9px] uppercase tracking-wide ${map[tone]}`}>
      {children}
    </span>
  );
}
