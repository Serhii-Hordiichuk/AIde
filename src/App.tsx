import { useCallback, useEffect, useState } from "react";
import { PROVIDERS, providerById, KIND_LABEL } from "./data/providers";
import { MODELS, modelById, DEFAULT_MODEL_ID, isAutoModel, resolveAutoModel } from "./data/models";
import {
  load, save, newConversation, uid,
  type Conversation, type ProviderCfg, type Project,
} from "./lib/store";
import ChatMode from "./components/ChatMode";
import CoderMode from "./components/CoderMode";
import ModelPicker from "./components/ModelPicker";
import {
  BrandMark, Wordmark, PlusIcon, TrashIcon, GearIcon, XIcon, FolderIcon,
  KeyIcon, ChatIcon, CodeIcon, CheckIcon,
} from "./components/Icons";

type Mode = "chat" | "coder";

export default function App() {
  const [mode, setMode] = useState<Mode>(() => load<Mode>("mode", "chat"));

  const [convs, setConvs] = useState<Conversation[]>(() => {
    const stored = load<Conversation[]>("convs", []);
    return stored.length ? stored : [newConversation()];
  });
  const [activeId, setActiveId] = useState<string>(() => load("active", ""));
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

  const [projects, setProjects] = useState<Project[]>(() => load<Project[]>("projects", []));
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => load<string | null>("activeProject", null));
  const [showSettings, setShowSettings] = useState(false);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [confirmDelProj, setConfirmDelProj] = useState<string | null>(null);

  useEffect(() => save("convs", convs), [convs]);
  useEffect(() => save("active", activeId), [activeId]);
  useEffect(() => save("model", modelId), [modelId]);
  useEffect(() => save("cfgs", cfgs), [cfgs]);
  useEffect(() => save("projects", projects), [projects]);
  useEffect(() => save("activeProject", activeProjectId), [activeProjectId]);
  useEffect(() => save("mode", mode), [mode]);

  useEffect(() => {
    if (!convs.some((c) => c.id === activeId)) setActiveId(convs[0]?.id ?? "");
  }, [convs, activeId]);

  const active = convs.find((c) => c.id === activeId) ?? convs[0];
  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;

  const patchConv = useCallback((id: string, fn: (c: Conversation) => Conversation) => {
    setConvs((prev) => prev.map((c) => (c.id === id ? fn(c) : c)));
  }, []);

  const handleNew = useCallback(() => {
    const c = newConversation();
    setConvs((prev) => [c, ...prev]);
    setActiveId(c.id);
    setMode("chat");
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      setConvs((prev) => {
        const next = prev.filter((c) => c.id !== id);
        const fallback = next.length ? next : [newConversation()];
        if (id === activeId) setActiveId(fallback[0].id);
        return fallback;
      });
      setConfirmDel(null);
    },
    [activeId]
  );

  const createProject = useCallback((prompt: string) => {
    const p: Project = {
      id: uid(),
      name: prompt.length > 34 ? prompt.slice(0, 34) + "…" : prompt,
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

  const patchProject = useCallback((id: string, fn: (p: Project) => Project) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? fn(p) : p)));
  }, []);

  const deleteProject = useCallback(
    (id: string) => {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (activeProjectId === id) setActiveProjectId(null);
      setConfirmDelProj(null);
    },
    [activeProjectId]
  );

  const model = isAutoModel(modelId) ? resolveAutoModel(modelId, cfgs) : modelById.get(modelId) ?? MODELS[0];

  return (
    <div className="flex h-dvh overflow-hidden bg-bg">
      {/* ---------- sidebar ---------- */}
      <aside className="flex w-[262px] shrink-0 flex-col border-r border-line bg-panel max-md:w-[230px]">
        <header className="flex items-center gap-2.5 px-4 pb-2 pt-4">
          <BrandMark className="h-8 w-8" />
          <Wordmark className="text-[17px] leading-none" />
        </header>

        <div className="px-3 pt-3">
          <button
            onClick={handleNew}
            className="row-hl flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-panel2 py-2.5 text-[13.5px] font-bold text-text transition-all hover:border-line2"
          >
            <PlusIcon className="h-4 w-4 text-brand" /> New chat
          </button>
        </div>

        <div className="mt-3 flex-1 overflow-y-auto px-3 pb-3">
          <p className="px-2 pb-1.5 text-[11.5px] font-bold text-faint">Chats</p>
          <ul className="space-y-0.5">
            {convs.map((c) => (
              <li key={c.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setActiveId(c.id);
                    setMode("chat");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && (setActiveId(c.id), setMode("chat"))}
                  className={`group flex w-full cursor-pointer items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[13px] transition-all ${
                    active?.id === c.id && mode === "chat"
                      ? "bg-panel3 font-semibold text-text"
                      : "text-dim hover:bg-panel2 hover:text-text"
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate">{c.title || "New chat"}</span>
                  {confirmDel === c.id ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(c.id);
                      }}
                      onMouseLeave={() => setConfirmDel(null)}
                      className="rounded-md bg-coral/15 px-1.5 py-0.5 font-mono text-[9.5px] font-bold uppercase text-coral"
                    >
                      del?
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDel(c.id);
                      }}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                      title="Delete chat"
                    >
                      <TrashIcon className="h-3.5 w-3.5 text-faint hover:text-coral" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <p className="flex items-center justify-between px-2 pb-1.5 pt-4 text-[11.5px] font-bold text-faint">
            Coder projects
            <button
              onClick={() => setMode("coder")}
              className="rounded-md px-1.5 font-mono text-[10px] text-faint transition-colors hover:text-brand"
              title="Open Coder"
            >
              + new
            </button>
          </p>
          {projects.length === 0 ? (
            <p className="px-2 py-1 text-[11.5px] text-faint">no projects yet</p>
          ) : (
            <ul className="space-y-0.5">
              {projects.map((p) => (
                <li key={p.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setActiveProjectId(p.id);
                      setMode("coder");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && (setActiveProjectId(p.id), setMode("coder"))}
                    className={`group flex w-full cursor-pointer items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[13px] transition-all ${
                      activeProjectId === p.id && mode === "coder"
                        ? "bg-panel3 font-semibold text-text"
                        : "text-dim hover:bg-panel2 hover:text-text"
                    }`}
                  >
                    <FolderIcon className="h-3.5 w-3.5 shrink-0 opacity-50" />
                    <span className="min-w-0 flex-1 truncate">{p.name}</span>
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${p.status === "ready" ? "bg-mint" : "animate-pulse bg-gold"}`} />
                    {confirmDelProj === p.id ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteProject(p.id);
                        }}
                        onMouseLeave={() => setConfirmDelProj(null)}
                        className="rounded-md bg-coral/15 px-1.5 py-0.5 font-mono text-[9.5px] font-bold uppercase text-coral"
                      >
                        del?
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelProj(p.id);
                        }}
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                        title="Delete project"
                      >
                        <TrashIcon className="h-3.5 w-3.5 text-faint hover:text-coral" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="flex items-center gap-2 border-t border-line p-3">
          <button
            onClick={() => setShowSettings(true)}
            className="row-hl flex flex-1 items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-bold text-dim hover:text-text"
          >
            <GearIcon className="h-4 w-4" />
            Settings
          </button>
          <span
            className="flex h-8 w-8 cursor-default items-center justify-center rounded-full bg-gradient-to-br from-[#615ced] to-[#9d5cf5] text-[13px] font-extrabold text-white"
            title="Guest"
          >
            A
          </span>
        </footer>
      </aside>

      {/* ---------- main ---------- */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* header */}
        <div className="flex h-[52px] shrink-0 items-center gap-3 border-b border-line px-4">
          <ModelPicker modelId={modelId} onChange={setModelId} cfgs={cfgs} />
          <div className="ml-auto flex items-center rounded-full border border-line bg-panel p-1">
            {(
              [
                { id: "chat", label: "Chat", icon: ChatIcon },
                { id: "coder", label: "Coder", icon: CodeIcon },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition-all ${
                  mode === m.id ? "bg-panel3 text-text" : "text-dim hover:text-text"
                }`}
              >
                <m.icon className={`h-3.5 w-3.5 ${mode === m.id ? (m.id === "chat" ? "text-brand" : "text-gold") : ""}`} />
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1">
          {mode === "chat" ? (
            <ChatMode conv={active} patchConv={patchConv} cfgs={cfgs} modelId={modelId} />
          ) : (
            <CoderMode
              project={activeProject}
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

/* ---------------- settings ---------------- */

function SettingsModal({
  cfgs,
  onCfgs,
  onClose,
}: {
  cfgs: Record<string, ProviderCfg>;
  onCfgs: (c: Record<string, ProviderCfg>) => void;
  onClose: () => void;
}) {
  const [testState, setTestState] = useState<Record<string, "idle" | "busy" | "ok" | "fail">>({});

  async function test(id: string) {
    const p = providerById.get(id)!;
    const cfg = cfgs[id];
    setTestState((s) => ({ ...s, [id]: "busy" }));
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 6000);
      const headers: Record<string, string> = {};
      if (cfg.key?.trim()) {
        headers["Authorization"] = `Bearer ${cfg.key.trim()}`;
        headers["x-api-key"] = cfg.key.trim();
      }
      const res = await fetch(cfg.baseUrl.replace(/\/+$/, "") + "/models", { headers, signal: ctrl.signal });
      clearTimeout(t);
      setTestState((s) => ({ ...s, [id]: res.ok ? "ok" : "fail" }));
    } catch {
      setTestState((s) => ({ ...s, [id]: "fail" }));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal>
      <div className="anim-rise absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={onClose} />
      <div className="anim-rise relative flex max-h-[84vh] w-full max-w-2xl flex-col overflow-hidden rounded-[22px] border border-line2 bg-panel shadow-[0_30px_90px_-20px_rgba(0,0,0,0.8)]">
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <KeyIcon className="h-4 w-4 text-brand" />
          <h2 className="text-[15px] font-extrabold">Providers</h2>
          <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wider text-faint">
            all free
          </span>
          <button onClick={onClose} className="icon-btn ml-auto" title="Close">
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {(["cloud", "aggregator", "inference", "local"] as const).map((kind) => (
            <section key={kind} className="mb-5">
              <p className="overline mb-2">{KIND_LABEL[kind]}</p>
              <div className="space-y-2">
                {PROVIDERS.filter((p) => p.kind === kind).map((p) => {
                  const cfg = cfgs[p.id] ?? { key: "", baseUrl: p.baseUrl };
                  const st = testState[p.id] ?? "idle";
                  const hasKey = !!cfg.key?.trim();
                  return (
                    <div key={p.id} className="rounded-2xl border border-line bg-panel2/70 p-3 transition-colors hover:border-line2">
                      <div className="flex items-center gap-2.5">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.accent }} />
                        <span className="text-[13.5px] font-bold">{p.name}</span>
                        {p.keyless ? (
                          <span className="flex items-center gap-1 rounded-full border border-brand/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-brand">
                            <CheckIcon className="h-2.5 w-2.5" /> ready
                          </span>
                        ) : hasKey ? (
                          <span className="flex items-center gap-1 rounded-full border border-mint/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-mint">
                            <CheckIcon className="h-2.5 w-2.5" /> key set
                          </span>
                        ) : p.local ? (
                          <span className="rounded-full border border-cyanic/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-cyanic">
                            local
                          </span>
                        ) : null}
                        <a
                          href={p.keyUrl ?? p.docs}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-auto font-mono text-[10px] text-faint underline decoration-line2 underline-offset-2 transition-colors hover:text-brand"
                        >
                          {p.keyUrl ? "get free key" : "docs"}
                        </a>
                        <button
                          onClick={() => test(p.id)}
                          disabled={st === "busy"}
                          className="rounded-lg border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-dim transition-all hover:border-brand/50 hover:text-brand disabled:opacity-50"
                        >
                          {st === "busy" ? "…" : st === "ok" ? "✓" : st === "fail" ? "✕" : "test"}
                        </button>
                      </div>
                      {!p.keyless && (
                        <div className="mt-2 flex gap-2">
                          {!p.local && (
                            <input
                              type="password"
                              value={cfg.key}
                              onChange={(e) => onCfgs({ ...cfgs, [p.id]: { ...cfg, key: e.target.value } })}
                              placeholder={p.keyName ?? "API key"}
                              className="field flex-1 font-mono text-[12px]"
                              autoComplete="off"
                            />
                          )}
                          <input
                            value={cfg.baseUrl}
                            onChange={(e) => onCfgs({ ...cfgs, [p.id]: { ...cfg, baseUrl: e.target.value } })}
                            className={`field font-mono text-[11px] ${p.local ? "flex-1" : "w-[210px] max-sm:hidden"}`}
                            title="Base URL"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
