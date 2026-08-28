export interface ModelInfo {
  id: string;
  name: string;
  providerId: string;
  /** id sent to the API */
  apiId: string;
  /** context window, K tokens */
  ctx: number;
  /** $ per 1M input tokens (null — free/local) */
  priceIn: number | null;
  priceOut: number | null;
  vision?: boolean;
  reasoning?: boolean;
  open?: boolean;
  tags: string[];
}

export const MODELS: ModelInfo[] = [
  // Smart routing (virtual)
  { id: "auto-free", name: "Auto Free", providerId: "auto", apiId: "auto/free", ctx: 200, priceIn: 0, priceOut: 0, tags: ["routing", "free"] },
  { id: "auto-price", name: "Auto Price", providerId: "auto", apiId: "auto/cheapest", ctx: 200, priceIn: null, priceOut: null, tags: ["routing", "cheapest"] },
  // OpenAI
  { id: "gpt-4o", name: "GPT-4o", providerId: "openai", apiId: "gpt-4o", ctx: 128, priceIn: 2.5, priceOut: 10, vision: true, tags: ["general"] },
  { id: "gpt-4-1", name: "GPT-4.1", providerId: "openai", apiId: "gpt-4.1", ctx: 1047, priceIn: 2, priceOut: 8, vision: true, tags: ["code", "1M ctx"] },
  { id: "gpt-4o-mini", name: "GPT-4o mini", providerId: "openai", apiId: "gpt-4o-mini", ctx: 128, priceIn: 0.15, priceOut: 0.6, vision: true, tags: ["fast", "cheap"] },
  { id: "o3", name: "o3", providerId: "openai", apiId: "o3", ctx: 200, priceIn: 10, priceOut: 40, reasoning: true, vision: true, tags: ["reasoning", "math"] },
  { id: "o4-mini", name: "o4-mini", providerId: "openai", apiId: "o4-mini", ctx: 200, priceIn: 1.1, priceOut: 4.4, reasoning: true, vision: true, tags: ["reasoning", "fast"] },
  // Anthropic
  { id: "claude-opus-4-5", name: "Claude Opus 4.5", providerId: "anthropic", apiId: "claude-opus-4-5", ctx: 200, priceIn: 5, priceOut: 25, reasoning: true, vision: true, tags: ["code", "agents", "flagship"] },
  { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5", providerId: "anthropic", apiId: "claude-sonnet-4-5", ctx: 200, priceIn: 3, priceOut: 15, reasoning: true, vision: true, tags: ["code", "agents"] },
  { id: "claude-haiku-4-5", name: "Claude Haiku 4.5", providerId: "anthropic", apiId: "claude-haiku-4-5", ctx: 200, priceIn: 1, priceOut: 5, vision: true, tags: ["fast"] },
  // Google
  { id: "gemini-3-pro", name: "Gemini 3 Pro", providerId: "google", apiId: "gemini-3-pro-preview", ctx: 1048, priceIn: 2, priceOut: 12, reasoning: true, vision: true, tags: ["flagship", "1M ctx", "multimodal"] },
  { id: "gemini-2-5-pro", name: "Gemini 2.5 Pro", providerId: "google", apiId: "gemini-2.5-pro", ctx: 1048, priceIn: 1.25, priceOut: 10, reasoning: true, vision: true, tags: ["1M ctx"] },
  { id: "gemini-2-5-flash", name: "Gemini 2.5 Flash", providerId: "google", apiId: "gemini-2.5-flash", ctx: 1048, priceIn: 0.3, priceOut: 2.5, reasoning: true, vision: true, tags: ["fast", "1M ctx"] },
  { id: "gemini-2-5-flash-lite", name: "Gemini 2.5 Flash-Lite", providerId: "google", apiId: "gemini-2.5-flash-lite", ctx: 1048, priceIn: 0.1, priceOut: 0.4, vision: true, tags: ["cheap"] },
  // DeepSeek
  { id: "deepseek-chat", name: "DeepSeek-V3 Chat", providerId: "deepseek", apiId: "deepseek-chat", ctx: 128, priceIn: 0.27, priceOut: 1.1, open: true, tags: ["cheap", "code"] },
  { id: "deepseek-reasoner", name: "DeepSeek-R1 Reasoner", providerId: "deepseek", apiId: "deepseek-reasoner", ctx: 128, priceIn: 0.55, priceOut: 2.19, reasoning: true, open: true, tags: ["reasoning", "math"] },
  // xAI
  { id: "grok-4", name: "Grok 4", providerId: "xai", apiId: "grok-4", ctx: 256, priceIn: 3, priceOut: 15, reasoning: true, tags: ["flagship", "agents"] },
  { id: "grok-4-fast", name: "Grok 4 Fast", providerId: "xai", apiId: "grok-4-fast-non-reasoning", ctx: 2000, priceIn: 0.2, priceOut: 0.5, vision: true, tags: ["2M ctx", "search"] },
  // Mistral
  { id: "mistral-large", name: "Mistral Large", providerId: "mistral", apiId: "mistral-large-latest", ctx: 128, priceIn: 2, priceOut: 6, tags: ["general"] },
  { id: "mistral-medium", name: "Mistral Medium 3", providerId: "mistral", apiId: "mistral-medium-latest", ctx: 128, priceIn: 0.4, priceOut: 2, vision: true, tags: ["balanced"] },
  { id: "codestral", name: "Codestral", providerId: "mistral", apiId: "codestral-latest", ctx: 256, priceIn: 0.3, priceOut: 0.9, open: true, tags: ["code", "FIM"] },
  // Cohere / Perplexity
  { id: "command-a", name: "Command A", providerId: "cohere", apiId: "command-a-03-2025", ctx: 256, priceIn: 2.5, priceOut: 10, tags: ["RAG", "multilingual"] },
  { id: "sonar-pro", name: "Sonar Pro", providerId: "perplexity", apiId: "sonar-pro", ctx: 200, priceIn: 3, priceOut: 15, tags: ["web search"] },
  { id: "sonar", name: "Sonar", providerId: "perplexity", apiId: "sonar", ctx: 128, priceIn: 1, priceOut: 1, tags: ["web search"] },
  // Groq
  { id: "llama-3-3-70b-groq", name: "Llama 3.3 70B · Groq", providerId: "groq", apiId: "llama-3.3-70b-versatile", ctx: 128, priceIn: 0.59, priceOut: 0.79, open: true, tags: ["500+ tok/s"] },
  { id: "gpt-oss-120b-groq", name: "GPT-OSS 120B · Groq", providerId: "groq", apiId: "openai/gpt-oss-120b", ctx: 128, priceIn: 0.35, priceOut: 0.7, reasoning: true, open: true, tags: ["reasoning", "open weights"] },
  // Together
  { id: "llama-4-maverick", name: "Llama 4 Maverick", providerId: "together", apiId: "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8", ctx: 256, priceIn: 0.27, priceOut: 0.85, vision: true, open: true, tags: ["MoE"] },
  { id: "deepseek-v3-together", name: "DeepSeek-V3 · Together", providerId: "together", apiId: "deepseek-ai/DeepSeek-V3", ctx: 128, priceIn: 0.6, priceOut: 2.5, open: true, tags: ["cheap"] },
  { id: "llama-405b-together", name: "Llama 3.1 405B · Together", providerId: "together", apiId: "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo", ctx: 131, priceIn: 2, priceOut: 2, open: true, tags: ["frontier", "open weights"] },
  // Fireworks
  { id: "llama-405b-fw", name: "Llama 3.1 405B · Fireworks", providerId: "fireworks", apiId: "accounts/fireworks/models/llama-v3p1-405b-instruct", ctx: 131, priceIn: 0.9, priceOut: 0.9, open: true, tags: ["frontier", "open weights"] },
  // Cerebras
  { id: "llama-3-3-70b-cerebras", name: "Llama 3.3 70B · Cerebras", providerId: "cerebras", apiId: "llama-3.3-70b", ctx: 128, priceIn: 0.59, priceOut: 0.79, open: true, tags: ["fast"] },
  { id: "llama-8b-cerebras", name: "Llama 3.1 8B · Cerebras", providerId: "cerebras", apiId: "llama3.1-8b", ctx: 128, priceIn: 0.1, priceOut: 0.1, open: true, tags: ["1000+ tok/s"] },
  // SambaNova
  { id: "llama-4-samba", name: "Llama 4 Maverick · SambaNova", providerId: "sambanova", apiId: "Llama-4-Maverick-17B-128E-Instruct", ctx: 131, priceIn: 0, priceOut: 0, open: true, tags: ["free tier"] },
  // Hugging Face
  { id: "deepseek-r1-hf", name: "DeepSeek-R1 · HF", providerId: "huggingface", apiId: "deepseek-ai/DeepSeek-R1", ctx: 128, priceIn: 0.55, priceOut: 2.19, reasoning: true, open: true, tags: ["reasoning"] },
  { id: "llama-4-scout-hf", name: "Llama 4 Scout · HF", providerId: "huggingface", apiId: "meta-llama/Llama-4-Scout-17B-16E-Instruct", ctx: 128, priceIn: 0.18, priceOut: 0.65, vision: true, open: true, tags: ["MoE"] },
  // OpenRouter meta
  { id: "openrouter-auto", name: "Auto (best price)", providerId: "openrouter", apiId: "openrouter/auto", ctx: 200, priceIn: null, priceOut: null, tags: ["routing", "fallback"] },
  // Local
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

export const DEFAULT_MODEL_ID = "claude-sonnet-4-5";

export function fmtPrice(m: ModelInfo): string {
  if (m.priceIn === null) return "$0 · local";
  if (m.priceIn === 0 && m.priceOut === 0) return "free";
  return `$${m.priceIn} / $${m.priceOut}`;
}

export function fmtCtx(k: number): string {
  if (k >= 1000) return `${(k / 1000).toFixed(k % 1000 === 0 ? 0 : 1)}M`;
  return `${k}K`;
}

/* ---------------- smart routing ---------------- */

export function isAutoModel(id: string): boolean {
  return id === "auto-free" || id === "auto-price";
}

export const AUTO_LABEL: Record<string, string> = {
  "auto-free": "auto free",
  "auto-price": "auto price",
};

interface Cfg {
  key: string;
  baseUrl: string;
}

/**
 * Resolves a virtual routing model to a concrete one:
 *  - auto-free  → best free option (free tiers + local runtimes), preferring providers with a key set
 *  - auto-price → cheapest model by $/1M input tokens among configured providers (fallback: overall cheapest)
 */
export function resolveAutoModel(id: string, cfgs: Record<string, Cfg> | undefined): ModelInfo {
  const pool = MODELS.filter((m) => !isAutoModel(m.id) && m.apiId !== "openrouter/auto");
  const hasKey = (m: ModelInfo) => !!cfgs?.[m.providerId]?.key?.trim();
  const biggestCtx = (list: ModelInfo[]) => [...list].sort((a, b) => b.ctx - a.ctx)[0];

  if (id === "auto-free") {
    const free = pool.filter((m) => m.priceIn === null || (m.priceIn === 0 && m.priceOut === 0));
    const keyed = free.filter(hasKey);
    if (keyed.length) return biggestCtx(keyed);
    if (free.length) return biggestCtx(free);
  }

  const priced = pool.filter((m) => m.priceIn !== null);
  const keyedPriced = priced.filter(hasKey);
  const src = keyedPriced.length ? keyedPriced : priced;
  const sorted = [...src].sort((a, b) => (a.priceIn ?? 0) - (b.priceIn ?? 0) || (b.ctx - a.ctx));
  return sorted[0] ?? MODELS[2] ?? MODELS[0];
}
