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
}

export class NoKeyError extends Error {
  constructor() { super("NO_KEY"); }
}

function base(p: ProviderInfo, cfg: ProviderCfg): string {
  return (cfg.baseUrl || p.baseUrl).replace(/\/$/, "");
}

/* ---------- SSE-потік ---------- */
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
      const t = line.trim();
      if (!t.startsWith("data:")) continue;
      const data = t.slice(5).trim();
      if (data === "[DONE]") return;
      yield data;
    }
  }
}

/* ---------- live-стрімінг (OpenAI-сумісні, Anthropic, Google) ---------- */
export async function* streamChat(opts: StreamOpts): AsyncGenerator<string> {
  const { model, provider, cfg, messages, params, signal } = opts;
  if (!cfg.key?.trim()) throw new NoKeyError();

  if (provider.id === "anthropic") {
    const res = await fetch(`${base(provider, cfg)}/v1/messages`, {
      method: "POST",
      signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": cfg.key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: model.apiId,
        max_tokens: Math.min(params.maxTokens, 8192),
        temperature: params.temperature,
        top_p: params.topP,
        system: params.system || undefined,
        stream: true,
        messages,
      }),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 200)}`);
    for await (const data of sseData(res)) {
      try {
        const j = JSON.parse(data);
        if (j.type === "content_block_delta" && j.delta?.text) yield j.delta.text;
      } catch { /* skip */ }
    }
    return;
  }

  if (provider.id === "google") {
    const res = await fetch(
      `${base(provider, cfg)}/v1beta/models/${model.apiId}:streamGenerateContent?alt=sse&key=${encodeURIComponent(cfg.key)}`,
      {
        method: "POST",
        signal,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
          systemInstruction: params.system ? { parts: [{ text: params.system }] } : undefined,
          generationConfig: { temperature: params.temperature, topP: params.topP, maxOutputTokens: params.maxTokens },
        }),
      }
    );
    if (!res.ok) throw new Error(`Google ${res.status}: ${(await res.text()).slice(0, 200)}`);
    for await (const data of sseData(res)) {
      try {
        const j = JSON.parse(data);
        const text = j.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("");
        if (text) yield text;
      } catch { /* skip */ }
    }
    return;
  }

  // OpenAI-сумісні: Qwen/DashScope, OpenAI, DeepSeek, xAI, Mistral, Groq, Together,
  // Fireworks, Cerebras, OpenRouter, Ollama, LM Studio, vLLM, llama.cpp, LocalAI…
  const res = await fetch(`${base(provider, cfg)}/chat/completions`, {
    method: "POST",
    signal,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${cfg.key}`,
    },
    body: JSON.stringify({
      model: model.apiId,
      stream: true,
      temperature: params.temperature,
      top_p: params.topP,
      max_tokens: params.maxTokens,
      messages: [
        ...(params.system ? [{ role: "system" as const, content: params.system }] : []),
        ...messages,
      ],
    }),
  });
  if (!res.ok) throw new Error(`${provider.name} ${res.status}: ${(await res.text()).slice(0, 200)}`);
  for await (const data of sseData(res)) {
    try {
      const j = JSON.parse(data);
      const delta = j.choices?.[0]?.delta?.content ?? j.choices?.[0]?.text ?? "";
      if (delta) yield delta;
    } catch { /* skip */ }
  }
}

/* ---------- перевірка з'єднання ---------- */
export async function listModels(provider: ProviderInfo, cfg: ProviderCfg, signal?: AbortSignal): Promise<string[]> {
  const b = base(provider, cfg);
  if (provider.id === "anthropic") {
    const res = await fetch(`${b}/v1/models`, {
      signal,
      headers: {
        "x-api-key": cfg.key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = await res.json();
    return (j.data ?? []).map((m: { id: string }) => m.id);
  }
  if (provider.id === "google") {
    const res = await fetch(`${b}/v1beta/models?key=${encodeURIComponent(cfg.key)}`, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = await res.json();
    return (j.models ?? []).map((m: { name: string }) => m.name.replace("models/", ""));
  }
  const res = await fetch(`${b}/models`, {
    signal,
    headers: cfg.key ? { authorization: `Bearer ${cfg.key}` } : {},
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const j = await res.json();
  return (j.data ?? j.models ?? []).map((m: { id?: string; name?: string; model?: string }) => m.id ?? m.name ?? m.model ?? "");
}
