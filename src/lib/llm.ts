import type { ModelInfo } from "../data/models";
import type { ProviderInfo } from "../data/providers";
import type { ProviderCfg } from "./store";
import type { GenParams } from "./store";

export class NoKeyError extends Error {
  constructor(provider: string) {
    super(`${provider} requires a free API key`);
  }
}

export interface ChatReq {
  model: ModelInfo;
  provider: ProviderInfo;
  cfg: ProviderCfg;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  params: GenParams;
  signal?: AbortSignal;
}

const base = (cfg: ProviderCfg, p: ProviderInfo) => (cfg.baseUrl?.trim() || p.baseUrl).replace(/\/+$/, "");

function headers(p: ProviderInfo, cfg: ProviderCfg, json = true): Record<string, string> {
  const h: Record<string, string> = {};
  if (json) h["Content-Type"] = "application/json";
  const key = cfg.key?.trim();
  if (key) {
    h["Authorization"] = `Bearer ${key}`;
    if (p.id === "anthropic") {
      h["x-api-key"] = key;
      h["anthropic-version"] = "2023-06-01";
    }
    if (p.id === "huggingface") h["x-api-key"] = key;
  }
  return h;
}

/* Anthropic Messages API (SSE) */
async function* anthropicStream(req: ChatReq): AsyncGenerator<string> {
  const { provider: p, cfg, messages, params } = req;
  const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n");
  const rest = messages.filter((m) => m.role !== "system");
  const res = await fetch(`${base(cfg, p)}/messages`, {
    method: "POST",
    headers: headers(p, cfg),
    body: JSON.stringify({
      model: req.model.apiId,
      max_tokens: params.maxTokens,
      temperature: params.temperature,
      top_p: params.topP,
      ...(system ? { system } : {}),
      stream: true,
      messages: rest.map((m) => ({ role: m.role, content: m.content })),
    }),
    signal: req.signal,
  });
  if (!res.ok || !res.body) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j?.error?.message ?? msg;
    } catch { /* keep */ }
    throw new Error(`${p.name} responded ${msg}`);
  }
  yield* sseDeltaStream(res.body, (data) => {
    const j = JSON.parse(data);
    if (j.type === "content_block_delta" && j.delta?.type === "text_delta") return j.delta.text ?? "";
    return "";
  });
}

/* Google streamGenerateContent (SSE) */
async function* googleStream(req: ChatReq): AsyncGenerator<string> {
  const { provider: p, cfg, messages, params } = req;
  const key = cfg.key?.trim();
  if (!key) throw new NoKeyError(p.name);
  const sys = messages.find((m) => m.role === "system");
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  const url = `${base(cfg, p)}/models/${req.model.apiId}:streamGenerateContent?alt=sse&key=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: headers(p, cfg),
    body: JSON.stringify({
      contents,
      ...(sys ? { systemInstruction: { parts: [{ text: sys.content }] } } : {}),
      generationConfig: {
        temperature: params.temperature,
        topP: params.topP,
        maxOutputTokens: params.maxTokens,
      },
    }),
    signal: req.signal,
  });
  if (!res.ok || !res.body) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j?.error?.message ?? msg;
    } catch { /* keep */ }
    throw new Error(`${p.name} responded ${msg}`);
  }
  yield* sseDeltaStream(res.body, (data) => {
    const j = JSON.parse(data);
    return j?.candidates?.[0]?.content?.parts?.map((pt: { text?: string }) => pt.text ?? "").join("") ?? "";
  });
}

/* Pollinations — keyless, OpenAI-compatible */
async function* pollinationsStream(req: ChatReq): AsyncGenerator<string> {
  const { provider: p, cfg, messages, params } = req;
  const res = await fetch(`${base(cfg, p)}/openai`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: req.model.apiId || "openai",
      messages,
      temperature: params.temperature,
      top_p: params.topP,
      max_tokens: params.maxTokens,
      stream: true,
    }),
    signal: req.signal,
  });
  if (!res.ok || !res.body) {
    if (res.status === 404) throw new Error(`${p.name}: endpoint unavailable (404)`);
    throw new Error(`${p.name} responded HTTP ${res.status}`);
  }
  yield* sseDeltaStream(res.body, (data) => {
    const j = JSON.parse(data);
    return j?.choices?.[0]?.delta?.content ?? "";
  });
}

/* OpenAI-compatible: OpenRouter, Groq, Cerebras, SambaNova, HF, local runtimes… */
async function* openaiCompatStream(req: ChatReq): AsyncGenerator<string> {
  const { provider: p, cfg, messages, params } = req;
  if (!p.keyless && !cfg.key?.trim()) throw new NoKeyError(p.name);
  const res = await fetch(`${base(cfg, p)}/chat/completions`, {
    method: "POST",
    headers: headers(p, cfg),
    body: JSON.stringify({
      model: req.model.apiId,
      messages,
      temperature: params.temperature,
      top_p: params.topP,
      max_tokens: params.maxTokens,
      stream: true,
    }),
    signal: req.signal,
  });
  if (!res.ok || !res.body) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j?.error?.message ?? msg;
    } catch { /* keep */ }
    throw new Error(`${p.name} responded ${msg}`);
  }
  yield* sseDeltaStream(res.body, (data) => {
    const j = JSON.parse(data);
    return j?.choices?.[0]?.delta?.content ?? "";
  });
}

async function* sseDeltaStream(body: ReadableStream<Uint8Array>, parse: (data: string) => string): AsyncGenerator<string> {
  const reader = body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (line.startsWith("data:")) {
          const data = line.slice(5).trim();
          if (data === "[DONE]") return;
          try {
            const d = parse(data);
            if (d) yield d;
          } catch { /* skip malformed frame */ }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function* streamChat(req: ChatReq): AsyncGenerator<string> {
  const pid = req.provider.id;
  if (pid === "anthropic") yield* anthropicStream(req);
  else if (pid === "google") yield* googleStream(req);
  else if (pid === "pollinations") yield* pollinationsStream(req);
  else yield* openaiCompatStream(req);
}

/* Single non-streaming completion (used by the translator). */
export async function complete(req: ChatReq): Promise<string> {
  let out = "";
  for await (const d of streamChat(req)) out += d;
  return out.trim();
}
