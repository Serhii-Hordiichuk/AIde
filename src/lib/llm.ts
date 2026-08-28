import type { ModelInfo } from "../data/models";
import type { ProviderInfo } from "../data/providers";
import type { GenParams, ProviderCfg } from "./store";

/* Real API clients. Everything here talks to FREE endpoints:
   - Pollinations: keyless hosted inference (OpenAI-compatible)
   - Google AI Studio: free tier, streamGenerateContent SSE
   - OpenAI-compatible: OpenRouter :free, Groq, Cerebras, SambaNova, HF, local runtimes */

export class NoKeyError extends Error {
  constructor(name: string) {
    super(`No API key set for ${name}. Add a free key in Settings.`);
  }
}

export interface ChatMessageParam {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOpts {
  model: ModelInfo;
  provider: ProviderInfo;
  cfg: ProviderCfg;
  messages: ChatMessageParam[];
  params: GenParams;
  signal: AbortSignal;
}

export async function* streamChat(opts: ChatOpts): AsyncGenerator<string> {
  const { provider, cfg } = opts;
  const needsKey = !provider.keyless && !provider.local;
  if (needsKey && !cfg.key?.trim()) throw new NoKeyError(provider.name);

  if (provider.id === "google") yield* googleStream(opts);
  else yield* openaiCompatible(opts); // pollinations, openrouter, groq, cerebras, sambanova, hf, local
}

/* ---------- shared SSE helpers ---------- */

async function* sseDataLines(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const dec = new TextDecoder();
  let buf = "";
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
        if (data && data !== "[DONE]") yield data;
      }
    }
  }
}

function baseOf(cfg: ProviderCfg, provider: ProviderInfo): string {
  return (cfg.baseUrl?.trim() || provider.baseUrl).replace(/\/+$/, "");
}

/* ---------- OpenAI-compatible (covers Pollinations keyless) ---------- */

async function* openaiCompatible(opts: ChatOpts): AsyncGenerator<string> {
  const { model, provider, cfg, messages, params, signal } = opts;
  const isPplx = provider.id === "pollinations";
  const url = isPplx ? baseOf(cfg, provider) + "/openai" : baseOf(cfg, provider) + "/chat/completions";

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cfg.key?.trim()) {
    headers["Authorization"] = `Bearer ${cfg.key.trim()}`;
    if (provider.id === "huggingface") headers["x-api-key"] = cfg.key.trim();
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      signal,
      body: JSON.stringify({
        model: model.apiId,
        messages,
        temperature: params.temperature,
        top_p: params.topP,
        max_tokens: params.maxTokens,
        stream: true,
      }),
    });
  } catch (e) {
    if (signal.aborted) throw e;
    throw new Error(
      provider.local
        ? `cannot reach ${provider.name} at ${baseOf(cfg, provider)} — is the server running?`
        : `network error while contacting ${provider.name}`
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${provider.name} responded HTTP ${res.status}${text ? `: ${text.slice(0, 140)}` : ""}`);
  }

  const ct = res.headers.get("content-type") ?? "";

  if (ct.includes("text/event-stream") && res.body) {
    for await (const data of sseDataLines(res.body)) {
      try {
        const json = JSON.parse(data);
        const delta: string = json.choices?.[0]?.delta?.content ?? "";
        if (delta) yield delta;
      } catch {
        /* keep-alive line */
      }
    }
    return;
  }

  // Non-streaming fallback (some endpoints ignore stream:true)
  const data = await res.json().catch(() => null);
  const content: string =
    data?.choices?.[0]?.message?.content ??
    data?.choices?.[0]?.text ??
    (typeof data === "string" ? data : "");
  if (!content) throw new Error(`${provider.name} returned an empty response`);
  // deliver in slices so the UI still feels live
  for (let i = 0; i < content.length; i += 24) {
    yield content.slice(i, i + 24);
    await new Promise((r) => setTimeout(r, 12));
  }
}

/* ---------- Google AI Studio (free tier) ---------- */

async function* googleStream(opts: ChatOpts): AsyncGenerator<string> {
  const { model, provider, cfg, messages, params, signal } = opts;
  const key = cfg.key?.trim();
  if (!key) throw new NoKeyError(provider.name);

  const system = messages.find((m) => m.role === "system")?.content;
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const url =
    `${baseOf(cfg, provider)}/models/${model.apiId}:streamGenerateContent` +
    `?alt=sse&key=${encodeURIComponent(key)}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        contents,
        ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
        generationConfig: {
          temperature: params.temperature,
          topP: params.topP,
          maxOutputTokens: params.maxTokens,
        },
      }),
    });
  } catch (e) {
    if (signal.aborted) throw e;
    throw new Error(`network error while contacting ${provider.name}`);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${provider.name} responded HTTP ${res.status}${text ? `: ${text.slice(0, 140)}` : ""}`);
  }

  if (!res.body) throw new Error(`${provider.name} returned no stream`);

  for await (const data of sseDataLines(res.body)) {
    try {
      const json = JSON.parse(data);
      const parts = json.candidates?.[0]?.content?.parts ?? [];
      for (const p of parts) if (p.text) yield p.text;
    } catch {
      /* keep-alive line */
    }
  }
}
