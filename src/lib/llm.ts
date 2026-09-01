import type { ProviderInfo } from "../data/providers";
import type { ModelInfo, Cfg } from "../data/models";
import type { GenParams } from "./store";

export class NoKeyError extends Error {
  constructor(public providerName: string) {
    super(`No API key set for ${providerName}.`);
  }
}

export interface ChatMessageLike {
  role: string;
  content: string;
}

export interface StreamOpts {
  model: ModelInfo;
  provider: ProviderInfo;
  cfg: Cfg;
  messages: ChatMessageLike[];
  params: GenParams;
  signal?: AbortSignal;
}

function baseOf(cfg: Cfg, provider: ProviderInfo): string {
  return (cfg.baseUrl?.trim() || provider.baseUrl).replace(/\/+$/, "");
}

async function* readSse(res: Response, extract: (json: any) => string | undefined, signal?: AbortSignal): AsyncGenerator<string> {
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";
  try {
    for (;;) {
      if (signal?.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        const l = line.trim();
        if (!l.startsWith("data:")) continue;
        const payload = l.slice(5).trim();
        if (payload === "[DONE]") return;
        try {
          const json = JSON.parse(payload);
          const delta = extract(json);
          if (delta) yield delta;
        } catch {
          /* skip malformed frame */
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/** Streams assistant tokens from any configured provider. No demo mode — real APIs only. */
export async function* streamChat(opts: StreamOpts): AsyncGenerator<string> {
  const { model, provider, cfg, messages, params, signal } = opts;
  const key = cfg.key?.trim();

  if (provider.id === "google") {
    if (!key) throw new NoKeyError(provider.name);
    const sys = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n");
    const contents = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
    const url = `${baseOf(cfg, provider)}/models/${encodeURIComponent(model.apiId)}:streamGenerateContent?key=${encodeURIComponent(
      key
    )}&alt=sse`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        ...(sys ? { systemInstruction: { parts: [{ text: sys }] } } : {}),
        generationConfig: {
          temperature: params.temperature,
          topP: params.topP,
          maxOutputTokens: params.maxTokens,
        },
      }),
      signal,
    });
    if (!res.ok) throw new Error(`Google responded HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
    yield* readSse(
      res,
      (j) => j?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? "").join("") || undefined,
      signal
    );
    return;
  }

  const isPplx = provider.id === "pollinations";
  const isCloudflare = provider.id === "cloudflare";
  const needsAuth = !provider.keyless && !provider.local;
  if (needsAuth && !key) throw new NoKeyError(provider.name);

  // Cloudflare AI Gateway needs an account-scoped path; keep the base as-is and let the user paste the full gateway URL.
  const url = isPplx ? baseOf(cfg, provider) + "/openai" : baseOf(cfg, provider) + "/chat/completions";
  void isCloudflare;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (key) {
    headers["Authorization"] = `Bearer ${key}`;
    if (provider.id === "huggingface") headers["x-api-key"] = key;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: model.apiId,
      messages,
      stream: true,
      temperature: params.temperature,
      top_p: params.topP,
      max_tokens: params.maxTokens,
    }),
    signal,
  });

  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new Error(`${provider.name} responded HTTP ${res.status}: ${body}`);
  }

  yield* readSse(res, (j) => j?.choices?.[0]?.delta?.content ?? undefined, signal);
}

/** Collects a full (non-streamed UX) completion into a string. */
export async function complete(opts: StreamOpts): Promise<string> {
  let out = "";
  for await (const d of streamChat(opts)) out += d;
  return out.trim();
}
