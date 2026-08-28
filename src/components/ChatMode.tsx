import { useEffect, useRef, useState } from "react";
import { MODELS, modelById, isAutoModel, resolveAutoModel, AUTO_LABEL } from "../data/models";
import { providerById, PROVIDERS } from "../data/providers";
import { streamChat } from "../lib/llm";
import { demoReply } from "../lib/engine";
import { Markdown } from "../lib/markdown";
import { uid, DEFAULT_PARAMS, type ChatMessage, type Conversation, type ProviderCfg } from "../lib/store";
import ModelPicker from "./ModelPicker";
import {
  Wordmark, SendIcon, StopIcon, PaperclipIcon, CopyIcon, CheckIcon,
  BrainIcon, GlobeIcon, SearchIcon, CodeIcon, BulbIcon, PenIcon, ChartIcon,
} from "./Icons";

const PERSONA =
  "You are AiDe, a helpful AI assistant inside the AiDe studio. Answer in English, concise and to the point, using markdown formatting and code blocks where appropriate.";

const SUGGESTIONS = [
  { icon: CodeIcon, title: "Write code", text: "Write a useDebounce hook with tests" },
  { icon: BulbIcon, title: "Explain a concept", text: "Explain RAG in plain words" },
  { icon: PenIcon, title: "Help with writing", text: "Write a short poem about a terminal at 3 a.m." },
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

  const auto = isAutoModel(modelId);
  const model = auto ? resolveAutoModel(modelId, cfgs) : modelById.get(modelId) ?? MODELS[0];
  const provider = providerById.get(model.providerId) ?? PROVIDERS[0];
  const live = !!cfgs[model.providerId]?.key?.trim();

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

    const userMsg: ChatMessage = { id: uid(), role: "user", content: text, ts: Date.now(), modelId };
    const asstId = uid();
    const asstMsg: ChatMessage = { id: asstId, role: "assistant", content: "", ts: Date.now(), modelId };

    patchConv(conv.id, (c) => ({
      ...c,
      title: c.messages.length === 0 ? text.slice(0, 44) + (text.length > 44 ? "…" : "") : c.title,
      messages: [...c.messages, userMsg, asstMsg],
    }));
    setBusy(true);
    setStopReq(false);
    stopRef.current = false;

    const cfg = cfgs[model.providerId];
    let full = "";
    let isDemo = !live;

    if (live) {
      try {
        const controller = new AbortController();
        abortRef.current = controller;
        const history = conv.messages
          .filter((m) => m.role !== "assistant" || m.content)
          .map((m) => ({ role: m.role, content: m.content }));
        for await (const delta of streamChat({
          model,
          provider,
          cfg: cfg!,
          messages: [{ role: "system", content: PERSONA }, ...history, { role: "user", content: text }],
          params: DEFAULT_PARAMS,
          signal: controller.signal,
        })) {
          if (stopRef.current) break;
          full += delta;
          setMsg(asstId, (m) => ({ ...m, content: full }));
        }
      } catch (e) {
        const aborted = e instanceof DOMException && e.name === "AbortError";
        if (!aborted && !full) {
          const note = e instanceof Error ? e.message : String(e);
          full = `*Couldn't reach ${provider.name} (${note.slice(0, 120)}). Switching to demo mode.*\n\n`;
          setMsg(asstId, (m) => ({ ...m, content: full }));
          isDemo = true;
        }
      }
    }

    if (isDemo && !stopRef.current) {
      const out = demoReply(text, model.name, provider.name, { thinking, search, deep });
      if (out.thinking) {
        const thinkText = out.thinking;
        setMsg(asstId, (m) => ({ ...m, demo: true, thinking: thinkText } as ChatMessage));
      }
      const target = full + out.text;
      let i = full.length;
      await new Promise<void>((resolve) => {
        const step = () => {
          if (stopRef.current) {
            resolve();
            return;
          }
          i = Math.min(target.length, i + 6 + Math.floor(Math.random() * 8));
          const slice = target.slice(0, i);
          setMsg(asstId, (m) => ({ ...m, demo: true, content: slice }));
          if (i >= target.length) resolve();
          else setTimeout(step, 16);
        };
        step();
      });
      full = target.slice(0, i);
    }

    setMsg(asstId, (m) => ({
      ...m,
      demo: isDemo || undefined,
      content: m.content || full,
      tokens: Math.max(1, Math.round((m.content || full).length / 3.2)),
    }));
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
          <div className="flex h-full flex-col justify-center overflow-y-auto">
            <div className="mx-auto w-full max-w-[760px] px-6 py-12">
              <p className="overline flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${live ? "pulse-live bg-mint" : "bg-gold"}`} />
                session · {auto ? `${AUTO_LABEL[modelId]} → ` : ""}
                {provider.name} · {model.name} · {live ? "live" : "demo"}
              </p>
              <div className="mt-5">
                <Wordmark className="text-[clamp(34px,4.6vw,58px)] leading-none" />
              </div>
              <p className="mt-4 max-w-[540px] text-[15px] leading-relaxed text-dim">
                Ask anything — code, concepts, writing. Or flip to <b className="text-gold">Coder</b> and
                ship a whole app from a single sentence.
              </p>

              <div className="my-7 h-px bg-gradient-to-r from-brand/50 via-line2 to-transparent" />

              <p className="overline mb-3">start with one of these</p>
              <div className="grid grid-cols-2 gap-2.5 max-sm:grid-cols-1">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={s.title}
                    onClick={() => send(s.text)}
                    style={{ animationDelay: `${i * 70}ms` }}
                    className="anim-rise group rounded-xl border border-line bg-panel/70 px-4 py-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-brand/45 hover:bg-panel2"
                  >
                    <span className="flex items-center justify-between">
                      <span className="font-mono text-[10px] tracking-wider text-faint transition-colors group-hover:text-brand">
                        0{i + 1}
                      </span>
                      <s.icon className="h-4 w-4 text-brand transition-transform group-hover:scale-110" />
                    </span>
                    <span className="mt-2 block text-[13.5px] font-bold">{s.title}</span>
                    <span className="block truncate text-[12px] text-faint">{s.text}</span>
                  </button>
                ))}
              </div>

              <p className="mt-7 font-mono text-[10.5px] text-faint">
                enter to send · shift+enter for a new line · answers stream token by token
              </p>
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
  const [showThink, setShowThink] = useState(false);
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

  const think = (m as ChatMessage & { thinking?: string }).thinking;

  return (
    <div className="anim-rise group mb-7 flex gap-3">
      <div className="mt-0.5 shrink-0">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-brand/30 bg-brand/8">
          <span className="font-mono text-[11px] font-bold text-brand">&gt;_</span>
        </span>
      </div>
      <div className="min-w-0 flex-1">
        {think && (
          <button
            onClick={() => setShowThink((v) => !v)}
            className="mb-2 flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-1.5 font-mono text-[11px] text-brand transition-colors hover:border-brand/40"
          >
            <BrainIcon className="h-3.5 w-3.5" />
            {showThink ? "hide reasoning" : "model reasoning"}
            <span className={`transition-transform ${showThink ? "rotate-180" : ""}`}>▾</span>
          </button>
        )}
        {think && showThink && (
          <pre className="mb-3 overflow-x-auto whitespace-pre-wrap rounded-xl border border-line bg-panel px-4 py-3 font-mono text-[11.5px] leading-relaxed text-dim">
            {think}
          </pre>
        )}
        <Markdown src={m.content || ""} />
        {streaming && !m.content && (
          <span className="mt-1 flex items-center gap-1.5 text-brand">
            <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-current" />
            <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-current" />
            <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-current" />
          </span>
        )}
        {streaming && m.content && <span className="caret" />}

        {!streaming && m.content && (
          <div className="mt-2.5 flex items-center gap-3 opacity-0 transition-opacity group-hover:opacity-100">
            {m.demo && (
              <span className="rounded border border-gold/40 bg-gold/10 px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-wider text-gold">
                demo
              </span>
            )}
            <span className="font-mono text-[10.5px] text-faint">
              {modelById.get(m.modelId ?? "")?.name ?? "model"} · ~{m.tokens ?? "—"} tokens
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
