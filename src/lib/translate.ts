import type { ModelInfo } from "../data/models";
import type { ProviderInfo } from "../data/providers";
import type { ProviderCfg } from "../lib/store";
import { DEFAULT_PARAMS } from "./store";
import { complete } from "./llm";
import { langName } from "./languages";
import { detectByScript } from "./languages";

export interface SmartResult {
  from: string;
  text: string;
}

const SYS =
  "You are a professional translator. Translate the user's text into the requested target language. " +
  "Preserve meaning, tone, formatting and line breaks. Output ONLY the translation, nothing else — " +
  "no quotes, no notes, no language labels.";

function clean(text: string): string {
  return text
    .trim()
    .replace(/^["“«]+|["”»]+$/g, "")
    .replace(/^translation\s*[:\-]\s*/i, "")
    .trim();
}

/* Detect + translate in one call; falls back to script heuristics. */
export async function translateSmart(
  text: string,
  target: string,
  model: ModelInfo,
  provider: ProviderInfo,
  cfg: ProviderCfg,
  signal?: AbortSignal
): Promise<SmartResult> {
  const prompt =
    `Target language: ${langName(target)} (${target}).\n` +
    `Also reply with the detected source language ISO code on the very first line as "from: xx".\n\n` +
    `Text:\n${text}`;
  try {
    const out = await complete({
      model,
      provider,
      cfg,
      messages: [
        { role: "system", content: SYS + "\nFirst line of your reply must be exactly: from: <iso-code>. Then the translation." },
        { role: "user", content: prompt },
      ],
      params: { ...DEFAULT_PARAMS, temperature: 0.2, maxTokens: 4096 },
      signal,
    });
    const m = /^from:\s*([a-z]{2,3}(?:-[a-z]{2,4})?)/i.exec(out);
    const from = (m ? m[1].toLowerCase().split("-")[0] : detectByScript(text)) ?? "en";
    const body = clean(m ? out.slice(m[0].length) : out);
    return { from, text: body || out.trim() };
  } catch (e) {
    if (signal?.aborted) throw e;
    throw e;
  }
}

export async function translateWithSource(
  text: string,
  from: string,
  target: string,
  model: ModelInfo,
  provider: ProviderInfo,
  cfg: ProviderCfg,
  signal?: AbortSignal
): Promise<string> {
  const out = await complete({
    model,
    provider,
    cfg,
    messages: [
      { role: "system", content: SYS },
      {
        role: "user",
        content: `Source language: ${langName(from)}. Target language: ${langName(target)}.\n\nText:\n${text}`,
      },
    ],
    params: { ...DEFAULT_PARAMS, temperature: 0.2, maxTokens: 4096 },
    signal,
  });
  return clean(out);
}
