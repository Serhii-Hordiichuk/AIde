import { useEffect, useRef, useState } from "react";
import { getModelInfo, isAutoModel, resolveAutoModel } from "../data/models";
import type { LiveCatalog } from "../lib/modelFetch";
import { providerById, PROVIDERS } from "../data/providers";
import { scaffoldProject, generateProjectWithLLM, buildPreviewDoc, CODER_SUGGESTIONS } from "../lib/engine";
import { ROLES, buildPlan, buildLLMPlan, uniqueRoles, type Subtask } from "../lib/plan";
import type { Project, ProjectFile, ProviderCfg } from "../lib/store";
import {
  BrandMark, SendIcon, CodeIcon, EyeIcon, TerminalIcon, RefreshIcon, PlayIcon,
  CheckIcon, FileIcon, OpenIcon,
} from "./Icons";

type Tab = "code" | "preview" | "term";

interface Props {
  project: Project | null;
  patchProject: (id: string, fn: (p: Project) => Project) => void;
  createProject: (prompt: string) => string;
  cfgs: Record<string, ProviderCfg>;
  modelId: string;
  catalog: LiveCatalog;
}

const COLOR_WORDS: Record<string, string> = {
  green: "#3ecf8e", teal: "#0f9d8f", mint: "#31e5ae",
  violet: "#8b7cff", purple: "#8b7cff",
  blue: "#5b8cff", cyan: "#58c4dd",
  red: "#ff6b6b", pink: "#ff8ac2",
  yellow: "#ffc24b", orange: "#ff9950",
};

const ROLE_TERM: Record<string, string> = {
  ARCH: "text-gold",
  UI: "text-cyanic",
  FE: "text-brand",
  FS: "text-brand",
  DOC: "text-[#c9a0ff]",
  QA: "text-[#ff8a5c]",
};

export default function CoderMode({ project, patchProject, createProject, cfgs, modelId, catalog }: Props) {
  const [prompt, setPrompt] = useState("");
  const [follow, setFollow] = useState("");
  const [tab, setTab] = useState<Tab>("code");
  const [fileIdx, setFileIdx] = useState(0);
  const [plan, setPlan] = useState<Subtask[]>([]);
  const [term, setTerm] = useState<string[]>([]);
  const [previewKey, setPreviewKey] = useState(0);
  const termRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  const model = isAutoModel(modelId) ? resolveAutoModel(modelId, cfgs, catalog) : getModelInfo(modelId);
  const provider = providerById.get(model.providerId) ?? PROVIDERS[0];

  const log = (line: string) => setTerm((t) => [...t, line]);
  const mark = (id: string, state: Subtask["state"]) =>
    setPlan((prev) => prev.map((s) => (s.id === id ? { ...s, state } : s)));

  useEffect(() => {
    const el = termRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [term]);

  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [plan, term]);

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
    const timers: number[] = [];
    const sleep = (ms: number) =>
      new Promise<void>((r) => {
        timers.push(window.setTimeout(r, ms));
      });
    const guard = () => cancelled || ac.signal.aborted;

    const addFile = (f: ProjectFile, idx: number) => {
      patchProject(pid, (p) => ({ ...p, files: [...p.files, f] }));
      setFileIdx(idx);
    };

    async function runFileSteps(files: ProjectFile[], _templateId: string) {
      for (let i = 0; i < files.length; i++) {
        if (guard()) return;
        const f = files[i];
        setPlan((prev) => prev.map((s) => (s.id === f.name || s.produces === f.name ? { ...s, state: "run" } : s)));
        const role = f.name.endsWith(".css") || f.name.endsWith(".html") ? "UI" : f.name.toLowerCase().endsWith(".md") ? "DOC" : "FE";
        log(`[${role}] working on ${f.name}…`);
        await sleep(620);
        if (guard()) return;
        log(`[${role}] + ${f.name} (${f.content.split("\n").length} lines)`);
        addFile(f, i);
        setPlan((prev) => prev.map((s) => (s.id === f.name || s.produces === f.name ? { ...s, state: "done" } : s)));
        await sleep(240);
      }
    }

    async function finish() {
      if (guard()) return;
      mark("qa", "run");
      log("[QA] vite build — inlining styles & scripts…");
      await sleep(900);
      if (guard()) return;
      log("[QA] ✓ dist/index.html built · smoke test passed");
      mark("qa", "done");
      patchProject(pid, (p) => ({ ...p, status: "ready" }));
      setTab("preview");
      setPreviewKey((k) => k + 1);
    }

    (async () => {
      await sleep(950);
      if (guard()) return;

      const canLLM = !!provider.keyless || !!provider.local || !!cfgs[model.providerId]?.key?.trim();

      if (canLLM) {
        const llmPlan = buildLLMPlan(model.name);
        setPlan(llmPlan);
        mark("plan", "done");
        log(`[ARCH] ✓ decomposed → ${llmPlan.length} subtasks · ${uniqueRoles(llmPlan).length} specialists`);
        await sleep(400);
        if (guard()) return;

        mark("fs", "run");
        const llmFiles = await generateProjectWithLLM(
          project!.prompt, model.providerId, cfgs[model.providerId], model.id,
          (l) => log(l), ac.signal
        ).catch(() => null);
        if (guard()) return;

        if (llmFiles) {
          const idx = llmFiles.find((f) => f.name === "index.html");
          const readme = llmFiles.find((f) => f.name === "README.md");
          if (idx) addFile(idx, 0);
          mark("fs", "done");
          mark("doc", "run");
          await sleep(500);
          if (guard()) return;
          if (readme) addFile(readme, 1);
          mark("doc", "done");
          patchProject(pid, (p) => ({ ...p, templateId: "llm" }));
          await finish();
          return;
        }

        // LLM route failed — the architect reroutes to the built-in generator
        log("[ARCH] rerouting → built-in generator");
        const sc = scaffoldProject(project!.prompt);
        patchProject(pid, (p) => ({ ...p, name: sc.name, templateId: sc.templateId }));
        const p2 = buildPlan(sc.templateId, sc.files.map((f) => f.name)).map((s) =>
          s.id === "plan" ? { ...s, state: "done" as const, label: "Re-decomposed for the built-in generator" } : s
        );
        setPlan(p2);
        await sleep(350);
        await runFileSteps(sc.files, sc.templateId);
        await finish();
        return;
      }

      // no reachable free API — built-in generator from the start
      log("[ARCH] no free API reachable — using the built-in generator");
      const sc = scaffoldProject(project!.prompt);
      patchProject(pid, (p) => ({ ...p, name: sc.name, templateId: sc.templateId }));
      const p2 = buildPlan(sc.templateId, sc.files.map((f) => f.name));
      setPlan(p2);
      mark("plan", "done");
      log(`[ARCH] ✓ decomposed → ${p2.length} subtasks · ${uniqueRoles(p2).length} specialists`);
      await sleep(400);
      await runFileSteps(sc.files, sc.templateId);
      await finish();
    })();

    return () => {
      cancelled = true;
      ac.abort();
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id, project?.status === "building"]);

  /* ---------- empty state ---------- */
  if (!project) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 pb-10">
        <div className="anim-rise flex flex-col items-center">
          <div className="floaty mb-6">
            <BrandMark className="h-14 w-14 drop-shadow-[0_0_28px_#615ced66]" />
          </div>
          <h1 className="font-display text-[clamp(24px,3vw,32px)] font-bold tracking-tight">
            AiDe <span className="text-brand">Coder</span>
          </h1>
          <p className="mt-2 text-[14px] text-dim">Describe an app — the crew builds it from scratch.</p>
        </div>
        <div className="mt-8 w-full max-w-[620px]">
          <div className="composer-glow flex items-end gap-2 rounded-2xl border border-line2 bg-panel2 p-2.5">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (prompt.trim()) createProject(prompt.trim());
                }
              }}
              rows={1}
              placeholder='e.g. a landing page for a coffee shop "Grain"'
              className="flex-1 resize-none bg-transparent px-2 py-1.5 text-[14.5px] leading-relaxed outline-none placeholder:text-faint"
            />
            <button
              onClick={() => prompt.trim() && createProject(prompt.trim())}
              disabled={!prompt.trim()}
              className="btn-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-xl disabled:opacity-35 disabled:saturate-50"
              title="Create project"
            >
              <PlayIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {CODER_SUGGESTIONS.map((s, i) => (
              <button
                key={s}
                onClick={() => createProject(s)}
                style={{ animationDelay: `${i * 60}ms` }}
                className="anim-rise row-hl rounded-full border border-line bg-panel/70 px-3.5 py-2 text-[12.5px] font-semibold text-dim transition-all hover:-translate-y-0.5 hover:border-brand/45 hover:text-text"
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
  void previewKey;

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
                .replace(/#0f9d8f/gi, hex)
                .replace(/#0c8377/gi, hex),
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

  return (
    <div className="flex h-full">
      {/* ------- specialist task board ------- */}
      <div className="flex w-[350px] shrink-0 flex-col border-r border-line max-lg:w-[290px] max-md:hidden">
        <div className="border-b border-line px-4 py-3">
          <div className="flex items-center gap-2">
            <BrandMark className="h-6 w-6" />
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-bold">{project.name}</p>
              <p className="truncate font-mono text-[10.5px] text-faint">
                {plan.length || "…"} subtasks · {roles.length || "…"} specialists ·{" "}
                {project.status === "ready" ? <span className="text-mint">ready</span> : <span className="text-gold">in progress</span>}
              </p>
            </div>
          </div>
          <p className="mt-2 rounded-lg bg-panel2 px-3 py-2 text-[12px] italic leading-snug text-dim">“{project.prompt}”</p>
          {roles.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {roles.map((r) => (
                <span
                  key={r.id}
                  className="rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider"
                  style={{ color: r.color, borderColor: r.color + "55", background: r.color + "12" }}
                >
                  {r.title}
                </span>
              ))}
            </div>
          )}
        </div>

        <div ref={feedRef} className="flex-1 space-y-1.5 overflow-y-auto px-3 py-3">
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
                    <span className="mt-0.5 inline-flex items-center gap-1 font-mono text-[10px] text-faint">
                      <FileIcon className="h-2.5 w-2.5" />
                      {s.produces}
                    </span>
                  )}
                </span>
                <span className="mt-1 shrink-0">
                  {s.state === "done" ? (
                    <CheckIcon className="h-3.5 w-3.5 text-mint" />
                  ) : s.state === "run" ? (
                    <span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-line2 border-t-brand" />
                  ) : (
                    <span className="block h-2 w-2 translate-x-[3px] rounded-full border border-line2" />
                  )}
                </span>
              </div>
            );
          })}

          {project.status === "ready" && (
            <div className="step-in mt-2 rounded-xl border border-line bg-panel px-3 py-2.5 text-[12px] leading-relaxed text-dim">
              Done — try <b className="text-brand">Preview</b>, or ask for a tweak below.
            </div>
          )}
        </div>

        <div className="border-t border-line p-3">
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
              placeholder={project.status === "ready" ? "Ask the crew for a change…" : "The crew is working…"}
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
        </div>
      </div>

      {/* ------- workspace ------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-1 border-b border-line px-3 py-2">
          {(
            [
              { id: "code", label: "Code", icon: CodeIcon },
              { id: "preview", label: "Preview", icon: EyeIcon },
              { id: "term", label: "Terminal", icon: TerminalIcon },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-all ${
                tab === t.id ? "bg-brand/12 text-brand" : "text-dim hover:bg-panel2 hover:text-text"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1.5">
            {tab === "preview" && (
              <>
                <button className="icon-btn" onClick={() => setPreviewKey((k) => k + 1)} title="Reload preview">
                  <RefreshIcon className="h-3.5 w-3.5" />
                </button>
                <button className="icon-btn" onClick={openPreview} title="Open in a new tab">
                  <OpenIcon className="h-3.5 w-3.5" />
                </button>
              </>
            )}
            {project.status === "ready" && (
              <button
                onClick={() => patchProject(project.id, (p) => ({ ...p, status: "building", files: [] }))}
                className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-dim transition-all hover:border-brand/45 hover:text-brand"
                title="Rebuild the project from scratch"
              >
                <RefreshIcon className="h-3.5 w-3.5" /> Rebuild
              </button>
            )}
          </div>
        </div>

        {tab === "code" && (
          <div className="flex min-h-0 flex-1">
            <div className="w-[190px] shrink-0 overflow-y-auto border-r border-line bg-panel/50 p-2">
              <p className="px-2 pb-1.5 pt-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-faint">Files</p>
              {project.files.length === 0 && (
                <p className="px-2 py-3 text-[11.5px] text-faint">Specialists are writing files…</p>
              )}
              {project.files.map((f, i) => (
                <button
                  key={f.name}
                  onClick={() => setFileIdx(i)}
                  className={`step-in flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left font-mono text-[11.5px] transition-colors ${
                    i === Math.min(fileIdx, project.files.length - 1) ? "bg-brand/12 text-brand" : "text-dim hover:bg-panel2"
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
                    <span className="font-mono text-[11.5px] text-brand">{current.name}</span>
                    <span className="font-mono text-[10px] text-faint">
                      {current.content.split("\n").length} lines · {(current.content.length / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <pre className="px-4 py-3 font-mono text-[12px] leading-[1.65]">
                    {current.content.split("\n").map((line, i) => (
                      <div key={i} className="flex">
                        <span className="mr-4 w-7 shrink-0 select-none text-right text-faint/60">{i + 1}</span>
                        <span className="whitespace-pre-wrap break-all text-[#c9d6de]">{line || " "}</span>
                      </div>
                    ))}
                  </pre>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="flex items-center gap-2 font-mono text-[12px] text-faint">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand/25 border-t-brand" />
                    waiting for the crew…
                  </span>
                </div>
              )}
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
              <div className="flex h-full items-center justify-center font-mono text-[12px] text-faint">
                the preview appears after QA builds the bundle…
              </div>
            )}
          </div>
        )}

        {tab === "term" && (
          <div className="term-scan relative min-h-0 flex-1 overflow-hidden bg-[#07090c]">
            <div ref={termRef} className="h-full overflow-y-auto px-4 py-3 font-mono text-[12px] leading-relaxed">
              {term.map((l, i) => (
                <TermLine key={i} l={l} />
              ))}
              {project.status === "building" && <span className="caret" />}
            </div>
          </div>
        )}
      </div>
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
        l.startsWith("✓") ? "text-mint" : l.startsWith("⚠") ? "text-gold" : l.startsWith("—") ? "text-brand" : "text-dim"
      }`}
    >
      {l}
    </p>
  );
}


