import { useCallback, useEffect, useRef, useState } from "react";
import { getModelInfo, isAutoModel, resolveAutoModel } from "../data/models";
import type { LiveCatalog } from "../lib/modelFetch";
import { providerById, PROVIDERS } from "../data/providers";
import { streamChat } from "../lib/llm";
import { DEFAULT_PARAMS, load, save, uid, type ProviderCfg } from "../lib/store";
import { LANGS, langName, ttsLang, detectByScript, normalizeCode } from "../lib/languages";
import { speak as ttsSpeak, ttsSupported, sttSupported } from "../lib/tts";
import {
  SwapIcon, DownloadIcon, FileTextIcon, MicIcon, StopIcon,
  SpeakerIcon, CopyIcon, CheckIcon, TrashIcon, GlobeIcon,
} from "./Icons";

type Tab = "text" | "convo" | "doc";

interface Props {
  cfgs: Record<string, ProviderCfg>;
  catalog: LiveCatalog;
  modelId: string;
}

interface ConvoMsg {
  id: string;
  orig: string;
  translated: string;
  from: string; // source lang code
  to: string;   // target lang code
  ts: number;
}

interface DocJob {
  name: string;
  total: number;
  done: number;
  out: string;
  state: "running" | "done" | "error";
  err?: string;
}

const TRANSLATOR_SYS =
  "You are a world-class translator fluent in every language and dialect. " +
  "Translate the user's text exactly, preserving tone, formatting and line breaks. " +
  "Reply with ONLY the translation — no commentary, no quotes, no explanations.";

export default function TranslatorMode({ cfgs, catalog, modelId }: Props) {
  const model = isAutoModel(modelId) ? resolveAutoModel(modelId, cfgs, catalog) : getModelInfo(modelId);
  const provider = providerById.get(model.providerId) ?? PROVIDERS[0];

  const [tab, setTab] = useState<Tab>("text");

  /* ---------- shared translation engine ---------- */
  const complete = useCallback(
    async (system: string, user: string, signal?: AbortSignal): Promise<string> => {
      const cfg = cfgs[model.providerId] ?? { key: "", baseUrl: provider.baseUrl };
      let out = "";
      for await (const delta of streamChat({
        model,
        provider,
        cfg,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        params: { ...DEFAULT_PARAMS, temperature: 0.2, maxTokens: 4096 },
        signal: signal ?? new AbortController().signal,
      })) {
        out += delta;
      }
      return out.trim();
    },
    [model, provider, cfgs]
  );

  const translate = useCallback(
    (text: string, target: string, signal?: AbortSignal) =>
      complete(TRANSLATOR_SYS, `Translate into ${langName(target)}:\n\n${text}`, signal),
    [complete]
  );

  const detect = useCallback(
    async (text: string): Promise<string> => {
      const guess = detectByScript(text);
      try {
        const raw = await complete(
          "You detect languages. Reply with ONLY the ISO 639-1 code (en, uk, de…).",
          `Language of this text?\n"""${text.slice(0, 400)}"""`
        );
        return normalizeCode(raw) ?? guess ?? "en";
      } catch {
        return guess ?? "en";
      }
    },
    [complete]
  );

  return (
    <div className="flex h-full flex-col">
      {/* tab strip */}
      <div className="flex shrink-0 items-center gap-1 border-b border-line px-3 py-2">
        {(
          [
            { id: "text", label: "Text", icon: GlobeIcon },
            { id: "convo", label: "Live conversation", icon: MicIcon },
            { id: "doc", label: "Documents", icon: FileTextIcon },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-all ${
              tab === t.id ? "bg-cyanic/12 text-cyanic" : "text-dim hover:bg-panel2 hover:text-text"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            <span className="max-sm:hidden">{t.label}</span>
          </button>
        ))}
        <span className="ml-auto hidden font-mono text-[10.5px] text-faint md:block">
          {model.name} · {provider.name} · {LANGS.length} languages
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === "text" && <TextPanel translate={translate} detect={detect} />}
        {tab === "convo" && <ConvoPanel translate={translate} detect={detect} />}
        {tab === "doc" && <DocPanel translate={translate} />}
      </div>
    </div>
  );
}

/* ================= language picker ================= */

function LangSelect({
  value, onChange, withAuto, label, accent,
}: {
  value: string;
  onChange: (v: string) => void;
  withAuto?: boolean;
  label: string;
  accent: string;
}) {
  return (
    <label className={`flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-line bg-panel px-3 py-2 ${accent}`}>
      <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-faint">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 flex-1 cursor-pointer bg-transparent text-[13px] font-bold text-text outline-none"
      >
        {withAuto && <option value="auto" className="bg-panel text-text">Auto detect</option>}
        {LANGS.map((l) => (
          <option key={l.code} value={l.code} className="bg-panel text-text">
            {l.name} · {l.native}
          </option>
        ))}
      </select>
    </label>
  );
}

function SpeakBtn({ text, lang, disabled }: { text: string; lang: string; disabled?: boolean }) {
  const [on, setOn] = useState(false);
  if (!ttsSupported()) return null;
  return (
    <button
      disabled={disabled || !text}
      onClick={() => {
        if (on) {
          ttsSpeak("", lang);
          setOn(false);
          return;
        }
        ttsSpeak(text, ttsLang(lang), () => setOn(false));
        setOn(true);
      }}
      className={`icon-btn h-7 w-7 disabled:opacity-30 ${on ? "speaking-ring text-cyanic" : ""}`}
      title={on ? "Stop" : "Listen"}
    >
      {on ? <span className="speaking-bars text-cyanic"><i /><i /><i /><i /></span> : <SpeakerIcon className="h-3.5 w-3.5" />}
    </button>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      disabled={!text}
      onClick={() => {
        navigator.clipboard?.writeText(text).catch(() => {});
        setOk(true);
        setTimeout(() => setOk(false), 1200);
      }}
      className="icon-btn h-7 w-7 disabled:opacity-30"
      title="Copy"
    >
      {ok ? <CheckIcon className="h-3.5 w-3.5 text-mint" /> : <CopyIcon className="h-3.5 w-3.5" />}
    </button>
  );
}

/* ================= 1 · live text translation ================= */

function TextPanel({
  translate, detect,
}: {
  translate: (t: string, to: string, s?: AbortSignal) => Promise<string>;
  detect: (t: string) => Promise<string>;
}) {
  const [langs, setLangs] = useState(() => load("transLangs", { src: "auto", tgt: "en" }));
  const [src, setSrc] = useState("");
  const [out, setOut] = useState("");
  const [detected, setDetected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const acRef = useRef<AbortController | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => save("transLangs", langs), [langs]);

  const target = langs.tgt;

  const run = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        setOut("");
        setDetected(null);
        return;
      }
      acRef.current?.abort();
      const ac = new AbortController();
      acRef.current = ac;
      setBusy(true);
      try {
        let from = langs.src;
        if (from === "auto") {
          const quick = detectByScript(text);
          if (quick) {
            setDetected(quick);
            from = quick === target ? "en" : quick;
          } else {
            const d = await detect(text);
            setDetected(d);
            from = d === target ? "en" : d;
          }
        } else setDetected(null);
        const res = await translate(text, target, ac.signal);
        setOut(res);
      } catch (e) {
        if (!ac.signal.aborted) setOut(`⚠ ${e instanceof Error ? e.message : "translation failed"}`);
      } finally {
        setBusy(false);
      }
    },
    [langs.src, target, translate, detect]
  );

  /* live: debounce 700ms like a pro translator */
  useEffect(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => run(src), 700);
    return () => window.clearTimeout(timer.current);
  }, [src, run]);

  const swap = () => {
    if (langs.src === "auto") return;
    setLangs((l: typeof langs) => ({ src: l.tgt, tgt: l.src }));
    setSrc(out);
    setOut(src);
  };

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-5">
      {/* language bar */}
      <div className="mb-4 flex items-center gap-2">
        <LangSelect value={langs.src} onChange={(v) => setLangs((l: typeof langs) => ({ ...l, src: v }))} withAuto label="from" accent="" />
        <button
          onClick={swap}
          disabled={langs.src === "auto"}
          className="icon-btn h-9 w-9 shrink-0 rounded-xl border border-line disabled:opacity-30"
          title="Swap languages"
        >
          <SwapIcon className="h-4 w-4" />
        </button>
        <LangSelect value={langs.tgt} onChange={(v) => setLangs((l: typeof langs) => ({ ...l, tgt: v }))} label="to" accent="border-cyanic/40" />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {/* source */}
        <div className="flex min-h-[300px] flex-col overflow-hidden rounded-2xl border border-line bg-panel">
          <div className="flex items-center gap-1.5 border-b border-line px-3 py-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
              {langs.src === "auto" ? (detected ? `auto → ${langName(detected)}` : "auto detect") : langName(langs.src)}
            </span>
            <span className="ml-auto font-mono text-[10px] text-faint">{src.length} chars</span>
          </div>
          <textarea
            value={src}
            onChange={(e) => setSrc(e.target.value)}
            placeholder="Type or paste text…"
            className="min-h-[240px] flex-1 resize-none bg-transparent px-4 py-3 text-[14.5px] leading-relaxed outline-none placeholder:text-faint"
          />
          <div className="flex items-center gap-1 border-t border-line px-2 py-1.5">
            <SpeakBtn text={src} lang={langs.src === "auto" ? detected ?? "en" : langs.src} />
            <button onClick={() => setSrc("")} className="icon-btn h-7 w-7" title="Clear" disabled={!src}>
              <TrashIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* target */}
        <div className="flex min-h-[300px] flex-col overflow-hidden rounded-2xl border border-cyanic/30 bg-panel">
          <div className="flex items-center gap-1.5 border-b border-line px-3 py-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyanic">{langName(target)}</span>
            {busy && (
              <span className="ml-2 flex items-center gap-1 font-mono text-[10px] text-cyanic">
                <span className="thinking-dot h-1 w-1 rounded-full bg-current" />
                <span className="thinking-dot h-1 w-1 rounded-full bg-current" />
                <span className="thinking-dot h-1 w-1 rounded-full bg-current" />
              </span>
            )}
            <span className="ml-auto font-mono text-[10px] text-faint">{out.length} chars</span>
          </div>
          <div className="min-h-[240px] flex-1 overflow-y-auto px-4 py-3 text-[14.5px] leading-relaxed whitespace-pre-wrap">
            {out ? (
              <span className={busy ? "text-dim" : "text-text"}>{out}</span>
            ) : (
              <span className="text-faint">{src ? "Translating…" : "Translation appears here"}</span>
            )}
            {busy && out && <span className="caret" />}
          </div>
          <div className="flex items-center gap-1 border-t border-line px-2 py-1.5">
            <SpeakBtn text={out} lang={target} />
            <CopyBtn text={out} />
          </div>
        </div>
      </div>

      <p className="mt-3 text-center font-mono text-[10.5px] text-faint">
        translates as you type · {LANGS.length} languages & dialects · voice on both sides
      </p>
    </div>
  );
}

/* ================= 2 · live conversation ================= */

function ConvoPanel({
  translate, detect,
}: {
  translate: (t: string, to: string, s?: AbortSignal) => Promise<string>;
  detect: (t: string) => Promise<string>;
}) {
  const [pair, setPair] = useState(() => load("transPair", { a: "uk", b: "en" }));
  const [msgs, setMsgs] = useState<ConvoMsg[]>(() => load("transConvo", []));
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<{ stop: () => void } | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => save("transPair", pair), [pair]);
  useEffect(() => save("transConvo", msgs), [msgs]);
  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, busy]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setBusy(true);
    try {
      const from = await detect(text);
      const to = from === pair.a ? pair.b : pair.a;
      const translated = await translate(text, to);
      setMsgs((m) => [...m, { id: uid(), orig: text, translated, from, to, ts: Date.now() }]);
    } catch {
      setMsgs((m) => [...m, { id: uid(), orig: text, translated: "⚠ translation failed", from: pair.a, to: pair.b, ts: Date.now() }]);
    } finally {
      setBusy(false);
    }
  };

  const mic = () => {
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = ttsLang(pair.a);
    rec.interimResults = false;
    rec.onresult = (e: SpeechRecognitionEventLike) => {
      const t = Array.from(e.results).map((r) => r[0]?.transcript ?? "").join(" ");
      setInput((v) => (v ? v + " " : "") + t);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
    recRef.current = rec;
    setListening(true);
  };

  return (
    <div className="mx-auto flex h-full max-h-full w-full max-w-[760px] flex-col px-4 py-4">
      {/* pair bar */}
      <div className="mb-3 flex items-center gap-2">
        <LangSelect value={pair.a} onChange={(v) => setPair((p: typeof pair) => ({ ...p, a: v }))} label="you" accent="border-cyanic/40" />
        <button
          onClick={() => setPair((p: typeof pair) => ({ a: p.b, b: p.a }))}
          className="icon-btn h-9 w-9 shrink-0 rounded-xl border border-line"
          title="Swap sides"
        >
          <SwapIcon className="h-4 w-4" />
        </button>
        <LangSelect value={pair.b} onChange={(v) => setPair((p: typeof pair) => ({ ...p, b: v }))} label="them" accent="border-cyanic/40" />
        {msgs.length > 0 && (
          <button onClick={() => setMsgs([])} className="icon-btn h-9 w-9 shrink-0 rounded-xl border border-line" title="Clear conversation">
            <TrashIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* feed */}
      <div ref={feedRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-3">
        {msgs.length === 0 && !busy && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-[14px] text-dim">
              Speak or type in <b className="text-cyanic">{langName(pair.a)}</b> or <b className="text-cyanic">{langName(pair.b)}</b> —
            </p>
            <p className="mt-1 text-[13px] text-faint">the other side sees it in their language instantly.</p>
          </div>
        )}
        {msgs.map((m) => {
          const mine = m.from === pair.a;
          return (
            <div key={m.id} className={`anim-rise flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[86%] overflow-hidden rounded-2xl border ${mine ? "rounded-br-md border-cyanic/30 bg-panel3" : "rounded-bl-md border-line bg-panel"}`}>
                <div className="px-4 pt-3 text-[14px] leading-relaxed">{m.orig}</div>
                <div className={`border-t border-line/70 px-4 py-3 text-[14px] leading-relaxed ${mine ? "bg-panel/50" : "bg-panel3/40"}`}>
                  <span className="mr-2 rounded bg-cyanic/12 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-cyanic">
                    {m.to}
                  </span>
                  {m.translated}
                </div>
                <div className="flex items-center gap-1 border-t border-line/60 px-2 py-1">
                  <SpeakBtn text={m.orig} lang={m.from} />
                  <SpeakBtn text={m.translated} lang={m.to} />
                  <CopyBtn text={m.translated} />
                </div>
              </div>
            </div>
          );
        })}
        {busy && (
          <div className="flex justify-end">
            <div className="rounded-2xl rounded-br-md border border-cyanic/30 bg-panel3 px-4 py-3">
              <span className="flex items-center gap-1.5 text-cyanic">
                <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-current" />
                <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-current" />
                <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-current" />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* input */}
      <div className="flex shrink-0 items-end gap-2 rounded-2xl border border-line2 bg-panel2 p-2 focus-within:border-cyanic/50">
        {sttSupported() && (
          <button
            onClick={mic}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all ${
              listening ? "bg-coral/15 text-coral" : "text-dim hover:bg-panel3 hover:text-text"
            }`}
            title={listening ? "Stop listening" : `Voice input (${langName(pair.a)})`}
          >
            {listening ? <StopIcon className="h-4 w-4" /> : <MicIcon className="h-4 w-4" />}
          </button>
        )}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder={`Say something in ${langName(pair.a)} or ${langName(pair.b)}…`}
          className="max-h-[120px] min-h-[36px] flex-1 resize-none bg-transparent px-2 py-1.5 text-[14.5px] leading-relaxed outline-none placeholder:text-faint"
        />
        <button
          onClick={send}
          disabled={!input.trim() || busy}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyanic to-[#2f9fd8] text-white transition-all enabled:hover:brightness-110 disabled:opacity-35"
          title="Translate & send"
        >
          <SwapIcon className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-2 text-center font-mono text-[10px] text-faint">
        auto-detects who's talking and flips direction · tap a bubble to hear it
      </p>
    </div>
  );
}

/* ================= 3 · documents ================= */

function DocPanel({ translate }: { translate: (t: string, to: string, s?: AbortSignal) => Promise<string> }) {
  const [langs, setLangs] = useState(() => load("transDocLangs", { src: "auto", tgt: "en" }));
  const [job, setJob] = useState<DocJob | null>(null);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const acRef = useRef<AbortController | null>(null);

  useEffect(() => save("transDocLangs", langs), [langs]);

  const process = async (file: File) => {
    if (job?.state === "running") return;
    const text = await file.text();
    if (!text.trim()) return;
    const CHUNK = 5000;
    const chunks: string[] = [];
    let rest = text.slice(0, 60000);
    while (rest.length > CHUNK) {
      let cut = rest.lastIndexOf("\n", CHUNK);
      if (cut < CHUNK / 2) cut = rest.lastIndexOf(". ", CHUNK);
      if (cut < CHUNK / 2) cut = CHUNK;
      chunks.push(rest.slice(0, cut + 1));
      rest = rest.slice(cut + 1);
    }
    if (rest.trim()) chunks.push(rest);

    const truncated = text.length > 60000;
    setJob({ name: file.name, total: chunks.length, done: 0, out: "", state: "running" });
    const ac = new AbortController();
    acRef.current = ac;
    let out = "";
    try {
      for (let i = 0; i < chunks.length; i++) {
        const part = await translate(chunks[i], langs.tgt, ac.signal);
        out += (out ? "\n\n" : "") + part;
        setJob({ name: file.name, total: chunks.length, done: i + 1, out, state: "running" });
      }
      setJob({ name: file.name, total: chunks.length, done: chunks.length, out, state: "done" });
      if (truncated) setJob((j) => j && { ...j, err: "Only the first ~60K characters were translated (free-tier context limit)." });
    } catch (e) {
      if (!ac.signal.aborted) setJob({ name: file.name, total: chunks.length, done: 0, out, state: "error", err: e instanceof Error ? e.message : "failed" });
    }
  };

  const download = () => {
    if (!job) return;
    const blob = new Blob([job.out], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = job.name.replace(/(\.[^.]+)?$/, "") + `.${langs.tgt}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="mx-auto w-full max-w-[900px] px-4 py-5">
      <div className="mb-4 flex items-center gap-2">
        <LangSelect value={langs.src} onChange={(v) => setLangs((l: typeof langs) => ({ ...l, src: v }))} withAuto label="from" accent="" />
        <LangSelect value={langs.tgt} onChange={(v) => setLangs((l: typeof langs) => ({ ...l, tgt: v }))} label="to" accent="border-cyanic/40" />
      </div>

      {/* dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files?.[0];
          if (f) process(f);
        }}
        onClick={() => fileRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all ${
          drag ? "border-cyanic bg-cyanic/8" : "border-line2 bg-panel hover:border-cyanic/50 hover:bg-panel2"
        }`}
      >
        <FileTextIcon className={`mb-3 h-8 w-8 ${drag ? "text-cyanic" : "text-faint"}`} />
        <p className="text-[14px] font-bold">{drag ? "Drop it" : "Drop a document or click to browse"}</p>
        <p className="mt-1 font-mono text-[11px] text-faint">.txt · .md · .csv · .json · .html — up to ~60K chars, chunked automatically</p>
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.md,.csv,.json,.html,.log,.srt,text/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) process(f);
            e.target.value = "";
          }}
        />
      </div>

      {job && (
        <div className="anim-rise mt-4 overflow-hidden rounded-2xl border border-cyanic/30 bg-panel">
          <div className="flex items-center gap-3 border-b border-line px-4 py-3">
            <FileTextIcon className="h-4 w-4 shrink-0 text-cyanic" />
            <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-text">{job.name}</span>
            {job.state === "running" ? (
              <span className="font-mono text-[11px] text-cyanic">
                chunk {Math.min(job.done + 1, job.total)}/{job.total}
              </span>
            ) : job.state === "done" ? (
              <span className="font-mono text-[11px] text-mint">✓ translated</span>
            ) : (
              <span className="font-mono text-[11px] text-coral">✕ error</span>
            )}
            {job.state === "done" && (
              <button
                onClick={download}
                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-cyanic to-[#2f9fd8] px-3 py-1.5 text-[12px] font-bold text-white transition-all hover:brightness-110"
              >
                <DownloadIcon className="h-3.5 w-3.5" /> Download
              </button>
            )}
            {job.state === "running" && (
              <button onClick={() => acRef.current?.abort()} className="icon-btn h-8 w-8" title="Cancel">
                <StopIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {job.state === "running" && (
            <div className="h-1 w-full bg-panel3">
              <div
                className="h-full bg-gradient-to-r from-cyanic to-[#2f9fd8] transition-all duration-500"
                style={{ width: `${(job.done / job.total) * 100}%` }}
              />
            </div>
          )}
          {job.err && <p className="border-b border-line bg-coral/8 px-4 py-2 font-mono text-[11px] text-coral">⚠ {job.err}</p>}
          <div className="max-h-[340px] overflow-y-auto px-4 py-3 text-[13.5px] leading-relaxed whitespace-pre-wrap">
            {job.out || <span className="text-faint">translating…</span>}
            {job.state === "running" && <span className="caret" />}
          </div>
          {job.state !== "running" && (
            <div className="flex items-center gap-1 border-t border-line px-2 py-1.5">
              <SpeakBtn text={job.out.slice(0, 1200)} lang={langs.tgt} />
              <CopyBtn text={job.out} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- speech recognition types (not in lib.dom for webkit) ---------- */
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}
interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}
