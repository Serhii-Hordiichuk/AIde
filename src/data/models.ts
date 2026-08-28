export interface ModelInfo {
  id: string;
  name: string;
  providerId: string;
  /** id, який відправляється в API */
  apiId: string;
  /** контекст, тис. токенів */
  ctx: number;
  /** $ за 1M вхідних токенів (null — безкоштовно/локально) */
  priceIn: number | null;
  priceOut: number | null;
  vision?: boolean;
  reasoning?: boolean;
  open?: boolean;
  tags: string[];
}

export const MODELS: ModelInfo[] = [
  // Qwen (DashScope)
  { id: "qwen3-max", name: "Qwen3-Max", providerId: "dashscope", apiId: "qwen3-max", ctx: 262, priceIn: 1.2, priceOut: 6, reasoning: true, tags: ["флагман", "код", "агенти"] },
  { id: "qwen3-coder-plus", name: "Qwen3-Coder-Plus", providerId: "dashscope", apiId: "qwen3-coder-plus", ctx: 1000, priceIn: 1, priceOut: 4, tags: ["код", "агенти", "1M ctx"] },
  { id: "qwen3-coder-flash", name: "Qwen3-Coder-Flash", providerId: "dashscope", apiId: "qwen3-coder-flash", ctx: 1000, priceIn: 0.2, priceOut: 0.8, tags: ["код", "швидка", "1M ctx"] },
  { id: "qwen3-235b", name: "Qwen3-235B-A22B", providerId: "dashscope", apiId: "qwen3-235b-a22b-instruct-2507", ctx: 262, priceIn: 0.4, priceOut: 1.6, open: true, tags: ["MoE", "open weights"] },
  // OpenAI
  { id: "gpt-4o", name: "GPT-4o", providerId: "openai", apiId: "gpt-4o", ctx: 128, priceIn: 2.5, priceOut: 10, vision: true, tags: ["універсал"] },
  { id: "gpt-4-1", name: "GPT-4.1", providerId: "openai", apiId: "gpt-4.1", ctx: 1047, priceIn: 2, priceOut: 8, vision: true, tags: ["код", "1M ctx"] },
  { id: "gpt-4o-mini", name: "GPT-4o mini", providerId: "openai", apiId: "gpt-4o-mini", ctx: 128, priceIn: 0.15, priceOut: 0.6, vision: true, tags: ["швидка", "дешева"] },
  { id: "o3", name: "o3", providerId: "openai", apiId: "o3", ctx: 200, priceIn: 10, priceOut: 40, reasoning: true, vision: true, tags: ["мислення", "math"] },
  { id: "o4-mini", name: "o4-mini", providerId: "openai", apiId: "o4-mini", ctx: 200, priceIn: 1.1, priceOut: 4.4, reasoning: true, vision: true, tags: ["мислення", "швидка"] },
  // Anthropic
  { id: "claude-opus-4-5", name: "Claude Opus 4.5", providerId: "anthropic", apiId: "claude-opus-4-5", ctx: 200, priceIn: 5, priceOut: 25, reasoning: true, vision: true, tags: ["код", "агенти", "флагман"] },
  { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5", providerId: "anthropic", apiId: "claude-sonnet-4-5", ctx: 200, priceIn: 3, priceOut: 15, reasoning: true, vision: true, tags: ["код", "агенти"] },
  { id: "claude-haiku-4-5", name: "Claude Haiku 4.5", providerId: "anthropic", apiId: "claude-haiku-4-5", ctx: 200, priceIn: 1, priceOut: 5, vision: true, tags: ["швидка"] },
  // Google
  { id: "gemini-3-pro", name: "Gemini 3 Pro", providerId: "google", apiId: "gemini-3-pro-preview", ctx: 1048, priceIn: 2, priceOut: 12, reasoning: true, vision: true, tags: ["флагман", "1M ctx", "мультимодальна"] },
  { id: "gemini-2-5-pro", name: "Gemini 2.5 Pro", providerId: "google", apiId: "gemini-2.5-pro", ctx: 1048, priceIn: 1.25, priceOut: 10, reasoning: true, vision: true, tags: ["1M ctx"] },
  { id: "gemini-2-5-flash", name: "Gemini 2.5 Flash", providerId: "google", apiId: "gemini-2.5-flash", ctx: 1048, priceIn: 0.3, priceOut: 2.5, reasoning: true, vision: true, tags: ["швидка", "1M ctx"] },
  { id: "gemini-2-5-flash-lite", name: "Gemini 2.5 Flash-Lite", providerId: "google", apiId: "gemini-2.5-flash-lite", ctx: 1048, priceIn: 0.1, priceOut: 0.4, vision: true, tags: ["дешева"] },
  // DeepSeek
  { id: "deepseek-chat", name: "DeepSeek-V3 Chat", providerId: "deepseek", apiId: "deepseek-chat", ctx: 128, priceIn: 0.27, priceOut: 1.1, open: true, tags: ["дешева", "код"] },
  { id: "deepseek-reasoner", name: "DeepSeek-R1 Reasoner", providerId: "deepseek", apiId: "deepseek-reasoner", ctx: 128, priceIn: 0.55, priceOut: 2.19, reasoning: true, open: true, tags: ["мислення", "math"] },
  // xAI
  { id: "grok-4", name: "Grok 4", providerId: "xai", apiId: "grok-4", ctx: 256, priceIn: 3, priceOut: 15, reasoning: true, tags: ["флагман", "агенти"] },
  { id: "grok-4-fast", name: "Grok 4 Fast", providerId: "xai", apiId: "grok-4-fast-non-reasoning", ctx: 2000, priceIn: 0.2, priceOut: 0.5, vision: true, tags: ["2M ctx", "пошук"] },
  // Mistral
  { id: "mistral-large", name: "Mistral Large", providerId: "mistral", apiId: "mistral-large-latest", ctx: 128, priceIn: 2, priceOut: 6, tags: ["універсал"] },
  { id: "mistral-medium", name: "Mistral Medium 3", providerId: "mistral", apiId: "mistral-medium-latest", ctx: 128, priceIn: 0.4, priceOut: 2, vision: true, tags: ["баланс"] },
  { id: "codestral", name: "Codestral", providerId: "mistral", apiId: "codestral-latest", ctx: 256, priceIn: 0.3, priceOut: 0.9, open: true, tags: ["код", "FIM"] },
  // Cohere / Perplexity
  { id: "command-a", name: "Command A", providerId: "cohere", apiId: "command-a-03-2025", ctx: 256, priceIn: 2.5, priceOut: 10, tags: ["RAG", "мультиязычна"] },
  { id: "sonar-pro", name: "Sonar Pro", providerId: "perplexity", apiId: "sonar-pro", ctx: 200, priceIn: 3, priceOut: 15, tags: ["пошук у мережі"] },
  { id: "sonar", name: "Sonar", providerId: "perplexity", apiId: "sonar", ctx: 128, priceIn: 1, priceOut: 1, tags: ["пошук у мережі"] },
  // Groq
  { id: "llama-3-3-70b-groq", name: "Llama 3.3 70B · Groq", providerId: "groq", apiId: "llama-3.3-70b-versatile", ctx: 128, priceIn: 0.59, priceOut: 0.79, open: true, tags: ["500+ tok/s"] },
  { id: "gpt-oss-120b-groq", name: "GPT-OSS 120B · Groq", providerId: "groq", apiId: "openai/gpt-oss-120b", ctx: 128, priceIn: 0.35, priceOut: 0.7, reasoning: true, open: true, tags: ["мислення", "open weights"] },
  // Together
  { id: "llama-4-maverick", name: "Llama 4 Maverick", providerId: "together", apiId: "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8", ctx: 256, priceIn: 0.27, priceOut: 0.85, vision: true, open: true, tags: ["MoE"] },
  { id: "qwen3-235b-together", name: "Qwen3-235B · Together", providerId: "together", apiId: "Qwen/Qwen3-235B-A22B-Instruct-2507", ctx: 131, priceIn: 0.22, priceOut: 0.88, open: true, tags: ["MoE"] },
  { id: "deepseek-v3-together", name: "DeepSeek-V3 · Together", providerId: "together", apiId: "deepseek-ai/DeepSeek-V3", ctx: 128, priceIn: 0.6, priceOut: 2.5, open: true, tags: ["дешева"] },
  // Fireworks
  { id: "qwen3-coder-480b-fw", name: "Qwen3-Coder-480B · Fireworks", providerId: "fireworks", apiId: "accounts/fireworks/models/qwen3-coder-480b-a35b-instruct", ctx: 256, priceIn: 0.45, priceOut: 1.8, open: true, tags: ["код", "агенти"] },
  // Cerebras
  { id: "qwen3-coder-480b-cerebras", name: "Qwen3-Coder-480B · Cerebras", providerId: "cerebras", apiId: "qwen-3-coder-480b", ctx: 256, priceIn: 0.45, priceOut: 1.8, open: true, tags: ["код", "1000+ tok/s"] },
  { id: "llama-3-3-70b-cerebras", name: "Llama 3.3 70B · Cerebras", providerId: "cerebras", apiId: "llama-3.3-70b", ctx: 128, priceIn: 0.59, priceOut: 0.79, open: true, tags: ["швидка"] },
  // SambaNova
  { id: "qwen3-235b-samba", name: "Qwen3-235B · SambaNova", providerId: "sambanova", apiId: "Qwen3-235B", ctx: 131, priceIn: 0, priceOut: 0, open: true, tags: ["безкоштовне тирло"] },
  // Hugging Face
  { id: "deepseek-r1-hf", name: "DeepSeek-R1 · HF", providerId: "huggingface", apiId: "deepseek-ai/DeepSeek-R1", ctx: 128, priceIn: 0.55, priceOut: 2.19, reasoning: true, open: true, tags: ["мислення"] },
  { id: "llama-4-scout-hf", name: "Llama 4 Scout · HF", providerId: "huggingface", apiId: "meta-llama/Llama-4-Scout-17B-16E-Instruct", ctx: 128, priceIn: 0.18, priceOut: 0.65, vision: true, open: true, tags: ["MoE"] },
  // OpenRouter meta
  { id: "openrouter-auto", name: "Auto (найкраща ціна)", providerId: "openrouter", apiId: "openrouter/auto", ctx: 200, priceIn: null, priceOut: null, tags: ["роутинг", "fallback"] },
  // Локальні
  { id: "ollama-qwen-coder", name: "Qwen2.5-Coder 7B", providerId: "ollama", apiId: "qwen2.5-coder:7b", ctx: 32, priceIn: null, priceOut: null, open: true, tags: ["код", "локально"] },
  { id: "ollama-llama", name: "Llama 3.1 8B", providerId: "ollama", apiId: "llama3.1:8b", ctx: 128, priceIn: null, priceOut: null, open: true, tags: ["локально"] },
  { id: "ollama-r1", name: "DeepSeek-R1 14B", providerId: "ollama", apiId: "deepseek-r1:14b", ctx: 128, priceIn: null, priceOut: null, reasoning: true, open: true, tags: ["мислення", "локально"] },
  { id: "ollama-nemo", name: "Mistral Nemo 12B", providerId: "ollama", apiId: "mistral-nemo:12b", ctx: 128, priceIn: null, priceOut: null, open: true, tags: ["локально"] },
  { id: "lmstudio-model", name: "Модель LM Studio", providerId: "lmstudio", apiId: "local-model", ctx: 128, priceIn: null, priceOut: null, open: true, tags: ["GGUF", "локально"] },
  { id: "vllm-model", name: "Модель vLLM", providerId: "vllm", apiId: "local-model", ctx: 128, priceIn: null, priceOut: null, open: true, tags: ["продакшн", "локально"] },
  { id: "llamacpp-model", name: "Модель llama.cpp", providerId: "llamacpp", apiId: "local-model", ctx: 128, priceIn: null, priceOut: null, open: true, tags: ["GGUF", "CPU"] },
  { id: "localai-model", name: "Модель LocalAI", providerId: "localai", apiId: "local-model", ctx: 128, priceIn: null, priceOut: null, open: true, tags: ["docker", "локально"] },
  { id: "kobold-model", name: "Модель KoboldCPP", providerId: "kobold", apiId: "local-model", ctx: 128, priceIn: null, priceOut: null, open: true, tags: ["GGUF", "локально"] },
];

export const modelById = new Map(MODELS.map((m) => [m.id, m]));

export const DEFAULT_MODEL_ID = "qwen3-coder-plus";

export function fmtPrice(m: ModelInfo): string {
  if (m.priceIn === null) return "$0 · локально";
  if (m.priceIn === 0 && m.priceOut === 0) return "безкоштовно";
  return `$${m.priceIn} / $${m.priceOut}`;
}

export function fmtCtx(k: number): string {
  if (k >= 1000) return `${Number((k / 1000).toFixed(1))}M`;
  return `${k}K`;
}
