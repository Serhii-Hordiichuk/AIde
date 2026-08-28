import { demoReply } from "./demo";
import type { ModelInfo } from "../data/models";
import type { ProviderInfo } from "../data/providers";
import type { GenParams, ProviderCfg } from "./store";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface StreamOpts {
  model: ModelInfo;
  provider: ProviderInfo;
  cfg: ProviderCfg;
  messages: ChatTurn[];
  params: GenParams;
  signal: AbortSignal;
  onMeta?: (meta: { mode: "live" | "demo" }) => void;
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((res, rej) => {
    if (signal.aborted) return rej(new DOMException("aborted", "AbortError"));
    const id = setTimeout(res, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(id);
        rej(new DOMException("aborted", "AbortError"));
      },
      { once: true }
    );
  });
}

async function* sseData(res: Response): AsyncGenerator<string> {
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      const l = line.trim();
      if (!l.startsWith("data:")) continue;
      const data = l.slice(5).trim();
      if (data === "[DONE]") return;
      yield data;
    }
  }
}

const trimBase = (b: string) => b.replace(/\/+$/, "");

async function* streamOpenAICompat(o: StreamOpts, base: string, key: string): AsyncGenerator<string> {
  const msgs = [
    ...(o.params.system ? [{ role: "system" as const, content: o.params.system }] : []),
    ...o.messages,
  ];
  const res = await fetch(`${trimBase(base)}/chat/completions`, {
    method: "POST",
    signal: o.signal,
    headers: {
      "Content-Type": "application/json",
      ...(key ? { Authorization: `Bearer ${key}` } : {}),
    },
    body: JSON.stringify({
      model: o.model.apiId,
      messages: msgs,
      stream: true,
      temperature: o.params.temperature,
      top_p: o.params.topP,
      max_tokens: o.params.maxTokens,
    }),
  });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
  for await (const data of sseData(res)) {
    try {
      const j = JSON.parse(data);
      const delta: string =
        j.choices?.[0]?.delta?.content ?? j.choices?.[0]?.text ?? "";
      if (delta) yield delta;
    } catch {
      /* partial json — skip */
    }
  }
}

async function* streamAnthropic(o: StreamOpts, key: string): AsyncGenerator<string> {
  const res = await fetch(`${trimBase(o.provider.baseUrl)}/messages`, {
    method: "POST",
    signal: o.signal,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: o.model.apiId,
      max_tokens: Math.min(o.params.maxTokens, 8192),
      system: o.params.system || undefined,
      messages: o.messages,
      stream: true,
      temperature: o.params.temperature,
      top_p: o.params.topP,
    }),
  });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
  for await (const data of sseData(res)) {
    try {
      const j = JSON.parse(data);
      if (j.type === "content_block_delta" && j.delta?.text) yield j.delta.text;
    } catch {
      /* skip */
    }
  }
}

async function* streamGoogle(o: StreamOpts, key: string): AsyncGenerator<string> {
  const contents = o.messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const res = await fetch(
    `${trimBase(o.provider.baseUrl)}/models/${o.model.apiId}:streamGenerateContent?alt=sse&key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      signal: o.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: o.params.system ? { parts: [{ text: o.params.system }] } : undefined,
        generationConfig: {
          temperature: o.params.temperature,
          topP: o.params.topP,
          maxOutputTokens: o.params.maxTokens,
        },
      }),
    }
  );
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
  for await (const data of sseData(res)) {
    try {
      const j = JSON.parse(data);
      const parts: { text?: string }[] = j.candidates?.[0]?.content?.parts ?? [];
      const text = parts.map((p) => p.text ?? "").join("");
      if (text) yield text;
    } catch {
      /* skip */
    }
  }
}

async function* streamDemo(o: StreamOpts): AsyncGenerator<string> {
  const lastUser = [...o.messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const text = demoReply(lastUser, o.model, o.provider.name);
  const words = text.split(/(?<=\s)/); // зберігаємо пробіли
  for (const w of words) {
    if (o.signal.aborted) throw new DOMException("aborted", "AbortError");
    yield w;
    const pause = /[.!?:)\]]\s?$/.test(w) ? 90 : 0;
    await sleep(14 + Math.random() * 34 + pause, o.signal);
  }
}

/**
 * Головний потік чату: намагається реальний виклик у провайдера
 * (ключ є і провайдер хмарний, або локальний рантайм), інакше — чесний демо-режим.
 */
export async function* streamChat(o: StreamOpts): AsyncGenerator<string> {
  const key = o.cfg.key?.trim() ?? "";
  const base = (o.cfg.baseUrl || o.provider.baseUrl || "").trim();
  const isLocal = !!o.provider.local;

  if (isLocal || key) {
    try {
      const gen =
        o.provider.id === "anthropic" && key
          ? streamAnthropic(o, key)
          : o.provider.id === "google" && key
            ? streamGoogle(o, key)
            : streamOpenAICompat(o, base, key);
      let got = false;
      for await (const chunk of gen) {
        if (!got) {
          got = true;
          o.onMeta?.({ mode: "live" });
        }
        yield chunk;
      }
      if (got) return;
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") throw e;
      // мережева помилка (CORS, локальний сервер вимкнено, невірний ключ) → демо
    }
  }

  o.onMeta?.({ mode: "demo" });
  yield* streamDemo(o);
}

export type ConnState = "idle" | "checking" | "ok" | "fail";

export async function testConnection(provider: ProviderInfo, cfg: ProviderCfg): Promise<"ok" | "fail"> {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 7000);
  try {
    const base = trimBase((cfg.baseUrl || provider.baseUrl || "").trim());
    let url = "";
    const headers: Record<string, string> = {};
    if (provider.local) {
      url = `${base}/models`;
    } else if (provider.id === "anthropic") {
      url = `${base}/models`;
      headers["x-api-key"] = cfg.key;
      headers["anthropic-version"] = "2023-06-01";
      headers["anthropic-dangerous-direct-browser-access"] = "true";
    } else if (provider.id === "google") {
      url = `${base}/models?key=${encodeURIComponent(cfg.key)}`;
    } else {
      url = `${base}/models`;
      headers["Authorization"] = `Bearer ${cfg.key}`;
    }
    const res = await fetch(url, { headers, signal: ctrl.signal });
    return res.ok ? "ok" : "fail";
  } catch {
    return "fail";
  } finally {
    clearTimeout(to);
  }
}
