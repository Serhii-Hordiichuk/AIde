import { useEffect, useRef, useState } from "react";
import { MODELS, modelById, isAutoModel, resolveAutoModel } from "../data/models";
import { providerById, PROVIDERS } from "../data/providers";
import { streamChat, NoKeyError } from "../lib/llm";
import { Markdown } from "../lib/markdown";
import { uid, DEFAULT_PARAMS, type ChatMessage, type Conversation, type ProviderCfg } from "../lib/store";
import ModelPicker from "./ModelPicker";
import {
  BrandMark, SendIcon, StopIcon, CopyIcon, CheckIcon, RefreshIcon,
  BrainIcon, GlobeIcon, SearchIcon, CodeIcon, BulbIcon, PenIcon, ChartIcon,
} from "./Icons";

const PERSONA =
  "You are AiDe, a helpful AI assistant. Answer in English, concise and to the point, using markdown formatting and code blocks where appropriate.";

const SUGGESTIONS = [
  { icon: CodeIcon, title: "Write code", text: "Write a useDebounce hook with tests" },
  { icon: BulbIcon, title: "Explain a concept", text: "Explain RAG in plain words" },
  { icon: PenIcon, title: "Help me write", text: "Write a short poem about a terminal at 3 a.m." },
  { icon: ChartIcon, title: "Compare tools", text: "Compare Ollama and vLLM for local models" },
];

interface Props {
  conv: Conversation;
  patchConv: (id: string, fn: (c: Conversation) => Conversation) => void;
  cfgs: Record<string, ProviderCfg>;
  modelId: string;
  onModel: (id: string) => void;
}

export default function ChatMode({ conv, patchConv, cfgs, modelId, onModel }: Props) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [search, setSearch] = useState(false);
  const [deep, setDeep] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const stopRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [conv.messages]);

  const model = isAutoModel(modelId) ? resolveAutoModel(modelId, cfgs) : modelById.get(modelId) ?? MODELS[0];
  const provider = providerById.get(model.providerId) ?? PROVIDERS[0];

  function autosize() {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    ta.style.height = Math.min(ta.scrollHeight, 180) + "px";
  }

  const setMsg = (msgId: string, fn: (m: ChatMessage) => ChatMessage) =>
    patchConv(conv.id, (c) => ({ ...c, messages: c.messages.map((m) => (m.id === msgId ? fn(m) : m)) }));

  async function send(textRaw?: string, baseMessages?: ChatMessage[]) {
    const text = (textRaw ?? input).trim();
    if (!text || busy) return;
    if (textRaw === undefined) setInput("");
    requestAnimationFrame(autosize);

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
        setMsg(asstId, (m) => ({ ...m, error: true, content: `**Request failed · ${provider.name}**\n\n${hint}` }));
      } else {
        setMsg(asstId, (m) => ({
          ...m,
          content: m.content ? m.content + "\n\n*— stopped —*" : "*Stopped.*",
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
          <div className="flex h-full flex-col items-center justify-center px-6 pb-[8vh]">
            <div className="anim-rise flex flex-col items-center">
              <div className="floaty mb-5">
                <BrandMark className="h-14 w-14 drop-shadow-[0_0_32px_#615ced66]" />
              </div>
              <h1 className="text-[26px] font-extrabold tracking-tight">
                Hello, I'm <span className="text-violet2">AiDe</span>
              </h1>
              <p className="mt-1.5 text-[14px] text-dim">How can I help you today?</p>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-[800px] px-5 pb-6 pt-8">
            {conv.messages.map((m, mi) => (
              <MessageRow
                key={m.id}
                m={m}
                busy={busy}
                isLast={mi === conv.messages.length - 1}
                canRegenerate={mi > lastUserIdx}
                onRegenerate={regenerate}
              />
            ))}
          </div>
        )}
      </div>

      {/* composer */}
      <div className="mx-auto w-full max-w-[800px] px-5 pb-5">
        <div className="rounded-[26px] border border-line2 bg-panel2 p-3 transition-all focus-within:border-violet/50 focus-within:shadow-[0_0_0_1px_#615ced44,0_12px_40px_-12px_#00000099]">
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
            placeholder="Message AiDe…"
            className="block w-full resize-none bg-transparent px-2 pt-1 text-[15px] leading-relaxed outline-none placeholder:text-faint"
          />
          <div className="mt-2 flex items-center gap-1.5">
            <div className="ml-auto flex items-center gap-1.5">
              <button className={`chip-mode ${thinking ? "on" : ""}`} onClick={() => setThinking((v) => !v)}>
                <BrainIcon className="h-3.5 w-3.5" /> Think
              </button>
              <button className={`chip-mode max-sm:hidden ${search ? "on" : ""}`} onClick={() => setSearch((v) => !v)}>
                <GlobeIcon className="h-3.5 w-3.5" /> Search
              </button>
              <button className={`chip-mode max-md:hidden ${deep ? "on" : ""}`} onClick={() => setDeep((v) => !v)}>
                <SearchIcon className="h-3.5 w-3.5" /> Deep Research
              </button>
              {busy ? (
                <button
                  onClick={stop}
                  className="btn-send ml-1 flex h-9 w-9 items-center justify-center rounded-full text-white"
                  title="Stop"
                >
                  <StopIcon className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => send()}
                  disabled={!input.trim()}
                  className="btn-send ml-1 flex h-9 w-9 items-center justify-center rounded-full text-white"
                  title="Send"
                >
                  <SendIcon className="h-4 w-4 -rotate-45" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* suggestions under the composer on empty state */}
        {empty && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((s, i) => (
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

function MessageRow({
  m,
  busy,
  isLast,
  canRegenerate,
  onRegenerate,
}: {
  m: ChatMessage;
  busy: boolean;
  isLast: boolean;
  canRegenerate: boolean;
  onRegenerate: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const streaming = busy && isLast && m.role === "assistant";

  if (m.role === "user") {
    return (
      <div className="anim-rise mb-6 flex justify-end">
        <div className="max-w-[82%] rounded-[22px] rounded-br-[8px] bg-panel3 px-4.5 py-3 text-[14.5px] leading-relaxed whitespace-pre-wrap">
          {m.content}
        </div>
      </div>
    );
  }

  return (
    <div className="anim-rise group mb-7 flex gap-3.5">
      <div className="mt-1 shrink-0">
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
          <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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
              <button onClick={onRegenerate} className="icon-btn h-7 w-7" title="Regenerate">
                <RefreshIcon className="h-3.5 w-3.5" />
              </button>
            )}
            <span className="ml-1 font-mono text-[10.5px] text-faint">
              {modelById.get(m.modelId ?? "")?.name ?? ""} · ~{m.tokens ?? "—"} tok
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
