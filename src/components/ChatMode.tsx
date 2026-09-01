import { useEffect, useMemo, useRef, useState } from "react";
import { getModelInfo, isAutoModel, resolveAutoModel } from "../data/models";
import { providerById, PROVIDERS } from "../data/providers";
import { streamChat, NoKeyError } from "../lib/llm";
import { Markdown } from "../lib/markdown";
import { uid, DEFAULT_PARAMS, type ChatMessage, type Conversation, type ProviderCfg } from "../lib/store";
import type { LiveCatalog } from "../lib/modelFetch";
import { speakText, stopSpeaking } from "../lib/tts";
import { useI18n } from "../lib/i18n";
import ModelPicker from "./ModelPicker";
import {
  BrandMark, SendIcon, StopIcon, CopyIcon, CheckIcon, RefreshIcon,
  BrainIcon, GlobeIcon, SearchIcon, CodeIcon, BulbIcon, PenIcon, ChartIcon, SpeakerIcon,
} from "./Icons";

const PERSONA =
  "You are AiDe, a helpful AI assistant. Answer in the language of the user's message, concise and to the point, using markdown formatting and code blocks where appropriate.";

interface Props {
  conv: Conversation;
  patchConv: (id: string, fn: (c: Conversation) => Conversation) => void;
  cfgs: Record<string, ProviderCfg>;
  catalog: LiveCatalog;
  modelId: string;
  onModel: (id: string) => void;
  onRefresh: (pid: string) => Promise<void>;
  onRefreshAll: () => void;
}

export default function ChatMode({ conv, patchConv, cfgs, catalog, modelId, onModel, onRefresh, onRefreshAll }: Props) {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [search, setSearch] = useState(false);
  const [deep, setDeep] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const stopRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [conv.messages]);

  useEffect(() => () => stopSpeaking(), []);

  const model = isAutoModel(modelId) ? resolveAutoModel(modelId, cfgs, freshCatalog(catalog)) : getModelInfo(modelId);
  const provider = providerById.get(model.providerId) ?? PROVIDERS[0];

  const suggestions = useMemo(
    () => [
      { icon: CodeIcon, title: t("chat.sugg1"), text: t("chat.suggT1") },
      { icon: BulbIcon, title: t("chat.sugg2"), text: t("chat.suggT2") },
      { icon: PenIcon, title: t("chat.sugg3"), text: t("chat.suggT3") },
      { icon: ChartIcon, title: t("chat.sugg4"), text: t("chat.suggT4") },
    ],
    [t]
  );

  function autosize() {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    ta.style.height = Math.min(ta.scrollHeight, 180) + "px";
  }

  const setMsg = (msgId: string, fn: (m: ChatMessage) => ChatMessage) =>
    patchConv(conv.id, (c) => ({ ...c, messages: c.messages.map((m) => (m.id === msgId ? fn(m) : m)) }));

  function speak(m: ChatMessage) {
    if (speakingId === m.id) {
      stopSpeaking();
      setSpeakingId(null);
      return;
    }
    setSpeakingId(m.id);
    speakText(m.content, detectReplyLang(m.content), { onEnd: () => setSpeakingId(null) });
  }

  async function send(textRaw?: string, baseMessages?: ChatMessage[]) {
    const text = (textRaw ?? input).trim();
    if (!text || busy) return;
    if (textRaw === undefined) setInput("");
    requestAnimationFrame(autosize);
    stopSpeaking();
    setSpeakingId(null);

    const base = baseMessages ?? conv.messages;
    const userMsg: ChatMessage = { id: uid(), role: "user", content: text, ts: Date.now(), modelId: model.id };
    const asstId = uid();
    const asstMsg: ChatMessage = { id: asstId, role: "assistant", content: "", ts: Date.now(), modelId: model.id };

    patchConv(conv.id, (c) => ({
      ...c,
      title: base.length === 0 ? text.slice(0, 44) + (text.length > 44 ? "…" : "") : c.title,
      messages: [...base, userMsg, asstMsg],
    }));
    setBusy(true);
    stopRef.current = false;

    const cfg = cfgs[model.providerId] ?? { key: "", baseUrl: provider.baseUrl };
    const controller = new AbortController();
    abortRef.current = controller;

    const sys =
      PERSONA +
      (search ? "\nThe user enabled web search: structure the answer around verifiable, up-to-date facts." : "") +
      (deep ? "\nThe user asked for Deep Research: produce a long structured report with sections and trade-offs." : "") +
      (thinking ? "\nReason step by step before the final answer." : "");

    try {
      const history = base
        .filter((m) => m.role !== "assistant" || m.content)
        .map((m) => ({ role: m.role, content: m.content }));
      let full = "";
      for await (const delta of streamChat({
        model,
        provider,
        cfg,
        messages: [{ role: "system", content: sys }, ...history, { role: "user", content: text }],
        params: DEFAULT_PARAMS,
        signal: controller.signal,
      })) {
        if (stopRef.current) break;
        full += delta;
        setMsg(asstId, (m) => ({ ...m, content: full }));
      }
      setMsg(asstId, (m) => ({
        ...m,
        content: m.content || full,
        tokens: Math.max(1, Math.round((m.content || full).length / 3.2)),
      }));
    } catch (e) {
      const aborted = (e instanceof DOMException && e.name === "AbortError") || controller.signal.aborted;
      if (!aborted) {
        const hint =
          e instanceof NoKeyError
            ? `Open **Settings** and paste a free ${provider.name} key — get one at ${provider.keyUrl ?? provider.docs}.`
            : e instanceof Error
              ? e.message
              : String(e);
        setMsg(asstId, (m) => ({ ...m, error: true, content: `**${provider.name}**\n\n${hint}` }));
      } else {
        setMsg(asstId, (m) => ({
          ...m,
          content: m.content ? m.content + "\n\n*— " + t("chat.stop").toLowerCase() + " —*" : "*…*",
        }));
      }
    }

    setBusy(false);
    stopRef.current = false;
  }

  function stop() {
    stopRef.current = true;
    abortRef.current?.abort();
  }

  function regenerate() {
    const idx = conv.messages.map((m) => m.role).lastIndexOf("user");
    if (idx < 0 || busy) return;
    const text = conv.messages[idx].content;
    const trimmed = conv.messages.slice(0, idx);
    patchConv(conv.id, (c) => ({ ...c, messages: trimmed }));
    send(text, trimmed);
  }

  const empty = conv.messages.length === 0;
  const lastUserIdx = conv.messages.map((m) => m.role).lastIndexOf("user");

  return (
    <div className="flex h-full flex-col">
      {/* feed */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center px-6 pb-[6vh]">
            <div className="anim-rise flex flex-col items-center">
              <div className="floaty mb-5">
                <BrandMark className="h-14 w-14 drop-shadow-[0_0_30px_color-mix(in_srgb,var(--t-violet)_45%,transparent)]" />
              </div>
              <h1 className="text-[24px] font-extrabold tracking-tight sm:text-[26px]">
                {t("chat.hello")} <span className="text-violet2">AiDe</span>
              </h1>
              <p className="mt-1.5 text-[14px] text-dim">{t("chat.help")}</p>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-[800px] px-4 pb-6 pt-8 sm:px-5">
            {conv.messages.map((m, mi) => (
              <MessageRow
                key={m.id}
                m={m}
                busy={busy}
                isLast={mi === conv.messages.length - 1}
                canRegenerate={mi > lastUserIdx}
                onRegenerate={regenerate}
                speaking={speakingId === m.id}
                onSpeak={() => speak(m)}
                tRegen={t("chat.regenerate")}
                tSpeak={speakingId === m.id ? t("chat.stopReading") : t("chat.readAloud")}
              />
            ))}
          </div>
        )}
      </div>

      {/* composer */}
      <div className="mx-auto w-full max-w-[800px] px-4 pb-4 sm:px-5 sm:pb-5">
        <div className="rounded-[26px] border border-line2 bg-panel2 p-3 transition-all focus-within:border-violet/50 focus-within:shadow-[0_0_0_1px_color-mix(in_srgb,var(--t-violet)_30%,transparent),0_12px_40px_-12px_#00000099]">
          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autosize();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder={t("chat.placeholder")}
            className="block w-full resize-none bg-transparent px-2 pt-1 text-[15px] leading-relaxed outline-none placeholder:text-faint"
          />
          <div className="mt-2 flex items-center gap-1.5">
            <div className="chips-scroll ms-auto flex items-center gap-1.5 overflow-x-auto">
              <button className={`chip-mode shrink-0 ${thinking ? "on" : ""}`} onClick={() => setThinking((v) => !v)}>
                <BrainIcon className="h-3.5 w-3.5" /> {t("chat.think")}
              </button>
              <button className={`chip-mode shrink-0 ${search ? "on" : ""}`} onClick={() => setSearch((v) => !v)}>
                <GlobeIcon className="h-3.5 w-3.5" /> {t("chat.search")}
              </button>
              <button className={`chip-mode shrink-0 ${deep ? "on" : ""}`} onClick={() => setDeep((v) => !v)}>
                <SearchIcon className="h-3.5 w-3.5" /> <span className="whitespace-nowrap">{t("chat.deep")}</span>
              </button>
              {busy ? (
                <button
                  onClick={stop}
                  className="ms-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-coral/15 text-coral transition-all hover:bg-coral/25"
                  title={t("chat.stop")}
                >
                  <StopIcon className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => send()}
                  disabled={!input.trim()}
                  className="btn-send ms-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
                  title={t("chat.send")}
                >
                  <SendIcon className="h-4 w-4 -rotate-45" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* suggestions under composer on empty state */}
        {empty && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {suggestions.map((s, i) => (
              <button
                key={s.title}
                onClick={() => send(s.text)}
                style={{ animationDelay: `${i * 60}ms` }}
                className="anim-rise flex items-center gap-2 rounded-full border border-line bg-panel px-3.5 py-2 text-[12.5px] font-semibold text-dim transition-all hover:-translate-y-0.5 hover:border-violet/45 hover:text-text"
              >
                <s.icon className="h-3.5 w-3.5 text-violet2" />
                {s.title}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function freshCatalog(catalog: LiveCatalog): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [pid, entry] of Object.entries(catalog)) {
    if (entry?.models?.length) out[pid] = entry.models;
  }
  return out;
}

function detectReplyLang(text: string): string {
  if (/[\u4e00-\u9fff]/.test(text)) return "zh";
  if (/[\u0400-\u04ff]/.test(text)) return /[іїєґ]/i.test(text) ? "uk" : "ru";
  if (/[\u0600-\u06ff]/.test(text)) return "ar";
  return "en";
}



function MessageRow({
  m, busy, isLast, canRegenerate, onRegenerate, speaking, onSpeak, tRegen, tSpeak,
}: {
  m: ChatMessage;
  busy: boolean;
  isLast: boolean;
  canRegenerate: boolean;
  onRegenerate: () => void;
  speaking: boolean;
  onSpeak: () => void;
  tRegen: string;
  tSpeak: string;
}) {
  const [copied, setCopied] = useState(false);
  const streaming = busy && isLast && m.role === "assistant";

  if (m.role === "user") {
    return (
      <div className="anim-rise mb-6 flex justify-end">
        <div className="max-w-[85%] rounded-[22px] rounded-br-[8px] bg-panel3 px-3.5 py-3 text-[14.5px] leading-relaxed whitespace-pre-wrap break-words sm:px-4.5">
          {m.content}
        </div>
      </div>
    );
  }

  return (
    <div className="anim-rise group mb-7 flex gap-3">
      <div className="mt-0.5 shrink-0">
        <BrandMark className="h-7 w-7" />
      </div>
      <div className="min-w-0 flex-1">
        {m.error ? (
          <div className="rounded-2xl border border-coral/35 bg-coral/8 px-4 py-3">
            <Markdown src={m.content || ""} />
          </div>
        ) : (
          <Markdown src={m.content || ""} />
        )}
        {streaming && !m.content && (
          <span className="mt-1 flex items-center gap-1.5 text-violet2">
            <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-current" />
            <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-current" />
            <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-current" />
          </span>
        )}
        {streaming && m.content && <span className="caret" />}

        {!streaming && m.content && !m.error && (
          <div className="mt-2 flex items-center gap-1 transition-opacity md:opacity-0 md:group-hover:opacity-100">
            <button
              onClick={onSpeak}
              className={`icon-btn h-7 w-7 ${speaking ? "speaking-ring text-violet3" : ""}`}
              title={tSpeak}
            >
              {speaking ? (
                <span className="speaking-bars text-violet3" aria-label="speaking">
                  <i /><i /><i /><i />
                </span>
              ) : (
                <SpeakerIcon className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(m.content).catch(() => {});
                setCopied(true);
                setTimeout(() => setCopied(false), 1300);
              }}
              className="icon-btn h-7 w-7"
              title="Copy"
            >
              {copied ? <CheckIcon className="h-3.5 w-3.5 text-mint" /> : <CopyIcon className="h-3.5 w-3.5" />}
            </button>
            {canRegenerate && (
              <button onClick={onRegenerate} className="icon-btn h-7 w-7" title={tRegen}>
                <RefreshIcon className="h-3.5 w-3.5" />
              </button>
            )}
            <span className="ms-1 hidden font-mono text-[10.5px] text-faint sm:inline">
              {m.modelId ? getModelInfo(m.modelId).name : ""} · ~{m.tokens ?? "—"} tok
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
