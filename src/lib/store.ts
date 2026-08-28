export type Role = "user" | "assistant";

export interface Message {
  id: string;
  role: Role;
  content: string;
  modelId?: string;
  demo?: boolean;
  stopped?: boolean;
  ts: number;
}

export interface Conversation {
  id: string;
  title: string;
  modelId: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface GenParams {
  temperature: number;
  topP: number;
  maxTokens: number;
  system: string;
}

export interface ProviderCfg {
  key: string;
  baseUrl: string;
}

export const DEFAULT_PARAMS: GenParams = {
  temperature: 0.7,
  topP: 0.95,
  maxTokens: 4096,
  system: "Ти — QStudio, мультипровайдерний асистент. Відповідай українською, стисло і по суті, з markdown-форматуванням там, де це доречно.",
};

export function uid(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

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
    /* quota / private mode — ігноруємо */
  }
}

export function newConversation(modelId: string): Conversation {
  const now = Date.now();
  return { id: uid(), title: "Нова розмова", modelId, messages: [], createdAt: now, updatedAt: now };
}

export function estTokens(s: string): number {
  return Math.max(1, Math.round(s.length / 3.6));
}

export function fmtTime(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  if (sameDay) return `${hh}:${mm}`;
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")} ${hh}:${mm}`;
}
