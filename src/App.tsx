import { useCallback, useEffect, useState } from "react";
import { PROVIDERS, providerById, KIND_LABEL } from "./data/providers";
import { DEFAULT_MODEL_ID } from "./data/models";
import {
  load, save, newConversation, uid,
  type Conversation, type ProviderCfg, type Project,
} from "./lib/store";
import ChatMode from "./components/ChatMode";
import CoderMode from "./components/CoderMode";
import ModelPicker from "./components/ModelPicker";
import {
  BrandMark, Wordmark, PlusIcon, TrashIcon, GearIcon, XIcon,
  KeyIcon, ChatIcon, CodeIcon, CheckIcon,
  PanelLeftIcon, SidebarIcon,
} from "./components/Icons";

type Mode = "chat" | "coder";

function fmtTok(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}

function groupLabel(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const day = (x: Date) => x.toDateString();
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  if (day(d) === day(now)) return "Today";
  if (day(d) === day(yest)) return "Yesterday";
  return "Previous";
}

export default function App() {
  const [mode, setMode] = useState<Mode>(() => load<Mode>("mode", "chat"));
  const [sideOpen, setSideOpen] = useState(() => load("sideOpen", true));
  const [mobileSide, setMobileSide] = useState(false);

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
  useEffect(() => save("sideOpen", sideOpen), [sideOpen]);

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
    setMobileSide(false);
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

  const groups: { label: string; items: Conversation[] }[] = [];
  for (const c of convs) {
    const g = groupLabel(c.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === g) last.items.push(c);
    else groups.push({ label: g, items: [c] });
  }

  const openProject = (id: string) => {
    setActiveProjectId(id);
    setMode("coder");
    setMobileSide(false);
  };

  const sidebar = (
    <div className="flex h-full w-[260px] flex-col bg-panel max-md:w-[280px]">
      {/* header */}
      <div className="flex items-center gap-2.5 px-4 py-4">
        <BrandMark className="h-8 w-8" />
        <Wordmark className="text-[17px]" />
        <button
          onClick={() => {
            setSideOpen(false);
            setMobileSide(false);
          }}
          className="icon-btn ml-auto max-md:hidden"
          title="Collapse sidebar"
        >
          <PanelLeftIcon className="h-4 w-4" />
        </button>
        <button onClick={() => setMobileSide(false)} className="icon-btn ml-auto md:hidden" title="Close">
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      {/* new chat */}
      <div className="px-3">
        <button
          onClick={handleNew}
          className="flex w-full items-center gap-2.5 rounded-xl border border-line bg-panel2 px-3.5 py-2.5 text-[13.5px] font-bold text-text transition-all hover:border-violet/45 hover:bg-panel3"
        >
          <PlusIcon className="h-4 w-4 text-violet2" />
          New chat
        </button>
      </div>

      {/* history */}
      <div className="mt-4 flex-1 overflow-y-auto px-3 pb-3">
        {groups.map((g) => (
          <div key={g.label} className="mb-3">
            <p className="px-2 pb-1.5 text-[11px] font-bold text-faint">{g.label}</p>
            <ul className="space-y-0.5">
              {g.items.map((c) => (
                <li key={c.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setActiveId(c.id);
                      setMode("chat");
                      setMobileSide(false);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && (setActiveId(c.id), setMode("chat"))}
                    className={`group relative flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] transition-all ${
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
                        title="Delete"
                      >
                        <TrashIcon className="h-3.5 w-3.5 text-faint hover:text-coral" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* projects */}
        <p className="flex items-center gap-2 px-2 pb-1.5 pt-2 text-[11px] font-bold text-faint">
          Projects
          <button
            onClick={() => {
              setMode("coder");
              setMobileSide(false);
            }}
            className="rounded-md border border-line px-1.5 py-px font-mono text-[9px] uppercase tracking-wider text-faint transition-colors hover:border-violet/50 hover:text-violet2"
          >
            coder
          </button>
        </p>
        {projects.length === 0 ? (
          <p className="px-2 py-1 font-mono text-[10.5px] text-faint">no projects yet</p>
        ) : (
          <ul className="space-y-0.5">
            {projects.map((p) => (
              <li key={p.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => openProject(p.id)}
                  onKeyDown={(e) => e.key === "Enter" && openProject(p.id)}
                  className={`group relative flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] transition-all ${
                    activeProjectId === p.id && mode === "coder"
                      ? "bg-panel3 font-semibold text-text"
                      : "text-dim hover:bg-panel2 hover:text-text"
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${p.status === "ready" ? "bg-mint" : "bg-gold"}`} />
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
                      title="Delete"
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

      {/* footer */}
      <div className="flex items-center gap-2.5 border-t border-line px-4 py-3.5">
        <button
          onClick={() => setShowSettings(true)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-violet/18 text-[12px] font-extrabold text-violet3 transition-all hover:bg-violet/28"
          title="Settings"
        >
          A
        </button>
        <button
          onClick={() => setShowSettings(true)}
          className="row-hl flex flex-1 items-center gap-2 rounded-xl px-2 py-1.5 text-left text-[13px] font-bold text-dim hover:text-text"
        >
          Settings
        </button>
        <GearIcon className="h-4 w-4 text-faint" />
      </div>
    </div>
  );

  return (
    <div className="flex h-dvh overflow-hidden bg-bg">
      {/* desktop sidebar */}
      {sideOpen && (
        <aside className="shrink-0 border-r border-line max-md:hidden">
          <div className="h-full">{sidebar}</div>
        </aside>
      )}

      {/* mobile sidebar */}
      {mobileSide && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={() => setMobileSide(false)} />
          <div className="anim-rise absolute left-0 top-0 h-full border-r border-line">{sidebar}</div>
        </div>
      )}

      {/* main */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* top bar */}
        <header className="flex h-[54px] shrink-0 items-center gap-2 px-3.5">
          {!sideOpen && (
            <button onClick={() => setSideOpen(true)} className="icon-btn max-md:hidden" title="Open sidebar">
              <SidebarIcon className="h-4 w-4" />
            </button>
          )}
          <button onClick={() => setMobileSide(true)} className="icon-btn md:hidden" title="Menu">
            <SidebarIcon className="h-4 w-4" />
          </button>

          <ModelPicker modelId={modelId} onChange={setModelId} cfgs={cfgs} />

          <div className="ml-auto flex items-center gap-1 rounded-full border border-line bg-panel p-1">
            {(
              [
                { id: "chat", label: "Chat", icon: ChatIcon },
                { id: "coder", label: "Coder", icon: CodeIcon },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-extrabold transition-all ${
                  mode === m.id ? "bg-panel3 text-text shadow-sm" : "text-faint hover:text-dim"
                }`}
              >
                <m.icon className="h-3.5 w-3.5" />
                <span className="max-sm:hidden">{m.label}</span>
              </button>
            ))}
          </div>
        </header>

        <div className="min-h-0 flex-1">
          {mode === "chat" ? (
            <ChatMode conv={active} patchConv={patchConv} cfgs={cfgs} modelId={modelId} onModel={setModelId} />
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

        {mode === "chat" && active.messages.length > 0 && (
          <div className="pointer-events-none pb-2 text-center font-mono text-[10px] text-faint">
            ≈ {fmtTok(active.messages.reduce((s, m) => s + (m.tokens ?? 0), 0))} tokens · free models only
          </div>
        )}
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
      <div className="anim-rise relative flex max-h-[86vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-line2 bg-panel shadow-[0_30px_90px_-20px_rgba(0,0,0,0.8)]">
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <KeyIcon className="h-4.5 w-4.5 text-violet2" />
          <div>
            <h2 className="font-display text-[15px] font-bold">Providers</h2>
            <p className="font-mono text-[10.5px] text-faint">all free · keys stay in your browser</p>
          </div>
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
                          <span className="flex items-center gap-1 rounded-full border border-violet/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-violet3">
                            <CheckIcon className="h-2.5 w-2.5" /> keyless · ready
                          </span>
                        ) : hasKey ? (
                          <span className="flex items-center gap-1 rounded-full border border-mint/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-mint">
                            <CheckIcon className="h-2.5 w-2.5" /> key set
                          </span>
                        ) : p.local ? (
                          <span className="rounded-full border border-cyanic/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-cyanic">
                            local · no key
                          </span>
                        ) : null}
                        <a
                          href={p.keyUrl ?? p.docs}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-auto font-mono text-[10px] text-faint underline decoration-line2 underline-offset-2 transition-colors hover:text-violet3"
                        >
                          {p.keyUrl ? "get free key" : "docs"}
                        </a>
                        <button
                          onClick={() => test(p.id)}
                          disabled={st === "busy"}
                          className="rounded-lg border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-dim transition-all hover:border-violet/50 hover:text-violet3 disabled:opacity-50"
                        >
                          {st === "busy" ? "ping…" : st === "ok" ? "✓ ok" : st === "fail" ? "✕ fail" : "test"}
                        </button>
                      </div>
                      <p className="mt-1 text-[11.5px] leading-snug text-faint">{p.note}</p>
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
                            className={`field font-mono text-[11px] ${p.local ? "flex-1" : "w-[220px] max-sm:hidden"}`}
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

        <div className="border-t border-line px-5 py-3">
          <p className="font-mono text-[10.5px] text-faint">
            Pollinations works with no key. Free keys unlock the bigger tiers.
          </p>
        </div>
      </div>
    </div>
  );
}
