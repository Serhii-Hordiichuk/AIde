import { useCallback, useEffect, useRef, useState } from "react";
import { PROVIDERS, providerById, KIND_LABEL } from "./data/providers";
import { DEFAULT_MODEL_ID } from "./data/models";
import {
  load, save, newConversation, uid,
  type Conversation, type ProviderCfg, type Project,
} from "./lib/store";
import { fetchProviderModels, freshEntries, type LiveCatalog } from "./lib/modelFetch";
import ChatMode from "./components/ChatMode";
import CoderMode from "./components/CoderMode";
import TranslatorMode from "./components/TranslatorMode";
import ModelPicker from "./components/ModelPicker";
import {
  BrandMark, Wordmark, PlusIcon, TrashIcon, GearIcon, XIcon,
  KeyIcon, ChatIcon, CodeIcon, CheckIcon, CopyIcon,
  PanelLeftIcon, DotsIcon, PenIcon, TranslateIcon,
} from "./components/Icons";
import AuthGate from "./components/AuthGate";
import { shortDid, identityBackup, didHue, type Identity } from "./lib/did";

type Mode = "chat" | "coder" | "translate";

function fmtTok(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}

const GROUP_ORDER = ["Today", "Yesterday", "Previous 7 Days", "Previous 30 Days", "Older"] as const;

function groupLabel(ts: number): (typeof GROUP_ORDER)[number] {
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOfDay(new Date()) - startOfDay(new Date(ts))) / 86400000);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff <= 7) return "Previous 7 Days";
  if (diff <= 30) return "Previous 30 Days";
  return "Older";
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

  /* per-item kebab menu + inline rename + delete modal */
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ kind: "chat" | "project" | "identity"; id: string; name: string } | null>(null);
  const [profileMenu, setProfileMenu] = useState(false);

  /* DID identity (gate) */
  const [identity, setIdentity] = useState<Identity | null>(() => load<Identity | null>("identity", null));

  /* live model catalog, fetched from provider APIs */
  const [catalog, setCatalog] = useState<LiveCatalog>(() => load<LiveCatalog>("catalog", {}));

  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const cfgsRef = useRef(cfgs);
  useEffect(() => {
    cfgsRef.current = cfgs;
  }, [cfgs]);

  useEffect(() => save("convs", convs), [convs]);
  useEffect(() => save("active", activeId), [activeId]);
  useEffect(() => save("model", modelId), [modelId]);
  useEffect(() => save("cfgs", cfgs), [cfgs]);
  useEffect(() => save("projects", projects), [projects]);
  useEffect(() => save("activeProject", activeProjectId), [activeProjectId]);
  useEffect(() => save("mode", mode), [mode]);
  useEffect(() => save("sideOpen", sideOpen), [sideOpen]);
  useEffect(() => save("identity", identity), [identity]);
  useEffect(() => save("catalog", catalog), [catalog]);

  /* ---------- live model discovery ---------- */
  const refreshProvider = useCallback(async (pid: string) => {
    const p = providerById.get(pid);
    if (!p) return;
    const cfg = cfgsRef.current[pid] ?? { key: "", baseUrl: p.baseUrl };
    const reachable = p.keyless || !!cfg.key?.trim() || p.local;
    if (!reachable) return;
    try {
      const models = await fetchProviderModels(p, cfg);
      setCatalog((c) => ({ ...c, [pid]: { models, at: Date.now() } }));
    } catch (e) {
      setCatalog((c) => ({ ...c, [pid]: { models: c[pid]?.models ?? [], at: 0 } }));
      throw e;
    }
  }, []);

  const refreshAll = useCallback(() => {
    PROVIDERS.forEach((p) => refreshProvider(p.id).catch(() => {}));
  }, [refreshProvider]);

  /* on boot: fetch models for every reachable provider with a stale/missing cache */
  useEffect(() => {
    if (!identity) return;
    const fresh = freshEntries(catalog);
    PROVIDERS.forEach((p) => {
      const cfg = cfgs[p.id];
      const reachable = p.keyless || !!cfg?.key?.trim() || p.local;
      if (reachable && !fresh[p.id]) refreshProvider(p.id).catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity]);

  /* debounced refetch when a key is typed in Settings */
  const keyTimers = useRef<Record<string, number>>({});
  const onKeyChanged = useCallback(
    (pid: string) => {
      window.clearTimeout(keyTimers.current[pid]);
      keyTimers.current[pid] = window.setTimeout(() => refreshProvider(pid).catch(() => {}), 800);
    },
    [refreshProvider]
  );

  /* click outside profile popover */
  useEffect(() => {
    if (!profileMenu) return;
    const h = (e: MouseEvent) => {
      if (!profileRef.current?.contains(e.target as Node)) setProfileMenu(false);
    };
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, [profileMenu]);

  /* keep active id valid */
  useEffect(() => {
    if (!convs.some((c) => c.id === activeId)) setActiveId(convs[0]?.id ?? "");
  }, [convs, activeId]);

  /* Escape: delete modal → settings → drawer → kebab menu → rename */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (deleteTarget) setDeleteTarget(null);
      else if (showSettings) setShowSettings(false);
      else if (mobileSide) setMobileSide(false);
      else if (menuFor) setMenuFor(null);
      else if (renamingId) setRenamingId(null);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [deleteTarget, showSettings, mobileSide, menuFor, renamingId]);

  /* click outside closes the kebab menu */
  useEffect(() => {
    if (!menuFor) return;
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuFor(null);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menuFor]);

  /* focus the close button when the drawer opens */
  useEffect(() => {
    if (mobileSide) requestAnimationFrame(() => drawerCloseRef.current?.focus());
  }, [mobileSide]);

  const active = convs.find((c) => c.id === activeId) ?? convs[0];
  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;

  const patchConv = useCallback((id: string, fn: (c: Conversation) => Conversation) => {
    setConvs((prev) => prev.map((c) => (c.id === id ? fn(c) : c)));
  }, []);

  /* New chat: don't spawn duplicates when the current chat is still empty */
  const handleNew = useCallback(() => {
    setMode("chat");
    setMobileSide(false);
    if (active && active.messages.length === 0) {
      setActiveId(active.id);
      return;
    }
    const c = newConversation();
    setConvs((prev) => [c, ...prev]);
    setActiveId(c.id);
  }, [active]);

  const handleDelete = useCallback(
    (id: string) => {
      setConvs((prev) => {
        const next = prev.filter((c) => c.id !== id);
        const fallback = next.length ? next : [newConversation()];
        if (id === activeId) setActiveId(fallback[0].id);
        return fallback;
      });
      setDeleteTarget(null);
    },
    [activeId]
  );

  const commitRename = useCallback(() => {
    if (!renamingId) return;
    const val = renameDraft.trim();
    if (val) {
      setConvs((prev) => prev.map((c) => (c.id === renamingId ? { ...c, title: val } : c)));
    }
    setRenamingId(null);
  }, [renamingId, renameDraft]);

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
    setMobileSide(false);
    return p.id;
  }, []);

  const patchProject = useCallback((id: string, fn: (p: Project) => Project) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? fn(p) : p)));
  }, []);

  const deleteProject = useCallback(
    (id: string) => {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (activeProjectId === id) setActiveProjectId(null);
      setDeleteTarget(null);
    },
    [activeProjectId]
  );

  const openProject = (id: string) => {
    setActiveProjectId(id);
    setMode("coder");
    setMobileSide(false);
  };

  const openChat = (id: string) => {
    setActiveId(id);
    setMode("chat");
    setMobileSide(false);
  };

  const openSettings = () => {
    setShowSettings(true);
    setMobileSide(false);
  };

  /* deterministic buckets: Today → Yesterday → Previous */
  const groups = GROUP_ORDER.map((label) => ({
    label,
    items: convs.filter((c) => groupLabel(c.createdAt) === label),
  })).filter((g) => g.items.length > 0);

  /* ---------- shared sidebar content ---------- */
  const sidebar = (isDrawer: boolean) => (
    <div className={`flex h-full flex-col bg-panel ${isDrawer ? "w-[280px]" : "w-[260px]"}`}>
      {/* header */}
      <div className="flex items-center gap-2.5 px-4 py-4">
        <BrandMark className="h-8 w-8 shrink-0" />
        <Wordmark className="min-w-0 truncate text-[17px]" />
        {isDrawer ? (
          <button
            ref={drawerCloseRef}
            onClick={() => setMobileSide(false)}
            className="icon-btn ml-auto"
            title="Close menu"
            aria-label="Close menu"
          >
            <XIcon className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => setSideOpen(false)}
            className="icon-btn ml-auto"
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <PanelLeftIcon className="h-4 w-4" />
          </button>
        )}
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

      {/* history + projects */}
      <div className="mt-4 min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {groups.length === 0 && (
          <p className="px-2 py-1 font-mono text-[10.5px] text-faint">no chats yet</p>
        )}
        {groups.map((g) => (
          <div key={g.label} className="mb-3">
            <p className="px-2 pb-1.5 text-[11px] font-bold text-faint">{g.label}</p>
            <ul className="space-y-0.5">
              {g.items.map((c) => {
                const isActive = active?.id === c.id && mode === "chat";
                const isRenaming = renamingId === c.id;
                const isMenu = menuFor === c.id;
                return (
                  <li key={c.id} className="relative">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => !isRenaming && openChat(c.id)}
                      onKeyDown={(e) => {
                        if (e.target !== e.currentTarget || isRenaming) return;
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openChat(c.id);
                        }
                      }}
                      className={`group flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] transition-all ${
                        isActive
                          ? "bg-panel3 font-semibold text-text"
                          : "text-dim hover:bg-panel2 hover:text-text"
                      }`}
                    >
                      {isRenaming ? (
                        <input
                          autoFocus
                          value={renameDraft}
                          onChange={(e) => setRenameDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitRename();
                            if (e.key === "Escape") setRenamingId(null);
                          }}
                          onBlur={commitRename}
                          onClick={(e) => e.stopPropagation()}
                          className="min-w-0 flex-1 rounded-md border border-violet/50 bg-panel2 px-1.5 py-0.5 text-[13px] text-text outline-none"
                        />
                      ) : (
                        <span className="min-w-0 flex-1 truncate">{c.title || "New chat"}</span>
                      )}

                      {!isRenaming && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuFor(isMenu ? null : c.id);
                          }}
                          className={`shrink-0 rounded-md p-0.5 transition-opacity hover:bg-panel3 focus-visible:opacity-100 ${
                            isMenu ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                          }`}
                          title="Options"
                          aria-label={`Options for ${c.title || "chat"}`}
                        >
                          <DotsIcon className="h-4 w-4 text-faint" />
                        </button>
                      )}
                    </div>

                    {isMenu && (
                      <div
                        ref={menuRef}
                        className="anim-rise absolute right-2 top-9 z-50 w-40 overflow-hidden rounded-xl border border-line2 bg-panel2 py-1 shadow-xl"
                      >
                        <button
                          onClick={() => {
                            setRenamingId(c.id);
                            setRenameDraft(c.title || "");
                            setMenuFor(null);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-dim transition-colors hover:bg-panel3 hover:text-text"
                        >
                          <PenIcon className="h-3.5 w-3.5" /> Rename
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTarget({ kind: "chat", id: c.id, name: c.title || "New chat" });
                            setMenuFor(null);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-coral transition-colors hover:bg-coral/10"
                        >
                          <TrashIcon className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {/* projects */}
        <p className="px-2 pb-1.5 pt-2 text-[11px] font-bold text-faint">Projects</p>
        {projects.length === 0 ? (
          <p className="px-2 py-1 font-mono text-[10.5px] text-faint">no projects yet</p>
        ) : (
          <ul className="space-y-0.5">
            {projects.map((p) => {
              const isActive = activeProjectId === p.id && mode === "coder";
              const isMenu = menuFor === p.id;
              return (
                <li key={p.id} className="relative">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => openProject(p.id)}
                    onKeyDown={(e) => {
                      if (e.target !== e.currentTarget) return;
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openProject(p.id);
                      }
                    }}
                    className={`group flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] transition-all ${
                      isActive ? "bg-panel3 font-semibold text-text" : "text-dim hover:bg-panel2 hover:text-text"
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate">{p.name}</span>
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        p.status === "ready" ? "bg-mint" : "animate-pulse bg-gold"
                      }`}
                      title={p.status === "ready" ? "Ready" : "Building"}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuFor(isMenu ? null : p.id);
                      }}
                      className={`shrink-0 rounded-md p-0.5 transition-opacity hover:bg-panel3 focus-visible:opacity-100 ${
                        isMenu ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                      title="Options"
                      aria-label={`Options for ${p.name}`}
                    >
                      <DotsIcon className="h-4 w-4 text-faint" />
                    </button>
                  </div>

                  {isMenu && (
                    <div
                      ref={menuRef}
                      className="anim-rise absolute right-2 top-9 z-50 w-40 overflow-hidden rounded-xl border border-line2 bg-panel2 py-1 shadow-xl"
                    >
                      <button
                        onClick={() => {
                          openProject(p.id);
                          setMenuFor(null);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-dim transition-colors hover:bg-panel3 hover:text-text"
                      >
                        <CodeIcon className="h-3.5 w-3.5" /> Open
                      </button>
                      <button
                        onClick={() => {
                          setDeleteTarget({ kind: "project", id: p.id, name: p.name });
                          setMenuFor(null);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-coral transition-colors hover:bg-coral/10"
                      >
                        <TrashIcon className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* feature links */}
      <div className="border-t border-line px-3 pb-1 pt-3">
        <button
          onClick={() => {
            setMode("coder");
            setMobileSide(false);
          }}
          className={`row-hl flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-all ${
            mode === "coder" ? "bg-panel3 text-text" : "text-dim hover:text-text"
          }`}
          title="Open Coder"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet/15 text-violet2">
            <CodeIcon className="h-3.5 w-3.5" />
          </span>
          <span className="flex-1 text-[13px] font-bold">Coder</span>
          <span className="font-mono text-[9.5px] uppercase tracking-wider text-faint">build apps</span>
        </button>
      </div>

      {/* DID profile row */}
      {identity && (
        <div className="relative border-t border-line p-3">
          <button
            onClick={() => setProfileMenu((v) => !v)}
            className={`row-hl flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors ${
              profileMenu ? "bg-panel2" : ""
            }`}
            title="Identity menu"
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-ink"
              style={{ background: `linear-gradient(135deg, hsl(${didHue(identity.did)} 70% 65%), hsl(${(didHue(identity.did) + 60) % 360} 70% 55%))` }}
            >
              {identity.did.slice(-2).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-mono text-[11px] font-bold text-text">{shortDid(identity.did, 14, 4)}</span>
              <span className="block font-mono text-[9px] uppercase tracking-wider text-mint">did verified · full access</span>
            </span>
            <GearIcon className="h-4 w-4 text-faint" />
          </button>

          {profileMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProfileMenu(false)} />
              <div ref={profileRef} className="anim-rise absolute bottom-[64px] left-3 z-50 w-[236px] overflow-hidden rounded-xl border border-line2 bg-panel2 py-1 shadow-xl">
                <div className="border-b border-line px-3.5 py-2.5">
                  <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-faint">decentralized id</p>
                  <p className="mt-1 break-all font-mono text-[10.5px] leading-relaxed text-violet3">{shortDid(identity.did, 22, 10)}</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(identity.did).catch(() => {});
                    setProfileMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-[12.5px] text-dim transition-colors hover:bg-panel3 hover:text-text"
                >
                  <CopyIcon className="h-3.5 w-3.5" /> Copy DID
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([identityBackup(identity)], { type: "application/json" });
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(blob);
                    a.download = "aide-identity.json";
                    a.click();
                    URL.revokeObjectURL(a.href);
                    setProfileMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-[12.5px] text-dim transition-colors hover:bg-panel3 hover:text-text"
                >
                  <KeyIcon className="h-3.5 w-3.5" /> Download backup
                </button>
                <button
                  onClick={openSettings}
                  className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-[12.5px] text-dim transition-colors hover:bg-panel3 hover:text-text"
                >
                  <GearIcon className="h-3.5 w-3.5" /> Provider keys
                </button>
                <button
                  onClick={() => {
                    setDeleteTarget({ kind: "identity", id: identity.did, name: shortDid(identity.did) });
                    setProfileMenu(false);
                  }}
                  className="flex w-full items-center gap-2 border-t border-line px-3.5 py-2 text-left text-[12.5px] text-coral transition-colors hover:bg-coral/10"
                >
                  <TrashIcon className="h-3.5 w-3.5" /> Sign out &amp; wipe
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );

  /* ---------- compact icon rail (collapsed desktop / mobile) ---------- */
  const rail = (onExpand: () => void) => (
    <div className="flex h-full w-[60px] flex-col items-center bg-panel py-4">
      <button
        onClick={onExpand}
        className="icon-btn"
        title="Expand sidebar"
        aria-label="Expand sidebar"
      >
        <PanelLeftIcon className="h-4 w-4" />
      </button>
      <button onClick={handleNew} className="icon-btn mt-1.5" title="New chat" aria-label="New chat">
        <PlusIcon className="h-4 w-4 text-violet2" />
      </button>

      <div className="my-3 h-px w-7 bg-line2" />

      <div className="min-h-0 w-full flex-1 space-y-1.5 overflow-y-auto px-3">
        {convs.map((c) => {
          const isActive = active?.id === c.id && mode === "chat";
          const letter = (c.title || "").trim().charAt(0).toUpperCase();
          return (
            <button
              key={c.id}
              onClick={() => openChat(c.id)}
              title={c.title || "New chat"}
              aria-label={c.title || "New chat"}
              className={`mx-auto flex h-9 w-9 items-center justify-center rounded-xl border text-[12px] font-extrabold transition-all ${
                isActive
                  ? "border-violet/50 bg-violet/15 text-violet2"
                  : "border-transparent text-dim hover:border-line hover:bg-panel2 hover:text-text"
              }`}
            >
              {letter || <ChatIcon className="h-4 w-4" />}
            </button>
          );
        })}
      </div>

      <div className="my-3 h-px w-7 bg-line2" />
      <button
        onClick={() => {
          if (projects.length) openProject(activeProjectId ?? projects[0].id);
          else {
            setMode("coder");
            setMobileSide(false);
          }
        }}
        title="Open Coder"
        aria-label="Open Coder"
        className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
          mode === "coder"
            ? "border-violet/50 bg-violet/15 text-violet2"
            : "border-transparent text-dim hover:border-line hover:bg-panel2 hover:text-text"
        }`}
      >
        <CodeIcon className="h-4 w-4" />
      </button>

      <button
        onClick={openSettings}
        title="Settings"
        aria-label="Settings"
        className="mt-3 flex h-9 w-9 items-center justify-center rounded-full bg-violet/18 text-[12px] font-extrabold text-violet3 transition-all hover:bg-violet/28"
      >
        A
      </button>
    </div>
  );

  /* ---------- DID gate ---------- */
  if (!identity) {
    return <AuthGate onReady={(id) => setIdentity(id)} />;
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-bg">
      {/* sidebar — chat mode only */}
      {mode === "chat" && (
        <>
          {/* desktop: full panel or compact rail */}
          <aside
            className={`hidden shrink-0 overflow-hidden border-r border-line transition-[width] duration-200 ease-out md:block ${
              sideOpen ? "w-[260px]" : "w-[60px]"
            }`}
          >
            <div className="h-full">{sideOpen ? sidebar(false) : rail(() => setSideOpen(true))}</div>
          </aside>

          {/* mobile: compact rail is always available */}
          <aside className="shrink-0 border-r border-line md:hidden">
            <div className="h-full">{rail(() => setMobileSide(true))}</div>
          </aside>
        </>
      )}

      {/* mobile drawer (opened from the rail) */}
      {mobileSide && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="backdrop-in absolute inset-0 bg-ink/70" onClick={() => setMobileSide(false)} />
          <div className="drawer-in absolute left-0 top-0 h-full border-r border-line shadow-2xl">
            {sidebar(true)}
          </div>
        </div>
      )}

      {/* main */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* top bar */}
        <header className="flex h-[54px] shrink-0 items-center gap-1.5 px-3.5">
          <ModelPicker
            modelId={modelId}
            onChange={setModelId}
            cfgs={cfgs}
            catalog={catalog}
            onRefresh={refreshProvider}
            onRefreshAll={refreshAll}
          />

          <div className="ml-auto flex items-center gap-1 rounded-full border border-line bg-panel p-1">
            {(
              [
                { id: "chat", label: "Chat", icon: ChatIcon },
                { id: "coder", label: "Coder", icon: CodeIcon },
                { id: "translate", label: "Translate", icon: TranslateIcon },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-extrabold transition-all ${
                  mode === m.id ? "bg-panel3 text-text shadow-sm" : "text-faint hover:text-dim"
                }`}
                aria-pressed={mode === m.id}
              >
                <m.icon className="h-3.5 w-3.5" />
                <span className="max-sm:hidden">{m.label}</span>
              </button>
            ))}
          </div>
        </header>

        <div className="min-h-0 flex-1">
          {mode === "chat" ? (
            active && (
              <ChatMode
                conv={active}
                patchConv={patchConv}
                cfgs={cfgs}
                catalog={catalog}
                modelId={modelId}
                onModel={setModelId}
              />
            )
          ) : mode === "coder" ? (
            <CoderMode
              project={activeProject}
              patchProject={patchProject}
              createProject={createProject}
              cfgs={cfgs}
              catalog={catalog}
              modelId={modelId}
            />
          ) : (
            <TranslatorMode cfgs={cfgs} catalog={catalog} modelId={modelId} />
          )}
        </div>

        {mode === "chat" && active && active.messages.length > 0 && (
          <div className="pointer-events-none pb-2 text-center font-mono text-[10px] text-faint">
            ≈ {fmtTok(active.messages.reduce((s, m) => s + (m.tokens ?? 0), 0))} tokens · free models only
          </div>
        )}
      </main>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="backdrop-in absolute inset-0 bg-ink/70" onClick={() => setDeleteTarget(null)} />
          <div className="anim-rise relative w-full max-w-sm rounded-2xl border border-line2 bg-panel p-5 shadow-2xl">
            <h3 className="text-[15px] font-bold text-text">
              {deleteTarget.kind === "identity"
                ? "Sign out & wipe identity?"
                : `Delete ${deleteTarget.kind === "chat" ? "chat" : "project"}?`}
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-dim">
              {deleteTarget.kind === "identity" ? (
                <>
                  The DID <span className="font-mono text-[11.5px] text-violet3">{deleteTarget.name}</span> and all
                  local data (chats, projects, keys) will be erased from this device. Without your backup file the
                  identity is unrecoverable.
                </>
              ) : (
                <>
                  <span className="font-semibold text-text">“{deleteTarget.name}”</span> will be permanently
                  removed. This action can't be undone.
                </>
              )}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-line px-4 py-2 text-[13px] font-semibold text-dim transition-all hover:border-line2 hover:text-text"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteTarget.kind === "chat") handleDelete(deleteTarget.id);
                  else if (deleteTarget.kind === "project") deleteProject(deleteTarget.id);
                  else {
                    try {
                      Object.keys(localStorage)
                        .filter((k) => k.startsWith("aide."))
                        .forEach((k) => localStorage.removeItem(k));
                    } catch {
                      /* ignore */
                    }
                    setDeleteTarget(null);
                    setIdentity(null);
                  }
                }}
                className="rounded-xl bg-coral px-4 py-2 text-[13px] font-bold text-white transition-all hover:brightness-110"
              >
                {deleteTarget.kind === "identity" ? "Wipe & sign out" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <SettingsModal
          cfgs={cfgs}
          onCfgs={setCfgs}
          onKeyChanged={onKeyChanged}
          catalog={catalog}
          onRefresh={refreshProvider}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

/* ---------------- settings ---------------- */

function SettingsModal({
  cfgs,
  onCfgs,
  onKeyChanged,
  catalog,
  onRefresh,
  onClose,
}: {
  cfgs: Record<string, ProviderCfg>;
  onCfgs: (c: Record<string, ProviderCfg>) => void;
  onKeyChanged: (pid: string) => void;
  catalog: LiveCatalog;
  onRefresh: (pid: string) => Promise<void>;
  onClose: () => void;
}) {
  const [testState, setTestState] = useState<Record<string, "idle" | "busy" | "ok" | "fail">>({});

  /* test = fetch the real /models list (also refreshes the catalog) */
  async function test(id: string) {
    setTestState((s) => ({ ...s, [id]: "busy" }));
    try {
      await onRefresh(id);
      setTestState((s) => ({ ...s, [id]: "ok" }));
    } catch {
      setTestState((s) => ({ ...s, [id]: "fail" }));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="backdrop-in absolute inset-0 bg-ink/70" onClick={onClose} />
      <div className="anim-rise relative flex max-h-[86vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-line2 bg-panel shadow-[0_30px_90px_-20px_rgba(0,0,0,0.8)]">
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <KeyIcon className="h-4.5 w-4.5 text-violet2" />
          <div>
            <h2 className="font-display text-[15px] font-bold">Providers</h2>
            <p className="font-mono text-[10.5px] text-faint">all free · keys stay in your browser</p>
          </div>
          <button onClick={onClose} className="icon-btn ml-auto" title="Close" aria-label="Close settings">
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
                  const liveCount = catalog[p.id]?.models?.length ?? 0;
                  return (
                    <div key={p.id} className="rounded-2xl border border-line bg-panel2/70 p-3 transition-colors hover:border-line2">
                      <div className="flex items-center gap-2.5">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.accent }} />
                        <span className="text-[13.5px] font-bold">{p.name}</span>
                        {liveCount > 0 && (
                          <span className="rounded-full border border-mint/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-mint">
                            {liveCount} models
                          </span>
                        )}
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
                              onChange={(e) => {
                                onCfgs({ ...cfgs, [p.id]: { ...cfg, key: e.target.value } });
                                onKeyChanged(p.id);
                              }}
                              placeholder={p.keyName ?? "API key"}
                              className="field flex-1 font-mono text-[12px]"
                              autoComplete="off"
                            />
                          )}
                          <input
                            value={cfg.baseUrl}
                            onChange={(e) => {
                              onCfgs({ ...cfgs, [p.id]: { ...cfg, baseUrl: e.target.value } });
                              onKeyChanged(p.id);
                            }}
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
