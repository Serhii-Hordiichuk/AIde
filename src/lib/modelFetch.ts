import type { ProviderInfo } from "../data/providers";
import type { ProviderCfg } from "./store";

/* Live model discovery: asks each provider which models are actually
   available right now (GET /models), so the catalog never goes stale. */

export interface LiveCatalog {
  [providerId: string]: { models: string[]; at: number };
}

const TTL_MS = 6 * 60 * 60 * 1000; // 6h cache

export function freshEntries(catalog: LiveCatalog): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  const now = Date.now();
  for (const [pid, entry] of Object.entries(catalog)) {
    if (entry && Array.isArray(entry.models) && now - entry.at < TTL_MS) out[pid] = entry.models;
  }
  return out;
}

function base(cfg: ProviderCfg, p: ProviderInfo): string {
  return (cfg.baseUrl?.trim() || p.baseUrl).replace(/\/+$/, "");
}

function authHeaders(p: ProviderInfo, cfg: ProviderCfg): Record<string, string> {
  const key = cfg.key?.trim();
  if (!key) return {};
  const h: Record<string, string> = { Authorization: `Bearer ${key}` };
  if (p.id === "huggingface") h["x-api-key"] = key;
  return h;
}

/** Returns model api-ids available at this provider right now. Throws on failure. */
export async function fetchProviderModels(
  p: ProviderInfo,
  cfg: ProviderCfg,
  timeoutMs = 8000
): Promise<string[]> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), p.local ? Math.min(timeoutMs, 2500) : timeoutMs);
  try {
    if (p.id === "google") {
      const key = cfg.key?.trim();
      if (!key) throw new Error("no key");
      const res = await fetch(`${base(cfg, p)}/models?key=${encodeURIComponent(key)}&pageSize=200`, {
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const list: { name?: string }[] = json?.models ?? [];
      return list.map((m) => (m.name ?? "").replace(/^models\//, "")).filter((n) => n.length > 0);
    }

    if (p.id === "pollinations") {
      const res = await fetch(`${base(cfg, p)}/models`, { signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const arr: unknown[] = Array.isArray(json) ? json : json?.data ?? [];
      return arr
        .map((m) => (typeof m === "string" ? m : (m as { name?: string })?.name ?? ""))
        .filter((n) => n.length > 0);
    }

    // OpenAI-compatible: OpenRouter, Groq, Cerebras, SambaNova, HF, Cloudflare, GitHub, local runtimes
    const res = await fetch(`${base(cfg, p)}/models`, {
      headers: authHeaders(p, cfg),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const arr: unknown[] = Array.isArray(json) ? json : json?.data ?? json?.models ?? json?.result ?? [];
    return arr
      .map((m) =>
        typeof m === "string" ? m : (m as { id?: string; name?: string })?.id ?? (m as { name?: string })?.name ?? ""
      )
      .filter((n) => n.length > 0)
      .slice(0, 120);
  } finally {
    clearTimeout(t);
  }
}
