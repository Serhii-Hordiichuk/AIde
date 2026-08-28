import type { ModelInfo } from "../data/models";
import type { ProviderInfo } from "../data/providers";
import type { GenParams, ProviderCfg } from "./store";

export class NoKeyError extends Error {}

export interface ChatMsg {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface StreamArgs {
  model: ModelInfo;
  provider: ProviderInfo;
  cfg: ProviderCfg;
  messages: ChatMsg[];
  params: GenParams;
  signal?: AbortSignal;
}

export const estimateTokens = (text: string) => Math.max(1, Math.round(text.length / 3.2));

function sseLines(reader: ReadableStreamDefaultReader<Uint8Array>, signal?: AbortSignal) {
  const dec = new TextDecoder();
  let buf = "";
  return {
    async *[Symbol.asyncIterator](): AsyncGenerator<string> {
      for (;;) {
        if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
        const { done, value } = await reader.read();
        if (done) return;
        buf += dec.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, idx).trim();
          buf = buf.slice(idx + 1);
          if (line.startsWith("data:")) yield line.slice(5).trim();
        }
      }
    },
  };
}

/** Single streaming adapter for all providers (OpenAI-compatible, Anthropic SSE, Google SSE). */
export async function* streamChat(args: StreamArgs): AsyncGenerator<string> {
  const { model, provider, cfg, messages, params, signal } = args;
  const key = cfg.key?.trim();
  if (!key && !provider.local) throw new NoKeyError("No API key configured");
  const base = (cfg.baseUrl || provider.baseUrl).replace(/\/+$/, "");

  if (provider.id === "anthropic") {
    const sys = [params.system, messages.find((m) => m.role === "system")?.content ?? ""]
      .filter(Boolean)
      .join("\n");
    const res = await fetch(`${base}/messages`, {
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
        stream: true,
        ...(sys ? { system: sys } : {}),
        messages: messages.filter((m) => m.role !== "system").map((m) => ({ role: m.role, content: m.content })),
      }),
    });
    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    for await (const data of sseLines(res.body.getReader(), signal)) {
      if (!data || data === "[DONE]") continue;
      try {
        const j = JSON.parse(data);
        if (j.type === "content_block_delta") yield j.delta?.text ?? "";
      } catch { /* keep-alive line */ }
    }
    return;
  }

  if (provider.id === "google") {
    const contents = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
    const res = await fetch(
      `${base}/models/${model.apiId}:streamGenerateContent?alt=sse&key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        signal,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: params.temperature,
            topP: params.topP,
            maxOutputTokens: params.maxTokens,
            ...(params.system ? { systemInstruction: { parts: [{ text: params.system }] } } : {}),
          },
        }),
      }
    );
    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    for await (const data of sseLines(res.body.getReader(), signal)) {
      if (!data || data === "[DONE]") continue;
      try {
        const j = JSON.parse(data);
        const t = j?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("");
        if (t) yield t;
      } catch { /* keep-alive line */ }
    }
    return;
  }

  // OpenAI-compatible: OpenRouter, OpenAI, DeepSeek, xAI, Mistral, Cohere, Perplexity,
  // Groq, Together, Fireworks, Cerebras, SambaNova, HF, Ollama, LM Studio, vLLM, llama.cpp, LocalAI, KoboldCPP
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    signal,
    headers: {
      "content-type": "application/json",
      ...(key ? { authorization: `Bearer ${key}` } : {}),
      ...(provider.id === "openrouter"
        ? { "HTTP-Referer": location.origin, "X-Title": "AiDe Studio" }
        : {}),
    },
    body: JSON.stringify({
      model: model.apiId,
      stream: true,
      messages: params.system ? [{ role: "system", content: params.system }, ...messages] : messages,
      max_tokens: params.maxTokens,
      temperature: params.temperature,
      top_p: params.topP,
    }),
  });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  for await (const data of sseLines(res.body.getReader(), signal)) {
    if (!data) continue;
    if (data === "[DONE]") return;
    try {
      const j = JSON.parse(data);
      const delta = j.choices?.[0]?.delta?.content ?? j.choices?.[0]?.text ?? "";
      if (delta) yield delta;
    } catch { /* keep-alive line */ }
  }
}

/** Simple availability check via the /models endpoint. */
export async function pingProvider(provider: ProviderInfo, cfg: ProviderCfg): Promise<string> {
  const base = (cfg.baseUrl || provider.baseUrl).replace(/\/+$/, "");
  const key = cfg.key?.trim();
  const url = provider.id === "google" ? `${base}/models?key=${encodeURIComponent(key)}` : `${base}/models`;
  const res = await fetch(url, {
    headers: key
      ? provider.id === "anthropic"
        ? { "x-api-key": key, "anthropic-version": "2023-06-01" }
        : { authorization: `Bearer ${key}` }
      : {},
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const j = await res.json().catch(() => ({}));
  const n = Array.isArray(j?.data) ? j.data.length : Array.isArray(j?.models) ? j.models.length : null;
  return n ? `${n} models` : "ok";
}
