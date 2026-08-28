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
  /** works with no API key at all */
  keyless?: boolean;
}

/* Every provider below is FREE: keyless cloud, free tier, or local runtime. */
export const PROVIDERS: ProviderInfo[] = [
  {
    id: "pollinations", name: "Pollinations", kind: "cloud",
    baseUrl: "https://text.pollinations.ai",
    docs: "https://github.com/pollinations/pollinations/blob/master/APIDOCS.md",
    note: "Keyless free cloud inference — GPT, Llama and Mistral hosted models. Works out of the box, no signup.",
    accent: "#31e5ae",
    keyless: true,
  },
  {
    id: "openrouter", name: "OpenRouter", kind: "aggregator",
    baseUrl: "https://openrouter.ai/api/v1",
    keyName: "OPENROUTER_API_KEY", keyUrl: "https://openrouter.ai/keys", docs: "https://openrouter.ai/docs",
    note: "Free-tier aggregator: hundreds of `:free` models under one key with routing and fallbacks.",
    accent: "#ffb454",
  },
  {
    id: "google", name: "Google AI Studio", kind: "cloud",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    keyName: "GOOGLE_API_KEY", keyUrl: "https://aistudio.google.com/apikey", docs: "https://ai.google.dev/gemini-api/docs",
    note: "Gemini free tier: generous requests-per-day quota and up to 1M-token context. Free key from AI Studio.",
    accent: "#54c8ff",
  },
  {
    id: "groq", name: "Groq", kind: "inference",
    baseUrl: "https://api.groq.com/openai/v1",
    keyName: "GROQ_API_KEY", keyUrl: "https://console.groq.com/keys", docs: "https://console.groq.com/docs",
    note: "Free LPU inference tier: 500+ tok/s for Llama and GPT-OSS open weights.",
    accent: "#f55036",
  },
  {
    id: "cerebras", name: "Cerebras", kind: "inference",
    baseUrl: "https://api.cerebras.ai/v1",
    keyName: "CEREBRAS_API_KEY", keyUrl: "https://cloud.cerebras.ai/", docs: "https://inference-docs.cerebras.ai",
    note: "Free tier on wafer-scale chips — the fastest Llama inference available.",
    accent: "#b691ff",
  },
  {
    id: "sambanova", name: "SambaNova", kind: "inference",
    baseUrl: "https://api.sambanova.ai/v1",
    keyName: "SAMBANOVA_API_KEY", keyUrl: "https://cloud.sambanova.ai/", docs: "https://docs.sambanova.ai",
    note: "Free RDU cloud tier for Llama 4 and other open models.",
    accent: "#ff5c5c",
  },
  {
    id: "huggingface", name: "Hugging Face", kind: "inference",
    baseUrl: "https://router.huggingface.co/v1",
    keyName: "HF_TOKEN", keyUrl: "https://huggingface.co/settings/tokens", docs: "https://huggingface.co/docs/inference-providers",
    note: "Free HF Inference API with a token — routes open models straight from the Hub.",
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
  aggregator: "Aggregator · free tier",
  cloud: "Cloud · free",
  inference: "Inference · free tier",
  local: "Local runtime · free",
};
