/* Курацований список моделей для селектора — як у Qwen Chat,
   але з моделями всіх підключених агрегаторів. */

export interface ModelInfo {
  id: string;
  name: string;
  providerId: string;
  providerCode: string; // коротка мітка в селекторі
  apiId: string;
  ctx: number; // тис. токенів
  priceIn: number | null; // $ за 1M вхідних
  priceOut: number | null;
  vision?: boolean;
  reasoning?: boolean;
  open?: boolean;
}

export const MODELS: ModelInfo[] = [
  // Qwen (рідні)
  { id: "qwen3-max", name: "Qwen3-Max", providerId: "dashscope", providerCode: "Qwen", apiId: "qwen3-max", ctx: 262, priceIn: 1.2, priceOut: 6, reasoning: true },
  { id: "qwen3-plus", name: "Qwen3-Plus", providerId: "dashscope", providerCode: "Qwen", apiId: "qwen3-plus", ctx: 1000, priceIn: 0.4, priceOut: 1.2 },
  { id: "qwen3-flash", name: "Qwen3-Flash", providerId: "dashscope", providerCode: "Qwen", apiId: "qwen3-flash", ctx: 1000, priceIn: 0, priceOut: 0 },
  { id: "qwen3-coder-plus", name: "Qwen3-Coder-Plus", providerId: "dashscope", providerCode: "Qwen", apiId: "qwen3-coder-plus", ctx: 1000, priceIn: 1, priceOut: 4 },
  { id: "qwen3-coder-flash", name: "Qwen3-Coder-Flash", providerId: "dashscope", providerCode: "Qwen", apiId: "qwen3-coder-flash", ctx: 1000, priceIn: 0.2, priceOut: 0.8 },
  { id: "qwen3-vl-plus", name: "Qwen3-VL-Plus", providerId: "dashscope", providerCode: "Qwen", apiId: "qwen3-vl-plus", ctx: 262, priceIn: 0.3, priceOut: 1.2, vision: true },
  // Хмарні агрегатори
  { id: "gpt-4o", name: "GPT-4o", providerId: "openai", providerCode: "OpenAI", apiId: "gpt-4o", ctx: 128, priceIn: 2.5, priceOut: 10, vision: true },
  { id: "o4-mini", name: "o4-mini", providerId: "openai", providerCode: "OpenAI", apiId: "o4-mini", ctx: 200, priceIn: 1.1, priceOut: 4.4, reasoning: true },
  { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5", providerId: "anthropic", providerCode: "Anthropic", apiId: "claude-sonnet-4-5", ctx: 200, priceIn: 3, priceOut: 15, reasoning: true, vision: true },
  { id: "claude-haiku-4-5", name: "Claude Haiku 4.5", providerId: "anthropic", providerCode: "Anthropic", apiId: "claude-haiku-4-5", ctx: 200, priceIn: 1, priceOut: 5, vision: true },
  { id: "gemini-3-pro", name: "Gemini 3 Pro", providerId: "google", providerCode: "Google", apiId: "gemini-3-pro-preview", ctx: 1048, priceIn: 2, priceOut: 12, reasoning: true, vision: true },
  { id: "gemini-2-5-flash", name: "Gemini 2.5 Flash", providerId: "google", providerCode: "Google", apiId: "gemini-2.5-flash", ctx: 1048, priceIn: 0.3, priceOut: 2.5, reasoning: true, vision: true },
  { id: "deepseek-chat", name: "DeepSeek-V3 Chat", providerId: "deepseek", providerCode: "DeepSeek", apiId: "deepseek-chat", ctx: 128, priceIn: 0.27, priceOut: 1.1, open: true },
  { id: "deepseek-reasoner", name: "DeepSeek-R1", providerId: "deepseek", providerCode: "DeepSeek", apiId: "deepseek-reasoner", ctx: 128, priceIn: 0.55, priceOut: 2.19, reasoning: true, open: true },
  { id: "grok-4-fast", name: "Grok 4 Fast", providerId: "xai", providerCode: "xAI", apiId: "grok-4-fast-non-reasoning", ctx: 2000, priceIn: 0.2, priceOut: 0.5, vision: true },
  { id: "codestral", name: "Codestral", providerId: "mistral", providerCode: "Mistral", apiId: "codestral-latest", ctx: 256, priceIn: 0.3, priceOut: 0.9, open: true },
  { id: "llama-3-3-70b", name: "Llama 3.3 70B", providerId: "groq", providerCode: "Groq", apiId: "llama-3.3-70b-versatile", ctx: 128, priceIn: 0.59, priceOut: 0.79, open: true },
  { id: "qwen3-coder-fw", name: "Qwen3-Coder-480B", providerId: "fireworks", providerCode: "Fireworks", apiId: "accounts/fireworks/models/qwen3-coder-480b-a35b-instruct", ctx: 256, priceIn: 0.45, priceOut: 1.8, open: true },
  { id: "openrouter-auto", name: "Auto (роутинг)", providerId: "openrouter", providerCode: "OpenRouter", apiId: "openrouter/auto", ctx: 200, priceIn: null, priceOut: null },
  // Локальні
  { id: "ollama-qwen-coder", name: "Qwen2.5-Coder 7B", providerId: "ollama", providerCode: "Ollama", apiId: "qwen2.5-coder:7b", ctx: 32, priceIn: null, priceOut: null, open: true },
  { id: "ollama-llama", name: "Llama 3.1 8B", providerId: "ollama", providerCode: "Ollama", apiId: "llama3.1:8b", ctx: 128, priceIn: null, priceOut: null, open: true },
  { id: "lmstudio-model", name: "Модель LM Studio", providerId: "lmstudio", providerCode: "LM Studio", apiId: "local-model", ctx: 128, priceIn: null, priceOut: null, open: true },
  { id: "vllm-model", name: "Модель vLLM", providerId: "vllm", providerCode: "vLLM", apiId: "local-model", ctx: 128, priceIn: null, priceOut: null, open: true },
  { id: "llamacpp-model", name: "Модель llama.cpp", providerId: "llamacpp", providerCode: "llama.cpp", apiId: "local-model", ctx: 128, priceIn: null, priceOut: null, open: true },
];

export const modelById = new Map(MODELS.map((m) => [m.id, m]));
export const DEFAULT_MODEL_ID = "qwen3-max";

export function fmtCtx(k: number): string {
  if (k >= 1000) return `${k / 1000}M`;
  return `${k}K`;
}

export function fmtPrice(m: ModelInfo): string {
  if (m.priceIn === null) return "локально";
  if (m.priceIn === 0 && m.priceOut === 0) return "безкоштовно";
  return `$${m.priceIn}/$${m.priceOut}`;
}
