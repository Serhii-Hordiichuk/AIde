import { useCallback, useEffect, useMemo, useState } from "react";
import { PROVIDERS } from "./data/providers";
import { DEFAULT_MODEL_ID } from "./data/models";
import {
  load, save, newConversation, DEFAULT_PARAMS,
  type Conversation, type GenParams, type ProviderCfg,
} from "./lib/store";
import ChatView from "./components/ChatView";
import ModelsPage from "./pages/ModelsPage";
import AgentsPage from "./pages/AgentsPage";
import ProvidersPage from "./pages/ProvidersPage";
import { Logo, ChatIcon, GridIcon, BotIcon, KeyIcon } from "./components/Icons";

type Page = "chat" | "models" | "agents" | "providers";

const NAV: { id: Page; label: string; icon: (p: { className?: string }) => React.ReactNode }[] = [
  { id: "chat", label: "Плейграунд", icon: (p) => <ChatIcon {...p} /> },
  { id: "models", label: "Моделі", icon: (p) => <GridIcon {...p} /> },
  { id: "agents", label: "Агенти-кодери", icon: (p) => <BotIcon {...p} /> },
  { id: "providers", label: "Провайдери", icon: (p) => <KeyIcon {...p} /> },
];

export default function App() {
  const [page, setPage] = useState<Page>("chat");

  const [convs, setConvs] = useState<Conversation[]>(() => {
    const stored = load<Conversation[]>("qs.convs", []);
    return stored.length ? stored : [newConversation(DEFAULT_MODEL_ID)];
  });
  const [activeId, setActiveId] = useState<string>(() => load("qs.active", convs[0]?.id ?? ""));
  const [modelId, setModelId] = useState<string>(() => load("qs.model", DEFAULT_MODEL_ID));
  const [params, setParams] = useState<GenParams>(() => ({ ...DEFAULT_PARAMS, ...load<Partial<GenParams>>("qs.params", {}) }));
  const [cfgs, setCfgs] = useState<Record<string, ProviderCfg>>(() => {
    const stored = load<Record<string, ProviderCfg>>("qs.cfgs", {});
    const merged: Record<string, ProviderCfg> = {};
    for (const p of PROVIDERS) {
      const s = stored[p.id];
      merged[p.id] = { key: s?.key ?? "", baseUrl: s?.baseUrl ?? p.baseUrl };
    }
    return merged;
  });

  useEffect(() => save("qs.convs", convs), [convs]);
  useEffect(() => save("qs.active", activeId), [activeId]);
  useEffect(() => save("qs.model", modelId), [modelId]);
  useEffect(() => save("qs.params", params), [params]);
  useEffect(() => save("qs.cfgs", cfgs), [cfgs]);

  const active = useMemo(() => convs.find((c) => c.id === activeId) ?? convs[0] ?? null, [convs, activeId]);

  const patchConv = useCallback((id: string, fn: (c: Conversation) => Conversation) => {
    setConvs((prev) => prev.map((c) => (c.id === id ? fn(c) : c)));
  }, []);

  const handleNew = useCallback(() => {
    const c = newConversation(load("qs.model", DEFAULT_MODEL_ID));
    setConvs((prev) => [c, ...prev]);
    setActiveId(c.id);
    setPage("chat");
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      setConvs((prev) => {
        const next = prev.filter((c) => c.id !== id);
        const fallback = next.length ? next : [newConversation(load("qs.model", DEFAULT_MODEL_ID))];
        if (id === activeId) setActiveId(fallback[0].id);
        return fallback;
      });
    },
    [activeId]
  );

  const hasLive = useMemo(() => Object.values(cfgs).some((c) => c.key?.trim()), [cfgs]);

  return (
    <div className="relative flex h-dvh overflow-hidden">
      {/* амбієнтний фон */}
      <div className="scene" aria-hidden>
        <div className="glow glow-a" />
        <div className="glow glow-b" />
        <div className="glow glow-c" />
        <div className="grid-overlay" />
        <div className="noise" />
        <div className="vignette" />
      </div>

      {/* ---- рейка навігації ---- */}
      <nav className="relative z-20 flex w-[64px] shrink-0 flex-col items-center border-r border-line bg-ink-900/70 py-4 backdrop-blur">
        <div className="mb-6 flex flex-col items-center gap-1.5" title="QStudio Fork — мультипровайдерний форк Qwen Studio">
          <Logo className="h-9 w-9" />
          <span className="font-mono text-[8.5px] uppercase tracking-[0.18em] text-faint">fork</span>
        </div>

        <div className="flex flex-col gap-1.5">
          {NAV.map((n) => {
            const isActive = page === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setPage(n.id)}
                title={n.label}
                className={`group relative flex h-11 w-11 items-center justify-center rounded-lg transition-all ${
                  isActive ? "bg-ink-700 text-ember" : "text-faint hover:bg-ink-800 hover:text-dim"
                }`}
              >
                <span
                  className={`absolute -left-[13px] h-5 w-[3px] rounded-r transition-all ${
                    isActive ? "bg-ember opacity-100" : "opacity-0"
                  }`}
                />
                {n.icon({ className: "h-[19px] w-[19px]" })}
                <span className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-md border border-line bg-ink-800 px-2.5 py-1.5 text-[12px] text-fog opacity-0 shadow-xl transition-all group-hover:opacity-100">
                  {n.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-auto flex flex-col items-center gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
              hasLive ? "border-mint/40 bg-mint/10" : "border-ember/40 bg-ember/10"
            }`}
            title={hasLive ? "Є ключі API — live-режим доступний" : "Демо-режим: додай ключі на сторінці «Провайдери»"}
          >
            <span className={`h-2 w-2 rounded-full ${hasLive ? "pulse-live bg-mint" : "animate-pulse bg-ember"}`} />
          </div>
          <span className="font-mono text-[8.5px] text-faint" style={{ writingMode: "vertical-rl" }}>
            v2.6 · {PROVIDERS.length} провайдерів
          </span>
        </div>
      </nav>

      {/* ---- контент ---- */}
      <main className="relative z-10 min-w-0 flex-1">
        {page === "chat" && (
          <ChatView
            convs={convs}
            active={active}
            onSelect={setActiveId}
            onNew={handleNew}
            onDelete={handleDelete}
            patchConv={patchConv}
            modelId={modelId}
            onModel={setModelId}
            params={params}
            onParams={setParams}
            cfgs={cfgs}
          />
        )}
        {page !== "chat" && (
          <div key={page} className="anim-fade-up h-full overflow-y-auto">
            {page === "models" && (
              <ModelsPage
                modelId={modelId}
                onPick={(id) => {
                  setModelId(id);
                  setPage("chat");
                }}
              />
            )}
            {page === "agents" && <AgentsPage />}
            {page === "providers" && <ProvidersPage cfgs={cfgs} onCfgs={setCfgs} />}
          </div>
        )}
      </main>
    </div>
  );
}
