/* Реєстр моделей для пікера: хмарні API, інференс-агрегатори та локальні рантайми.
   Провайдери живуть у data/providers.ts (єдине джерело). */

export interface ModelInfo {
  id: string;
  name: string;
  providerId: string;
  apiId: string;
  ctx: number; // тис. токенів
  tag?: string;
  reasoning?: boolean;
}

export const MODELS: ModelInfo[] = [
  { id: "qwen3-max", name: "Qwen3-Max", providerId: "dashscope", apiId: "qwen3-max", ctx: 262, tag: "флагман" },
  { id: "qwen3-max-thinking", name: "Qwen3-Max-Thinking", providerId: "dashscope", apiId: "qwen3-max-2026-01-23", ctx: 262, reasoning: true, tag: "мислення" },
  { id: "qwen3-coder-plus", name: "Qwen3-Coder-Plus", providerId: "dashscope", apiId: "qwen3-coder-plus", ctx: 1000, tag: "код · 1M" },
  { id: "qwen3-coder-flash", name: "Qwen3-Coder-Flash", providerId: "dashscope", apiId: "qwen3-coder-flash", ctx: 1000, tag: "швидкий код" },
  { id: "openrouter-auto", name: "Auto-роутинг", providerId: "openrouter", apiId: "openrouter/auto", ctx: 200, tag: "найкраща ціна" },
  { id: "gpt-4-1", name: "GPT-4.1", providerId: "openai", apiId: "gpt-4.1", ctx: 1047, tag: "1M ctx" },
  { id: "gpt-4o-mini", name: "GPT-4o mini", providerId: "openai", apiId: "gpt-4o-mini", ctx: 128, tag: "дешева" },
  { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5", providerId: "anthropic", apiId: "claude-sonnet-4-5", ctx: 200, tag: "код і агенти" },
  { id: "claude-haiku-4-5", name: "Claude Haiku 4.5", providerId: "anthropic", apiId: "claude-haiku-4-5", ctx: 200, tag: "швидка" },
  { id: "gemini-2-5-pro", name: "Gemini 2.5 Pro", providerId: "google", apiId: "gemini-2.5-pro", ctx: 1048, reasoning: true, tag: "1M ctx" },
  { id: "gemini-2-5-flash", name: "Gemini 2.5 Flash", providerId: "google", apiId: "gemini-2.5-flash", ctx: 1048, reasoning: true, tag: "швидка" },
  { id: "deepseek-chat", name: "DeepSeek-V3 Chat", providerId: "deepseek", apiId: "deepseek-chat", ctx: 128, tag: "ціна/якість" },
  { id: "deepseek-reasoner", name: "DeepSeek-R1", providerId: "deepseek", apiId: "deepseek-reasoner", ctx: 128, reasoning: true, tag: "мислення" },
  { id: "grok-4-fast", name: "Grok 4 Fast", providerId: "xai", apiId: "grok-4-fast-non-reasoning", ctx: 2000, tag: "2M ctx" },
  { id: "mistral-large", name: "Mistral Large", providerId: "mistral", apiId: "mistral-large-latest", ctx: 128 },
  { id: "command-a", name: "Command A", providerId: "cohere", apiId: "command-a-03-2025", ctx: 256, tag: "RAG" },
  { id: "sonar", name: "Sonar", providerId: "perplexity", apiId: "sonar", ctx: 128, tag: "веб-пошук" },
  { id: "llama-groq", name: "Llama 3.3 70B", providerId: "groq", apiId: "llama-3.3-70b-versatile", ctx: 128, tag: "500+ tok/s" },
  { id: "qwen3-235b-together", name: "Qwen3-235B", providerId: "together", apiId: "Qwen/Qwen3-235B-A22B-Instruct-2507", ctx: 131, tag: "open weights" },
  { id: "qwen3-coder-fw", name: "Qwen3-Coder-480B", providerId: "fireworks", apiId: "accounts/fireworks/models/qwen3-coder-480b-a35b-instruct", ctx: 256, tag: "код" },
  { id: "llama-cerebras", name: "Llama 3.3 70B", providerId: "cerebras", apiId: "llama-3.3-70b", ctx: 128, tag: "1000+ tok/s" },
  { id: "qwen3-235b-samba", name: "Qwen3-235B", providerId: "sambanova", apiId: "Qwen3-235B", ctx: 131, tag: "безкоштовно" },
  { id: "r1-hf", name: "DeepSeek-R1 · HF", providerId: "huggingface", apiId: "deepseek-ai/DeepSeek-R1", ctx: 128, reasoning: true },
  { id: "ollama-coder", name: "Qwen2.5-Coder 7B", providerId: "ollama", apiId: "qwen2.5-coder:7b", ctx: 32, tag: "локально" },
  { id: "ollama-r1", name: "DeepSeek-R1 14B", providerId: "ollama", apiId: "deepseek-r1:14b", ctx: 128, reasoning: true, tag: "локально" },
  { id: "lmstudio-any", name: "Модель LM Studio", providerId: "lmstudio", apiId: "local-model", ctx: 128, tag: "локально" },
  { id: "vllm-any", name: "Модель vLLM", providerId: "vllm", apiId: "local-model", ctx: 128, tag: "локально" },
  { id: "llamacpp-any", name: "Модель llama.cpp", providerId: "llamacpp", apiId: "local-model", ctx: 128, tag: "локально" },
];

export const modelById = new Map(MODELS.map((m) => [m.id, m]));
export const DEFAULT_MODEL_ID = "qwen3-max";
