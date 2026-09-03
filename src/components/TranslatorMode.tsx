import { useCallback, useEffect, useRef, useState } from "react";
import { getModelInfo, isAutoModel, resolveAutoModel, type ModelInfo } from "../data/models";
import { providerById, PROVIDERS } from "../data/providers";
import type { ProviderCfg } from "../lib/store";
import type { LiveCatalog } from "../lib/modelFetch";
import { LANGS, langName, ttsLang } from "../lib/languages";
import { translateSmart, translateWithSource } from "../lib/translate";
import { speakText, stopSpeaking } from "../lib/tts";
import { useI18n } from "../lib/i18n";
import {
  GlobeIcon, MicIcon, FileTextIcon, SwapIcon, SpeakerIcon, CopyIcon, CheckIcon,
  DownloadIcon, XIcon, ChevronDown, StopIcon,
} from "./Icons";

type Tab = "text" | "convo" | "doc";

interface Props {
  cfgs: Record<string, ProviderCfg>;
  catalog: LiveCatalog;
  modelId: string;
}

function freshOf(catalog: LiveCatalog): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [pid, entry] of Object.entries(catalog)) {
    if (entry?.models?.length) out[pid] = entry.models;
  }
  return out;
}

export default function TranslatorMode({ cfgs, catalog, modelId }: Props) {
  const { t } = useI18n();
  const model = isAutoModel(modelId) ? resolveAutoModel(modelId, cfgs, freshOf(catalog)) : getModelInfo(modelId);
  const provider = providerById.get(model.providerId) ?? PROVIDERS[0];
  const cfg = cfgs[model.providerId] ?? { key: "", baseUrl: provider.baseUrl };

  const [tab, setTab] = useState<Tab>("text");

  return (
    <div className="mx-auto flex h-full w-full max-w-[920px] flex-col px-3 py-4 sm:px-5 sm:py-5">
      <div className="flex flex-wrap items-center gap-1">
        {(
          [
            { id: "text", label: t("tr.text"), icon: GlobeIcon },
            { id: "convo", label: t("tr.live"), icon: MicIcon },
            { id: "doc", label: t("tr.docs"), icon: FileTextIcon },
          ] as const
        ).map((tb) => (
          <button
            key={tb.id}
            onClick={() => {
              stopSpeaking();
              setTab(tb.id);
            }}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-all ${
              tab === tb.id ? "bg-violet/12 text-violet2" : "text-dim hover:bg-panel2 hover:text-text"
            }`}
          >
            <tb.icon className="h-3.5 w-3.5" />
            {tb.label}
          </button>
        ))}
        <span className="ms-auto hidden font-mono text-[10px] text-faint lg:inline">{t("tr.tagline")}</span>
      </div>

      <div className="mt-4 min-h-0 flex-1">
        {tab === "text" && <TextPanel model={model} provider={provider} cfg={cfg} />}
        {tab === "convo" && <ConvoPanel model={model} provider={provider} cfg={cfg} />}
        {tab === "doc" && <DocPanel model={model} provider={provider} cfg={cfg} />}
      </div>
    </div>
  );
}

/* ---------------- language select ---------------- */

function LangSelect({
  value, onChange, withAuto, label, accent,
}: {
  value: string;
  onChange: (v: string) => void;
  withAuto?: boolean;
  label: string;
  accent?: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, []);

  const list = LANGS.filter((l) => (l.name + l.native).toLowerCase().includes(q.toLowerCase()));
  const current = withAuto && value === "auto" ? t("tr.auto") : langName(value);

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`row-hl flex min-w-[128px] items-center gap-2 rounded-xl border border-line bg-panel px-3 py-2 transition-all hover:border-line2 ${accent ?? ""}`}
        title={label}
      >
        <span className="truncate text-[13px] font-bold">{current}</span>
        <ChevronDown className={`ms-auto h-3.5 w-3.5 shrink-0 text-faint transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="backdrop-in fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="anim-rise absolute start-0 top-full z-50 mt-2 flex max-h-[300px] w-64 max-w-[86vw] flex-col overflow-hidden rounded-xl border border-line2 bg-panel shadow-xl">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="🔍"
              className="border-b border-line bg-transparent px-3 py-2 text-[13px] outline-none placeholder:text-faint"
            />
            <div className="min-h-0 flex-1 overflow-y-auto py-1">
              {withAuto && (
                <button
                  onClick={() => {
                    onChange("auto");
                    setOpen(false);
                    setQ("");
                  }}
                  className={`flex w-full items-center gap-2 px-3.5 py-2 text-start text-[13px] transition-colors ${
                    value === "auto" ? "font-bold text-violet3" : "text-dim hover:bg-panel2"
                  }`}
                >
                  ✨ {t("tr.auto")}
                </button>
              )}
              {list.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    onChange(l.code);
                    setOpen(false);
                    setQ("");
                  }}
                  className={`flex w-full items-center justify-between gap-2 px-3.5 py-2 text-start text-[13px] transition-colors ${
                    value === l.code ? "font-bold text-violet3" : "text-dim hover:bg-panel2"
                  }`}
                >
                  <span>{l.native}</span>
                  <span className="font-mono text-[10px] text-faint">{l.code}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- text panel ---------------- */

function TextPanel({ model, provider, cfg }: { model: ModelInfo; provider: (typeof PROVIDERS)[number]; cfg: ProviderCfg }) {
  const { t } = useI18n();
  const [src, setSrc] = useState("auto");
  const [tgt, setTgt] = useState("uk");
  const [input, setInput] = useState("");
  const [out, setOut] = useState("");
  const [detected, setDetected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const timerRef = useRef<number>(0);
  const acRef = useRef<AbortController | null>(null);

  useEffect(() => () => acRef.current?.abort(), []);

  const run = useCallback(
    (text: string, target: string) => {
      acRef.current?.abort();
      if (!text.trim()) {
        setOut("");
        setDetected(null);
        return;
      }
      const ac = new AbortController();
      acRef.current = ac;
      setBusy(true);
      translateSmart(text, target, model, provider, cfg, ac.signal)
        .then((r) => {
          setDetected(r.from);
          setOut(r.text);
        })
        .catch((e) => {
          if (!ac.signal.aborted) setOut("⚠ " + (e instanceof Error ? e.message : String(e)).slice(0, 160));
        })
        .finally(() => setBusy(false));
    },
    [model, provider, cfg]
  );

  const onChange = (v: string) => {
    setInput(v);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => run(v, tgt), 450);
  };

  const swap = () => {
    const newSrc = src === "auto" ? detected ?? "en" : src;
    if (tgt === newSrc) return;
    setSrc(tgt);
    setTgt(newSrc);
    setInput(out);
    setOut(input);
    setDetected(null);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => run(out, newSrc), 350);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <LangSelect value={src} onChange={(v) => { setSrc(v); if (input.trim()) run(input, tgt); }} withAuto label={t("tr.from")} />
        <button onClick={swap} className="icon-btn border border-line" title={t("tr.swap")} aria-label={t("tr.swap")}>
          <SwapIcon className="h-4 w-4" />
        </button>
        <LangSelect value={tgt} onChange={(v) => { setTgt(v); if (input.trim()) run(input, v); }} label={t("tr.to")} accent="border-cyanic/40" />
        {detected && src === "auto" && (
          <span className="rounded-full border border-line bg-panel px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-faint">
            {t("tr.detected")}: {langName(detected)}
          </span>
        )}
        {input && (
          <button onClick={() => { setInput(""); setOut(""); setDetected(null); }} className="icon-btn ms-auto" title={t("tr.clear")}>
            <XIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
        <div className="relative min-h-[180px] overflow-hidden rounded-2xl border border-line bg-panel transition-colors focus-within:border-violet/50">
          <textarea
            value={input}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t("tr.srcPlaceholder")}
            className="h-full w-full resize-none bg-transparent p-4 text-[14.5px] leading-relaxed outline-none placeholder:text-faint"
          />
          <span className="pointer-events-none absolute bottom-2.5 end-3.5 font-mono text-[10px] text-faint">
            {input.length} {t("tr.chars")}
          </span>
        </div>
        <div className="relative min-h-[180px] overflow-hidden rounded-2xl border border-line bg-panel2/70">
          <div className="h-full w-full overflow-y-auto p-4 text-[14.5px] leading-relaxed whitespace-pre-wrap">
            {busy && !out && (
              <span className="flex items-center gap-1.5 text-violet3">
                <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-current" />
                <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-current" />
                <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-current" />
                <span className="ms-1 text-[13px]">{t("tr.translating")}</span>
              </span>
            )}
            {!busy && !out && <span className="text-faint">{t("tr.outEmpty")}</span>}
            {out}
            {busy && out && <span className="caret" />}
          </div>
          {out && !busy && (
            <div className="absolute bottom-2.5 end-2.5 flex items-center gap-1">
              <button
                onClick={() => {
                  if (speaking) {
                    stopSpeaking();
                    setSpeaking(false);
                  } else {
                    setSpeaking(true);
                    speakText(out, tgt, { onEnd: () => setSpeaking(false) });
                  }
                }}
                className={`icon-btn h-8 w-8 bg-panel ${speaking ? "speaking-ring text-violet3" : ""}`}
                title={t("tr.listen")}
              >
                {speaking ? <span className="speaking-bars text-violet3"><i /><i /><i /><i /></span> : <SpeakerIcon className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(out).catch(() => {});
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1300);
                }}
                className="icon-btn h-8 w-8 bg-panel"
                title={t("common.copy")}
              >
                {copied ? <CheckIcon className="h-3.5 w-3.5 text-mint" /> : <CopyIcon className="h-3.5 w-3.5" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- live conversation (push-to-talk interpreter) ---------------- */

interface Turn {
  id: number;
  side: "A" | "B";
  srcLang: string;
  text: string;
  tr: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const SR: any =
  (typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) || null;

function ConvoPanel({ model, provider, cfg }: { model: ModelInfo; provider: (typeof PROVIDERS)[number]; cfg: ProviderCfg }) {
  const { t } = useI18n();
  const [pair, setPair] = useState({ a: "en", b: "uk" });
  const [turns, setTurns] = useState<Turn[]>([]);
  const [listening, setListening] = useState<"A" | "B" | null>(null);
  const [transcript, setTranscript] = useState("");
  const [translatingSide, setTranslatingSide] = useState<"A" | "B" | null>(null);
  const [speakingTurn, setSpeakingTurn] = useState<number | null>(null);
  const recRef = useRef<any>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(1);
  const transcriptRef = useRef("");
  transcriptRef.current = transcript;

  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, transcript]);

  useEffect(() => () => recRef.current?.stop?.(), []);

  const swap = () => setPair((p) => ({ a: p.b, b: p.a }));

  async function finalize(side: "A" | "B", text: string) {
    const srcLang = side === "A" ? pair.a : pair.b;
    const tgtLang = side === "A" ? pair.b : pair.a;
    setTranslatingSide(side);
    try {
      const tr = await translateWithSource(text, srcLang, tgtLang, model, provider, cfg);
      const turn: Turn = { id: idRef.current++, side, srcLang, text, tr };
      setTurns((ts) => [...ts, turn]);
      setSpeakingTurn(turn.id);
      speakText(tr, tgtLang, { onEnd: () => setSpeakingTurn(null) });
    } catch (e) {
      setTurns((ts) => [...ts, { id: idRef.current++, side, srcLang, text, tr: "⚠ " + (e instanceof Error ? e.message : String(e)).slice(0, 140) }]);
    } finally {
      setTranslatingSide(null);
    }
  }

  const hold = (side: "A" | "B") => {
    if (!SR || listening) return;
    const lang = side === "A" ? pair.a : pair.b;
    const rec = new SR();
    recRef.current = rec;
    rec.lang = ttsLang(lang);
    rec.continuous = true;
    rec.interimResults = true;
    setTranscript("");
    setListening(side);
    let finalText = "";
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const chunk = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += chunk + " ";
        else interim += chunk;
      }
      setTranscript((finalText + interim).trim());
    };
    rec.onend = () => {
      setListening(null);
      const text = (finalText || "").trim() || transcriptRef.current.trim();
      setTranscript("");
      if (text) void finalize(side, text);
    };
    rec.onerror = () => {
      setListening(null);
      setTranscript("");
    };
    rec.start();
  };

  const release = () => {
    try {
      recRef.current?.stop?.();
    } catch {
      /* already stopped */
    }
  };

  const copyTranscript = () => {
    const doc = turns
      .map((tn) => {
        const who = tn.side === "A" ? `A (${langName(tn.srcLang)})` : `B (${langName(tn.srcLang)})`;
        return `${who}: ${tn.text}\n→ ${tn.tr}`;
      })
      .join("\n\n");
    navigator.clipboard?.writeText(doc).catch(() => {});
  };

  const sideColor = (s: "A" | "B") => (s === "A" ? "text-cyanic" : "text-gold");
  const sideBorder = (s: "A" | "B") => (s === "A" ? "border-cyanic/50" : "border-gold/50");
  const sideBg = (s: "A" | "B") => (s === "A" ? "bg-cyanic/15" : "bg-gold/15");

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <LangSelect value={pair.a} onChange={(v) => setPair((p) => ({ ...p, a: v }))} label="Side A" accent="border-cyanic/40" />
        <button onClick={swap} className="icon-btn border border-line" title={t("tr.swap")} aria-label={t("tr.swap")}>
          <SwapIcon className="h-4 w-4" />
        </button>
        <LangSelect value={pair.b} onChange={(v) => setPair((p) => ({ ...p, b: v }))} label="Side B" accent="border-gold/40" />
        {turns.length > 0 && (
          <div className="ms-auto flex items-center gap-1">
            <button onClick={copyTranscript} className="icon-btn" title={t("tr.copyTranscript")}>
              <CopyIcon className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                setTurns([]);
                stopSpeaking();
              }}
              className="icon-btn"
              title={t("tr.clearConvo")}
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {!SR && <p className="mb-3 rounded-xl border border-gold/35 bg-gold/8 px-3.5 py-2.5 text-[12.5px] text-gold">{t("tr.noMic")}</p>}

      <div ref={feedRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-line bg-panel/60 p-3 sm:p-4">
        {turns.length === 0 && !listening && (
          <p className="pt-8 text-center text-[13px] text-faint">{t("tr.liveEmpty")}</p>
        )}
        {turns.map((tn) => (
          <div key={tn.id} className={`anim-rise max-w-[88%] rounded-2xl border p-3 sm:max-w-[75%] ${tn.side === "A" ? "me-auto border-cyanic/25 bg-cyanic/6" : "ms-auto border-gold/25 bg-gold/6"}`}>
            <div className="flex items-center gap-2">
              <span className={`font-mono text-[10px] font-bold uppercase tracking-wider ${sideColor(tn.side)}`}>
                {tn.side} · {langName(tn.srcLang)}
              </span>
              <button
                onClick={() => {
                  if (speakingTurn === tn.id) {
                    stopSpeaking();
                    setSpeakingTurn(null);
                  } else {
                    setSpeakingTurn(tn.id);
                    speakText(tn.tr, tn.side === "A" ? pair.b : pair.a, { onEnd: () => setSpeakingTurn(null) });
                  }
                }}
                className="ms-auto p-0.5 text-faint transition-colors hover:text-violet3"
                title={t("tr.listen")}
              >
                {speakingTurn === tn.id ? <span className="speaking-bars text-violet3"><i /><i /><i /><i /></span> : <SpeakerIcon className="h-3.5 w-3.5" />}
              </button>
            </div>
            <p className="mt-1 text-[14px] leading-relaxed">{tn.text}</p>
            <p className={`mt-1.5 border-t pt-1.5 text-[13.5px] leading-relaxed text-dim ${tn.side === "A" ? "border-cyanic/20" : "border-gold/20"}`}>
              → {tn.tr}
            </p>
          </div>
        ))}

        {listening && (
          <div className={`anim-rise max-w-[85%] rounded-2xl border p-3 ${listening === "A" ? "me-auto border-cyanic/40" : "ms-auto border-gold/40"}`}>
            <p className={`flex items-center gap-2 font-mono text-[10.5px] font-bold uppercase tracking-wider ${sideColor(listening)}`}>
              <span className="pulse-live h-1.5 w-1.5 rounded-full bg-current" />
              {listening} · {t("tr.speaking")}
            </p>
            <p className="mt-1.5 min-h-[22px] text-[14px] leading-relaxed text-dim">
              {transcript}
              <span className="caret ms-1" />
            </p>
          </div>
        )}
        {translatingSide && (
          <p className="flex items-center gap-1.5 ps-1 text-[12px] text-violet3">
            <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-current" />
            <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-current" />
            <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-current" />
            <span className="ms-1">{t("tr.translating")}</span>
          </p>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 pb-1">
        {(["A", "B"] as const).map((side) => {
          const active = listening === side;
          return (
            <button
              key={side}
              disabled={!SR}
              onPointerDown={() => hold(side)}
              onPointerUp={release}
              onPointerLeave={() => active && release()}
              onPointerCancel={release}
              onContextMenu={(e) => e.preventDefault()}
              className={`relative flex h-[74px] touch-none select-none flex-col items-center justify-center gap-1 rounded-2xl border-2 transition-all disabled:opacity-40 sm:h-[84px] ${
                active ? `${sideBorder(side)} ${sideBg(side)} scale-[0.98]` : "border-line bg-panel hover:border-line2"
              }`}
            >
              {active && (
                <span className="mic-ripples pointer-events-none absolute inset-0" aria-hidden>
                  <span /><span />
                </span>
              )}
              <MicIcon className={`h-5 w-5 ${active ? sideColor(side) : "text-dim"}`} />
              <span className={`text-[12px] font-extrabold ${active ? sideColor(side) : "text-dim"}`}>
                {side} · {langName(side === "A" ? pair.a : pair.b)}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-faint">{t("tr.holdA")}</span>
            </button>
          );
        })}
      </div>
      <p className="pb-1 text-center font-mono text-[10px] text-faint">{t("tr.liveHint")}</p>
    </div>
  );
}

/* ---------------- documents panel ---------------- */

function DocPanel({ model, provider, cfg }: { model: ModelInfo; provider: (typeof PROVIDERS)[number]; cfg: ProviderCfg }) {
  const { t } = useI18n();
  const [src, setSrc] = useState("auto");
  const [tgt, setTgt] = useState("en");
  const [doc, setDoc] = useState("");
  const [out, setOut] = useState("");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const acRef = useRef<AbortController | null>(null);

  useEffect(() => () => acRef.current?.abort(), []);

  const chunk = (text: string, size = 1200): string[] => {
    const parts: string[] = [];
    let rest = text;
    while (rest.length > size) {
      let cut = rest.lastIndexOf("\n", size);
      if (cut < size * 0.4) cut = rest.lastIndexOf(". ", size);
      if (cut < size * 0.4) cut = size;
      parts.push(rest.slice(0, cut + 1));
      rest = rest.slice(cut + 1);
    }
    if (rest.trim()) parts.push(rest);
    return parts;
  };

  const run = async () => {
    if (!doc.trim()) return;
    if (progress) {
      acRef.current?.abort();
      return;
    }
    const ac = new AbortController();
    acRef.current = ac;
    const parts = chunk(doc);
    setOut("");
    setProgress({ done: 0, total: parts.length });
    let acc = "";
    let from = src;
    for (let i = 0; i < parts.length; i++) {
      try {
        let piece: string;
        if (from === "auto") {
          const r = await translateSmart(parts[i], tgt, model, provider, cfg, ac.signal);
          from = r.from;
          piece = r.text;
        } else {
          piece = await translateWithSource(parts[i], from, tgt, model, provider, cfg, ac.signal);
        }
        acc += (acc ? "\n" : "") + piece;
        setOut(acc);
        setProgress({ done: i + 1, total: parts.length });
      } catch (e) {
        if (!ac.signal.aborted) setOut(acc + (acc ? "\n" : "") + "⚠ " + (e instanceof Error ? e.message : String(e)).slice(0, 160));
        break;
      }
    }
    setProgress(null);
  };

  const download = () => {
    const blob = new Blob([out], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "aide-translation.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <LangSelect value={src} onChange={setSrc} withAuto label={t("tr.from")} />
        <SwapIcon className="h-4 w-4 shrink-0 text-faint" />
        <LangSelect value={tgt} onChange={setTgt} label={t("tr.to")} accent="border-cyanic/40" />
        <div className="ms-auto flex items-center gap-1.5">
          {out && (
            <>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(out).catch(() => {});
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1300);
                }}
                className="icon-btn"
                title={t("common.copy")}
              >
                {copied ? <CheckIcon className="h-3.5 w-3.5 text-mint" /> : <CopyIcon className="h-3.5 w-3.5" />}
              </button>
              <button onClick={download} className="icon-btn" title=".txt">
                <DownloadIcon className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          <button
            onClick={() => void run()}
            disabled={!doc.trim()}
            className={`btn-brand flex items-center gap-2 rounded-xl px-4 py-2 text-[12.5px] font-extrabold disabled:opacity-35 ${progress ? "opacity-90" : ""}`}
          >
            {progress ? (
              <>
                <StopIcon className="h-3.5 w-3.5" />
                {progress.done}/{progress.total}
              </>
            ) : (
              <>
                <FileTextIcon className="h-3.5 w-3.5" />
                {t("tr.docTranslate")}
              </>
            )}
          </button>
        </div>
      </div>

      {progress && (
        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-panel3">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet to-violet2 transition-all duration-300"
            style={{ width: `${(progress.done / progress.total) * 100}%` }}
          />
        </div>
      )}

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
        <textarea
          value={doc}
          onChange={(e) => setDoc(e.target.value)}
          placeholder={t("tr.docPlaceholder")}
          className="min-h-[200px] w-full resize-none rounded-2xl border border-line bg-panel p-4 text-[13.5px] leading-relaxed outline-none placeholder:text-faint focus:border-violet/50"
        />
        <div className="min-h-[200px] overflow-y-auto rounded-2xl border border-line bg-panel2/70 p-4 text-[13.5px] leading-relaxed whitespace-pre-wrap">
          {out || <span className="text-faint">{t("tr.outEmpty")}</span>}
          {progress && <span className="caret ms-1" />}
        </div>
      </div>
      <p className="mt-2 pb-1 text-center font-mono text-[10px] text-faint">{t("tr.docHint")}</p>
    </div>
  );
}
