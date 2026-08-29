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
  keyless?: boolean;
}

export const PROVIDERS: ProviderInfo[] = [
  {
    id: "pollinations", name: "Pollinations", kind: "cloud",
    baseUrl: "https://text.pollinations.ai",
    docs: "https://pollinations.ai",
    note: "Keyless free models, streams via SSE.",
    accent: "#ffc24b",
    keyless: true,
  },
  {
    id: "google", name: "Google AI Studio", kind: "cloud",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    keyName: "GOOGLE_API_KEY", keyUrl: "https://aistudio.google.com/apikey", docs: "https://ai.google.dev",
    note: "Free Gemini keys, 1M context.",
    accent: "#54c8ff",
  },
  {
    id: "cloudflare", name: "Cloudflare AI", kind: "cloud",
    baseUrl: "https://api.ai.cloudflare.com/v1",
    keyName: "CLOUDFLARE_API_TOKEN", keyUrl: "https://developers.cloudflare.com/ai-gateway", docs: "https://developers.cloudflare.com/ai-gateway",
    note: "Free AI Gateway router.",
    accent: "#f6821f",
  },
  {
    id: "github", name: "GitHub Models", kind: "cloud",
    baseUrl: "https://models.inference.ai.azure.com",
    keyName: "GITHUB_TOKEN", keyUrl: "https://github.com/settings/tokens", docs: "https://docs.github.com/github-models",
    note: "Free via `gh auth`, rate-limited.",
    accent: "#cfd8e3",
  },
  {
    id: "huggingface", name: "Hugging Face", kind: "inference",
    baseUrl: "https://router.huggingface.co/v1",
    keyName: "HF_TOKEN", keyUrl: "https://huggingface.co/settings/tokens", docs: "https://huggingface.co/docs/inference-providers",
    note: "Free token, inference router.",
    accent: "#ffd21e",
  },
  {
    id: "openrouter", name: "OpenRouter", kind: "aggregator",
    baseUrl: "https://openrouter.ai/api/v1",
    keyName: "OPENROUTER_API_KEY", keyUrl: "https://openrouter.ai/keys", docs: "https://openrouter.ai/docs",
    note: "Aggregator with `:free` variants.",
    accent: "#ffb454",
  },
  {
    id: "groq", name: "Groq", kind: "inference",
    baseUrl: "https://api.groq.com/openai/v1",
    keyName: "GROQ_API_KEY", keyUrl: "https://console.groq.com/keys", docs: "https://console.groq.com/docs",
    note: "Free tier, 500+ tok/s.",
    accent: "#f55036",
  },
  {
    id: "cerebras", name: "Cerebras", kind: "inference",
    baseUrl: "https://api.cerebras.ai/v1",
    keyName: "CEREBRAS_API_KEY", keyUrl: "https://cloud.cerebras.ai", docs: "https://inference-docs.cerebras.ai",
    note: "Free tier, fastest Llama.",
    accent: "#b691ff",
  },
  {
    id: "sambanova", name: "SambaNova", kind: "inference",
    baseUrl: "https://api.sambanova.ai/v1",
    keyName: "SAMBANOVA_API_KEY", keyUrl: "https://cloud.sambanova.ai", docs: "https://docs.sambanova.ai",
    note: "Free tier for open models.",
    accent: "#ff5c5c",
  },
  {
    id: "ollama", name: "Ollama", kind: "local", local: true,
    baseUrl: "http://localhost:11434/v1",
    docs: "https://github.com/ollama/ollama",
    note: "Local models, port 11434.",
    accent: "#2dd4bf",
  },
  {
    id: "lmstudio", name: "LM Studio", kind: "local", local: true,
    baseUrl: "http://localhost:1234/v1",
    docs: "https://lmstudio.ai/docs",
    note: "Desktop GGUF server, port 1234.",
    accent: "#c084fc",
  },
  {
    id: "vllm", name: "vLLM", kind: "local", local: true,
    baseUrl: "http://localhost:8000/v1",
    docs: "https://docs.vllm.ai",
    note: "`vllm serve <model>`, port 8000.",
    accent: "#60a5fa",
  },
  {
    id: "llamacpp", name: "llama.cpp", kind: "local", local: true,
    baseUrl: "http://localhost:8080/v1",
    docs: "https://github.com/ggerganov/llama.cpp",
    note: "`llama-server`, port 8080.",
    accent: "#a3e635",
  },
  {
    id: "localai", name: "LocalAI", kind: "local", local: true,
    baseUrl: "http://localhost:8080/v1",
    docs: "https://localai.io",
    note: "Docker, OpenAI-compatible.",
    accent: "#34d399",
  },
  {
    id: "kobold", name: "KoboldCPP", kind: "local", local: true,
    baseUrl: "http://localhost:5001/v1",
    docs: "https://github.com/LostRuins/koboldcpp",
    note: "Single binary, port 5001.",
    accent: "#f472b6",
  },
];

export const providerById = new Map(PROVIDERS.map((p) => [p.id, p]));

export const KIND_LABEL: Record<ProviderKind, string> = {
  aggregator: "Aggregator",
  cloud: "Cloud · free tier",
  inference: "Inference · free tier",
  local: "Local runtime",
};
