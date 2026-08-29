import { PROVIDERS, providerById } from "./providers";

export interface ModelInfo {
  id: string;
  name: string;
  providerId: string;
  /** id sent to the API */
  apiId: string;
  /** context window, K tokens */
  ctx: number;
  /** $ per 1M input tokens — null for local, 0 for free cloud */
  priceIn: number | null;
  priceOut: number | null;
  vision?: boolean;
  reasoning?: boolean;
  open?: boolean;
  tags: string[];
}

/* No hardcoded models. The catalog is discovered live from each provider's
   /models endpoint (see lib/modelFetch.ts), so nothing here can go stale.
   The keyless fallback below guarantees the app works with zero config. */
export const MODELS: ModelInfo[] = [];

/** Always-available keyless fallback (Pollinations needs no key). */
export const FALLBACK_MODEL = syntheticModelSafe("pollinations", "openai");

function syntheticModelSafe(providerId: string, apiId: string): ModelInfo {
  return {
    id: `dyn:${providerId}:${apiId}`,
    name: `${apiId} · ${providerId}`,
    providerId,
    apiId,
    ctx: 128,
    priceIn: 0,
    priceOut: 0,
    open: true,
    tags: ["keyless", "fallback"],
  };
}

export const modelById = new Map(MODELS.map((m) => [m.id, m]));

/** Keyless by default — the app is fully functional with zero configuration. */
export const DEFAULT_MODEL_ID = "auto-free";

export function fmtPrice(m: ModelInfo): string {
  if (m.priceIn === null) return "local · $0";
  return "free · $0";
}

export function fmtCtx(k: number): string {
  if (k >= 1000) return `${(k / 1000).toFixed(k % 1000 === 0 ? 0 : 1)}M`;
  return `${k}K`;
}

/* ---------------- smart routing (all routes are free) ---------------- */

export function isAutoModel(id: string): boolean {
  return id === "auto-free" || id === "auto-local";
}

export const AUTO_LABEL: Record<string, string> = {
  "auto-free": "auto free",
  "auto-local": "auto local",
};

interface Cfg {
  key: string;
  baseUrl: string;
}

const LOCAL_PROVIDERS = new Set(
  ["ollama", "lmstudio", "vllm", "llamacpp", "localai", "kobold"]
);

/* ---------------- live (dynamically fetched) models ---------------- */

const DYN = "dyn:";

/** Stable id for a model discovered from a provider's /models endpoint. */
export function dynId(providerId: string, apiId: string): string {
  return `${DYN}${providerId}:${apiId}`;
}

export function parseDynId(id: string): { providerId: string; apiId: string } | null {
  if (!id.startsWith(DYN)) return null;
  const rest = id.slice(DYN.length);
  const idx = rest.indexOf(":");
  if (idx < 0) return null;
  return { providerId: rest.slice(0, idx), apiId: rest.slice(idx + 1) };
}

/** Builds a ModelInfo for a model fetched live from a provider API. */
export function syntheticModel(providerId: string, apiId: string): ModelInfo {
  const p = providerById.get(providerId);
  return {
    id: dynId(providerId, apiId),
    name: apiId,
    providerId,
    apiId,
    ctx: 128,
    priceIn: p?.local ? null : 0,
    priceOut: p?.local ? null : 0,
    open: true,
    tags: ["live"],
  };
}

/** Resolves any model id (including live "dyn:" ids) to a ModelInfo. */
export function getModelInfo(id: string): ModelInfo {
  const reg = modelById.get(id);
  if (reg) return reg;
  const dyn = parseDynId(id);
  if (dyn) return syntheticModel(dyn.providerId, dyn.apiId);
  return FALLBACK_MODEL;
}

export const LOCAL_PROVIDER_IDS = [...LOCAL_PROVIDERS];

/**
 * Resolves a virtual routing model to a concrete one, using ONLY live catalogs
 * fetched from provider APIs (nothing stale can leak in):
 *  - auto-free  → first live model of a provider with a key, else a keyless provider
 *  - auto-local → first live model of a reachable local runtime
 * Always returns something usable (keyless Pollinations as the last resort).
 */
export function resolveAutoModel(
  id: string,
  cfgs: Record<string, Cfg> | undefined,
  live?: { [pid: string]: { models: string[] } | undefined }
): ModelInfo {
  const hasKey = (pid: string) => !!cfgs?.[pid]?.key?.trim();
  const liveOf = (pids: string[]): ModelInfo | null => {
    for (const pid of pids) {
      const models = live?.[pid]?.models;
      if (models?.length) return syntheticModel(pid, models[0]);
    }
    return null;
  };

  if (id === "auto-local") {
    const localPids = [...LOCAL_PROVIDERS];
    return liveOf(localPids.filter(hasKey)) ?? liveOf(localPids) ?? FALLBACK_MODEL;
  }

  const cloudPids = PROVIDERS.filter((p) => !p.local).map((p) => p.id);
  return (
    liveOf(cloudPids.filter(hasKey)) ??
    liveOf(cloudPids.filter((pid) => providerById.get(pid)?.keyless)) ??
    FALLBACK_MODEL
  );
}
