import { providerById } from "./providers";

export interface ModelInfo {
  id: string;
  name: string;
  providerId: string;
  /** id sent to the API */
  apiId: string;
  /** context window, K tokens */
  ctx: number;
  /** $ per 1M input tokens — null for local, 0 for free cloud */
  priceIn: number | null;
  priceOut: number | null;
  vision?: boolean;
  reasoning?: boolean;
  open?: boolean;
  tags: string[];
}

/* Everything below is free: keyless cloud, free tiers, or local runtimes. */
export const MODELS: ModelInfo[] = [
  // Pollinations — keyless, works out of the box
  { id: "pplx-openai", name: "GPT-4o mini · Pollinations", providerId: "pollinations", apiId: "openai", ctx: 128, priceIn: 0, priceOut: 0, tags: ["keyless", "general"] },
  { id: "pplx-llama", name: "Llama 3.3 70B · Pollinations", providerId: "pollinations", apiId: "llama", ctx: 128, priceIn: 0, priceOut: 0, open: true, tags: ["keyless", "code"] },
  { id: "pplx-mistral", name: "Mistral Small · Pollinations", providerId: "pollinations", apiId: "mistral", ctx: 32, priceIn: 0, priceOut: 0, open: true, tags: ["keyless", "fast"] },
  { id: "pplx-r1", name: "DeepSeek-R1 · Pollinations", providerId: "pollinations", apiId: "deepseek-r1", ctx: 64, priceIn: 0, priceOut: 0, reasoning: true, open: true, tags: ["keyless", "reasoning"] },
  // Google AI Studio — free tier
  { id: "gemini-2-5-flash", name: "Gemini 2.5 Flash", providerId: "google", apiId: "gemini-2.5-flash", ctx: 1048, priceIn: 0, priceOut: 0, reasoning: true, vision: true, tags: ["free tier", "1M ctx"] },
  { id: "gemini-2-5-flash-lite", name: "Gemini 2.5 Flash-Lite", providerId: "google", apiId: "gemini-2.5-flash-lite", ctx: 1048, priceIn: 0, priceOut: 0, vision: true, tags: ["free tier", "fast"] },
  // OpenRouter — :free models
  { id: "or-llama-free", name: "Llama 3.3 70B · OpenRouter", providerId: "openrouter", apiId: "meta-llama/llama-3.3-70b-instruct:free", ctx: 128, priceIn: 0, priceOut: 0, open: true, tags: ["free tier"] },
  { id: "or-r1-free", name: "DeepSeek-R1 · OpenRouter", providerId: "openrouter", apiId: "deepseek/deepseek-r1:free", ctx: 160, priceIn: 0, priceOut: 0, reasoning: true, open: true, tags: ["free tier", "reasoning"] },
  // Groq — free tier
  { id: "llama-3-3-70b-groq", name: "Llama 3.3 70B · Groq", providerId: "groq", apiId: "llama-3.3-70b-versatile", ctx: 128, priceIn: 0, priceOut: 0, open: true, tags: ["free tier", "500+ tok/s"] },
  { id: "gpt-oss-120b-groq", name: "GPT-OSS 120B · Groq", providerId: "groq", apiId: "openai/gpt-oss-120b", ctx: 128, priceIn: 0, priceOut: 0, reasoning: true, open: true, tags: ["free tier", "reasoning"] },
  // Cerebras — free tier
  { id: "llama-3-3-70b-cerebras", name: "Llama 3.3 70B · Cerebras", providerId: "cerebras", apiId: "llama-3.3-70b", ctx: 128, priceIn: 0, priceOut: 0, open: true, tags: ["free tier", "fast"] },
  { id: "llama-8b-cerebras", name: "Llama 3.1 8B · Cerebras", providerId: "cerebras", apiId: "llama3.1-8b", ctx: 128, priceIn: 0, priceOut: 0, open: true, tags: ["free tier", "1000+ tok/s"] },
  // SambaNova — free tier
  { id: "llama-4-samba", name: "Llama 4 Maverick · SambaNova", providerId: "sambanova", apiId: "Llama-4-Maverick-17B-128E-Instruct", ctx: 131, priceIn: 0, priceOut: 0, open: true, tags: ["free tier", "MoE"] },
  // Hugging Face — free inference
  { id: "deepseek-r1-hf", name: "DeepSeek-R1 · HF", providerId: "huggingface", apiId: "deepseek-ai/DeepSeek-R1", ctx: 128, priceIn: 0, priceOut: 0, reasoning: true, open: true, tags: ["free tier", "reasoning"] },
  { id: "llama-4-scout-hf", name: "Llama 4 Scout · HF", providerId: "huggingface", apiId: "meta-llama/Llama-4-Scout-17B-16E-Instruct", ctx: 128, priceIn: 0, priceOut: 0, vision: true, open: true, tags: ["free tier", "MoE"] },
  // Local runtimes
  { id: "ollama-deepseek-coder", name: "DeepSeek Coder V2 16B", providerId: "ollama", apiId: "deepseek-coder-v2:16b", ctx: 128, priceIn: null, priceOut: null, open: true, tags: ["code", "local"] },
  { id: "ollama-llama", name: "Llama 3.1 8B", providerId: "ollama", apiId: "llama3.1:8b", ctx: 128, priceIn: null, priceOut: null, open: true, tags: ["local"] },
  { id: "ollama-r1", name: "DeepSeek-R1 14B", providerId: "ollama", apiId: "deepseek-r1:14b", ctx: 128, priceIn: null, priceOut: null, reasoning: true, open: true, tags: ["reasoning", "local"] },
  { id: "ollama-nemo", name: "Mistral Nemo 12B", providerId: "ollama", apiId: "mistral-nemo:12b", ctx: 128, priceIn: null, priceOut: null, open: true, tags: ["local"] },
  { id: "lmstudio-model", name: "LM Studio model", providerId: "lmstudio", apiId: "local-model", ctx: 128, priceIn: null, priceOut: null, open: true, tags: ["GGUF", "local"] },
  { id: "vllm-model", name: "vLLM model", providerId: "vllm", apiId: "local-model", ctx: 128, priceIn: null, priceOut: null, open: true, tags: ["production", "local"] },
  { id: "llamacpp-model", name: "llama.cpp model", providerId: "llamacpp", apiId: "local-model", ctx: 128, priceIn: null, priceOut: null, open: true, tags: ["GGUF", "CPU"] },
  { id: "localai-model", name: "LocalAI model", providerId: "localai", apiId: "local-model", ctx: 128, priceIn: null, priceOut: null, open: true, tags: ["docker", "local"] },
  { id: "kobold-model", name: "KoboldCPP model", providerId: "kobold", apiId: "local-model", ctx: 128, priceIn: null, priceOut: null, open: true, tags: ["GGUF", "local"] },
];

export const modelById = new Map(MODELS.map((m) => [m.id, m]));

/** Keyless by default — the app is fully functional with zero configuration. */
export const DEFAULT_MODEL_ID = "pplx-openai";

export function fmtPrice(m: ModelInfo): string {
  if (m.priceIn === null) return "local · $0";
  return "free · $0";
}

export function fmtCtx(k: number): string {
  if (k >= 1000) return `${(k / 1000).toFixed(k % 1000 === 0 ? 0 : 1)}M`;
  return `${k}K`;
}

/* ---------------- smart routing (all routes are free) ---------------- */

export function isAutoModel(id: string): boolean {
  return id === "auto-free" || id === "auto-local";
}

export const AUTO_LABEL: Record<string, string> = {
  "auto-free": "auto free",
  "auto-local": "auto local",
};

interface Cfg {
  key: string;
  baseUrl: string;
}

const LOCAL_PROVIDERS = new Set(
  ["ollama", "lmstudio", "vllm", "llamacpp", "localai", "kobold"]
);

/* ---------------- live (dynamically fetched) models ---------------- */

const DYN = "dyn:";

/** Stable id for a model discovered from a provider's /models endpoint. */
export function dynId(providerId: string, apiId: string): string {
  return `${DYN}${providerId}:${apiId}`;
}

export function parseDynId(id: string): { providerId: string; apiId: string } | null {
  if (!id.startsWith(DYN)) return null;
  const rest = id.slice(DYN.length);
  const idx = rest.indexOf(":");
  if (idx < 0) return null;
  return { providerId: rest.slice(0, idx), apiId: rest.slice(idx + 1) };
}

/** Builds a ModelInfo for a model fetched live from a provider API. */
export function syntheticModel(providerId: string, apiId: string): ModelInfo {
  const p = providerById.get(providerId);
  return {
    id: dynId(providerId, apiId),
    name: apiId,
    providerId,
    apiId,
    ctx: 128,
    priceIn: p?.local ? null : 0,
    priceOut: p?.local ? null : 0,
    open: true,
    tags: ["live"],
  };
}

/** Registry first, then live models, then a safe default. */
export function getModelInfo(id: string): ModelInfo {
  const reg = modelById.get(id);
  if (reg) return reg;
  const dyn = parseDynId(id);
  if (dyn) return syntheticModel(dyn.providerId, dyn.apiId);
  return MODELS[0];
}

/**
 * Resolves a virtual routing model to a concrete one.
 * Live catalogs (fetched from provider APIs) take priority over the built-in registry:
 *  - auto-free  → first live model of a keyed/keyless cloud provider, else registry free models
 *  - auto-local → first live model of a reachable local runtime, else registry local models
 */
export function resolveAutoModel(
  id: string,
  cfgs: Record<string, Cfg> | undefined,
  live?: Record<string, string[]>
): ModelInfo {
  const hasKey = (pid: string) => !!cfgs?.[pid]?.key?.trim();
  const biggest = (list: ModelInfo[]) => [...list].sort((a, b) => b.ctx - a.ctx)[0];
  const pool = MODELS.filter((m) => !isAutoModel(m.id));

  const liveOf = (pids: string[]): ModelInfo | null => {
    for (const pid of pids) {
      const models = live?.[pid];
      if (models?.length) return syntheticModel(pid, models[0]);
    }
    return null;
  };

  if (id === "auto-local") {
    const localPids = [...LOCAL_PROVIDERS];
    const fromLive = liveOf(localPids.filter((pid) => hasKey(pid))) ?? liveOf(localPids);
    if (fromLive) return fromLive;
    const local = pool.filter((m) => LOCAL_PROVIDERS.has(m.providerId));
    return local[0] ?? pool[0];
  }

  const cloudPids = [...new Set(pool.filter((m) => !LOCAL_PROVIDERS.has(m.providerId)).map((m) => m.providerId))];
  const fromLive = liveOf(cloudPids.filter(hasKey)) ?? liveOf(cloudPids.filter((pid) => providerById.get(pid)?.keyless));
  if (fromLive) return fromLive;

  const cloud = pool.filter((m) => !LOCAL_PROVIDERS.has(m.providerId));
  const keyed = cloud.filter((m) => hasKey(m.providerId));
  if (keyed.length) return biggest(keyed);
  const keyless = cloud.filter((m) => providerById.get(m.providerId)?.keyless);
  return (keyless.length ? biggest(keyless) : cloud[0]) ?? pool[0];
}
