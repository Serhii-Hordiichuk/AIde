import { streamChat, NoKeyError } from "./llm";
import { modelById } from "../data/models";
import { providerById } from "../data/providers";
import type { ProviderCfg, ProjectFile } from "./store";
import { pickTemplate, deriveName } from "./templates";

/* ================= chat demo replies ================= */

export interface DemoOut {
  thinking?: string;
  text: string;
}

export interface ReplyOpts {
  thinking: boolean;
  search: boolean;
  deep: boolean;
}

function thinkAbout(t: string): string {
  return [
    `1. Parsing the request: "${t.slice(0, 60)}${t.length > 60 ? "…" : ""}"`,
    "2. Classifying the task: code / explanation / comparison / writing",
    "3. Planning the answer structure: essence → details → example",
    "4. Sanity-checking facts and code samples",
    "5. Composing the final reply in English",
  ].join("\n");
}

export function demoReply(userText: string, modelName: string, providerName: string, opts: ReplyOpts): DemoOut {
  const t = userText.toLowerCase();
  let text = "";

  if (/(hello|hey|hi |greetings|good (morning|afternoon|evening))/.test(t + " ")) {
    text = `Hey! I'm **AiDe** — an AI coding studio running through ${providerName} (model \`${modelName}\`).

I can help with code, architecture, writing and explanations. And in **Coder** mode I build entire projects from scratch — give it a try.

- Try: *"write a useDebounce hook with tests"*
- Or: *"compare Ollama and vLLM"*`;
  } else if (/(usedebounce|hook|debounce)/.test(t)) {
    text = `Here's a \`useDebounce\` with a Vitest test:

\`\`\`tsx
import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
\`\`\`

\`\`\`tsx
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useDebounce } from "./useDebounce";

it("updates after the delay", () => {
  vi.useFakeTimers();
  const { result, rerender } = renderHook(({ v }) => useDebounce(v, 300), {
    initialProps: { v: "a" },
  });
  rerender({ v: "b" });
  expect(result.current).toBe("a");
  act(() => void vi.advanceTimersByTime(300));
  expect(result.current).toBe("b");
});
\`\`\`

The key detail: \`clearTimeout\` in the cleanup cancels pending timers while the user keeps typing.`;
  } else if (/(ollama|vllm|llama\.cpp|local)/.test(t)) {
    text = `## Ollama vs vLLM

| Criterion | Ollama | vLLM |
|---|---|---|
| Use case | development, desktop | production, high load |
| Launch | \`ollama run deepseek-coder-v2:16b\` | \`vllm serve deepseek-ai/DeepSeek-V3\` |
| Speed | good (llama.cpp inside) | excellent (PagedAttention + batching) |
| Quantization | GGUF, CPU+GPU | AWQ / GPTQ / FP8, GPU-first |

**Verdict:** for personal dev — Ollama (zero config). For a service with >5 RPS — vLLM: continuous batching gives 3–10× throughput.

> Both are already in the AiDe provider list — connect them in Settings.`;
  } else if (/(rag|embedding|vector)/.test(t)) {
    text = `## RAG in plain words

Imagine a library where the librarian **doesn't read every book** — they instantly pull the right pages:

1. **Indexing** — documents are split into chunks (300–800 tokens) and turned into embedding vectors
2. **Retrieval** — the question is vectorized too; cosine similarity returns the top-K chunks
3. **Assembly** — the retrieved fragments go into the prompt as context
4. **Generation** — the model answers from context, not from memory

\`\`\`python
chunks = retrieve(question, top_k=6)
prompt = f"Answer using only the context:\\n{chunks}\\n\\nQuestion: {question}"
answer = llm.complete(prompt)
\`\`\`

Typical mistakes: chunks that are too large, no reranker, and answers without citing sources.`;
  } else if (/(poem|poetry|verse)/.test(t)) {
    text = `> The cursor blinks — a lighthouse in the fog,
> compiling thoughts on cold and quiet cores.
> We are the daemons, hunting binary dreams
> across the black cathedral of our floors.
>
> And snow falls down from logs no one will read,
> and grep finds meaning in the emptiness —
> while your code and mine, like gods agreed,
> hold up this world on one warm process.`;
  } else if (/(code|function|react|python|typescript|api|write me|implement)/.test(t)) {
    text = `A compact implementation with proper error handling:

\`\`\`ts
async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) throw new Error("HTTP " + res.status + ": " + res.statusText);
  return res.json() as Promise<T>;
}

const withTimeout = <T,>(p: Promise<T>, ms = 5000) =>
  Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)),
  ]);
\`\`\`

What matters here:

1. **Generic \`T\`** — the response type is checked at compile time
2. **\`res.ok\`** — fetch doesn't throw on 4xx/5xx
3. **Race with timeout** — protection against hung connections

Want me to add a retry with exponential backoff?`;
  } else {
    text = `Let's break down **"${userText.slice(0, 70)}${userText.length > 70 ? "…" : ""}"** step by step.

### Approach
Model \`${modelName}\` via ${providerName} (the chat context includes previous messages). For requests like this I:

1. Define the success criterion
2. Decompose the task into 3–5 verifiable steps
3. Execute with intermediate checks
4. Summarize, noting what's worth verifying manually

### Worth clarifying
- What format do you need: code, prose, a plan?
- Any constraints: stack, scope, style?

> This is a demo reply: no ${providerName} key is connected. Add one in **Settings** (⚙) — and the request will go to the real \`${modelName}\`.`;
  }

  if (opts.deep) {
    text = `# Research: ${userText.slice(0, 60)}

## Key takeaways
- **State of play** — the field is evolving fast; core approaches are settled, but tooling churns quickly
- **Practice** — the best results come from combining simple solutions with gradual refinement
- **Risks** — the main trap: premature optimization without measurement

## Detailed breakdown

### 1. Context & prerequisites
Most decisions in this area boil down to a trade-off between speed, simplicity and control. Start with the simplest variant you can measure.

### 2. Solution options
1. **Minimal** — off-the-shelf tools, zero infrastructure
2. **Balanced** — customization only where a measured need exists
3. **Advanced** — own infrastructure; justified at >10× the load

### 3. Recommendation
Start minimal, measure, harden only the bottlenecks.

## Sources & next steps
- Validate assumptions on real data
- Compare 2–3 options against a single metric
- Record the decision in an ADR

> *Deep Research in demo mode: structured, but without live web crawling.*`;
  }

  if (opts.search) {
    text += `\n\n---\n\n**Sources (demo):** aide.dev/blog · aggregator API docs`;
  }

  return { thinking: opts.thinking ? thinkAbout(userText) : undefined, text };
}

/* ================= Coder: project generation ================= */

export interface ScaffoldResult {
  templateId: string;
  name: string;
  files: ProjectFile[];
}

export function scaffoldProject(desc: string): ScaffoldResult {
  const tpl = pickTemplate(desc);
  const name = deriveName(desc, tpl.id);
  const rec = tpl.build(name, desc);
  return {
    templateId: tpl.id,
    name,
    files: Object.entries(rec).map(([n, content]) => ({ name: n, content })),
  };
}

const LLM_PROMPT = (desc: string) =>
  `You are a senior frontend developer. Create ONE self-contained web app (a single HTML file with <style> and <script> inline) for the request below. UI copy in English, modern minimal design, everything must work immediately. Return ONLY one \`\`\`html code block with no explanation before or after.\n\nRequest: ${desc}`;

/** Try to generate the project with a real model. Returns null on failure. */
export async function generateProjectWithLLM(
  desc: string,
  providerId: string,
  cfg: ProviderCfg | undefined,
  modelId: string,
  onLine: (line: string) => void,
  signal: AbortSignal
): Promise<ProjectFile[] | null> {
  const provider = providerById.get(providerId);
  const model = modelById.get(modelId);
  if (!provider || !model || !cfg?.key?.trim()) return null;
  try {
    onLine(`⏺ Connected: ${provider.name} · ${model.name}`);
    onLine("⏺ Sending the code-generation request…");
    let full = "";
    for await (const delta of streamChat({
      model,
      provider,
      cfg,
      messages: [{ role: "user", content: LLM_PROMPT(desc) }],
      params: { temperature: 0.4, topP: 0.95, maxTokens: 12000, system: "" },
      signal,
    })) {
      full += delta;
    }
    const html = extractHtmlBlock(full);
    if (!html) throw new Error("the model returned no ```html code block");
    onLine(`✓ Received ${(html.length / 1024).toFixed(1)} KB of code from ${model.name}`);
    return [
      { name: "index.html", content: html },
      {
        name: "README.md",
        content: `# Project generated by ${model.name}\n\nRequest: ${desc}\n\nRun: open index.html in a browser.`,
      },
    ];
  } catch (e) {
    if (signal.aborted) throw e;
    const msg = e instanceof NoKeyError ? "no API key" : e instanceof Error ? e.message : String(e);
    onLine(`⚠ LLM generation failed (${msg.slice(0, 80)})`);
    onLine("⏺ Falling back to the built-in AiDe generator…");
    return null;
  }
}

export function extractHtmlBlock(text: string): string | null {
  const m = /```html\s*\n([\s\S]*?)```/i.exec(text) ?? /```\s*\n(<!doctype[\s\S]*?)```/i.exec(text);
  return m ? m[1].trim() : null;
}

/** Assembles index.html with inlined css/js for the iframe preview. */
export function buildPreviewDoc(files: ProjectFile[]): string {
  const get = (n: string) => files.find((f) => f.name === n)?.content ?? "";
  let html = get("index.html") || files[0]?.content || "";
  const css = get("styles.css");
  const js = get("app.js");
  if (css) html = html.replace(/<link[^>]*styles\.css[^>]*>/i, `<style>\n${css}\n</style>`);
  if (js) html = html.replace(/<script[^>]*app\.js[^>]*><\/script>/i, `<script>\n${js}\n</script>`);
  return html;
}

/* ================= suggestions ================= */

export const CHAT_SUGGESTIONS = [
  "Write a useDebounce hook with tests",
  "Compare Ollama and vLLM for local models",
  "Explain RAG in plain words",
  "Write a short poem about a terminal at 3 a.m.",
];

export const CODER_SUGGESTIONS = [
  "To-Do app that saves to localStorage",
  'Landing page for a coffee shop "Grain"',
  "Analytics dashboard with a sales chart",
  "Snake game on canvas",
  "Pomodoro timer with a progress ring",
  "Markdown notebook with autosave",
];
