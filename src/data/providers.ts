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
    note: "Агрегатор №1: 300+ моделей усіх вендорів в одному ключі, з роутингом і fallback.",
    accent: "#ffb454",
  },
  {
    id: "dashscope", name: "Qwen · DashScope", kind: "cloud",
    baseUrl: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    keyName: "DASHSCOPE_API_KEY", keyUrl: "https://bailian.console.aliyun.com/", docs: "https://help.aliyun.com/zh/model-studio",
    note: "Рідна домівка Qwen: qwen3-max і Coder-моделі за найнижчими цінами.",
    accent: "#b795ff",
  },
  {
    id: "openai", name: "OpenAI", kind: "cloud",
    baseUrl: "https://api.openai.com/v1",
    keyName: "OPENAI_API_KEY", keyUrl: "https://platform.openai.com/api-keys", docs: "https://platform.openai.com/docs",
    note: "GPT-4.1, o3/o4-mini — напряму з platform.openai.com.",
    accent: "#3ecf8e",
  },
  {
    id: "anthropic", name: "Anthropic", kind: "cloud",
    baseUrl: "https://api.anthropic.com/v1",
    keyName: "ANTHROPIC_API_KEY", keyUrl: "https://console.anthropic.com/settings/keys", docs: "https://docs.anthropic.com",
    note: "Claude Opus / Sonnet / Haiku 4.5 через Messages API (SSE-стрімінг).",
    accent: "#ff6b6b",
  },
  {
    id: "google", name: "Google AI Studio", kind: "cloud",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    keyName: "GOOGLE_API_KEY", keyUrl: "https://aistudio.google.com/apikey", docs: "https://ai.google.dev/gemini-api/docs",
    note: "Gemini 2.5 / 3 Pro з контекстом до 1 млн токенів, щедро безкоштовне тирло.",
    accent: "#54c8ff",
  },
  {
    id: "deepseek", name: "DeepSeek", kind: "cloud",
    baseUrl: "https://api.deepseek.com/v1",
    keyName: "DEEPSEEK_API_KEY", keyUrl: "https://platform.deepseek.com/api_keys", docs: "https://api-docs.deepseek.com",
    note: "V3-Chat і R1-Reasoner — найкраща ціна/якість серед топових моделей.",
    accent: "#6f8bff",
  },
  {
    id: "xai", name: "xAI", kind: "cloud",
    baseUrl: "https://api.x.ai/v1",
    keyName: "XAI_API_KEY", keyUrl: "https://console.x.ai/", docs: "https://docs.x.ai/docs",
    note: "Grok 4 та Grok 4 Fast з реальним часом і величезним контекстом.",
    accent: "#cfd8e3",
  },
  {
    id: "mistral", name: "Mistral AI", kind: "cloud",
    baseUrl: "https://api.mistral.ai/v1",
    keyName: "MISTRAL_API_KEY", keyUrl: "https://console.mistral.ai/api-keys", docs: "https://docs.mistral.ai",
    note: "Large, Medium і Codestral — сильні європейські моделі, OpenAI-сумісні.",
    accent: "#ff7000",
  },
  {
    id: "cohere", name: "Cohere", kind: "cloud",
    baseUrl: "https://api.cohere.ai/compatibility/v1",
    keyName: "COHERE_API_KEY", keyUrl: "https://dashboard.cohere.com/api-keys", docs: "https://docs.cohere.com",
    note: "Command A — мультиязычна модель, заточена під RAG і агентів.",
    accent: "#f45da0",
  },
  {
    id: "perplexity", name: "Perplexity", kind: "cloud",
    baseUrl: "https://api.perplexity.ai",
    keyName: "PERPLEXITY_API_KEY", keyUrl: "https://www.perplexity.ai/settings/api", docs: "https://docs.perplexity.ai",
    note: "Sonar-моделі з пошуком у мережі в реальному часі.",
    accent: "#22b8cf",
  },
  {
    id: "groq", name: "Groq", kind: "inference",
    baseUrl: "https://api.groq.com/openai/v1",
    keyName: "GROQ_API_KEY", keyUrl: "https://console.groq.com/keys", docs: "https://console.groq.com/docs",
    note: "LPU-інференс: 500+ tok/s. Llama, GPT-OSS та Qwen у відкритих вагах.",
    accent: "#f55036",
  },
  {
    id: "together", name: "Together AI", kind: "inference",
    baseUrl: "https://api.together.xyz/v1",
    keyName: "TOGETHER_API_KEY", keyUrl: "https://api.together.xyz/settings/api-keys", docs: "https://docs.together.ai",
    note: "Величезний каталог open-моделей: Llama 4, Qwen3, DeepSeek-V3.",
    accent: "#0f9d8f",
  },
  {
    id: "fireworks", name: "Fireworks", kind: "inference",
    baseUrl: "https://api.fireworks.ai/inference/v1",
    keyName: "FIREWORKS_API_KEY", keyUrl: "https://fireworks.ai/api-keys", docs: "https://docs.fireworks.ai",
    note: "Швидкий інференс open-моделей, включно з Qwen3-Coder-480B.",
    accent: "#f05a28",
  },
  {
    id: "cerebras", name: "Cerebras", kind: "inference",
    baseUrl: "https://api.cerebras.ai/v1",
    keyName: "CEREBRAS_API_KEY", keyUrl: "https://cloud.cerebras.ai/", docs: "https://inference-docs.cerebras.ai",
    note: "Wafer-scale чипи: найшвидший інференс Qwen3-Coder і Llama у світі.",
    accent: "#b691ff",
  },
  {
    id: "sambanova", name: "SambaNova", kind: "inference",
    baseUrl: "https://api.sambanova.ai/v1",
    keyName: "SAMBANOVA_API_KEY", keyUrl: "https://cloud.sambanova.ai/", docs: "https://docs.sambanova.ai",
    note: "RDU-хмара з безкоштовним тирло для Qwen3-235B та Llama 4.",
    accent: "#ff5c5c",
  },
  {
    id: "huggingface", name: "Hugging Face", kind: "inference",
    baseUrl: "https://router.huggingface.co/v1",
    keyName: "HF_TOKEN", keyUrl: "https://huggingface.co/settings/tokens", docs: "https://huggingface.co/docs/inference-providers",
    note: "HF Inference: маршрутизація між провайдерами прямо з_hub'у.",
    accent: "#ffd21e",
  },
  {
    id: "ollama", name: "Ollama", kind: "local", local: true,
    baseUrl: "http://localhost:11434/v1",
    docs: "https://github.com/ollama/ollama",
    note: "Локальні моделі однією командою: `ollama run qwen2.5-coder:7b`. OpenAI-сумісний порт 11434.",
    accent: "#2dd4bf",
  },
  {
    id: "lmstudio", name: "LM Studio", kind: "local", local: true,
    baseUrl: "http://localhost:1234/v1",
    docs: "https://lmstudio.ai/docs",
    note: "Десктопний сервер GGUF-моделей: увімкни Local Server на порту 1234.",
    accent: "#c084fc",
  },
  {
    id: "vllm", name: "vLLM", kind: "local", local: true,
    baseUrl: "http://localhost:8000/v1",
    docs: "https://docs.vllm.ai",
    note: "Продакшн-сервер інференсу з PagedAttention. `vllm serve Qwen/Qwen3-8B`.",
    accent: "#60a5fa",
  },
  {
    id: "llamacpp", name: "llama.cpp", kind: "local", local: true,
    baseUrl: "http://localhost:8080/v1",
    docs: "https://github.com/ggerganov/llama.cpp",
    note: "Максимальний контроль: `llama-server -m model.gguf --port 8080`.",
    accent: "#a3e635",
  },
  {
    id: "localai", name: "LocalAI", kind: "local", local: true,
    baseUrl: "http://localhost:8080/v1",
    docs: "https://localai.io",
    note: "Self-hosted 'заміна OpenAI API' у Docker: текст, голос, зображення.",
    accent: "#34d399",
  },
  {
    id: "kobold", name: "KoboldCPP", kind: "local", local: true,
    baseUrl: "http://localhost:5001/v1",
    docs: "https://github.com/LostRuins/koboldcpp",
    note: "Один бінарник для CPU/GPU-інференсу GGUF, порт 5001.",
    accent: "#f472b6",
  },
];

export const providerById = new Map(PROVIDERS.map((p) => [p.id, p]));

export const KIND_LABEL: Record<ProviderKind, string> = {
  aggregator: "Агрегатор",
  cloud: "Хмарне API",
  inference: "Інференс-хмара",
  local: "Локальний рантайм",
};
