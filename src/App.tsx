import { useCallback, useEffect, useMemo, useState } from "react";
import { PROVIDERS, KIND_LABEL, type ProviderKind } from "./data/providers";
import { DEFAULT_MODEL_ID } from "./data/models";
import { pingProvider } from "./lib/llm";
import {
  load, save, uid, newConversation,
  type Conversation, type Project, type ProviderCfg,
} from "./lib/store";
import ChatMode from "./components/ChatMode";
import CoderMode from "./components/CoderMode";
import {
  Star, PlusIcon, TrashIcon, GearIcon, KeyIcon, XIcon, CheckIcon, CodeIcon, FolderIcon,
} from "./components/Icons";

type Mode = "chat" | "coder";
const KIND_ORDER: ProviderKind[] = ["aggregator", "cloud", "inference", "local"];

export default function App() {
  const [mode, setMode] = useState<Mode>("chat");

  const [convs, setConvs] = useState<Conversation[]>(() => {
    const s = load<Conversation[]>("convs", []);
    return s.length ? s : [newConversation()];
  });
  const [activeConvId, setActiveConvId] = useState<string>(() => load("activeConv", ""));
  const [projects, setProjects] = useState<Project[]>(() => load<Project[]>("projects", []));
  const [activeProjectId, setActiveProjectId] = useState<string>(() => load("activeProject", ""));
  const [modelId, setModelId] = useState<string>(() => load("model", DEFAULT_MODEL_ID));
  const [cfgs, setCfgs] = useState<Record<string, ProviderCfg>>(() => {
    const stored = load<Record<string, ProviderCfg>>("cfgs", {});
    const merged: Record<string, ProviderCfg> = {};
    for (const p of PROVIDERS) {
      const prev = stored[p.id];
      merged[p.id] = { key: prev?.key ?? "", baseUrl: prev?.baseUrl ?? p.baseUrl };
    }
    return merged;
  });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => save("convs", convs), [convs]);
  useEffect(() => save("activeConv", activeConvId), [activeConvId]);
  useEffect(() => save("projects", projects), [projects]);
  useEffect(() => save("activeProject", activeProjectId), [activeProjectId]);
  useEffect(() => save("model", modelId), [modelId]);
  useEffect(() => save("cfgs", cfgs), [cfgs]);

  const activeConv = useMemo(
    () => convs.find((c) => c.id === activeConvId) ?? convs[0],
    [convs, activeConvId]
  );
  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? null,
    [projects, activeProjectId]
  );

  const patchConv = useCallback((id: string, fn: (c: Conversation) => Conversation) => {
    setConvs((prev) => prev.map((c) => (c.id === id ? fn(c) : c)));
  }, []);

  const patchProject = useCallback((id: string, fn: (p: Project) => Project) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? fn(p) : p)));
  }, []);

  const newChat = useCallback(() => {
    const c = newConversation();
    setConvs((prev) => [c, ...prev]);
    setActiveConvId(c.id);
    setMode("chat");
  }, []);

  const deleteConv = useCallback((id: string) => {
    setConvs((prev) => {
      const next = prev.filter((c) => c.id !== id);
      const fallback = next.length ? next : [newConversation()];
      setActiveConvId((cur) => (cur === id ? fallback[0].id : cur));
      return fallback;
    });
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setActiveProjectId((cur) => (cur === id ? "" : cur));
  }, []);

  const createProject = useCallback((prompt: string) => {
    const p: Project = {
      id: uid(),
      name: prompt.slice(0, 28) + (prompt.length > 28 ? "…" : ""),
      prompt,
      templateId: "",
      files: [],
      createdAt: Date.now(),
      status: "building",
    };
    setProjects((prev) => [p, ...prev]);
    setActiveProjectId(p.id);
    setMode("coder");
    return p.id;
  }, []);

  const hasLive = useMemo(() => Object.values(cfgs).some((c) => c.key?.trim()), [cfgs]);

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* ================= САЙДБАР ================= */}
      <aside className="flex w-[248px] shrink-0 flex-col border-r border-line bg-panel/80 backdrop-blur max-sm:w-[210px]">
        <div className="flex items-center gap-2.5 px-4 pb-4 pt-5">
          <div className="star-spin">
            <Star className="h-7 w-7" />
          </div>
          <div className="leading-none">
            <p className="font-display text-[15px] font-bold tracking-tight">Qwen</p>
            <p className="mt-1 font-mono text-[8.5px] uppercase tracking-[0.22em] text-faint">studio · fork</p>
          </div>
        </div>

        <div className="px-3">
          <button onClick={newChat} className="btn-brand flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-bold text-white">
            <PlusIcon className="h-4 w-4" /> Новий чат
          </button>
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          <SectionTitle>Чати</SectionTitle>
          {convs.map((c) => (
            <div key={c.id} className={`group mb-0.5 flex items-center rounded-lg transition-colors ${c.id === activeConv?.id && mode === "chat" ? "bg-panel3" : "hover:bg-panel2"}`}>
              <button
                onClick={() => {
                  setActiveConvId(c.id);
                  setMode("chat");
                }}
                className="min-w-0 flex-1 truncate px-2.5 py-2 text-left text-[12.5px] font-medium text-text/85"
                title={c.title}
              >
                {c.title}
              </button>
              <button
                onClick={() => deleteConv(c.id)}
                className="mr-1.5 hidden shrink-0 rounded p-1 text-faint transition-colors hover:text-coral group-hover:block"
                title="Видалити чат"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          <SectionTitle className="mt-5">Проєкти Кодера</SectionTitle>
          {projects.length === 0 && (
            <p className="px-2.5 py-1 text-[11.5px] leading-relaxed text-faint">
              Поки порожньо. Відкрий вкладку Кодер і створи перший застосунок.
            </p>
          )}
          {projects.map((p) => (
            <div key={p.id} className={`group mb-0.5 flex items-center rounded-lg transition-colors ${p.id === activeProjectId && mode === "coder" ? "bg-panel3" : "hover:bg-panel2"}`}>
              <button
                onClick={() => {
                  setActiveProjectId(p.id);
                  setMode("coder");
                }}
                className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2 text-left"
                title={p.prompt}
              >
                <FolderIcon className="h-3.5 w-3.5 shrink-0 text-violet2" />
                <span className="truncate text-[12.5px] font-medium text-text/85">{p.name}</span>
                <span className={`ml-auto h-1.5 w-1.5 shrink-0 rounded-full ${p.status === "ready" ? "bg-mint" : "animate-pulse bg-solar"}`} />
              </button>
              <button
                onClick={() => deleteProject(p.id)}
                className="mr-1.5 hidden shrink-0 rounded p-1 text-faint transition-colors hover:text-coral group-hover:block"
                title="Видалити проєкт"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="border-t border-line p-3">
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-panel2 px-2.5 py-2">
            <span className={`h-2 w-2 shrink-0 rounded-full ${hasLive ? "pulse-live bg-mint" : "animate-pulse bg-solar"}`} />
            <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-dim">
              {hasLive ? "Live: ключі підключено" : "Демо-режим"}
            </span>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="row-hl flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] font-semibold text-dim"
          >
            <GearIcon className="h-4 w-4" /> Налаштування API
            <span className="ml-auto rounded border border-line px-1.5 py-0.5 font-mono text-[9px] text-faint">⌘</span>
          </button>
        </div>
      </aside>

      {/* ================= ОСНОВНА ОБЛАСТЬ ================= */}
      <main className="relative flex min-w-0 flex-1 flex-col">
        {/* перемикач режимів */}
        <div className="pointer-events-none absolute left-1/2 top-3 z-30 -translate-x-1/2">
          <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-line bg-panel/85 p-1 shadow-lg backdrop-blur">
            <ModeBtn on={mode === "chat"} onClick={() => setMode("chat")} label="Чат" />
            <ModeBtn on={mode === "coder"} onClick={() => setMode("coder")} label="Кодер" icon={<CodeIcon className="h-3.5 w-3.5" />} />
          </div>
        </div>

        <div className="min-h-0 flex-1 pt-12">
          {mode === "chat" && activeConv && (
            <ChatMode
              conv={activeConv}
              patchConv={patchConv}
              cfgs={cfgs}
              modelId={modelId}
              onModel={setModelId}
            />
          )}
          {mode === "coder" && (
            <CoderMode
              project={activeProject}
              projects={projects}
              patchProject={patchProject}
              createProject={createProject}
              cfgs={cfgs}
              modelId={modelId}
            />
          )}
        </div>
      </main>

      {showSettings && <SettingsModal cfgs={cfgs} onCfgs={setCfgs} onClose={() => setShowSettings(false)} />}
    </div>
  );
}

function SectionTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`px-2.5 pb-1.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-faint ${className}`}>{children}</p>;
}

function ModeBtn({ on, onClick, label, icon }: { on: boolean; onClick: () => void; label: string; icon?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-[12.5px] font-bold transition-all ${
        on ? "bg-violet/16 text-violet2" : "text-dim hover:text-text"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

/* ================= НАЛАШТУВАННЯ ================= */

function SettingsModal({
  cfgs,
  onCfgs,
  onClose,
}: {
  cfgs: Record<string, ProviderCfg>;
  onCfgs: (c: Record<string, ProviderCfg>) => void;
  onClose: () => void;
}) {
  const [pingState, setPingState] = useState<Record<string, string>>({});

  const setCfg = (id: string, patch: Partial<ProviderCfg>) => {
    onCfgs({ ...cfgs, [id]: { ...cfgs[id], ...patch } });
  };

  async function test(pid: string) {
    const p = PROVIDERS.find((x) => x.id === pid)!;
    setPingState((s) => ({ ...s, [pid]: "…" }));
    const r = await pingProvider(p, cfgs[pid]);
    setPingState((s) => ({ ...s, [pid]: r.ok ? `✓ ${r.info}` : `✗ ${r.info}` }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="anim-rise flex max-h-[86vh] w-full max-w-[680px] flex-col overflow-hidden rounded-2xl border border-line2 bg-panel shadow-[0_40px_90px_-20px_rgba(0,0,0,.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <KeyIcon className="h-5 w-5 text-violet2" />
          <div>
            <h2 className="text-[15px] font-bold">Ключі API провайдерів</h2>
            <p className="text-[11.5px] text-faint">Зберігаються лише у вашому браузері (localStorage). Порожній ключ = демо-режим.</p>
          </div>
          <button onClick={onClose} className="icon-btn ml-auto" title="Закрити">
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {KIND_ORDER.map((kind) => {
            const list = PROVIDERS.filter((p) => p.kind === kind);
            if (!list.length) return null;
            return (
              <div key={kind} className="mb-5">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
                  {KIND_LABEL[kind]} · {list.length}
                </p>
                <div className="space-y-1.5">
                  {list.map((p) => {
                    const cfg = cfgs[p.id];
                    const hasKey = !!cfg?.key?.trim();
                    return (
                      <div key={p.id} className={`rounded-xl border px-3.5 py-2.5 transition-colors ${hasKey ? "border-mint/30 bg-mint/4" : "border-line bg-panel2"}`}>
                        <div className="flex items-center gap-2.5">
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.accent }} />
                          <span className="text-[13px] font-bold">{p.name}</span>
                          {hasKey && <CheckIcon className="h-3.5 w-3.5 text-mint" />}
                          <span className="ml-auto hidden font-mono text-[10px] text-faint md:block">{p.keyName ?? "—"}</span>
                          {p.keyUrl && (
                            <a href={p.keyUrl} target="_blank" rel="noreferrer" className="font-mono text-[10.5px] text-violet2 underline decoration-violet2/40 underline-offset-2 hover:decoration-violet2">
                              ключ ↗
                            </a>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="password"
                            value={cfg?.key ?? ""}
                            onChange={(e) => setCfg(p.id, { key: e.target.value })}
                            placeholder={p.keyName ?? "API-ключ"}
                            autoComplete="off"
                            className="field field-mono flex-1 !py-1.5 text-[12px]"
                          />
                          <button
                            onClick={() => test(p.id)}
                            disabled={!hasKey}
                            className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-[11.5px] font-semibold text-dim transition-all hover:border-violet/45 hover:text-violet2 disabled:opacity-35"
                          >
                            Тест
                          </button>
                        </div>
                        {p.local && (
                          <input
                            value={cfg?.baseUrl ?? ""}
                            onChange={(e) => setCfg(p.id, { baseUrl: e.target.value })}
                            className="field field-mono mt-1.5 w-full !py-1.5 text-[11.5px]"
                            placeholder="http://localhost:…"
                          />
                        )}
                        {pingState[p.id] && (
                          <p className={`mt-1.5 font-mono text-[10.5px] ${pingState[p.id].startsWith("✓") ? "text-mint" : "text-coral"}`}>
                            {pingState[p.id]}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3 border-t border-line px-5 py-3.5">
          <p className="font-mono text-[10.5px] text-faint">
            {Object.values(cfgs).filter((c) => c.key?.trim()).length} активних ключів
          </p>
          <button
            onClick={() => {
              if (window.confirm("Стерти всі локальні дані QStudio (чати, проєкти, ключі)?")) {
                Object.keys(localStorage)
                  .filter((k) => k.startsWith("qsf."))
                  .forEach((k) => localStorage.removeItem(k));
                location.reload();
              }
            }}
            className="ml-auto rounded-lg border border-coral/40 px-3 py-1.5 text-[11.5px] font-semibold text-coral transition-colors hover:bg-coral/10"
          >
            Стерти всі дані
          </button>
          <button onClick={onClose} className="btn-brand rounded-lg px-5 py-1.5 text-[12.5px] font-bold text-white">
            Готово
          </button>
        </div>
      </div>
    </div>
  );
}
