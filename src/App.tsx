import { useCallback, useEffect, useMemo, useState } from "react";
import { PROVIDERS } from "./data/providers";
import { DEFAULT_MODEL_ID } from "./data/models";
import { pingProvider } from "./lib/llm";
import {
  load, save, uid, newConversation,
  type Conversation, type Project, type ProviderCfg,
} from "./lib/store";
import ChatMode from "./components/ChatMode";
import CoderMode from "./components/CoderMode";
import {
  BrandMark, PlusIcon, TrashIcon, GearIcon, XIcon, FolderIcon,
  KeyIcon, ChatIcon, CodeIcon,
} from "./components/Icons";

type Mode = "chat" | "coder";

export default function App() {
  const [mode, setMode] = useState<Mode>("chat");
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [convs, setConvs] = useState<Conversation[]>(() => {
    const stored = load<Conversation[]>("convs", []);
    return stored.length ? stored : [newConversation()];
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
      merged[p.id] = { key: prev?.key ?? "", baseUrl: prev?.baseUrl?.trim() ? prev.baseUrl : p.baseUrl };
    }
    return merged;
  });

  useEffect(() => save("convs", convs), [convs]);
  useEffect(() => save("activeConv", activeConvId), [activeConvId]);
  useEffect(() => save("projects", projects), [projects]);
  useEffect(() => save("activeProject", activeProjectId), [activeProjectId]);
  useEffect(() => save("model", modelId), [modelId]);
  useEffect(() => save("cfgs", cfgs), [cfgs]);

  const activeConv = useMemo(
    () => convs.find((c) => c.id === activeConvId) ?? convs[0] ?? null,
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

  const createConv = useCallback(() => {
    const c = newConversation();
    setConvs((prev) => [c, ...prev]);
    setActiveConvId(c.id);
    setMode("chat");
  }, []);

  const deleteConv = useCallback(
    (id: string) => {
      setConvs((prev) => {
        const next = prev.filter((c) => c.id !== id);
        const fallback = next.length ? next : [newConversation()];
        if (id === activeConvId) setActiveConvId(fallback[0].id);
        return fallback;
      });
    },
    [activeConvId]
  );

  const createProject = useCallback((prompt: string) => {
    const p: Project = {
      id: uid(),
      name: "New project",
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

  const deleteProject = useCallback(
    (id: string) => {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (id === activeProjectId) setActiveProjectId("");
    },
    [activeProjectId]
  );

  const keyCount = Object.values(cfgs).filter((c) => c.key?.trim()).length;

  const list = mode === "chat" ? convs : projects;
  const activeId = mode === "chat" ? activeConv?.id : activeProject?.id;

  return (
    <div className="relative flex h-dvh overflow-hidden">
      {/* ambient background */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <div className="absolute -top-40 right-[8%] h-[420px] w-[560px] rounded-full bg-aqua/8 blur-[130px]" />
        <div className="absolute -left-32 top-1/3 h-[380px] w-[380px] rounded-full bg-solar/6 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(#ffffff10 1px, transparent 1px), linear-gradient(90deg, #ffffff10 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(ellipse 90% 70% at 50% 0%, black 30%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse 90% 70% at 50% 0%, black 30%, transparent 75%)",
          }}
        />
      </div>

      {/* ---------- sidebar ---------- */}
      <aside
        className={`relative z-10 flex shrink-0 flex-col border-r border-line bg-panel/60 backdrop-blur transition-all duration-300 ${
          collapsed ? "w-[64px]" : "w-[276px]"
        }`}
      >
        <div className={`flex items-center gap-2.5 px-4 py-4 ${collapsed ? "justify-center px-0" : ""}`}>
          <BrandMark className="h-8 w-8 shrink-0" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-display text-[15px] font-bold leading-none tracking-tight">AiDe</p>
              <p className="mt-1 truncate font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
                one studio · every model API
              </p>
            </div>
          )}
        </div>

        {/* mode switch */}
        <div className={`px-3 ${collapsed ? "px-2" : ""}`}>
          <div className={`grid rounded-xl border border-line bg-ink/70 p-1 ${collapsed ? "grid-cols-1 gap-1" : "grid-cols-2"}`}>
            {(
              [
                { id: "chat", label: "Chat", icon: ChatIcon },
                { id: "coder", label: "Coder", icon: CodeIcon },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                title={m.label}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[12.5px] font-bold transition-all ${
                  mode === m.id ? "bg-aqua/14 text-aqua2" : "text-dim hover:text-text"
                }`}
              >
                <m.icon className="h-3.5 w-3.5" />
                {!collapsed && m.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`mt-4 px-3 ${collapsed ? "px-2" : ""}`}>
          <button
            onClick={mode === "chat" ? createConv : () => setMode("coder")}
            className={`btn-brand flex w-full items-center justify-center gap-2 rounded-xl py-2 text-[13px] font-bold ${
              collapsed ? "px-0" : ""
            }`}
            title={mode === "chat" ? "New chat" : "Describe an app in Coder"}
          >
            <PlusIcon className="h-4 w-4" />
            {!collapsed && (mode === "chat" ? "New chat" : "New project")}
          </button>
        </div>

        {/* history */}
        <div className="mt-4 min-h-0 flex-1 overflow-y-auto px-2">
          {!collapsed && (
            <p className="px-2 pb-1.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-faint">
              {mode === "chat" ? "Chats" : "Projects"}
            </p>
          )}
          {list.length === 0 && !collapsed && (
            <p className="px-2 py-3 text-[12px] text-faint">
              {mode === "chat" ? "No chats yet." : "No projects yet — build one in Coder mode."}
            </p>
          )}
          {list.map((item) => {
            const isActive = item.id === activeId;
            const title = mode === "chat" ? (item as Conversation).title : (item as Project).name;
            const sub =
              mode === "chat"
                ? `${(item as Conversation).messages.length} msgs`
                : `${(item as Project).files.length} files · ${(item as Project).status}`;
            return (
              <div
                key={item.id}
                className={`group relative mb-0.5 flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 transition-all ${
                  isActive ? "bg-panel3 text-text" : "text-dim hover:bg-panel2 hover:text-text"
                } ${collapsed ? "justify-center px-0" : ""}`}
                onClick={() => {
                  if (mode === "chat") {
                    setActiveConvId(item.id);
                    setMode("chat");
                  } else {
                    setActiveProjectId(item.id);
                    setMode("coder");
                  }
                }}
                title={title}
              >
                {mode === "coder" && <FolderIcon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-aqua" : "text-faint"}`} />}
                {!collapsed && (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold leading-tight">{title}</p>
                      <p className="truncate font-mono text-[9.5px] text-faint">{sub}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (mode === "chat") deleteConv(item.id);
                        else deleteProject(item.id);
                      }}
                      className="rounded p-1 text-faint opacity-0 transition-all hover:bg-coral/15 hover:text-coral group-hover:opacity-100"
                      title="Delete"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* footer */}
        <div className="border-t border-line p-2">
          {!collapsed ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSettingsOpen(true)}
                className="flex flex-1 items-center gap-2 rounded-lg px-2.5 py-2 text-[12.5px] font-semibold text-dim transition-all hover:bg-panel2 hover:text-text"
              >
                <GearIcon className="h-4 w-4" />
                Settings
                {keyCount > 0 && (
                  <span className="ml-auto rounded-md bg-mint/12 px-1.5 py-0.5 font-mono text-[9.5px] text-mint">
                    {keyCount} keys
                  </span>
                )}
              </button>
              <button
                onClick={() => setCollapsed(true)}
                className="rounded-lg p-2 text-faint transition-colors hover:bg-panel2 hover:text-dim"
                title="Collapse sidebar"
              >
                <ChevronsLeft />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => setSettingsOpen(true)}
                className="rounded-lg p-2 text-dim transition-colors hover:bg-panel2 hover:text-text"
                title="Settings"
              >
                <GearIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCollapsed(false)}
                className="rounded-lg p-2 text-faint transition-colors hover:bg-panel2 hover:text-dim"
                title="Expand sidebar"
              >
                <ChevronsRight />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ---------- main ---------- */}
      <main className="relative z-10 min-w-0 flex-1">
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
            patchProject={patchProject}
            createProject={createProject}
            cfgs={cfgs}
            modelId={modelId}
          />
        )}
      </main>

      {/* status dot */}
      <div
        className="absolute bottom-4 right-4 z-20 flex items-center gap-2 rounded-full border border-line bg-panel/80 px-3 py-1.5 font-mono text-[10px] text-dim backdrop-blur"
        title={keyCount ? `${keyCount} API keys connected — live mode available` : "Demo mode — connect an API key in Settings"}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${keyCount ? "pulse-live bg-mint" : "animate-pulse bg-solar"}`} />
        {keyCount ? `${keyCount} keys · live` : "demo"}
      </div>

      {settingsOpen && <SettingsModal cfgs={cfgs} onClose={() => setSettingsOpen(false)} onSave={setCfgs} />}
    </div>
  );
}

function ChevronsLeft() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 7l-5 5 5 5M17 7l-5 5 5 5" />
    </svg>
  );
}
function ChevronsRight() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M7 7l5 5-5 5M13 7l5 5-5 5" />
    </svg>
  );
}

/* ---------- settings modal ---------- */

function SettingsModal({
  cfgs,
  onClose,
  onSave,
}: {
  cfgs: Record<string, ProviderCfg>;
  onClose: () => void;
  onSave: (c: Record<string, ProviderCfg>) => void;
}) {
  const [draft, setDraft] = useState(() => JSON.parse(JSON.stringify(cfgs)) as Record<string, ProviderCfg>);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Record<string, string>>({});

  const groups = useMemo(() => {
    const order = ["aggregator", "cloud", "inference", "local"] as const;
    return order
      .map((k) => PROVIDERS.filter((p) => p.kind === k))
      .filter((g) => g.length);
  }, []);

  const KIND: Record<string, string> = {
    aggregator: "Aggregators",
    cloud: "Cloud APIs",
    inference: "Inference clouds",
    local: "Local runtimes",
  };

  async function test(id: string) {
    const p = PROVIDERS.find((x) => x.id === id)!;
    setStatus((s) => ({ ...s, [id]: "testing…" }));
    try {
      const info = await pingProvider(p, draft[id]);
      setStatus((s) => ({ ...s, [id]: "ok — reachable" + (info && info !== "ok" ? ` (${info})` : "") }));
    } catch (e) {
      setStatus((s) => ({ ...s, [id]: "failed: " + (e instanceof Error ? e.message.slice(0, 60) : "network error") }));
    }
  }

  const visible = (name: string) => name.toLowerCase().includes(q.trim().toLowerCase());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={onClose} />
      <div className="anim-rise relative flex max-h-[86vh] w-full max-w-[680px] flex-col overflow-hidden rounded-2xl border border-line2 bg-panel shadow-2xl shadow-black/60">
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <KeyIcon className="h-4.5 w-4.5 text-aqua" />
          <div className="flex-1">
            <h2 className="font-display text-[15px] font-bold">API Providers</h2>
            <p className="text-[11.5px] text-dim">
              Keys are stored only in this browser (localStorage) and sent directly to providers.
              Local runtimes need no key — just make sure the server is up.
            </p>
          </div>
          <button onClick={onClose} className="icon-btn" title="Close">
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-line px-5 py-2.5">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search providers…"
            className="field w-full"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {groups.map((g) => {
            const items = g.filter((p) => visible(p.name));
            if (!items.length) return null;
            return (
              <div key={g[0].kind} className="mb-5">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">{KIND[g[0].kind]}</p>
                <div className="space-y-2">
                  {items.map((p) => {
                    const c = draft[p.id];
                    const hasKey = !!c.key?.trim();
                    return (
                      <div key={p.id} className="rounded-xl border border-line bg-panel2/70 p-3 transition-colors focus-within:border-aqua/40">
                        <div className="flex items-center gap-2.5">
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.accent }} />
                          <span className="text-[13.5px] font-bold">{p.name}</span>
                          {!p.local && (
                            <span
                              className={`rounded border px-1.5 py-px font-mono text-[9px] uppercase tracking-wide ${
                                hasKey ? "border-mint/40 text-mint" : "border-solar/40 text-solar"
                              }`}
                            >
                              {hasKey ? "key set" : "no key"}
                            </span>
                          )}
                          {p.local && (
                            <span className="rounded border border-cyanic/40 px-1.5 py-px font-mono text-[9px] uppercase tracking-wide text-cyanic">
                              local
                            </span>
                          )}
                          <button
                            onClick={() => test(p.id)}
                            className="ml-auto rounded-lg border border-line px-2.5 py-1 font-mono text-[10.5px] text-dim transition-all hover:border-aqua/50 hover:text-aqua2"
                          >
                            Test
                          </button>
                        </div>
                        <p className="mt-1 pl-[18px] text-[11.5px] leading-snug text-faint">{p.note}</p>
                        <div className="mt-2 grid gap-2 pl-[18px] max-sm:grid-cols-1 sm:grid-cols-[1fr_220px]">
                          <input
                            value={c.baseUrl}
                            onChange={(e) => setDraft((d) => ({ ...d, [p.id]: { ...d[p.id], baseUrl: e.target.value } }))}
                            placeholder={p.baseUrl}
                            className="field field-mono"
                            title="Base URL"
                          />
                          {!p.local ? (
                            <input
                              type="password"
                              value={c.key}
                              onChange={(e) => setDraft((d) => ({ ...d, [p.id]: { ...d[p.id], key: e.target.value } }))}
                              placeholder={p.keyName ?? "API key"}
                              className="field field-mono"
                              autoComplete="off"
                            />
                          ) : (
                            <span className="flex items-center font-mono text-[10.5px] text-faint">no key required</span>
                          )}
                        </div>
                        {status[p.id] && (
                          <p
                            className={`mt-1.5 pl-[18px] font-mono text-[10.5px] ${
                              status[p.id].startsWith("ok") ? "text-mint" : status[p.id] === "testing…" ? "text-dim" : "text-coral"
                            }`}
                          >
                            {status[p.id]}
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

        <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3.5">
          <p className="font-mono text-[10.5px] text-faint">
            {Object.values(draft).filter((c) => c.key?.trim()).length} keys configured
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-line px-4 py-2 text-[13px] font-semibold text-dim transition-all hover:border-line2 hover:text-text"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onSave(draft);
                onClose();
              }}
              className="btn-brand rounded-lg px-5 py-2 text-[13px] font-bold"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
