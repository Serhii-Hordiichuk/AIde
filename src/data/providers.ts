export type ProviderKind = "aggregator" | "cloud" | "inference" | "local";

export interface ProviderInfo {
  id: string;
  name: string;
  kind: ProviderKind;
  baseUrl: string;
  keyName?: string;
  keyUrl?: string;
  docs: string;
  note: string;
  accent: string;
  local?: boolean;
}

export const PROVIDERS: ProviderInfo[] = [
  {
    id: "openrouter", name: "OpenRouter", kind: "aggregator",
    baseUrl: "https://openrouter.ai/api/v1",
    keyName: "OPENROUTER_API_KEY", keyUrl: "https://openrouter.ai/keys", docs: "https://openrouter.ai/docs",
    note: "Aggregator #1: 300+ models from every vendor under one key, with routing and fallbacks.",
    accent: "#ffb454",
  },
  {
    id: "openai", name: "OpenAI", kind: "cloud",
    baseUrl: "https://api.openai.com/v1",
    keyName: "OPENAI_API_KEY", keyUrl: "https://platform.openai.com/api-keys", docs: "https://platform.openai.com/docs",
    note: "GPT-4.1, o3/o4-mini — straight from platform.openai.com.",
    accent: "#3ecf8e",
  },
  {
    id: "anthropic", name: "Anthropic", kind: "cloud",
    baseUrl: "https://api.anthropic.com/v1",
    keyName: "ANTHROPIC_API_KEY", keyUrl: "https://console.anthropic.com/settings/keys", docs: "https://docs.anthropic.com",
    note: "Claude Opus / Sonnet / Haiku 4.5 via the Messages API (SSE streaming).",
    accent: "#ff6b6b",
  },
  {
    id: "google", name: "Google AI Studio", kind: "cloud",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    keyName: "GOOGLE_API_KEY", keyUrl: "https://aistudio.google.com/apikey", docs: "https://ai.google.dev/gemini-api/docs",
    note: "Gemini 2.5 / 3 Pro with up to 1M-token context and a generous free tier.",
    accent: "#54c8ff",
  },
  {
    id: "deepseek", name: "DeepSeek", kind: "cloud",
    baseUrl: "https://api.deepseek.com/v1",
    keyName: "DEEPSEEK_API_KEY", keyUrl: "https://platform.deepseek.com/api_keys", docs: "https://api-docs.deepseek.com",
    note: "V3-Chat and R1-Reasoner — the best price/quality among top-tier models.",
    accent: "#6f8bff",
  },
  {
    id: "xai", name: "xAI", kind: "cloud",
    baseUrl: "https://api.x.ai/v1",
    keyName: "XAI_API_KEY", keyUrl: "https://console.x.ai/", docs: "https://docs.x.ai/docs",
    note: "Grok 4 and Grok 4 Fast with realtime data and huge context windows.",
    accent: "#cfd8e3",
  },
  {
    id: "mistral", name: "Mistral AI", kind: "cloud",
    baseUrl: "https://api.mistral.ai/v1",
    keyName: "MISTRAL_API_KEY", keyUrl: "https://console.mistral.ai/api-keys", docs: "https://docs.mistral.ai",
    note: "Large, Medium and Codestral — strong European models, OpenAI-compatible.",
    accent: "#ff7000",
  },
  {
    id: "cohere", name: "Cohere", kind: "cloud",
    baseUrl: "https://api.cohere.ai/compatibility/v1",
    keyName: "COHERE_API_KEY", keyUrl: "https://dashboard.cohere.com/api-keys", docs: "https://docs.cohere.com",
    note: "Command A — a multilingual model tuned for RAG and agents.",
    accent: "#f45da0",
  },
  {
    id: "perplexity", name: "Perplexity", kind: "cloud",
    baseUrl: "https://api.perplexity.ai",
    keyName: "PERPLEXITY_API_KEY", keyUrl: "https://www.perplexity.ai/settings/api", docs: "https://docs.perplexity.ai",
    note: "Sonar models with realtime web search baked in.",
    accent: "#22b8cf",
  },
  {
    id: "groq", name: "Groq", kind: "inference",
    baseUrl: "https://api.groq.com/openai/v1",
    keyName: "GROQ_API_KEY", keyUrl: "https://console.groq.com/keys", docs: "https://console.groq.com/docs",
    note: "LPU inference: 500+ tok/s. Llama, GPT-OSS and other open weights.",
    accent: "#f55036",
  },
  {
    id: "together", name: "Together AI", kind: "inference",
    baseUrl: "https://api.together.xyz/v1",
    keyName: "TOGETHER_API_KEY", keyUrl: "https://api.together.xyz/settings/api-keys", docs: "https://docs.together.ai",
    note: "A huge open-model catalog: Llama 4, DeepSeek-V3, Mistral and more.",
    accent: "#0f9d8f",
  },
  {
    id: "fireworks", name: "Fireworks", kind: "inference",
    baseUrl: "https://api.fireworks.ai/inference/v1",
    keyName: "FIREWORKS_API_KEY", keyUrl: "https://fireworks.ai/api-keys", docs: "https://docs.fireworks.ai",
    note: "Fast inference for open models, including Llama 3.1 405B.",
    accent: "#f05a28",
  },
  {
    id: "cerebras", name: "Cerebras", kind: "inference",
    baseUrl: "https://api.cerebras.ai/v1",
    keyName: "CEREBRAS_API_KEY", keyUrl: "https://cloud.cerebras.ai/", docs: "https://inference-docs.cerebras.ai",
    note: "Wafer-scale chips: the fastest Llama inference in the world.",
    accent: "#b691ff",
  },
  {
    id: "sambanova", name: "SambaNova", kind: "inference",
    baseUrl: "https://api.sambanova.ai/v1",
    keyName: "SAMBANOVA_API_KEY", keyUrl: "https://cloud.sambanova.ai/", docs: "https://docs.sambanova.ai",
    note: "RDU cloud with a free tier for Llama 4 and other open models.",
    accent: "#ff5c5c",
  },
  {
    id: "huggingface", name: "Hugging Face", kind: "inference",
    baseUrl: "https://router.huggingface.co/v1",
    keyName: "HF_TOKEN", keyUrl: "https://huggingface.co/settings/tokens", docs: "https://huggingface.co/docs/inference-providers",
    note: "HF Inference: routes between providers straight from the Hub.",
    accent: "#ffd21e",
  },
  {
    id: "ollama", name: "Ollama", kind: "local", local: true,
    baseUrl: "http://localhost:11434/v1",
    docs: "https://github.com/ollama/ollama",
    note: "Local models in one command: `ollama run deepseek-coder-v2:16b`. OpenAI-compatible port 11434.",
    accent: "#2dd4bf",
  },
  {
    id: "lmstudio", name: "LM Studio", kind: "local", local: true,
    baseUrl: "http://localhost:1234/v1",
    docs: "https://lmstudio.ai/docs",
    note: "Desktop GGUF model server: enable Local Server on port 1234.",
    accent: "#c084fc",
  },
  {
    id: "vllm", name: "vLLM", kind: "local", local: true,
    baseUrl: "http://localhost:8000/v1",
    docs: "https://docs.vllm.ai",
    note: "Production inference server with PagedAttention. `vllm serve deepseek-ai/DeepSeek-V3`.",
    accent: "#60a5fa",
  },
  {
    id: "llamacpp", name: "llama.cpp", kind: "local", local: true,
    baseUrl: "http://localhost:8080/v1",
    docs: "https://github.com/ggerganov/llama.cpp",
    note: "Maximum control: `llama-server -m model.gguf --port 8080`.",
    accent: "#a3e635",
  },
  {
    id: "localai", name: "LocalAI", kind: "local", local: true,
    baseUrl: "http://localhost:8080/v1",
    docs: "https://localai.io",
    note: "Self-hosted 'OpenAI API replacement' in Docker: text, voice, images.",
    accent: "#34d399",
  },
  {
    id: "kobold", name: "KoboldCPP", kind: "local", local: true,
    baseUrl: "http://localhost:5001/v1",
    docs: "https://github.com/LostRuins/koboldcpp",
    note: "A single binary for CPU/GPU GGUF inference, port 5001.",
    accent: "#f472b6",
  },
];

export const providerById = new Map(PROVIDERS.map((p) => [p.id, p]));

export const KIND_LABEL: Record<ProviderKind, string> = {
  aggregator: "Aggregator",
  cloud: "Cloud API",
  inference: "Inference cloud",
  local: "Local runtime",
};
