import { PROVIDERS, providerById } from "./providers";

export interface ModelInfo {
  id: string;
  name: string;
  providerId: string;
  apiId: string;
  ctx: number;
  vision?: boolean;
  reasoning?: boolean;
  open?: boolean;
  tags: string[];
}

export interface Cfg {
  key: string;
  baseUrl: string;
}

/* The static registry is intentionally EMPTY: every model shown in the app is
   fetched live from each provider's own /models endpoint, so the catalog can
   never go stale or list dead ids. */

export const DYN_PREFIX = "dyn:";

export function dynId(providerId: string, apiId: string): string {
  return DYN_PREFIX + providerId + ":" + apiId;
}

export function parseDynId(id: string): { providerId: string; apiId: string } | null {
  if (!id.startsWith(DYN_PREFIX)) return null;
  const rest = id.slice(DYN_PREFIX.length);
  const cut = rest.indexOf(":");
  if (cut < 1) return null;
  return { providerId: rest.slice(0, cut), apiId: rest.slice(cut + 1) };
}

export function syntheticModel(providerId: string, apiId: string): ModelInfo {
  const p = providerById.get(providerId);
  return {
    id: dynId(providerId, apiId),
    name: apiId,
    providerId,
    apiId,
    ctx: p?.local ? 32 : 128,
    open: true,
    tags: [],
  };
}

export const FALLBACK_MODEL: ModelInfo = syntheticModel("pollinations", "openai");

export const DEFAULT_MODEL_ID = "auto-free";

export function getModelInfo(id: string): ModelInfo {
  const dyn = parseDynId(id);
  if (dyn) return syntheticModel(dyn.providerId, dyn.apiId);
  return FALLBACK_MODEL;
}

/* ---------------- smart routing ---------------- */

export function isAutoModel(id: string): boolean {
  return id === "auto-free" || id === "auto-local";
}

export const LOCAL_PROVIDERS = new Set(PROVIDERS.filter((p) => p.local).map((p) => p.id));

/**
 * Resolves a routing model using ONLY live catalogs fetched from provider APIs:
 *  - auto-free  → first live model of a provider with a key, else a keyless one
 *  - auto-local → first live model of a reachable local runtime
 */
export function resolveAutoModel(
  id: string,
  cfgs: Record<string, Cfg> | undefined,
  live?: Record<string, string[]>
): ModelInfo {
  const hasKey = (pid: string) => !!cfgs?.[pid]?.key?.trim();
  const liveOf = (pids: string[]): ModelInfo | null => {
    for (const pid of pids) {
      const models = live?.[pid];
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
