import { useEffect, useRef, useState } from "react";
import { MODELS, modelById, isAutoModel, resolveAutoModel } from "../data/models";
import { providerById, PROVIDERS } from "../data/providers";
import { streamChat, NoKeyError } from "../lib/llm";
import { Markdown } from "../lib/markdown";
import { uid, DEFAULT_PARAMS, type ChatMessage, type Conversation, type ProviderCfg } from "../lib/store";
import ModelPicker from "./ModelPicker";
import {
  BrandMark, SendIcon, StopIcon, PaperclipIcon, CopyIcon, CheckIcon,
  BrainIcon, GlobeIcon, SearchIcon, CodeIcon, BulbIcon, PenIcon, ChartIcon,
} from "./Icons";

const PERSONA =
  "You are AiDe, a helpful AI assistant inside the AiDe studio. Answer in English, concise and to the point, using markdown formatting and code blocks where appropriate.";

const SUGGESTIONS = [
  { icon: CodeIcon, title: "Write code", text: "Write a useDebounce hook with tests" },
  { icon: BulbIcon, title: "Explain", text: "Explain RAG in plain words" },
  { icon: PenIcon, title: "Write", text: "Write a short poem about a terminal at 3 a.m." },
  { icon: ChartIcon, title: "Compare", text: "Compare Ollama and vLLM for local models" },
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
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
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
      (search ? "\nThe user enabled web search: structure the answer around verifiable, up-to-date facts and list sources." : "") +
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
            ? `Open **Settings** (gear icon, bottom-left) and paste a free ${provider.name} key — get one at ${provider.keyUrl ?? provider.docs}.`
            : e instanceof Error
              ? e.message
              : String(e);
        setMsg(asstId, (m) => ({
          ...m,
          error: true,
          content: `**Request failed · ${provider.name}**\n\n${hint}`,
        }));
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
      {/* message feed */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center px-6 pb-10">
            <div className="anim-rise flex flex-col items-center">
              <div className="floaty mb-6">
                <BrandMark className="h-14 w-14 drop-shadow-[0_0_28px_#31e5ae55]" />
              </div>
              <h1 className="font-display text-[clamp(24px,3vw,32px)] font-bold tracking-tight">
                Hello, I'm <span className="text-brand">AiDe</span>
              </h1>
              <p className="mt-2 text-[14px] text-dim">How can I help you today?</p>
            </div>
            <div className="mt-9 flex max-w-[620px] flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={s.title}
                  onClick={() => send(s.text)}
                  style={{ animationDelay: `${i * 60}ms` }}
                  className="anim-rise row-hl flex items-center gap-2 rounded-full border border-line bg-panel/70 px-3.5 py-2 text-[12.5px] font-semibold text-dim transition-all hover:-translate-y-0.5 hover:border-brand/45 hover:text-text"
                >
                  <s.icon className="h-3.5 w-3.5 text-brand" />
                  {s.title}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-[760px] px-5 py-6">
            {conv.messages.map((m) => (
              <MessageRow key={m.id} m={m} busy={busy} isLast={m.id === conv.messages[conv.messages.length - 1].id} />
            ))}
          </div>
        )}
      </div>

      {/* composer */}
      <div className="mx-auto w-full max-w-[760px] px-5 pb-5">
        <div className="composer-glow rounded-2xl border border-line2 bg-panel2 transition-all">
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
            placeholder={`Message ${model.name}…`}
            className="block w-full resize-none bg-transparent px-4 pt-3.5 text-[14.5px] leading-relaxed outline-none placeholder:text-faint"
          />
          <div className="flex items-center gap-2 px-3 pb-2.5 pt-1">
            <ModelPicker modelId={modelId} onChange={onModel} cfgs={cfgs} />
            <button className="icon-btn" title="Attach a file (coming soon)">
              <PaperclipIcon className="h-4 w-4" />
            </button>

            <div className="ml-auto flex items-center gap-1.5">
              <Toggle on={thinking} set={setThinking} icon={<BrainIcon className="h-3.5 w-3.5" />} label="Think" />
              <Toggle on={search} set={setSearch} icon={<GlobeIcon className="h-3.5 w-3.5" />} label="Web search" />
              <Toggle on={deep} set={setDeep} icon={<SearchIcon className="h-3.5 w-3.5" />} label="Deep Research" />
              {busy ? (
                <button
                  onClick={stop}
                  className="ml-1 flex h-9 w-9 items-center justify-center rounded-xl bg-coral/15 text-coral transition-all hover:bg-coral/25"
                  title="Stop generating"
                >
                  <StopIcon className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => send()}
                  disabled={!input.trim()}
                  className="btn-brand ml-1 flex h-9 w-9 items-center justify-center rounded-xl disabled:opacity-35 disabled:saturate-50"
                  title="Send (Enter)"
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

function Toggle({ on, set, icon, label }: { on: boolean; set: (v: boolean) => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={() => set(!on)}
      className={`hidden items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold transition-all md:flex ${
        on ? "border-brand/55 bg-brand/12 text-brand" : "border-line text-dim hover:border-line2 hover:text-text"
      }`}
      title={label}
    >
      {icon}
      <span className="max-lg:hidden">{label}</span>
    </button>
  );
}

function MessageRow({ m, busy, isLast }: { m: ChatMessage; busy: boolean; isLast: boolean }) {
  const [copied, setCopied] = useState(false);
  const streaming = busy && isLast && m.role === "assistant";

  if (m.role === "user") {
    return (
      <div className="anim-rise mb-6 flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-panel3 px-4 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap">
          {m.content}
        </div>
      </div>
    );
  }

  return (
    <div className="anim-rise group mb-7 flex gap-3">
      <div className="mt-0.5 shrink-0">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg border ${m.error ? "border-coral/40 bg-coral/8" : "border-brand/30 bg-brand/8"}`}>
          <span className={`font-mono text-[11px] font-bold ${m.error ? "text-coral" : "text-brand"}`}>
            {m.error ? "✕" : ">_"}
          </span>
        </span>
      </div>
      <div className="min-w-0 flex-1">
        {m.error ? (
          <div className="rounded-xl border border-coral/35 bg-coral/8 px-4 py-3">
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
          <div className="mt-2.5 flex items-center gap-3 opacity-0 transition-opacity group-hover:opacity-100">
            <span className="font-mono text-[10.5px] text-faint">
              {modelById.get(m.modelId ?? "")?.name ?? "model"} · ~{m.tokens ?? "—"} tokens · free
            </span>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(m.content).catch(() => {});
                setCopied(true);
                setTimeout(() => setCopied(false), 1300);
              }}
              className="flex items-center gap-1 font-mono text-[10.5px] text-dim transition-colors hover:text-brand"
            >
              {copied ? <CheckIcon className="h-3 w-3 text-mint" /> : <CopyIcon className="h-3 w-3" />}
              {copied ? "copied" : "copy"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
