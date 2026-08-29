import { useEffect, useRef, useState } from "react";
import { MODELS, modelById, isAutoModel, resolveAutoModel } from "../data/models";
import { providerById, PROVIDERS } from "../data/providers";
import { streamChat, NoKeyError } from "../lib/llm";
import { Markdown } from "../lib/markdown";
import { uid, DEFAULT_PARAMS, type ChatMessage, type Conversation, type ProviderCfg } from "../lib/store";
import {
  BrandMark, SendIcon, StopIcon, PaperclipIcon, CopyIcon, CheckIcon,
  BrainIcon, GlobeIcon, SearchIcon, CodeIcon, BulbIcon, PenIcon, ChartIcon,
} from "./Icons";

const PERSONA =
  "You are AiDe, a helpful AI assistant inside the AiDe studio. Answer in English, concise and to the point, using markdown formatting and code blocks where appropriate.";

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
}

export default function ChatMode({ conv, patchConv, cfgs, modelId }: Props) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [search, setSearch] = useState(false);
  const [deep, setDeep] = useState(false);
  const [stopReq, setStopReq] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const stopRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [conv.messages]);

  useEffect(() => {
    stopRef.current = stopReq;
  }, [stopReq]);

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

  async function send(textRaw?: string) {
    const text = (textRaw ?? input).trim();
    if (!text || busy) return;
    setInput("");
    requestAnimationFrame(autosize);

    const userMsg: ChatMessage = { id: uid(), role: "user", content: text, ts: Date.now(), modelId: model.id };
    const asstId = uid();
    const asstMsg: ChatMessage = { id: asstId, role: "assistant", content: "", ts: Date.now(), modelId: model.id };

    patchConv(conv.id, (c) => ({
      ...c,
      title: c.messages.length === 0 ? text.slice(0, 44) + (text.length > 44 ? "…" : "") : c.title,
      messages: [...c.messages, userMsg, asstMsg],
    }));
    setBusy(true);
    setStopReq(false);
    stopRef.current = false;

    const cfg = cfgs[model.providerId] ?? { key: "", baseUrl: provider.baseUrl };
    const controller = new AbortController();
    abortRef.current = controller;

    const sys =
      PERSONA +
      (search ? "\nThe user enabled web search: structure the answer around verifiable facts and list sources." : "") +
      (deep ? "\nThe user asked for Deep Research: produce a long structured report with sections, trade-offs and next steps." : "") +
      (thinking ? "\nReason step by step before the final answer." : "");

    try {
      const history = conv.messages
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
          content: m.content ? m.content + "\n\n*— stopped —*" : "*Stopped before any token arrived.*",
        }));
      }
    }

    setBusy(false);
    setStopReq(false);
    stopRef.current = false;
  }

  function stop() {
    setStopReq(true);
    stopRef.current = true;
    abortRef.current?.abort();
  }

  const empty = conv.messages.length === 0;

  return (
    <div className="flex h-full flex-col">
      {/* feed */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center px-6 pb-40">
            <div className="anim-rise flex flex-col items-center">
              <div className="floaty mb-7">
                <BrandMark className="h-16 w-16 drop-shadow-[0_0_32px_#615ced66]" />
              </div>
              <h1 className="font-display text-[clamp(24px,3vw,32px)] font-bold tracking-tight">
                Hello, I'm <span className="text-brand">AiDe</span>
              </h1>
            </div>
            <div className="mt-10 flex max-w-[640px] flex-wrap justify-center gap-2.5">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={s.title}
                  onClick={() => send(s.text)}
                  style={{ animationDelay: `${i * 60}ms` }}
                  className="chip anim-rise"
                >
                  <s.icon className="h-4 w-4 text-brand" />
                  {s.title}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-[720px] px-5 py-7">
            {conv.messages.map((m) => (
              <MessageRow key={m.id} m={m} busy={busy} isLast={m.id === conv.messages[conv.messages.length - 1].id} />
            ))}
          </div>
        )}
      </div>

      {/* composer */}
      <div className="mx-auto w-full max-w-[760px] px-5 pb-6">
        <div className="composer">
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
            className="block w-full resize-none bg-transparent px-5 pt-4 text-[15px] leading-relaxed outline-none placeholder:text-faint"
          />
          <div className="flex items-center gap-2 px-3.5 pb-3 pt-1.5">
            <button className="icon-btn" title="Attach a file">
              <PaperclipIcon className="h-[17px] w-[17px]" />
            </button>
            <div className="ml-auto flex items-center gap-1.5">
              <button className={`mode-chip ${thinking ? "on" : ""}`} onClick={() => setThinking(!thinking)} title="Think">
                <BrainIcon className="h-3.5 w-3.5" /> Think
              </button>
              <button className={`mode-chip ${search ? "on" : ""}`} onClick={() => setSearch(!search)} title="Web search">
                <GlobeIcon className="h-3.5 w-3.5" /> Search
              </button>
              <button className={`mode-chip max-sm:hidden ${deep ? "on" : ""}`} onClick={() => setDeep(!deep)} title="Deep Research">
                <SearchIcon className="h-3.5 w-3.5" /> Deep Research
              </button>
              {busy ? (
                <button
                  onClick={stop}
                  className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-coral/20 text-coral transition-all hover:bg-coral/30"
                  title="Stop generating"
                >
                  <StopIcon className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => send()}
                  disabled={!input.trim()}
                  className="btn-brand ml-1 flex h-9 w-9 items-center justify-center rounded-full disabled:opacity-30 disabled:saturate-50"
                  title="Send"
                >
                  <SendIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageRow({ m, busy, isLast }: { m: ChatMessage; busy: boolean; isLast: boolean }) {
  const [copied, setCopied] = useState(false);
  const streaming = busy && isLast && m.role === "assistant";

  if (m.role === "user") {
    return (
      <div className="anim-rise mb-7 flex justify-end">
        <div className="max-w-[85%] rounded-[22px] rounded-br-lg bg-panel3 px-4.5 py-3 text-[14.5px] leading-relaxed whitespace-pre-wrap">
          {m.content}
        </div>
      </div>
    );
  }

  return (
    <div className="anim-rise group mb-8 flex gap-3.5">
      <div className="mt-1 shrink-0">
        <BrandMark className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        {m.error ? (
          <div className="rounded-2xl border border-coral/35 bg-coral/8 px-4 py-3">
            <Markdown src={m.content || ""} />
          </div>
        ) : (
          <Markdown src={m.content || ""} />
        )}
        {streaming && !m.content && (
          <span className="mt-1 flex items-center gap-1.5 text-brand">
            <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-current" />
            <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-current" />
            <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-current" />
          </span>
        )}
        {streaming && m.content && <span className="caret" />}

        {!streaming && m.content && !m.error && (
          <div className="mt-2.5 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
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
            <span className="font-mono text-[10.5px] text-faint">~{m.tokens ?? "—"} tokens</span>
          </div>
        )}
      </div>
    </div>
  );
}
