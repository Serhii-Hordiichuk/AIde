export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  modelId?: string;
  demo?: boolean;
  ts: number;
  tokens?: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
}

export interface GenParams {
  temperature: number;
  topP: number;
  maxTokens: number;
  system: string;
}

export const DEFAULT_PARAMS: GenParams = {
  temperature: 0.7,
  topP: 0.95,
  maxTokens: 4096,
  system: "",
};

export interface ProjectFile {
  name: string;
  content: string;
}

export interface Project {
  id: string;
  name: string;
  prompt: string;
  templateId: string;
  files: ProjectFile[];
  createdAt: number;
  status: "building" | "ready";
}

export interface ProviderCfg {
  key: string;
  baseUrl: string;
}

const NS = "aide.";

export function load<T>(k: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(NS + k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function save(k: string, v: unknown) {
  try {
    localStorage.setItem(NS + k, JSON.stringify(v));
  } catch {
    /* ignore quota */
  }
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export function newConversation(): Conversation {
  return { id: uid(), title: "New chat", messages: [], createdAt: Date.now() };
}
