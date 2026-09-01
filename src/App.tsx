import { useCallback, useEffect, useRef, useState } from "react";
import { PROVIDERS, providerById, KIND_LABEL } from "./data/providers";
import { DEFAULT_MODEL_ID } from "./data/models";
import {
  load, save, newConversation, uid,
  type Conversation, type ProviderCfg,
} from "./lib/store";
import { fetchProviderModels, freshEntries, type LiveCatalog } from "./lib/modelFetch";
import { identityBackup, shortDid, type Identity } from "./lib/did";
import { useI18n } from "./lib/i18n";
import { useTheme } from "./lib/theme";
import ChatMode from "./components/ChatMode";

import TranslatorMode from "./components/TranslatorMode";
import ModelPicker from "./components/ModelPicker";
import Landing from "./components/Landing";
import AuthGate from "./components/AuthGate";
import { ThemeToggle, LangPicker } from "./components/Appearance";
import {
  BrandMark, Wordmark, PlusIcon, TrashIcon, GearIcon, XIcon,
  KeyIcon, ChatIcon, CheckIcon, CopyIcon,
  PanelLeftIcon, DotsIcon, PenIcon, TranslateIcon, Seal, Tryzub,
} from "./components/Icons";

type Mode = "chat" | "translate";

const GROUP_ORDER = ["Today", "Yesterday", "Previous 7 Days", "Previous 30 Days", "Older"] as const;

function groupLabel(ts: number): (typeof GROUP_ORDER)[number] {
  const now = new Date();
  const d = new Date(ts);
  const day = (x: Date) => x.toDateString();
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  if (day(d) === day(now)) return "Today";
  if (day(d) === day(yest)) return "Yesterday";
  const diff = now.getTime() - ts;
  if (diff < 7 * 864e5) return "Previous 7 Days";
  if (diff < 30 * 864e5) return "Previous 30 Days";
  return "Older";
}

export default function App() {
  const { t, lang } = useI18n();
  const theme = useTheme();

  const [mode, setMode] = useState<Mode>(() => {
    const m = load<Mode>("mode", "chat");
    return m === "translate" ? "translate" : "chat";
  });
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


  const [showSettings, setShowSettings] = useState(false);

  /* per-item kebab menu + inline rename + delete modal */
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ kind: "chat" | "identity"; id: string; name: string } | null>(null);
  const [profileMenu, setProfileMenu] = useState(false);

  /* DID identity (gate): landing → auth → app */
  const [identity, setIdentity] = useState<Identity | null>(() => load<Identity | null>("identity", null));
  const [gate, setGate] = useState<"landing" | "auth">("landing");
  const [authPhase, setAuthPhase] = useState<"idle" | "import">("idle");

  /* live model catalog, fetched from provider APIs */
  const [catalog, setCatalog] = useState<LiveCatalog>(() => load<LiveCatalog>("catalog", {}));

  const menuRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const cfgsRef = useRef(cfgs);
  useEffect(() => {
    cfgsRef.current = cfgs;
  }, [cfgs]);

  /* ---------- persistence ---------- */
  useEffect(() => save("convs", convs), [convs]);
  useEffect(() => save("active", activeId), [activeId]);
  useEffect(() => save("model", modelId), [modelId]);
  useEffect(() => save("cfgs", cfgs), [cfgs]);

  useEffect(() => save("mode", mode), [mode]);
  useEffect(() => save("sideOpen", sideOpen), [sideOpen]);
  useEffect(() => save("catalog", catalog), [catalog]);
  useEffect(() => {
    if (identity) save("identity", identity);
  }, [identity]);

  useEffect(() => {
    if (!convs.some((c) => c.id === activeId)) setActiveId(convs[0]?.id ?? "");
  }, [convs, activeId]);

  /* ---------- live catalog ---------- */
  const refreshProvider = useCallback(async (pid: string) => {
    const p = providerById.get(pid);
    if (!p) return;
    const cfg = cfgsRef.current[pid] ?? { key: "", baseUrl: p.baseUrl };
    const models = await fetchProviderModels(p, cfg);
    setCatalog((c) => ({ ...c, [pid]: { models, at: Date.now() } }));
  }, []);

  const refreshAll = useCallback(() => {
    PROVIDERS.forEach((p) => {
      const cfg = cfgsRef.current[p.id];
      const reachable = p.keyless || p.local || !!cfg?.key?.trim();
      if (reachable) refreshProvider(p.id).catch(() => {});
    });
  }, [refreshProvider]);

  /* on first launch: pull models for whatever is already reachable */
  useEffect(() => {
    const fresh = freshEntries(catalog);
    PROVIDERS.forEach((p) => {
      const cfg = cfgsRef.current[p.id];
      const reachable = p.keyless || p.local || !!cfg?.key?.trim();
      if (reachable && !fresh[p.id]) refreshProvider(p.id).catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const keyTimers = useRef<Record<string, number>>({});
  const onKeyChanged = useCallback(
    (pid: string) => {
      window.clearTimeout(keyTimers.current[pid]);
      keyTimers.current[pid] = window.setTimeout(() => refreshProvider(pid).catch(() => {}), 800);
    },
    [refreshProvider]
  );

  /* ---------- actions ---------- */
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
      setDeleteTarget(null);
    },
    [activeId]
  );

  function logout() {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("aide."))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
    location.reload();
  }

  function downloadBackup(id: Identity) {
    const blob = new Blob([identityBackup(id)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "aide-identity.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /* ---------- derived ---------- */
  const active = convs.find((c) => c.id === activeId) ?? convs[0];
  const nKeys = Object.values(cfgs).filter((c) => c.key?.trim()).length;

  const groups = GROUP_ORDER.map((g) => ({
    g,
    label: t(
      g === "Today" ? "nav.today" : g === "Yesterday" ? "nav.yesterday" : g === "Previous 7 Days" ? "nav.prev7" : g === "Previous 30 Days" ? "nav.prev30" : "nav.older"
    ),
    items: convs.filter((c) => groupLabel(c.createdAt) === g),
  })).filter((x) => x.items.length > 0);

  /* click-outside for kebab & profile menus */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuFor(null);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileMenu(false);
    };
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, []);

  /* Esc closes drawers/modals */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileSide(false);
        setMenuFor(null);
        setProfileMenu(false);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  /* ---------- DID gate ---------- */
  if (!identity) {
    if (gate === "landing") {
      return (
        <Landing
          onStart={() => {
            setAuthPhase("idle");
            setGate("auth");
          }}
          onRestore={() => {
            setAuthPhase("import");
            setGate("auth");
          }}
          theme={theme}
        />
      );
    }
    return (
      <AuthGate
        initial={authPhase}
        onBack={() => setGate("landing")}
        theme={theme}
        onReady={(id) => setIdentity(id)}
      />
    );
  }

  /* ---------- shared sidebar content ---------- */
  const sidebarInner = (
    <>
      <div className="flex items-center gap-2 border-b border-line px-3 py-3.5">
        <BrandMark className="h-8 w-8 shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Wordmark className="text-[15px] leading-none" />
            {lang === "zh" && <Seal ch="智" className="h-5 w-5 text-[10px]" />}
            {lang === "uk" && <Tryzub className="h-5 w-5" />}
          </div>
          <p className="mt-1 truncate font-mono text-[8.5px] uppercase tracking-[0.2em] text-faint">{t("app.tagline")}</p>
        </div>
        <button
          onClick={() => setSideOpen(false)}
          className="icon-btn ms-auto hidden md:flex"
          title={t("nav.collapse")}
          aria-label={t("nav.collapse")}
        >
          <PanelLeftIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => setMobileSide(false)}
          className="icon-btn ms-auto md:hidden"
          title={t("nav.closeMenu")}
          aria-label={t("nav.closeMenu")}
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="p-3 pb-1">
        <button onClick={handleNew} className="btn-brand flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-extrabold">
          <PlusIcon className="h-4 w-4 text-white" />
          {t("nav.newChat")}
        </button>
      </div>

      <div className="mt-2 min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {groups.length === 0 && <p className="px-2 py-1 font-mono text-[10.5px] text-faint">{t("nav.noChats")}</p>}
        {groups.map(({ g, label, items }) => (
          <div key={g} className="mb-2">
            <p className="px-2 pb-1 pt-2 text-[11px] font-bold text-faint">{label}</p>
            <ul className="space-y-0.5">
              {items.map((c) => {
                const isActive = c.id === activeId && mode === "chat";
                const isMenu = menuFor === c.id;
                const isRenaming = renamingId === c.id;
                return (
                  <li key={c.id} className="relative">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setActiveId(c.id);
                        setMode("chat");
                        setMobileSide(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.target !== e.currentTarget) return;
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setActiveId(c.id);
                          setMode("chat");
                          setMobileSide(false);
                        }
                      }}
                      className={`group flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-start text-[13px] transition-all ${
                        isActive ? "bg-panel3 font-semibold text-text" : "text-dim hover:bg-panel2 hover:text-text"
                      }`}
                    >
                      <span
                        className={`absolute start-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-e bg-violet2 transition-opacity ${
                          isActive ? "opacity-100" : "opacity-0"
                        }`}
                      />
                      {isRenaming ? (
                        <input
                          autoFocus
                          value={renameDraft}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setRenameDraft(e.target.value)}
                          onBlur={() => {
                            patchConv(c.id, (cc) => ({ ...cc, title: renameDraft.trim() || cc.title }));
                            setRenamingId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              patchConv(c.id, (cc) => ({ ...cc, title: renameDraft.trim() || cc.title }));
                              setRenamingId(null);
                            }
                            if (e.key === "Escape") setRenamingId(null);
                          }}
                          className="w-full rounded-md border border-violet/50 bg-ink px-1.5 py-0.5 text-[12.5px] outline-none"
                        />
                      ) : (
                        <span className="min-w-0 flex-1 truncate">{c.title || t("nav.newChat")}</span>
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
                          title={t("common.options")}
                          aria-label={t("common.options")}
                        >
                          <DotsIcon className="h-4 w-4 text-faint" />
                        </button>
                      )}
                    </div>

                    {isMenu && (
                      <div
                        ref={menuRef}
                        className="anim-rise absolute end-2 top-9 z-50 w-40 overflow-hidden rounded-xl border border-line2 bg-panel2 py-1 shadow-xl"
                      >
                        <button
                          onClick={() => {
                            setRenamingId(c.id);
                            setRenameDraft(c.title || "");
                            setMenuFor(null);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-start text-[13px] text-dim transition-colors hover:bg-panel3 hover:text-text"
                        >
                          <PenIcon className="h-3.5 w-3.5" /> {t("common.rename")}
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTarget({ kind: "chat", id: c.id, name: c.title || t("nav.newChat") });
                            setMenuFor(null);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-start text-[13px] text-coral transition-colors hover:bg-coral/10"
                        >
                          <TrashIcon className="h-3.5 w-3.5" /> {t("common.delete")}
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

      </div>

      {/* linguist shortcut + profile */}
      <div className="border-t border-line px-3 pb-1 pt-2.5">
        <button
          onClick={() => {
            setMode("translate");
            setMobileSide(false);
          }}
          className="row-hl flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-start text-dim transition-all hover:text-text"
          title={t("tr.title")}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyanic/15 text-cyanic">
            <TranslateIcon className="h-3.5 w-3.5" />
          </span>
          <span className="flex-1 text-[13px] font-bold">{t("tr.title")}</span>
          <span className="font-mono text-[9.5px] uppercase tracking-wider text-faint">{t("tr.taglineShort")}</span>
        </button>
      </div>

      <div className="relative border-t border-line p-3" ref={profileRef}>
        <button
          onClick={() => setProfileMenu((v) => !v)}
          className="row-hl flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-start transition-colors"
          title={t("profile.name")}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet/18 text-[12px] font-extrabold text-violet3">
            A
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-bold text-text">{t("profile.name")}</span>
            <span className="block truncate font-mono text-[9.5px] uppercase tracking-wider text-faint">
              {identity ? shortDid(identity.did) : ""}
            </span>
          </span>
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${nKeys ? "pulse-live bg-mint" : "bg-gold"}`}
            title={nKeys ? `${nKeys} keys` : "demo"}
          />
        </button>

        {profileMenu && identity && (
          <div className="anim-rise absolute bottom-full start-3 z-50 mb-1 w-52 overflow-hidden rounded-xl border border-line2 bg-panel2 py-1 shadow-xl">
            <button
              onClick={() => {
                navigator.clipboard?.writeText(identity.did).catch(() => {});
                setProfileMenu(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-start text-[13px] text-dim transition-colors hover:bg-panel3 hover:text-text"
            >
              <CopyIcon className="h-3.5 w-3.5" /> {t("profile.copyDid")}
            </button>
            <button
              onClick={() => {
                downloadBackup(identity);
                setProfileMenu(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-start text-[13px] text-dim transition-colors hover:bg-panel3 hover:text-text"
            >
              <KeyIcon className="h-3.5 w-3.5" /> {t("profile.backup")}
            </button>
            <button
              onClick={() => {
                setDeleteTarget({ kind: "identity", id: "identity", name: identity.did });
                setProfileMenu(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-start text-[13px] text-coral transition-colors hover:bg-coral/10"
            >
              <TrashIcon className="h-3.5 w-3.5" /> {t("profile.signOut")}
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="flex h-dvh overflow-hidden bg-bg">
      {/* ---------- sidebar: desktop expanded / icon rail / mobile drawer ---------- */}
      {mode !== "translate" && (
        <>
          {/* desktop */}
          <aside
            className={`hidden shrink-0 flex-col border-e border-line bg-panel/70 backdrop-blur transition-all duration-300 md:flex ${
              sideOpen ? "w-[266px]" : "w-[60px]"
            }`}
          >
            {sideOpen ? (
              sidebarInner
            ) : (
              <div className="flex h-full flex-col items-center gap-1.5 py-3">
                <button
                  onClick={() => setSideOpen(true)}
                  className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl text-dim transition-colors hover:bg-panel2 hover:text-text"
                  title={t("nav.expand")}
                  aria-label={t("nav.expand")}
                >
                  <PanelLeftIcon className="h-4.5 w-4.5" />
                </button>
                <BrandMark className="mb-2 h-8 w-8" />
                <button
                  onClick={handleNew}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-dim transition-colors hover:bg-panel2 hover:text-violet2"
                  title={t("nav.newChat")}
                  aria-label={t("nav.newChat")}
                >
                  <PlusIcon className="h-4.5 w-4.5" />
                </button>
                {convs.slice(0, 4).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setActiveId(c.id);
                      setMode("chat");
                    }}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                      c.id === activeId && mode === "chat" ? "bg-violet/15 text-violet2" : "text-dim hover:bg-panel2 hover:text-text"
                    }`}
                    title={c.title || t("nav.newChat")}
                  >
                    <ChatIcon className="h-4 w-4" />
                  </button>
                ))}
                <button
                  onClick={() => setMode("translate")}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-dim transition-colors hover:bg-panel2 hover:text-text"
                  title={t("tr.title")}
                  aria-label={t("tr.title")}
                >
                  <TranslateIcon className="h-4 w-4" />
                </button>
                <div className="flex-1" />
                <button
                  onClick={() => setShowSettings(true)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-dim transition-colors hover:bg-panel2 hover:text-text"
                  title={t("nav.settings")}
                  aria-label={t("nav.settings")}
                >
                  <GearIcon className="h-4.5 w-4.5" />
                </button>
              </div>
            )}
          </aside>

          {/* mobile drawer */}
          {mobileSide && (
            <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
              <div className="backdrop-in absolute inset-0 bg-ink/70" onClick={() => setMobileSide(false)} />
              <aside className="drawer-in absolute inset-y-0 start-0 flex w-[280px] max-w-[85vw] flex-col border-e border-line bg-panel">
                {sidebarInner}
              </aside>
            </div>
          )}
        </>
      )}

      {/* ---------- main ---------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[54px] min-w-0 shrink-0 items-center gap-1.5 px-2 sm:px-3.5">
          {mode !== "translate" && (
            <button
              onClick={() => setMobileSide(true)}
              className="icon-btn md:hidden"
              title={t("nav.openMenu")}
              aria-label={t("nav.openMenu")}
            >
              <PanelLeftIcon className="h-4.5 w-4.5" />
            </button>
          )}
          {mode === "translate" && (
            <button
              onClick={() => {
                setMode("chat");
                setMobileSide(false);
              }}
              className="icon-btn"
              title={t("nav.openMenu")}
              aria-label={t("nav.openMenu")}
            >
              <PanelLeftIcon className="h-4.5 w-4.5" />
            </button>
          )}

          <ModelPicker
            modelId={modelId}
            onChange={setModelId}
            cfgs={cfgs}
            catalog={catalog}
            onRefresh={refreshProvider}
            onRefreshAll={refreshAll}
          />

          <div className="ms-auto flex items-center gap-1 rounded-full border border-line bg-panel p-1">
            {(
              [
                { id: "chat", label: t("mode.chat"), icon: ChatIcon },
                { id: "translate", label: t("tr.title"), icon: TranslateIcon },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-extrabold transition-all sm:px-3.5 ${
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
                onRefresh={refreshProvider}
                onRefreshAll={refreshAll}
              />
            )
          ) : (
            <TranslatorMode cfgs={cfgs} catalog={catalog} modelId={modelId} />
          )}
        </div>
      </div>

      {showSettings && (
        <SettingsModal
          cfgs={cfgs}
          onCfgs={setCfgs}
          catalog={catalog}
          onKeyChanged={onKeyChanged}
          onTest={refreshProvider}
          theme={theme}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* delete / sign-out confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="backdrop-in absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="anim-rise relative w-full max-w-[360px] rounded-2xl border border-line2 bg-panel p-5 shadow-2xl">
            <h3 className="text-[16px] font-extrabold text-text">{t("confirm.deleteTitle")}</h3>
            <p className="mt-1.5 break-words text-[13px] leading-relaxed text-dim">
              “{deleteTarget.name}” — {t("confirm.deleteAsk")}
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="row-hl flex-1 rounded-xl border border-line py-2.5 text-[13px] font-bold text-dim hover:text-text"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={() => {
                  if (deleteTarget.kind === "chat") handleDelete(deleteTarget.id);
                  else logout();
                }}
                className="flex-1 rounded-xl bg-coral py-2.5 text-[13px] font-extrabold text-white transition-all hover:brightness-110"
              >
                {t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- settings modal ---------------- */

function SettingsModal({
  cfgs,
  onCfgs,
  catalog,
  onKeyChanged,
  onTest,
  theme,
  onClose,
}: {
  cfgs: Record<string, ProviderCfg>;
  onCfgs: (c: Record<string, ProviderCfg>) => void;
  catalog: LiveCatalog;
  onKeyChanged: (pid: string) => void;
  onTest: (pid: string) => Promise<void>;
  theme: ReturnType<typeof useTheme>;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [testState, setTestState] = useState<Record<string, "idle" | "busy" | "ok" | "fail">>({});

  async function test(id: string) {
    setTestState((s) => ({ ...s, [id]: "busy" }));
    try {
      await onTest(id);
      setTestState((s) => ({ ...s, [id]: "ok" }));
    } catch {
      setTestState((s) => ({ ...s, [id]: "fail" }));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true">
      <div className="backdrop-in absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={onClose} />
      <div className="anim-rise relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line2 bg-panel shadow-[0_30px_90px_-20px_rgba(0,0,0,0.8)]">
        <div className="flex items-center gap-3 border-b border-line px-4 py-3.5 sm:px-5">
          <KeyIcon className="h-4.5 w-4.5 text-violet3" />
          <div className="min-w-0">
            <h2 className="font-display text-[15px] font-bold">{t("settings.title")}</h2>
            <p className="truncate font-mono text-[10.5px] text-faint">{t("settings.sub")}</p>
          </div>
          <button onClick={onClose} className="icon-btn ms-auto" title={t("common.close")} aria-label={t("common.close")}>
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {/* appearance */}
          <section className="mb-5 rounded-xl border border-line bg-panel2/60 p-3.5">
            <p className="overline mb-2.5">{t("ui.appearance")}</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[12.5px] font-bold text-dim">{t("ui.theme")}</span>
              <ThemeToggle mode={theme.mode} setMode={theme.setMode} />
              <span className="ms-2 text-[12.5px] font-bold text-dim">{t("ui.language")}</span>
              <LangPicker />
            </div>
          </section>

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
                    <div key={p.id} className="rounded-xl border border-line bg-panel2/70 p-3 transition-colors hover:border-line2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.accent }} />
                        <span className="text-[13.5px] font-bold">{p.name}</span>
                        {p.keyless ? (
                          <span className="flex items-center gap-1 rounded-full border border-violet/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-violet3">
                            <CheckIcon className="h-2.5 w-2.5" /> {t("settings.keyless")}
                          </span>
                        ) : hasKey ? (
                          <span className="flex items-center gap-1 rounded-full border border-mint/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-mint">
                            <CheckIcon className="h-2.5 w-2.5" /> {t("settings.keySet")}
                          </span>
                        ) : p.local ? (
                          <span className="rounded-full border border-cyanic/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-cyanic">
                            {t("settings.local")}
                          </span>
                        ) : null}
                        {liveCount > 0 && (
                          <span className="rounded-full bg-panel3 px-2 py-0.5 font-mono text-[9px] text-mint">
                            {liveCount} {t("settings.models")}
                          </span>
                        )}
                        <a
                          href={p.keyUrl ?? p.docs}
                          target="_blank"
                          rel="noreferrer"
                          className="ms-auto font-mono text-[10px] text-faint underline decoration-line2 underline-offset-2 transition-colors hover:text-violet3"
                        >
                          {p.keyUrl ? t("settings.getKey") : t("settings.docs")}
                        </a>
                        <button
                          onClick={() => test(p.id)}
                          disabled={st === "busy"}
                          className="rounded-lg border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-dim transition-all hover:border-violet/50 hover:text-violet3 disabled:opacity-50"
                        >
                          {st === "busy" ? t("settings.ping") : st === "ok" ? t("settings.ok") : st === "fail" ? t("settings.fail") : t("settings.test")}
                        </button>
                      </div>
                      <p className="mt-1 text-[11.5px] leading-snug text-faint">{p.note}</p>
                      {!p.keyless && (
                        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
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
                            className={`field font-mono text-[11px] ltr-keep ${p.local ? "flex-1" : "sm:w-[220px]"}`}
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

        <div className="border-t border-line px-4 py-3 sm:px-5">
          <p className="font-mono text-[10.5px] text-faint">{t("settings.note")}</p>
        </div>
      </div>
    </div>
  );
}
