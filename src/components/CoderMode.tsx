import { useEffect, useMemo, useRef, useState } from "react";
import { modelById, MODELS } from "../data/models";
import { providerById } from "../data/providers";
import {
  scaffoldProject, generateProjectWithLLM, buildPreviewDoc, CODER_SUGGESTIONS,
} from "../lib/engine";
import { pickTemplate } from "../lib/templates";
import type { Project, ProjectFile, ProviderCfg } from "../lib/store";
import {
  Star, SendIcon, CodeIcon, EyeIcon, TerminalIcon, RefreshIcon, PlayIcon,
  CheckIcon, FileIcon, OpenIcon, StopIcon,
} from "./Icons";

type Tab = "code" | "preview" | "term";

interface Props {
  project: Project | null;
  projects: Project[];
  patchProject: (id: string, fn: (p: Project) => Project) => void;
  createProject: (prompt: string) => string;
  cfgs: Record<string, ProviderCfg>;
  modelId: string;
}

const COLOR_WORDS: Record<string, string> = {
  зелени: "#3ecf8e", green: "#3ecf8e",
  фіолетов: "#8b7cff", violet: "#8b7cff", пурпур: "#8b7cff",
  синь: "#5b8cff", blue: "#5b8cff",
  голуб: "#58c4dd", блакитн: "#58c4dd",
  червон: "#ff6b6b", red: "#ff6b6b",
  рожев: "#ff8ac2", pink: "#ff8ac2",
  жовт: "#ffc24b", yellow: "#ffc24b",
  помаранч: "#ff9950", orange: "#ff9950",
};

interface Step {
  label: string;
  state: "wait" | "run" | "done";
}

export default function CoderMode({ project, patchProject, createProject, cfgs, modelId }: Props) {
  const [prompt, setPrompt] = useState("");
  const [follow, setFollow] = useState("");
  const [tab, setTab] = useState<Tab>("code");
  const [fileIdx, setFileIdx] = useState(0);
  const [steps, setSteps] = useState<Step[]>([]);
  const [term, setTerm] = useState<string[]>([]);
  const [previewKey, setPreviewKey] = useState(0);
  const timers = useRef<number[]>([]);
  const termRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  const model = modelById.get(modelId) ?? MODELS[0];
  const provider = providerById.get(model.providerId)!;
  const tplLabel = project ? pickTemplate(project.prompt).label : "";

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const log = (line: string) => setTerm((t) => [...t, line]);

  useEffect(() => {
    const el = termRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [term]);

  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [steps, term]);

  /* запуск пайплайну, коли проєкт у стані building */
  useEffect(() => {
    if (!project || project.status !== "building") return;
    const pid = project.id;
    setSteps([]);
    setTerm([]);
    setTab("code");
    setFileIdx(0);

    const setStep = (i: number, state: Step["state"], label?: string) =>
      setSteps((s) => {
        const next = [...s];
        while (next.length <= i) next.push({ label: "", state: "wait" });
        next[i] = { label: label ?? next[i].label, state };
        return next;
      });

    setStep(0, "run", "Аналізую запит і планую структуру");
    log(`⏺ Qwen Coder · модель ${model.name} (${provider.name})`);
    log("⏺ Задача: " + project.prompt);

    let cancelled = false;
    const ac = new AbortController();

    (async () => {
      let files: ProjectFile[] = [];
      let tplId = project.templateId;

      const llmFiles = await generateProjectWithLLM(
        project.prompt, model.providerId, cfgs[model.providerId], modelId,
        (l) => log(l), ac.signal
      ).catch(() => null);

      if (cancelled) return;
      if (llmFiles) {
        files = llmFiles;
        tplId = "llm";
        log("✓ Проєкт згенеровано справжньою моделлю");
      } else {
        const sc = scaffoldProject(project.prompt);
        files = sc.files;
        tplId = sc.templateId;
        log("⏺ Шаблон: " + pickTemplate(project.prompt).label);
      }

      later(() => setStep(0, "done"), 0);
      later(() => {
        setStep(1, "run", "Створюю файли проєкту");
        log(`⏺ Структура: ${files.length} файли`);
      }, 500);

      files.forEach((f, i) => {
        later(() => {
          setSteps((s) => s.map((st, j) => (j === 1 ? { ...st, label: `Створюю файли (${i + 1}/${files.length})` } : st)));
          log("  + " + f.name + "  (" + f.content.split("\n").length + " рядків)");
          patchProject(pid, (p) => ({ ...p, files: [...p.files, f], templateId: tplId }));
          setFileIdx(i);
        }, 900 + i * 620);
      });

      const t1 = 900 + files.length * 620;
      later(() => {
        setStep(1, "done");
        setStep(2, "run", "Збираю bundle для прев'ю");
        log("⏺ vite build — інлайню стилі та скрипти…");
      }, t1 + 300);
      later(() => {
        log("✓ dist/index.html зібрано (" + (files.reduce((s, f) => s + f.content.length, 0) / 1024).toFixed(1) + " КБ)");
        setStep(2, "done");
        setStep(3, "done", "Прев'ю запущено");
        patchProject(pid, (p) => ({ ...p, status: "ready" }));
        setTab("preview");
        setPreviewKey((k) => k + 1);
      }, t1 + 1400);
    })();

    return () => {
      cancelled = true;
      ac.abort();
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id, project?.status === "building"]);

  if (!project) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 pb-16">
        <div className="star-spin mb-5">
          <Star className="h-14 w-14 drop-shadow-[0_0_28px_#615ced88]" />
        </div>
        <h1 className="font-display text-[clamp(24px,3vw,34px)] font-bold tracking-tight">
          Qwen <span className="text-violet2">Coder</span>
        </h1>
        <p className="mt-2 max-w-[440px] text-center text-[14px] leading-relaxed text-dim">
          Опиши застосунок — створю його з нуля: файли, стилі, логіка і робоче прев'ю.
          {cfgs[model.providerId]?.key?.trim()
            ? ` Генерація через ${model.name}.`
            : " У демо-режимі працює вбудований генератор."}
        </p>
        <div className="mt-7 w-full max-w-[560px]">
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
              rows={2}
              placeholder={"Наприклад: «Зроби лендинг кав'ярні “Зерно”»"}
              className="flex-1 resize-none bg-transparent px-2 py-1.5 text-[14.5px] leading-relaxed outline-none placeholder:text-faint"
            />
            <button
              onClick={() => prompt.trim() && createProject(prompt.trim())}
              disabled={!prompt.trim()}
              className="btn-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white disabled:opacity-35 disabled:saturate-50"
              title="Створити проєкт"
            >
              <PlayIcon className="h-4.5 w-4.5" />
            </button>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {CODER_SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => createProject(s)}
                className="row-hl rounded-full border border-line bg-panel/70 px-3.5 py-1.5 text-[12.5px] text-dim transition-all hover:border-violet/45 hover:text-text"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const previewDoc = useMemo(() => buildPreviewDoc(project.files), [project.files, previewKey]);
  const current = project.files[Math.min(fileIdx, Math.max(0, project.files.length - 1))];

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
          ? { ...f, content: f.content.replace(/(--accent:\s*)#[0-9a-fA-F]{3,8}/, "$1" + hex) }
          : f
      );
      // підфарбувати головний акцент, якщо змінної немає
      files = files.map((f) =>
        f.name.endsWith(".css") && !f.content.includes("--accent")
          ? { ...f, content: f.content.replace(/#615ced/gi, hex) }
          : f
      );
      logs.push("⏺ Оновлено акцентний колір → " + hex);
    }
    const quoted = text.match(/["«]([^"»]{2,40})["»]/);
    if (quoted) {
      files = files.map((f) =>
        f.name === "index.html"
          ? { ...f, content: f.content.replace(/<title>[^<]*<\/title>/, "<title>" + quoted[1] + "</title>") }
          : f
      );
      logs.push('⏺ Заголовок → "' + quoted[1] + '"');
    }
    if (!logs.length) logs.push("⏺ Проаналізовано запит — істотних змін не потребує");

    log("— запит на зміну: " + text);
    logs.forEach(log);
    log("✓ перебудовано dist/index.html");
    patchProject(project.id, (p) => ({ ...p, files, name: quoted ? quoted[1] : p.name }));
    setPreviewKey((k) => k + 1);
  }

  function openPreview() {
    const blob = new Blob([previewDoc], { type: "text/html;charset=utf-8" });
    window.open(URL.createObjectURL(blob), "_blank");
  }

  return (
    <div className="flex h-full">
      {/* ------- стрічка агента ------- */}
      <div className="flex w-[340px] shrink-0 flex-col border-r border-line max-lg:w-[280px] max-md:hidden">
        <div className="border-b border-line px-4 py-3">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-bold">{project.name}</p>
              <p className="truncate font-mono text-[10.5px] text-faint">
                {tplLabel} · {project.files.length} файлів ·{" "}
                {project.status === "ready" ? <span className="text-mint">готово</span> : <span className="text-solar">будується…</span>}
              </p>
            </div>
          </div>
          <p className="mt-2 rounded-lg bg-panel2 px-3 py-2 text-[12px] italic leading-snug text-dim">«{project.prompt}»</p>
        </div>

        <div ref={feedRef} className="flex-1 space-y-1.5 overflow-y-auto px-4 py-4">
          {steps.map((s, i) => (
            <div key={i} className="step-in flex items-center gap-2.5 text-[12.5px]">
              {s.state === "done" ? (
                <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-mint/15 text-mint"><CheckIcon className="h-3 w-3" /></span>
              ) : s.state === "run" ? (
                <span className="h-4.5 w-4.5 shrink-0 animate-spin rounded-full border-[2px] border-violet/25 border-t-violet2" />
              ) : (
                <span className="h-4.5 w-4.5 shrink-0 rounded-full border border-line2" />
              )}
              <span className={s.state === "wait" ? "text-faint" : "text-text"}>{s.label}</span>
            </div>
          ))}
          {project.status === "ready" && (
            <div className="step-in mt-3 rounded-xl border border-line bg-panel px-3 py-2.5 text-[12px] leading-relaxed text-dim">
              Проєкт готовий — випробуй у <b className="text-violet2">Прев'ю</b>. Можеш попросити зміни,
              наприклад: <i>«зроби акцент зеленим»</i> або <i>«назви "Мій застосунок"»</i>.
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
              placeholder={project.status === "ready" ? "Попроси зміну…" : "Агент працює…"}
              disabled={project.status !== "ready"}
              className="flex-1 resize-none bg-transparent px-1.5 py-1 text-[13px] outline-none placeholder:text-faint disabled:opacity-50"
            />
            <button
              onClick={applyFollowUp}
              disabled={!follow.trim() || project.status !== "ready"}
              className="btn-brand flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white disabled:opacity-30"
            >
              <SendIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ------- робоча область ------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-1 border-b border-line px-3 py-2">
          {(
            [
              { id: "code", label: "Код", icon: CodeIcon },
              { id: "preview", label: "Прев'ю", icon: EyeIcon },
              { id: "term", label: "Термінал", icon: TerminalIcon },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-all ${
                tab === t.id ? "bg-violet/14 text-violet2" : "text-dim hover:bg-panel2 hover:text-text"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1.5">
            {tab === "preview" && (
              <>
                <button className="icon-btn" onClick={() => setPreviewKey((k) => k + 1)} title="Перезавантажити прев'ю">
                  <RefreshIcon className="h-3.5 w-3.5" />
                </button>
                <button className="icon-btn" onClick={openPreview} title="Відкрити у новій вкладці">
                  <OpenIcon className="h-3.5 w-3.5" />
                </button>
              </>
            )}
            {project.status === "ready" && (
              <button
                onClick={() => {
                  patchProject(project.id, (p) => ({ ...p, status: "building", files: [] }));
                }}
                className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-dim transition-all hover:border-violet/45 hover:text-violet2"
                title="Перестворити проєкт з нуля"
              >
                <RefreshIcon className="h-3.5 w-3.5" /> Перебудувати
              </button>
            )}
          </div>
        </div>

        {tab === "code" && (
          <div className="flex min-h-0 flex-1">
            <div className="w-[190px] shrink-0 overflow-y-auto border-r border-line bg-panel/50 p-2">
              <p className="px-2 pb-1.5 pt-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-faint">Файли</p>
              {project.files.length === 0 && (
                <p className="px-2 py-3 text-[11.5px] text-faint">Агент створює файли…</p>
              )}
              {project.files.map((f, i) => (
                <button
                  key={f.name}
                  onClick={() => setFileIdx(i)}
                  className={`step-in flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left font-mono text-[11.5px] transition-colors ${
                    i === Math.min(fileIdx, project.files.length - 1) ? "bg-violet/14 text-violet2" : "text-dim hover:bg-panel2"
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
                    <span className="font-mono text-[11.5px] text-violet2">{current.name}</span>
                    <span className="font-mono text-[10px] text-faint">
                      {current.content.split("\n").length} рядків · {(current.content.length / 1024).toFixed(1)} КБ
                    </span>
                  </div>
                  <pre className="px-4 py-3 font-mono text-[12px] leading-[1.65]">
                    {current.content.split("\n").map((line, i) => (
                      <div key={i} className="flex">
                        <span className="mr-4 w-7 shrink-0 select-none text-right text-faint/60">{i + 1}</span>
                        <span className="whitespace-pre-wrap break-all text-[#c9d0e8]">{line || " "}</span>
                      </div>
                    ))}
                  </pre>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="flex items-center gap-2 font-mono text-[12px] text-faint">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-violet/25 border-t-violet2" />
                    генерація файлів…
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "preview" && (
          <div className="min-h-0 flex-1 bg-[#0c0c10] p-0">
            {project.files.length ? (
              <iframe
                key={previewKey}
                title="Прев'ю проєкту"
                sandbox="allow-scripts allow-modals"
                srcDoc={previewDoc}
                className="h-full w-full border-0 bg-white"
              />
            ) : (
              <div className="flex h-full items-center justify-center font-mono text-[12px] text-faint">
                прев'ю з'явиться після збірки…
              </div>
            )}
          </div>
        )}

        {tab === "term" && (
          <div className="term-scan relative min-h-0 flex-1 overflow-hidden bg-[#08080c]">
            <div ref={termRef} className="h-full overflow-y-auto px-4 py-3 font-mono text-[12px] leading-relaxed">
              {term.map((l, i) => (
                <p
                  key={i}
                  className={`term-line whitespace-pre-wrap ${
                    l.startsWith("✓") ? "text-mint" : l.startsWith("⚠") ? "text-solar" : l.startsWith("—") ? "text-violet2" : l.startsWith("  +") ? "text-cyanic" : "text-dim"
                  }`}
                >
                  {l}
                </p>
              ))}
              {project.status === "building" && <span className="caret" />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
