import { useEffect, useMemo, useRef, useState } from "react";
import { modelById, MODELS, fmtCtx, type ModelInfo } from "../data/models";
import { providerById } from "../data/providers";
import { estTokens, fmtTime, uid, type Conversation, type GenParams, type ProviderCfg } from "../lib/store";
import { streamChat, type ChatTurn } from "../lib/llm";
import { Markdown } from "../lib/markdown";
import ModelPicker from "./ModelPicker";
import ParamsPanel from "./ParamsPanel";
import {
  PlusIcon, TrashIcon, SendIcon, StopIcon, CopyIcon, CheckIcon,
  RefreshIcon, ChatIcon, GearIcon, BoltIcon,
} from "./Icons";

interface Props {
  convs: Conversation[];
  active: Conversation | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  patchConv: (id: string, fn: (c: Conversation) => Conversation) => void;
  modelId: string;
  onModel: (id: string) => void;
  params: GenParams;
  onParams: (p: GenParams) => void;
  cfgs: Record<string, ProviderCfg>;
}

const SUGGESTIONS = [
  "Напиши React-хук useDebounce з тестами",
  "Порівняй Ollama і vLLM для продакшну",
  "Поясни, як працює RAG, простими словами",
  "Склади SQL-запит для когортного утримання",
];

export default function ChatView({
  convs, active, onSelect, onNew, onDelete, patchConv,
  modelId, onModel, params, onParams, cfgs,
}: Props) {
  const model: ModelInfo = modelById.get(modelId) ?? MODELS[0];
  const provider = providerById.get(model.providerId)!;
  const hasKey = !!cfgs[model.providerId]?.key?.trim();

  const [input, setInput] = useState("");
  const [showParams, setShowParams] = useState(true);
  const [stream, setStream] = useState<{ convId: string; mode: "live" | "demo" | null } | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const streamingHere = !!stream && stream.convId === active?.id;

  /* автопрокрутка донизу */
  const lastLen = active?.messages.length ? active.messages[active.messages.length - 1].content.length : 0;
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lastLen, active?.id, streamingHere]);

  useEffect(() => () => abortRef.current?.abort(), []);

  /* ---- генерація ---- */
  async function runGeneration(convId: string, turns: ChatTurn[], assistantId: string) {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setStream({ convId, mode: null });
    let acc = "";
    try {
      const gen = streamChat({
        model, provider,
        cfg: cfgs[model.providerId] ?? { key: "", baseUrl: provider.baseUrl },
        messages: turns,
        params,
        signal: ctrl.signal,
        onMeta: ({ mode }) => {
          setStream({ convId, mode });
          patchConv(convId, (c) => ({
            ...c,
            messages: c.messages.map((m) => (m.id === assistantId ? { ...m, demo: mode === "demo" } : m)),
          }));
        },
      });
      for await (const chunk of gen) {
        acc += chunk;
        patchConv(convId, (c) => ({
          ...c, updatedAt: Date.now(),
          messages: c.messages.map((m) => (m.id === assistantId ? { ...m, content: acc } : m)),
        }));
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        patchConv(convId, (c) => ({
          ...c,
          messages: c.messages.map((m) => (m.id === assistantId ? { ...m, stopped: true } : m)),
        }));
      }
    }
    setStream(null);
  }

  function send(text: string) {
    const t = text.trim();
    if (!t || !active || streamingHere) return;
    const userMsg = { id: uid(), role: "user" as const, content: t, ts: Date.now() };
    const assistantMsg = { id: uid(), role: "assistant" as const, content: "", modelId, ts: Date.now() };
    const turns: ChatTurn[] = [...active.messages.map((m) => ({ role: m.role, content: m.content })), { role: "user", content: t }];
    const firstUser = !active.messages.some((m) => m.role === "user");
    patchConv(active.id, (c) => ({
      ...c,
      title: firstUser && c.title === "Нова розмова" ? t.slice(0, 48) : c.title,
      modelId,
      updatedAt: Date.now(),
      messages: [...c.messages, userMsg, assistantMsg],
    }));
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";
    void runGeneration(active.id, turns, assistantMsg.id);
  }

  function regenerate() {
    if (!active || streamingHere) return;
    const msgs = [...active.messages];
    if (msgs[msgs.length - 1]?.role === "assistant") msgs.pop();
    const lastUserIdx = msgs.map((m) => m.role).lastIndexOf("user");
    if (lastUserIdx === -1) return;
    const kept = msgs.slice(0, lastUserIdx + 1);
    const turns: ChatTurn[] = kept.map((m) => ({ role: m.role, content: m.content }));
    const assistantMsg = { id: uid(), role: "assistant" as const, content: "", modelId, ts: Date.now() };
    patchConv(active.id, (c) => ({
      ...c, updatedAt: Date.now(),
      messages: [...kept, assistantMsg],
    }));
    void runGeneration(active.id, turns, assistantMsg.id);
  }

  function stop() {
    abortRef.current?.abort();
  }

  /* ---- статистика розмови ---- */
  const stats = useMemo(() => {
    if (!active) return { inT: 0, outT: 0, cost: 0 };
    let inT = 0, outT = 0;
    for (const m of active.messages) (m.role === "user" ? (inT += estTokens(m.content)) : (outT += estTokens(m.content)));
    const cost =
      model.priceIn === null || model.priceOut === null
        ? 0
        : (inT / 1_000_000) * model.priceIn + (outT / 1_000_000) * model.priceOut;
    return { inT, outT, cost };
  }, [active, model]);

  const ctxPct = Math.min(100, Math.round(((stats.inT + stats.outT) / (model.ctx * 1000)) * 100));

  const modeBadge = streamingHere ? (
    stream.mode === "demo" ? (
      <span className="flex items-center gap-1.5 rounded-md border border-ember/40 bg-ember/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-ember">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ember" /> демо-режим
      </span>
    ) : stream.mode === "live" ? (
      <span className="flex items-center gap-1.5 rounded-md border border-mint/40 bg-mint/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-mint">
        <span className="pulse-live h-1.5 w-1.5 rounded-full bg-mint" /> live
      </span>
    ) : (
      <span className="flex items-center gap-1.5 rounded-md border border-line px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-dim">
        <span className="h-1.5 w-1.5 animate-ping rounded-full bg-dim" /> з'єднання…
      </span>
    )
  ) : provider.local ? (
    <span className="rounded-md border border-tealic/35 bg-tealic/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-tealic">локально · $0</span>
  ) : hasKey ? (
    <span className="rounded-md border border-mint/35 bg-mint/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-mint">ключ ✓</span>
  ) : (
    <span className="rounded-md border border-line bg-ink-800 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-faint" title="Додай ключ провайдера на сторінці «Провайдери»">без ключа · демо</span>
  );

  return (
    <div className="relative z-10 flex h-full min-h-0">
      {/* ---- бічна панель розмов ---- */}
      <div className="flex w-[248px] shrink-0 flex-col border-r border-line bg-ink-900/50 max-md:hidden">
        <div className="p-3">
          <button
            onClick={onNew}
            className="group flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line2 bg-ink-850 py-2.5 text-[13px] font-medium text-dim transition-all hover:border-ember/60 hover:bg-ink-800 hover:text-ember"
          >
            <PlusIcon className="h-4 w-4 transition-transform group-hover:rotate-90" />
            Нова розмова
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          <p className="px-2 pb-1.5 pt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">Історія · {convs.length}</p>
          <div className="space-y-1">
            {convs.map((c) => {
              const cm = modelById.get(c.modelId);
              const isActive = c.id === active?.id;
              return (
                <div key={c.id} className={`group relative rounded-lg transition-colors ${isActive ? "bg-ink-700/80" : "hover:bg-ink-800"}`}>
                  <button onClick={() => onSelect(c.id)} className="w-full px-3 py-2.5 text-left">
                    <span className={`block truncate text-[12.5px] font-medium ${isActive ? "text-fog" : "text-dim"}`}>{c.title}</span>
                    <span className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] text-faint">
                      <span className="truncate" style={{ color: cm ? providerById.get(cm.providerId)?.accent : undefined }}>
                        {cm?.name ?? "—"}
                      </span>
                      <span>· {fmtTime(c.updatedAt)}</span>
                    </span>
                  </button>
                  {confirmDel === c.id ? (
                    <span className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
                      <button onClick={() => { onDelete(c.id); setConfirmDel(null); }} className="rounded bg-coral/20 px-1.5 py-0.5 font-mono text-[10px] text-coral hover:bg-coral/30">так</button>
                      <button onClick={() => setConfirmDel(null)} className="rounded bg-ink-700 px-1.5 py-0.5 font-mono text-[10px] text-dim hover:bg-ink-600">ні</button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmDel(c.id)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-faint opacity-0 transition-all hover:bg-coral/15 hover:text-coral group-hover:opacity-100"
                      title="Видалити розмову"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="border-t border-line px-4 py-3">
          <p className="font-mono text-[10px] leading-relaxed text-faint">
            Розмови зберігаються локально у твоєму браузері (localStorage).
          </p>
        </div>
      </div>

      {/* ---- чат ---- */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* шапка */}
        <div className="flex items-center gap-3 border-b border-line bg-ink-900/40 px-4 py-2.5 backdrop-blur">
          <ModelPicker modelId={modelId} onChange={onModel} cfgs={cfgs} />
          {modeBadge}
          <div className="ml-auto flex items-center gap-3 max-lg:hidden">
            <span className="font-mono text-[11px] text-faint">
              ctx <span className="text-dim">{fmtCtx(model.ctx)}</span>
            </span>
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-ink-700" title={`Використано ${ctxPct}% контексту`}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${ctxPct}%`, background: ctxPct > 80 ? "#ff6b6b" : ctxPct > 50 ? "#ffb454" : "#3ecf8e" }}
              />
            </div>
            <button
              onClick={() => setShowParams((v) => !v)}
              className={`rounded-lg border p-2 transition-all ${showParams ? "border-ember/40 bg-ember/10 text-ember" : "border-line text-faint hover:border-line2 hover:text-dim"}`}
              title="Параметри генерації"
            >
              <GearIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* повідомлення */}
        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto">
          {!active || active.messages.length === 0 ? (
            <EmptyState onPick={send} providerName={provider.name} />
          ) : (
            <div className="mx-auto max-w-3xl px-4 py-6">
              {active.messages.map((m, idx) => {
                const isLastAssistant = m.role === "assistant" && idx === active.messages.length - 1;
                const isStreamingThis = streamingHere && isLastAssistant;
                if (m.role === "user") {
                  return (
                    <div key={m.id} className="anim-fade-up mb-6 flex justify-end">
                      <div className="max-w-[85%] rounded-xl rounded-br-sm border border-ember/25 bg-ink-800 px-4 py-3">
                        <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-fog">{m.content}</p>
                        <p className="mt-1.5 text-right font-mono text-[10px] text-faint">{fmtTime(m.ts)} · {estTokens(m.content)} tok</p>
                      </div>
                    </div>
                  );
                }
                const mm = m.modelId ? modelById.get(m.modelId) : undefined;
                const pp = mm ? providerById.get(mm.providerId)! : provider;
                const waiting = isStreamingThis && m.content === "";
                return (
                  <div key={m.id} className="anim-fade-up group mb-7 flex gap-3">
                    <div
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
                      style={{ borderColor: `${pp.accent}44`, background: `${pp.accent}14`, color: pp.accent }}
                      title={`${mm?.name ?? ""} · ${pp.name}`}
                    >
                      <BoltIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="text-[12.5px] font-semibold" style={{ color: pp.accent }}>{mm?.name ?? "Модель"}</span>
                        <span className="font-mono text-[10.5px] text-faint">{pp.name} · {fmtTime(m.ts)}</span>
                        {m.demo && (
                          <span className="rounded border border-ember/35 px-1.5 py-px font-mono text-[9.5px] uppercase tracking-wider text-ember">демо</span>
                        )}
                        {m.stopped && (
                          <span className="rounded border border-coral/35 px-1.5 py-px font-mono text-[9.5px] uppercase tracking-wider text-coral">зупинено</span>
                        )}
                      </div>
                      {waiting ? (
                        <div className="flex items-center gap-1.5 py-2">
                          {[0, 1, 2].map((i) => (
                            <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-dim" style={{ animationDelay: `${i * 0.15}s` }} />
                          ))}
                          <span className="ml-2 font-mono text-[11px] text-faint">
                            {provider.local ? `запит до ${cfgs[provider.id]?.baseUrl || provider.baseUrl}…` : `запит до ${pp.name}…`}
                          </span>
                        </div>
                      ) : (
                        <div className={isStreamingThis ? "caret" : ""}>
                          <Markdown src={m.content} />
                        </div>
                      )}
                      {!waiting && !isStreamingThis && (
                        <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() => { navigator.clipboard?.writeText(m.content).catch(() => {}); setCopiedId(m.id); setTimeout(() => setCopiedId(null), 1300); }}
                            className="flex items-center gap-1 rounded-md border border-line bg-ink-850 px-2 py-1 font-mono text-[10.5px] text-dim transition-colors hover:border-line2 hover:text-fog"
                          >
                            {copiedId === m.id ? <CheckIcon className="h-3 w-3 text-mint" /> : <CopyIcon className="h-3 w-3" />}
                            {copiedId === m.id ? "готово" : "копіювати"}
                          </button>
                          {isLastAssistant && (
                            <button
                              onClick={regenerate}
                              className="flex items-center gap-1 rounded-md border border-line bg-ink-850 px-2 py-1 font-mono text-[10.5px] text-dim transition-colors hover:border-line2 hover:text-fog"
                            >
                              <RefreshIcon className="h-3 w-3" /> перегенерувати
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* композер */}
        <div className="border-t border-line bg-ink-900/60 px-4 py-3 backdrop-blur">
          <div className="mx-auto max-w-3xl">
            <div className={`flex items-end gap-2 rounded-xl border bg-ink-850 p-2 transition-all focus-within:shadow-[0_0_0_3px_rgba(255,180,84,0.08)] ${streamingHere ? "border-line2" : "border-line focus-within:border-ember/50"}`}>
              <textarea
                ref={taRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                rows={1}
                placeholder={`Повідомлення для ${model.name}… (Enter — надіслати)`}
                className="max-h-[180px] flex-1 resize-none bg-transparent px-2 py-1.5 text-[14px] text-fog outline-none placeholder:text-faint"
              />
              {streamingHere ? (
                <button
                  onClick={stop}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-coral/15 text-coral transition-all hover:bg-coral/25"
                  title="Зупинити генерацію"
                >
                  <StopIcon className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => send(input)}
                  disabled={!input.trim()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ember text-ink-950 transition-all enabled:hover:shadow-[0_0_18px_rgba(255,180,84,0.4)] enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35"
                  title="Надіслати"
                >
                  <SendIcon className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10.5px] text-faint">
              <span>↑ {stats.inT.toLocaleString("uk-UA")} tok</span>
              <span>↓ {stats.outT.toLocaleString("uk-UA")} tok</span>
              <span className={stats.cost > 0 ? "text-ember" : "text-tealic"}>
                {model.priceIn === null ? "вартість: $0 (локально)" : `≈ $${stats.cost.toFixed(4)}`}
              </span>
              <span className="ml-auto max-sm:hidden">Shift+Enter — новий рядок</span>
            </div>
          </div>
        </div>
      </div>

      {/* ---- параметри ---- */}
      <div className={showParams ? "max-lg:hidden" : "hidden"}>
        <ParamsPanel params={params} onChange={onParams} />
      </div>
    </div>
  );
}

/* ---------- порожній стан ---------- */
function EmptyState({ onPick, providerName }: { onPick: (s: string) => void; providerName: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-10">
      <div className="anim-fade-up mb-5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
        <span className="h-px w-10 bg-line2" /> мультипровайдерний плейграунд <span className="h-px w-10 bg-line2" />
      </div>
      <h1 className="anim-fade-up font-display text-center text-[clamp(26px,4vw,44px)] font-bold leading-tight text-fog" style={{ animationDelay: "0.06s" }}>
        Одна студія.<br />
        <span className="text-ember">Усі моделі світу.</span>
      </h1>
      <p className="anim-fade-up mt-4 max-w-md text-center text-[14px] leading-relaxed text-dim" style={{ animationDelay: "0.12s" }}>
        Зараз активна <span className="text-fog">{providerName}</span>. Перемикайся між хмарними агрегаторами
        та локальними рантаймами без виходу з чату.
      </p>

      {/* тікер моделей */}
      <div className="anim-fade-up mt-7 w-full max-w-2xl overflow-hidden rounded-lg border border-line bg-ink-900/70 py-2" style={{ animationDelay: "0.18s" }}>
        <div className="marquee-track flex w-max items-center gap-6 whitespace-nowrap px-4 font-mono text-[11px] text-dim">
          {[...MODELS, ...MODELS].map((m, i) => {
            const p = providerById.get(m.providerId)!;
            return (
              <span key={`${m.id}-${i}`} className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.accent }} />
                {m.name}
              </span>
            );
          })}
        </div>
      </div>

      <div className="anim-fade-up mt-7 grid w-full max-w-2xl grid-cols-2 gap-2.5 max-sm:grid-cols-1" style={{ animationDelay: "0.24s" }}>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="group flex items-center gap-2.5 rounded-lg border border-line bg-ink-850/80 px-3.5 py-3 text-left text-[13px] text-dim transition-all hover:-translate-y-0.5 hover:border-ember/50 hover:bg-ink-800 hover:text-fog"
          >
            <ChatIcon className="h-4 w-4 shrink-0 text-faint transition-colors group-hover:text-ember" />
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
