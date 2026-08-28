export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinking?: string;
  model?: string;
  providerId?: string;
  demo?: boolean;
  tokens?: { in: number; out: number };
  cost?: number | null;
  ts: number;
}

export interface Conversation {
  id: string;
  title: string;
  modelId: string;
  messages: ChatMessage[];
  createdAt: number;
}

export interface ProviderCfg {
  key: string;
  baseUrl: string;
}

export interface GenParams {
  temperature: number;
  topP: number;
  maxTokens: number;
  system: string;
}

export interface ProjectFile {
  name: string;
  content: string;
}

export type ProjectStatus = "running" | "ready" | "failed";

export interface Project {
  id: string;
  name: string;
  desc: string;
  templateId: string;
  status: ProjectStatus;
  files: ProjectFile[];
  source: "demo" | "llm";
  createdAt: number;
}

export const DEFAULT_PARAMS: GenParams = {
  temperature: 0.7,
  topP: 0.95,
  maxTokens: 8192,
  system: "Ти — QStudio, helpful AI-асистент. Відповідай українською, стисло і по суті.",
};

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* переповнення сховища — ігноруємо */
  }
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function newConversation(modelId: string): Conversation {
  return { id: uid(), title: "Новий чат", modelId, messages: [], createdAt: Date.now() };
}

export function toast(msg: string) {
  window.dispatchEvent(new CustomEvent("qs-toast", { detail: msg }));
}
