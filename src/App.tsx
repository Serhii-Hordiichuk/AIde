import { useCallback, useEffect, useMemo, useState } from "react";
import { PROVIDERS, providerById, KIND_LABEL } from "./data/providers";
import { MODELS, modelById, DEFAULT_MODEL_ID, isAutoModel, resolveAutoModel, AUTO_LABEL } from "./data/models";
import {
  load, save, newConversation, uid,
  type Conversation, type ProviderCfg, type Project,
} from "./lib/store";
import ChatMode from "./components/ChatMode";
import CoderMode from "./components/CoderMode";
import StatusBar from "./components/StatusBar";
import {
  BrandMark, Wordmark, PlusIcon, TrashIcon, GearIcon, XIcon, FolderIcon,
  KeyIcon, ChatIcon, CodeIcon, CheckIcon,
} from "./components/Icons";

type Mode = "chat" | "coder";

function fmtTok(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}

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

  const hasLive = useMemo(() => Object.values(cfgs).some((c) => c.key?.trim()), [cfgs]);
  const auto = isAutoModel(modelId);
  const model = auto ? resolveAutoModel(modelId, cfgs) : modelById.get(modelId) ?? MODELS[0];
  const provider = providerById.get(model.providerId) ?? PROVIDERS[0];

  const meta =
    mode === "chat"
      ? `≈ ${fmtTok(active?.messages.reduce((s, m) => s + (m.tokens ?? 0), 0) ?? 0)} tok · ${convs.length} chats`
      : activeProject
        ? `${activeProject.files.length} files · ${activeProject.status}`
        : "no project yet";

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      {/* ambient layers */}
      <div className="ambient" aria-hidden>
        <div className="dots" />
        <div className="tint tint-mint" />
        <div className="tint tint-gold" />
        <div className="noise" />
      </div>

      <div className="relative z-10 flex min-h-0 flex-1">
        {/* -------- sidebar -------- */}
        <aside className="flex w-[266px] shrink-0 flex-col border-r border-line bg-panel/70 backdrop-blur max-md:w-[234px]">
          <header className="flex items-center gap-3 border-b border-line px-4 py-4">
            <span className="floaty">
              <BrandMark className="h-9 w-9 drop-shadow-[0_0_16px_#31e5ae40]" />
            </span>
            <div className="min-w-0">
              <Wordmark className="block text-[16px] leading-none" />
              <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-faint">ai-native studio</p>
            </div>
          </header>

          <button
            onClick={handleNew}
            className="btn-brand mx-3 mt-3 flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-extrabold"
          >
            <PlusIcon className="h-4 w-4" /> New chat
          </button>

          <div className="mt-4 flex-1 overflow-y-auto px-3 pb-3">
            <p className="overline px-1.5 pb-2">chats</p>
            <ul className="space-y-1">
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
                    className={`group relative flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] transition-all ${
                      active?.id === c.id && mode === "chat"
                        ? "bg-brand/10 font-semibold text-text"
                        : "text-dim hover:bg-panel2 hover:text-text"
                    }`}
                  >
                    <span
                      className={`absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r bg-brand transition-opacity ${
                        active?.id === c.id && mode === "chat" ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    <ChatIcon className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    <span className="min-w-0 flex-1 truncate">{c.title || "New chat"}</span>
                    {confirmDel === c.id ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(c.id);
                        }}
                        onMouseLeave={() => setConfirmDel(null)}
                        className="rounded bg-coral/15 px-1.5 py-0.5 font-mono text-[9.5px] font-bold uppercase text-coral"
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

            <p className="overline flex items-center gap-2 px-1.5 pb-2 pt-5">
              coder projects
              <button
                onClick={() => setMode("coder")}
                className="rounded border border-line px-1.5 py-px font-mono text-[9px] uppercase tracking-wider text-faint transition-colors hover:border-brand/50 hover:text-brand"
                title="Open Coder"
              >
                + new
              </button>
            </p>
            {projects.length === 0 ? (
              <p className="px-2 py-2 text-[11.5px] leading-relaxed text-faint">
                Nothing yet — describe an app in Coder and it will appear here.
              </p>
            ) : (
              <ul className="space-y-1">
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
                      className={`group relative flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] transition-all ${
                        activeProjectId === p.id && mode === "coder"
                          ? "bg-gold/10 font-semibold text-text"
                          : "text-dim hover:bg-panel2 hover:text-text"
                      }`}
                    >
                      <span
                        className={`absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r bg-gold transition-opacity ${
                          activeProjectId === p.id && mode === "coder" ? "opacity-100" : "opacity-0"
                        }`}
                      />
                      <FolderIcon className="h-3.5 w-3.5 shrink-0 opacity-60" />
                      <span className="min-w-0 flex-1 truncate">{p.name}</span>
                      <span className={`font-mono text-[9px] uppercase ${p.status === "ready" ? "text-mint" : "text-gold"}`}>
                        {p.status === "ready" ? "●" : "◌"}
                      </span>
                      {confirmDelProj === p.id ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteProject(p.id);
                          }}
                          onMouseLeave={() => setConfirmDelProj(null)}
                          className="rounded bg-coral/15 px-1.5 py-0.5 font-mono text-[9.5px] font-bold uppercase text-coral"
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

          <footer className="border-t border-line p-3">
            <button
              onClick={() => setShowSettings(true)}
              className="row-hl flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-bold text-dim hover:text-text"
            >
              <GearIcon className="h-4 w-4" />
              Settings
              <span
                className={`ml-auto flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${
                  hasLive ? "border-mint/40 text-mint" : "border-gold/40 text-gold"
                }`}
              >
                <span className={`h-1 w-1 rounded-full ${hasLive ? "pulse-live bg-mint" : "bg-gold"}`} />
                {hasLive ? "live" : "demo"}
              </span>
            </button>
          </footer>
        </aside>

        {/* -------- main -------- */}
        <main className="min-w-0 flex-1">
          {/* mode switch */}
          <div className="pointer-events-none absolute left-1/2 top-4 z-30 -translate-x-1/2">
            <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-line2 bg-panel/90 p-1 shadow-lg backdrop-blur">
              {(
                [
                  { id: "chat", label: "Chat", icon: ChatIcon },
                  { id: "coder", label: "Coder", icon: CodeIcon },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-[13px] font-bold transition-all ${
                    mode === m.id
                      ? m.id === "chat"
                        ? "bg-brand/15 text-brand"
                        : "bg-gold/15 text-gold"
                      : "text-dim hover:text-text"
                  }`}
                >
                  <m.icon className="h-3.5 w-3.5" />
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {mode === "chat" ? (
            <ChatMode
              conv={active}
              patchConv={patchConv}
              cfgs={cfgs}
              modelId={modelId}
              onModel={setModelId}
            />
          ) : (
            <CoderMode
              project={activeProject}
              patchProject={patchProject}
              createProject={createProject}
              cfgs={cfgs}
              modelId={modelId}
            />
          )}
        </main>
      </div>

      <StatusBar
        mode={mode}
        model={auto ? `${AUTO_LABEL[modelId]} → ${model.name}` : model.name}
        provider={provider.name}
        live={hasLive}
        meta={meta}
      />

      {showSettings && <SettingsModal cfgs={cfgs} onCfgs={setCfgs} onClose={() => setShowSettings(false)} />}
    </div>
  );
}

/* ---------------- settings modal ---------------- */

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
      const res = await fetch(cfg.baseUrl.replace(/\/$/, "") + "/models", {
        headers: cfg.key?.trim()
          ? { Authorization: `Bearer ${cfg.key.trim()}`, "x-api-key": cfg.key.trim() }
          : undefined,
        signal: ctrl.signal,
      });
      clearTimeout(t);
      setTestState((s) => ({ ...s, [id]: res.ok ? "ok" : "fail" }));
    } catch {
      setTestState((s) => ({ ...s, [id]: "fail" }));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal>
      <div className="anim-rise absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={onClose} />
      <div className="anim-rise relative flex max-h-[86vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line2 bg-panel shadow-[0_30px_90px_-20px_rgba(0,0,0,0.8)]">
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <KeyIcon className="h-4.5 w-4.5 text-brand" />
          <div>
            <h2 className="font-display text-[15px] font-bold">Provider settings</h2>
            <p className="font-mono text-[10.5px] text-faint">keys never leave your browser — stored in localStorage only</p>
          </div>
          <button onClick={onClose} className="icon-btn ml-auto" title="Close">
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {(["aggregator", "cloud", "inference", "local"] as const).map((kind) => (
            <section key={kind} className="mb-5">
              <p className="overline mb-2">{KIND_LABEL[kind]}</p>
              <div className="space-y-2">
                {PROVIDERS.filter((p) => p.kind === kind).map((p) => {
                  const cfg = cfgs[p.id] ?? { key: "", baseUrl: p.baseUrl };
                  const st = testState[p.id] ?? "idle";
                  const hasKey = !!cfg.key?.trim();
                  return (
                    <div key={p.id} className="rounded-xl border border-line bg-panel2/70 p-3 transition-colors hover:border-line2">
                      <div className="flex items-center gap-2.5">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.accent }} />
                        <span className="text-[13.5px] font-bold">{p.name}</span>
                        {hasKey ? (
                          <span className="flex items-center gap-1 rounded-full border border-mint/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-mint">
                            <CheckIcon className="h-2.5 w-2.5" /> key set
                          </span>
                        ) : p.local ? (
                          <span className="rounded-full border border-cyanic/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-cyanic">
                            local · no key
                          </span>
                        ) : null}
                        <a
                          href={p.docs}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-auto font-mono text-[10px] text-faint underline decoration-line2 underline-offset-2 transition-colors hover:text-brand"
                        >
                          docs
                        </a>
                        <button
                          onClick={() => test(p.id)}
                          disabled={st === "busy"}
                          className="rounded-lg border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-dim transition-all hover:border-brand/50 hover:text-brand disabled:opacity-50"
                        >
                          {st === "busy" ? "ping…" : st === "ok" ? "✓ ok" : st === "fail" ? "✕ fail" : "test"}
                        </button>
                      </div>
                      <p className="mt-1 text-[11.5px] leading-snug text-faint">{p.note}</p>
                      <div className="mt-2 flex gap-2">
                        <input
                          type="password"
                          value={cfg.key}
                          onChange={(e) => onCfgs({ ...cfgs, [p.id]: { ...cfg, key: e.target.value } })}
                          placeholder={p.keyName ?? "API key (optional)"}
                          className="field flex-1 font-mono text-[12px]"
                          autoComplete="off"
                        />
                        <input
                          value={cfg.baseUrl}
                          onChange={(e) => onCfgs({ ...cfgs, [p.id]: { ...cfg, baseUrl: e.target.value } })}
                          className="field w-[220px] font-mono text-[11px] max-sm:hidden"
                          title="Base URL"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="border-t border-line px-5 py-3">
          <p className="font-mono text-[10.5px] text-faint">
            Without a key AiDe answers in demo mode (marked with a badge). With a key — requests stream
            directly from the provider's API.
          </p>
        </div>
      </div>
    </div>
  );
}
