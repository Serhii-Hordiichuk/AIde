import type { ModelInfo } from "../data/models";
import type { ProviderInfo } from "../data/providers";
import type { GenParams, ProviderCfg } from "./store";

/* Стрімінг-клієнт для всіх трьох API-сімей:
   OpenAI-сумісні (більшість агрегаторів і локальні), Anthropic Messages, Google. */

export class NoKeyError extends Error {
  constructor() {
    super("API key is not configured");
  }
}

export interface ChatRequestMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface Req {
  model: ModelInfo;
  provider: ProviderInfo;
  cfg: ProviderCfg;
  messages: ChatRequestMessage[];
  params: GenParams;
  signal?: AbortSignal;
}

export async function* streamChat({ model, provider, cfg, messages, params, signal }: Req): AsyncGenerator<string> {
  const key = cfg.key?.trim();
  if (!key) throw new NoKeyError();
  const base = (cfg.baseUrl?.trim() || provider.baseUrl).replace(/\/+$/, "");
  const family = provider.id === "anthropic" ? "anthropic" : provider.id === "google" ? "google" : "openai";

  let res: Response;
  if (family === "anthropic") {
    const sys = messages.find((m) => m.role === "system")?.content;
    const rest = messages.filter((m) => m.role !== "system");
    res = await fetch(`${base}/messages`, {
      method: "POST",
      signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: model.apiId,
        max_tokens: params.maxTokens,
        temperature: params.temperature,
        top_p: params.topP,
        ...(sys ? { system: sys } : {}),
        stream: true,
        messages: rest.map((m) => ({ role: m.role, content: m.content })),
      }),
    });
  } else if (family === "google") {
    res = await fetch(`${base}/models/${model.apiId}:streamGenerateContent?alt=sse&key=${key}`, {
      method: "POST",
      signal,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: messages
          .filter((m) => m.role !== "system")
          .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
        generationConfig: {
          temperature: params.temperature,
          topP: params.topP,
          maxOutputTokens: params.maxTokens,
        },
      }),
    });
  } else {
    res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      signal,
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: model.apiId,
        stream: true,
        temperature: params.temperature,
        top_p: params.topP,
        max_tokens: params.maxTokens,
        messages,
      }),
    });
  }

  if (!res.ok || !res.body) {
    let detail = "";
    try {
      detail = (await res.text()).slice(0, 240);
    } catch {
      /* ignore */
    }
    throw new Error(`HTTP ${res.status} від ${provider.name}${detail ? `: ${detail}` : ""}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const raw of lines) {
      const line = raw.trim();
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      let obj: any;
      try {
        obj = JSON.parse(payload);
      } catch {
        continue;
      }
      let delta: string | undefined;
      if (family === "anthropic") {
        if (obj.type === "content_block_delta") delta = obj.delta?.text;
      } else if (family === "google") {
        delta = obj.candidates?.[0]?.content?.parts?.[0]?.text;
      } else {
        delta = obj.choices?.[0]?.delta?.content;
      }
      if (delta) yield delta;
    }
  }
}

export async function pingProvider(provider: ProviderInfo, cfg: ProviderCfg): Promise<{ ok: boolean; info?: string }> {
  const base = (cfg.baseUrl?.trim() || provider.baseUrl).replace(/\/+$/, "");
  const key = cfg.key?.trim();
  try {
    const res = await fetch(`${base}/models`, {
      headers: key
        ? provider.id === "anthropic"
          ? { "x-api-key": key, "anthropic-version": "2023-06-01" }
          : { authorization: `Bearer ${key}` }
        : {},
    });
    if (!res.ok) return { ok: false, info: `HTTP ${res.status}` };
    const j = await res.json().catch(() => null);
    const n = Array.isArray(j?.data) ? j.data.length : Array.isArray(j?.models) ? j.models.length : undefined;
    return { ok: true, info: n ? `${n} моделей` : "доступно" };
  } catch {
    return { ok: false, info: provider.local ? "сервер не запущено" : "мережева помилка" };
  }
}
