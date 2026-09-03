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

/* Every provider below offers a free tier (or is keyless / local). */
export const PROVIDERS: ProviderInfo[] = [
  { id: "pollinations", name: "Pollinations", kind: "cloud", baseUrl: "https://text.pollinations.ai", docs: "https://pollinations.ai", note: "Keyless free models, SSE streaming.", accent: "#ffc24b", keyless: true },
  { id: "google", name: "Google AI Studio", kind: "cloud", baseUrl: "https://generativelanguage.googleapis.com/v1beta", keyName: "GOOGLE_API_KEY", keyUrl: "https://aistudio.google.com/apikey", docs: "https://ai.google.dev", note: "Free Gemini keys, 1M context.", accent: "#54c8ff" },
  { id: "groq", name: "Groq", kind: "inference", baseUrl: "https://api.groq.com/openai/v1", keyName: "GROQ_API_KEY", keyUrl: "https://console.groq.com/keys", docs: "https://console.groq.com/docs", note: "Free tier, 500+ tok/s.", accent: "#f55036" },
  { id: "cerebras", name: "Cerebras", kind: "inference", baseUrl: "https://api.cerebras.ai/v1", keyName: "CEREBRAS_API_KEY", keyUrl: "https://cloud.cerebras.ai", docs: "https://inference-docs.cerebras.ai", note: "Free tier, fastest Llama.", accent: "#b691ff" },
  { id: "sambanova", name: "SambaNova", kind: "inference", baseUrl: "https://api.sambanova.ai/v1", keyName: "SAMBANOVA_API_KEY", keyUrl: "https://cloud.sambanova.ai", docs: "https://docs.sambanova.ai", note: "Free tier for open models.", accent: "#ff5c5c" },
  { id: "huggingface", name: "Hugging Face", kind: "inference", baseUrl: "https://router.huggingface.co/v1", keyName: "HF_TOKEN", keyUrl: "https://huggingface.co/settings/tokens", docs: "https://huggingface.co/docs/inference-providers", note: "Free token, inference router.", accent: "#ffd21e" },
  { id: "openrouter", name: "OpenRouter", kind: "aggregator", baseUrl: "https://openrouter.ai/api/v1", keyName: "OPENROUTER_API_KEY", keyUrl: "https://openrouter.ai/keys", docs: "https://openrouter.ai/docs", note: "Aggregator with :free variants.", accent: "#ffb454" },
  { id: "qwen", name: "Qwen Cloud", kind: "cloud", baseUrl: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1", keyName: "DASHSCOPE_API_KEY", keyUrl: "https://bailian.console.alibabacloud.com", docs: "https://www.alibabacloud.com/help/en/model-studio", note: "Free grant for new accounts.", accent: "#b795ff" },
  { id: "xai", name: "xAI", kind: "cloud", baseUrl: "https://api.x.ai/v1", keyName: "XAI_API_KEY", keyUrl: "https://console.x.ai", docs: "https://docs.x.ai/docs", note: "Free monthly grant.", accent: "#cfd8e3" },
  { id: "mistral", name: "Mistral", kind: "cloud", baseUrl: "https://api.mistral.ai/v1", keyName: "MISTRAL_API_KEY", keyUrl: "https://console.mistral.ai/api-keys", docs: "https://docs.mistral.ai", note: "Free experimentation tier.", accent: "#ff7000" },
  { id: "cohere", name: "Cohere", kind: "cloud", baseUrl: "https://api.cohere.ai/compatibility/v1", keyName: "COHERE_API_KEY", keyUrl: "https://dashboard.cohere.com/api-keys", docs: "https://docs.cohere.com", note: "Free trial keys.", accent: "#f45da0" },
  { id: "deepseek", name: "DeepSeek", kind: "cloud", baseUrl: "https://api.deepseek.com/v1", keyName: "DEEPSEEK_API_KEY", keyUrl: "https://platform.deepseek.com/api_keys", docs: "https://api-docs.deepseek.com", note: "Free quota on sign-up.", accent: "#6f8bff" },
  { id: "zai", name: "Z.AI (GLM)", kind: "cloud", baseUrl: "https://api.z.ai/api/paas/v4", keyName: "ZAI_API_KEY", keyUrl: "https://z.ai/manage-apikey/apikey-list", docs: "https://docs.z.ai", note: "GLM models with free credits.", accent: "#3ddbb8" },
  { id: "nvidia", name: "NVIDIA NIM", kind: "inference", baseUrl: "https://integrate.api.nvidia.com/v1", keyName: "NVIDIA_API_KEY", keyUrl: "https://build.nvidia.com", docs: "https://docs.api.nvidia.com", note: "1,000 free credits.", accent: "#76b900" },
  { id: "siliconflow", name: "SiliconFlow", kind: "inference", baseUrl: "https://api.siliconflow.com/v1", keyName: "SILICONFLOW_API_KEY", keyUrl: "https://cloud.siliconflow.cn/account/ak", docs: "https://docs.siliconflow.cn", note: "Free tokens for new users.", accent: "#5ec8f2" },
  { id: "github", name: "GitHub Models", kind: "cloud", baseUrl: "https://models.inference.ai.azure.com", keyName: "GITHUB_TOKEN", keyUrl: "https://github.com/settings/tokens", docs: "https://docs.github.com/github-models", note: "Free via gh auth, rate-limited.", accent: "#cfd8e3" },
  { id: "cloudflare", name: "Cloudflare AI", kind: "cloud", baseUrl: "https://api.ai.cloudflare.com/v1", keyName: "CLOUDFLARE_API_TOKEN", keyUrl: "https://developers.cloudflare.com/ai-gateway", docs: "https://developers.cloudflare.com/ai-gateway", note: "Free AI Gateway router.", accent: "#f6821f" },
  { id: "ollama", name: "Ollama", kind: "local", local: true, baseUrl: "http://localhost:11434/v1", docs: "https://github.com/ollama/ollama", note: "Local models, port 11434.", accent: "#2dd4bf" },
  { id: "lmstudio", name: "LM Studio", kind: "local", local: true, baseUrl: "http://localhost:1234/v1", docs: "https://lmstudio.ai/docs", note: "Desktop GGUF server, port 1234.", accent: "#c084fc" },
  { id: "vllm", name: "vLLM", kind: "local", local: true, baseUrl: "http://localhost:8000/v1", docs: "https://docs.vllm.ai", note: "vllm serve <model>, port 8000.", accent: "#60a5fa" },
  { id: "llamacpp", name: "llama.cpp", kind: "local", local: true, baseUrl: "http://localhost:8080/v1", docs: "https://github.com/ggerganov/llama.cpp", note: "llama-server, port 8080.", accent: "#a3e635" },
  { id: "localai", name: "LocalAI", kind: "local", local: true, baseUrl: "http://localhost:8080/v1", docs: "https://localai.io", note: "Docker, OpenAI-compatible.", accent: "#34d399" },
  { id: "kobold", name: "KoboldCPP", kind: "local", local: true, baseUrl: "http://localhost:5001/v1", docs: "https://github.com/LostRuins/koboldcpp", note: "Single binary, port 5001.", accent: "#f472b6" },
];

export const providerById = new Map(PROVIDERS.map((p) => [p.id, p]));

export const KIND_LABEL: Record<ProviderKind, string> = {
  aggregator: "Aggregator",
  cloud: "Cloud · free tier",
  inference: "Inference · free tier",
  local: "Local runtime",
};
