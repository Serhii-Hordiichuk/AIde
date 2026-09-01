import type { ModelInfo, Cfg } from "../data/models";
import type { ProviderInfo } from "../data/providers";
import type { GenParams } from "./store";
import { complete } from "./llm";
import { detectByScript } from "./languages";

const TR_PARAMS: GenParams = { temperature: 0.2, topP: 0.9, maxTokens: 2048, system: "" };

function optsFor(model: ModelInfo, provider: ProviderInfo, cfg: Cfg, system: string, user: string, signal?: AbortSignal) {
  return {
    model,
    provider,
    cfg,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    params: TR_PARAMS,
    signal,
  };
}

function cleanJson(s: string): string {
  const m = s.replace(/```(?:json)?/gi, "").trim();
  const start = m.indexOf("{");
  const end = m.lastIndexOf("}");
  if (start >= 0 && end > start) return m.slice(start, end + 1);
  return m;
}

export interface SmartResult {
  from: string;
  text: string;
}

/** Detects the source language and translates in one grounded call. */
export async function translateSmart(
  text: string,
  target: string,
  model: ModelInfo,
  provider: ProviderInfo,
  cfg: Cfg,
  signal?: AbortSignal
): Promise<SmartResult> {
  const sys =
    "You are a professional translator. Detect the source language, then translate the user's text into the target language. " +
    'Reply ONLY with valid JSON: {"from":"<iso code>","text":"<translation>"}. Keep tone, formatting and line breaks.';
  const raw = await complete(
    optsFor(model, provider, cfg, sys, `Target language: ${target}\n\nText:\n${text}`, signal)
  );
  try {
    const j = JSON.parse(cleanJson(raw));
    if (typeof j.text === "string" && j.text.trim()) {
      return { from: typeof j.from === "string" ? j.from.slice(0, 5).toLowerCase() : detectByScript(text) ?? "en", text: j.text };
    }
  } catch {
    /* fall through to raw output */
  }
  return { from: detectByScript(text) ?? "en", text: raw };
}

/** Translates with a known source language (used by live conversation & documents). */
export async function translateWithSource(
  text: string,
  source: string,
  target: string,
  model: ModelInfo,
  provider: ProviderInfo,
  cfg: Cfg,
  signal?: AbortSignal
): Promise<string> {
  const sys =
    `You are a professional translator. Translate from ${source} to ${target}. ` +
    "Output ONLY the translation — no quotes, no explanations, keep formatting and line breaks.";
  const out = await complete(optsFor(model, provider, cfg, sys, text, signal));
  return out.replace(/^["«”\s]+|["»”\s]+$/g, "");
}

/** Lightweight language detection via the model (fallback: script heuristics). */
export async function detectLanguage(
  text: string,
  model: ModelInfo,
  provider: ProviderInfo,
  cfg: Cfg,
  signal?: AbortSignal
): Promise<string> {
  const quick = detectByScript(text);
  if (quick) return quick;
  try {
    const raw = await complete(
      optsFor(
        model,
        provider,
        cfg,
        'Detect the language of the given text. Reply ONLY with a lowercase ISO 639-1 code (e.g. "en", "uk", "zh").',
        text,
        signal
      )
    );
    const code = raw.trim().toLowerCase().slice(0, 5).replace(/[^a-z-]/g, "");
    return code.length >= 2 ? code : "en";
  } catch {
    return "en";
  }
}
