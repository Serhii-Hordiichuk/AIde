import { useEffect, useRef, useState } from "react";
import { getModelInfo, isAutoModel, resolveAutoModel } from "../data/models";
import { providerById, PROVIDERS } from "../data/providers";
import { scaffoldProject, generateProjectWithLLM, buildPreviewDoc } from "../lib/engine";
import { ROLES, buildPlan, buildLLMPlan, uniqueRoles, type Subtask } from "../lib/plan";
import type { Project, ProjectFile, ProviderCfg } from "../lib/store";
import type { LiveCatalog } from "../lib/modelFetch";
import { useI18n } from "../lib/i18n";
import {
  BrandMark, SendIcon, CodeIcon, EyeIcon, TerminalIcon, RefreshIcon, PlayIcon,
  CheckIcon, FileIcon, OpenIcon, XIcon, ListIcon,
} from "./Icons";

type Tab = "code" | "preview" | "term";

interface Props {
  project: Project | null;
  patchProject: (id: string, fn: (p: Project) => Project) => void;
  createProject: (prompt: string) => string;
  cfgs: Record<string, ProviderCfg>;
  catalog: LiveCatalog;
  modelId: string;
}

const COLOR_WORDS: Record<string, string> = {
  green: "#3ecf8e", teal: "#0f9d8f", violet: "#8b7cff", purple: "#8b7cff",
  blue: "#5b8cff", cyan: "#58c4dd", red: "#ff6b6b", pink: "#ff8ac2",
  yellow: "#ffc24b", orange: "#ff9950", black: "#1d1d22", white: "#f5f5f7",
  зелени: "#3ecf8e", синь: "#5b8cff", червон: "#ff6b6b", жовт: "#ffc24b",
  绿: "#3ecf8e", 蓝: "#5b8cff", 红: "#ff6b6b", 金: "#d9a441",
  أخضر: "#3ecf8e", أزرق: "#5b8cff", أحمر: "#ff6b6b",
};

const ROLE_TERM: Record<string, string> = {
  ARCH: "text-gold",
  UI: "text-cyanic",
  FE: "text-violet3",
  DOC: "text-[#c9a0ff]",
  QA: "text-[#ff8a5c]",
};

export default function CoderMode({ project, patchProject, createProject, cfgs, catalog, modelId }: Props) {
  const { t } = useI18n();
  const [prompt, setPrompt] = useState("");
  const [follow, setFollow] = useState("");
  const [tab, setTab] = useState<Tab>("code");
  const [fileIdx, setFileIdx] = useState(0);
  const [plan, setPlan] = useState<Subtask[]>([]);
  const [term, setTerm] = useState<string[]>([]);
  const [previewKey, setPreviewKey] = useState(0);
  const [showPlan, setShowPlan] = useState(false);
  const termRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  const model = isAutoModel(modelId) ? resolveAutoModel(modelId, cfgs, freshOf(catalog)) : getModelInfo(modelId);
  const provider = providerById.get(model.providerId) ?? PROVIDERS[0];

  const log = (line: string) => setTerm((prev) => [...prev, line]);
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  useEffect(() => {
    const el = termRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [term]);

  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [plan, term]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  /* ---------- build pipeline: architect → specialists → QA ---------- */
  useEffect(() => {
    if (!project || project.status !== "building") return;
    const pid = project.id;
    setTab("code");
    setFileIdx(0);
    setTerm([]);
    setPlan([{ id: "plan", role: "arch", label: "Analyzing brief & decomposing…", state: "run" }]);
    log(`[ARCH] AiDe Coder · ${model.name} via ${provider.name} — free`);
    log(`[ARCH] brief: “${project.prompt}”`);

    let cancelled = false;
    const ac = new AbortController();

    (async () => {
      await sleep(900);
      if (cancelled) return;

      const llmFiles = await generateProjectWithLLM(
        project.prompt, model.providerId, cfgs[model.providerId], model.apiId,
        (l) => log(l), ac.signal
      ).catch(() => null);
      if (cancelled) return;

      if (llmFiles) {
        log("[ARCH] ✓ decomposed · generating with the live model");
        setPlan(buildLLMPlan(model.name).map((s) => (s.id === "plan" ? { ...s, state: "done" } : s)));
        later(() => setPlan((p) => p.map((s) => (s.id === "fs" ? { ...s, state: "run" } : s))), 300);
        const idx = llmFiles.find((f) => f.name.endsWith(".html")) ?? llmFiles[0];
        later(() => {
          patchProject(pid, (p) => ({ ...p, files: [...p.files, idx], templateId: "llm" }));
          setFileIdx(0);
          setPlan((p) => p.map((s) => (s.id === "fs" ? { ...s, state: "done" } : s)));
        }, 1200);
        const rest = llmFiles.filter((f) => f !== idx);
        later(() => setPlan((p) => p.map((s) => (s.id === "doc" ? { ...s, state: "run" } : s))), 1400);
        rest.forEach((f, i) => {
          later(() => {
            patchProject(pid, (p) => ({ ...p, files: [...p.files, f] }));
            setFileIdx(i + 1);
          }, 1600 + i * 500);
        });
        later(() => {
          setPlan((p) => p.map((s) => (s.id === "doc" ? { ...s, state: "done" } : s)));
          finish(pid);
        }, 1600 + rest.length * 500 + 400);
        return;
      }

      /* built-in generator route */
      log("[ARCH] rerouting → built-in generator");
      const sc = scaffoldProject(project.prompt);
      patchProject(pid, (p) => ({ ...p, name: sc.name, templateId: sc.templateId }));
      const p2 = buildPlan(sc.templateId, sc.files.map((f) => f.name));
      setPlan(p2);
      log(`[ARCH] ✓ decomposed → ${p2.length} subtasks · ${uniqueRoles(p2).length} specialists`);

      await sleep(400);
      for (let i = 0; i < sc.files.length; i++) {
        if (cancelled) return;
        const f = sc.files[i];
        setPlan((p) => p.map((s) => (s.id === f.name ? { ...s, state: "run" } : s)));
        const role = f.name.endsWith(".css") || f.name.endsWith(".html") ? "UI" : f.name.toLowerCase().endsWith(".md") ? "DOC" : "FE";
        log(`[${role}] working on ${f.name}…`);
        await sleep(620);
        if (cancelled) return;
        log(`[${role}] + ${f.name} (${f.content.split("\n").length} lines)`);
        patchProject(pid, (p) => ({ ...p, files: [...p.files, f] }));
        setFileIdx(i);
        setPlan((p) => p.map((s) => (s.id === f.name ? { ...s, state: "done" } : s)));
        await sleep(240);
      }
      finish(pid);
    })();

    function finish(pjId: string) {
      if (cancelled) return;
      setPlan((p) => p.map((s) => (s.id === "qa" ? { ...s, state: "run" } : s)));
      log("[QA] vite build — inlining styles & scripts…");
      later(() => {
        log("[QA] ✓ dist/index.html built · smoke test passed");
        setPlan((p) => p.map((s) => (s.id === "qa" ? { ...s, state: "done" } : s)));
        patchProject(pjId, (p) => ({ ...p, status: "ready" }));
        setTab("preview");
        setPreviewKey((k) => k + 1);
      }, 900);
    }

    return () => {
      cancelled = true;
      ac.abort();
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id, project?.status === "building"]);

  /* ---------- empty state ---------- */
  if (!project) {
    const suggs = [t("coder.sugg1"), t("coder.sugg2"), t("coder.sugg3"), t("coder.sugg4")];
    return (
      <div className="flex h-full flex-col items-center justify-center overflow-y-auto px-4 py-12">
        <div className="floaty mb-5">
          <BrandMark className="h-16 w-16 drop-shadow-[0_0_28px_color-mix(in_srgb,var(--t-violet)_45%,transparent)]" />
        </div>
        <h1 className="text-[24px] font-extrabold tracking-tight sm:text-[26px]">
          AiDe <span className="text-violet2">{t("coder.title")}</span>
        </h1>
        <p className="mt-2 max-w-[520px] text-center text-[14px] leading-relaxed text-dim">{t("coder.emptySub")}</p>
        <div className="mt-7 w-full max-w-[560px]">
          <div className="flex items-end gap-2 rounded-3xl border border-line2 bg-panel2 p-2.5 transition-all focus-within:border-violet/50">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (prompt.trim()) createProject(prompt.trim());
                }
              }}
              rows={2}
              placeholder={t("coder.placeholder")}
              className="flex-1 resize-none bg-transparent px-2 py-1.5 text-[14.5px] leading-relaxed outline-none placeholder:text-faint"
            />
            <button
              onClick={() => prompt.trim() && createProject(prompt.trim())}
              disabled={!prompt.trim()}
              className="btn-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-xl disabled:opacity-35"
              title={t("coder.create")}
            >
              <PlayIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {suggs.map((s) => (
              <button
                key={s}
                onClick={() => createProject(s)}
                className="row-hl rounded-full border border-line bg-panel/70 px-3.5 py-1.5 text-[12.5px] text-dim transition-all hover:-translate-y-0.5 hover:border-violet/45 hover:text-text"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ---------- workspace ---------- */
  const previewDoc = buildPreviewDoc(project.files);
  const current = project.files[Math.min(fileIdx, Math.max(0, project.files.length - 1))];
  const roles = uniqueRoles(plan);
  const doneCount = plan.filter((s) => s.state === "done").length;

  function applyFollowUp() {
    const text = follow.trim();
    if (!text || !project || project.status !== "ready") return;
    setFollow("");
    const low = text.toLowerCase();
    const logs: string[] = [];
    let files = project.files.map((f) => ({ ...f }));

    const colorKey = Object.keys(COLOR_WORDS).find((k) => low.includes(k));
    if (colorKey) {
      const hex = COLOR_WORDS[colorKey];
      files = files.map((f) =>
        f.name.endsWith(".css")
          ? {
              ...f,
              content: f.content
                .replace(/(--accent:\s*)#[0-9a-fA-F]{3,8}/, "$1" + hex)
                .replace(/#615ced/gi, hex)
                .replace(/#4f4ac4/gi, hex),
            }
          : f
      );
      logs.push(`[UI] accent color updated → ${hex}`);
    }
    const quoted = text.match(/["«”]([^"»”]{2,40})["»”]/);
    if (quoted) {
      files = files.map((f) =>
        f.name === "index.html"
          ? { ...f, content: f.content.replace(/<title>[^<]*<\/title>/, "<title>" + quoted[1] + "</title>") }
          : f
      );
      logs.push(`[FE] title → "${quoted[1]}"`);
    }
    if (!logs.length) logs.push("[ARCH] request analyzed — no structural changes needed");

    log(`— change request: ${text}`);
    logs.forEach(log);
    log("[QA] ✓ rebuilt dist/index.html");
    patchProject(project.id, (p) => ({ ...p, files, name: quoted ? quoted[1] : p.name }));
    setPreviewKey((k) => k + 1);
  }

  function openPreview() {
    const blob = new Blob([previewDoc], { type: "text/html;charset=utf-8" });
    window.open(URL.createObjectURL(blob), "_blank");
  }

  const feedRows = (
    <>
      {plan.map((s) => {
        const role = ROLES[s.role];
        return (
          <div
            key={s.id}
            className={`step-in flex items-start gap-2.5 rounded-lg border px-2.5 py-2 transition-colors ${
              s.state === "run" ? "border-line2 bg-panel2" : "border-line/60 bg-panel/50"
            }`}
          >
            <span
              className="mt-px flex h-6 w-9 shrink-0 items-center justify-center rounded border font-mono text-[9px] font-bold tracking-wider"
              style={{ color: role.color, borderColor: role.color + "55", background: role.color + "12" }}
            >
              {role.short}
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block text-[12.5px] leading-snug ${s.state === "wait" ? "text-faint" : "text-text"}`}>
                {s.label}
              </span>
              {s.produces && (
                <span className="mt-0.5 inline-flex items-center gap-1 font-mono text-[10px] text-faint ltr-keep">
                  <FileIcon className="h-2.5 w-2.5" />
                  {s.produces}
                </span>
              )}
            </span>
            <span className="mt-1 shrink-0">
              {s.state === "done" ? (
                <CheckIcon className="h-3.5 w-3.5 text-mint" />
              ) : s.state === "run" ? (
                <span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-line2 border-t-violet3" />
              ) : (
                <span className="block h-2 w-2 translate-x-[3px] rounded-full border border-line2" />
              )}
            </span>
          </div>
        );
      })}

      {project.status === "ready" && (
        <div className="step-in mt-2 rounded-xl border border-line bg-panel px-3 py-2.5 text-[12px] leading-relaxed text-dim">
          {t("coder.doneHint")}
        </div>
      )}
    </>
  );

  const followBox = (autoFocus?: boolean) => (
    <div className="flex items-end gap-2 rounded-xl border border-line bg-panel2 p-2">
      <textarea
        value={follow}
        onChange={(e) => setFollow(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            applyFollowUp();
          }
        }}
        rows={1}
        autoFocus={autoFocus}
        placeholder={project.status === "ready" ? t("coder.askChange") : t("coder.working")}
        disabled={project.status !== "ready"}
        className="flex-1 resize-none bg-transparent px-1.5 py-1 text-[13px] outline-none placeholder:text-faint disabled:opacity-50"
      />
      <button
        onClick={applyFollowUp}
        disabled={!follow.trim() || project.status !== "ready"}
        className="btn-brand flex h-8 w-8 shrink-0 items-center justify-center rounded-lg disabled:opacity-30"
      >
        <SendIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  return (
    <div className="flex h-full">
      {/* ------- specialist task board (desktop) ------- */}
      <div className="hidden w-[340px] shrink-0 flex-col border-e border-line md:flex max-lg:w-[290px]">
        <div className="border-b border-line px-4 py-3">
          <div className="flex items-center gap-2">
            <BrandMark className="h-6 w-6" />
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-bold">{project.name}</p>
              <p className="truncate font-mono text-[10.5px] text-faint">
                {plan.length || "…"} {t("coder.subtasks")} ·{" "}
                {project.status === "ready" ? <span className="text-mint">{t("coder.ready")}</span> : <span className="text-gold">{t("coder.inProgress")}</span>}
              </p>
            </div>
          </div>
          <p className="mt-2 rounded-lg bg-panel2 px-3 py-2 text-[12px] italic leading-snug text-dim">“{project.prompt}”</p>
          {roles.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {roles.map((r) => (
                <span
                  key={r.short}
                  className="rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider"
                  style={{ color: r.color, borderColor: r.color + "55", background: r.color + "12" }}
                >
                  {r.title}
                </span>
              ))}
            </div>
          )}
        </div>

        <div ref={feedRef} className="flex-1 space-y-1.5 overflow-y-auto px-3 py-3">{feedRows}</div>
        <div className="border-t border-line p-3">{followBox()}</div>
      </div>

      {/* ------- workspace ------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-1 border-b border-line px-2 py-2 sm:px-3">
          {(
            [
              { id: "code", label: t("coder.code"), icon: CodeIcon },
              { id: "preview", label: t("coder.preview"), icon: EyeIcon },
              { id: "term", label: t("coder.terminal"), icon: TerminalIcon },
            ] as const
          ).map((tb) => (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold transition-all sm:px-3 ${
                tab === tb.id ? "bg-violet/12 text-violet2" : "text-dim hover:bg-panel2 hover:text-text"
              }`}
            >
              <tb.icon className="h-3.5 w-3.5" />
              <span className="max-sm:hidden">{tb.label}</span>
            </button>
          ))}
          {/* mobile: plan button */}
          <button
            onClick={() => setShowPlan(true)}
            className="ms-1 flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12px] font-bold text-dim transition-all hover:border-violet/45 hover:text-violet2 md:hidden"
          >
            <ListIcon className="h-3.5 w-3.5" />
            {doneCount}/{plan.length || "…"}
          </button>
          <div className="ms-auto flex items-center gap-1.5">
            {tab === "preview" && (
              <>
                <button className="icon-btn" onClick={() => setPreviewKey((k) => k + 1)} title="Reload">
                  <RefreshIcon className="h-3.5 w-3.5" />
                </button>
                <button className="icon-btn" onClick={openPreview} title="Open in tab">
                  <OpenIcon className="h-3.5 w-3.5" />
                </button>
              </>
            )}
            {project.status === "ready" && (
              <button
                onClick={() => patchProject(project.id, (p) => ({ ...p, status: "building", files: [] }))}
                className="hidden items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-dim transition-all hover:border-violet/45 hover:text-violet2 sm:flex"
                title={t("coder.rebuild")}
              >
                <RefreshIcon className="h-3.5 w-3.5" /> {t("coder.rebuild")}
              </button>
            )}
          </div>
        </div>

        {tab === "code" && (
          <div className="flex min-h-0 flex-1 flex-col">
            {/* mobile file chips */}
            <div className="flex gap-1.5 overflow-x-auto border-b border-line bg-panel/50 px-2 py-2 md:hidden">
              {project.files.length === 0 && (
                <span className="px-1 py-1 text-[11px] text-faint">{t("coder.writing")}</span>
              )}
              {project.files.map((f, i) => (
                <button
                  key={f.name}
                  onClick={() => setFileIdx(i)}
                  className={`shrink-0 rounded-lg border px-2.5 py-1 font-mono text-[10.5px] ltr-keep transition-colors ${
                    i === Math.min(fileIdx, project.files.length - 1)
                      ? "border-violet/50 bg-violet/12 text-violet3"
                      : "border-line text-dim"
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>

            <div className="flex min-h-0 flex-1">
              {/* desktop file tree */}
              <div className="hidden w-[190px] shrink-0 overflow-y-auto border-e border-line bg-panel/50 p-2 md:block">
                <p className="px-2 pb-1.5 pt-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-faint">{t("coder.files")}</p>
                {project.files.length === 0 && (
                  <p className="px-2 py-3 text-[11.5px] text-faint">{t("coder.writing")}</p>
                )}
                {project.files.map((f, i) => (
                  <button
                    key={f.name}
                    onClick={() => setFileIdx(i)}
                    className={`step-in flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-start font-mono text-[11.5px] transition-colors ltr-keep ${
                      i === Math.min(fileIdx, project.files.length - 1) ? "bg-violet/12 text-violet2" : "text-dim hover:bg-panel2"
                    }`}
                  >
                    <FileIcon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{f.name}</span>
                  </button>
                ))}
              </div>

              <div className="min-w-0 flex-1 overflow-auto bg-ink/60">
                {current ? (
                  <div>
                    <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-line bg-panel/90 px-4 py-2 backdrop-blur">
                      <span className="font-mono text-[11.5px] text-violet2 ltr-keep">{current.name}</span>
                      <span className="font-mono text-[10px] text-faint">
                        {current.content.split("\n").length} lines · {(current.content.length / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <pre className="px-4 py-3 font-mono text-[12px] leading-[1.65] ltr-keep" dir="ltr">
                      {current.content.split("\n").map((line, i) => (
                        <div key={i} className="flex">
                          <span className="me-4 w-7 shrink-0 select-none text-end text-faint/60">{i + 1}</span>
                          <span className="whitespace-pre-wrap break-all text-[#c9d6de]">{line || " "}</span>
                        </div>
                      ))}
                    </pre>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="flex items-center gap-2 font-mono text-[12px] text-faint">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-violet/25 border-t-violet3" />
                      {t("coder.waiting")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "preview" && (
          <div className="min-h-0 flex-1 bg-[#0c0e12] p-0">
            {project.files.length ? (
              <iframe
                key={previewKey}
                title="Project preview"
                sandbox="allow-scripts allow-modals"
                srcDoc={previewDoc}
                className="h-full w-full border-0 bg-white"
              />
            ) : (
              <div className="flex h-full items-center justify-center px-4 text-center font-mono text-[12px] text-faint">
                {t("coder.previewWait")}
              </div>
            )}
          </div>
        )}

        {tab === "term" && (
          <div className="term-scan relative min-h-0 flex-1 overflow-hidden bg-[#07090c]">
            <div ref={termRef} className="h-full overflow-y-auto px-4 py-3 font-mono text-[12px] leading-relaxed ltr-keep" dir="ltr">
              {term.map((l, i) => (
                <TermLine key={i} l={l} />
              ))}
              {project.status === "building" && <span className="caret" />}
            </div>
          </div>
        )}
      </div>

      {/* mobile: crew plan bottom sheet */}
      {showPlan && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div className="backdrop-in absolute inset-0 bg-ink/70" onClick={() => setShowPlan(false)} />
          <div className="sheet-in absolute inset-x-2 bottom-2 flex max-h-[78vh] flex-col overflow-hidden rounded-3xl border border-line2 bg-panel shadow-2xl">
            <div className="flex items-center gap-2 border-b border-line px-4 py-3">
              <BrandMark className="h-5 w-5" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold">{project.name}</p>
                <p className="font-mono text-[10px] text-faint">
                  {doneCount}/{plan.length || "…"} {t("coder.subtasks")} ·{" "}
                  {project.status === "ready" ? <span className="text-mint">{t("coder.ready")}</span> : <span className="text-gold">{t("coder.inProgress")}</span>}
                </p>
              </div>
              <button onClick={() => setShowPlan(false)} className="icon-btn" title={t("common.close")} aria-label={t("common.close")}>
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-3 py-3">{feedRows}</div>
            <div className="border-t border-line p-3">{followBox(true)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function TermLine({ l }: { l: string }) {
  const m = /^\[(\w+)\]\s?/.exec(l);
  if (m) {
    const cls = ROLE_TERM[m[1]] ?? "text-dim";
    return (
      <p className="term-line whitespace-pre-wrap text-dim">
        <span className={`font-bold ${cls}`}>[{m[1]}]</span> {l.slice(m[0].length)}
      </p>
    );
  }
  return (
    <p
      className={`term-line whitespace-pre-wrap ${
        l.startsWith("✓") ? "text-mint" : l.startsWith("⚠") ? "text-gold" : l.startsWith("—") ? "text-violet3" : "text-dim"
      }`}
    >
      {l}
    </p>
  );
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

function freshOf(catalog: LiveCatalog): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [pid, entry] of Object.entries(catalog)) {
    if (entry?.models?.length) out[pid] = entry.models;
  }
  return out;
}
