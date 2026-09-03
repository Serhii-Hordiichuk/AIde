export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  modelId?: string;
  error?: boolean;
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

export const DEFAULT_PARAMS: GenParams = { temperature: 0.7, topP: 0.95, maxTokens: 2048, system: "" };

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

export function wipeAll() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(NS))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export function newConversation(): Conversation {
  return { id: uid(), title: "", messages: [], createdAt: Date.now() };
}
