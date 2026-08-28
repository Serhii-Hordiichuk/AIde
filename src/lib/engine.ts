import { streamChat, NoKeyError } from "./llm";
import { modelById } from "../data/models";
import { PROVIDERS, providerById } from "../data/providers";
import type { ProviderCfg, ProjectFile } from "./store";
import { pickTemplate, deriveName } from "./templates";

/* ================= демо-відповіді чату ================= */

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
    `1. Розбираю запит: «${t.slice(0, 60)}${t.length > 60 ? "…" : ""}»`,
    "2. Визначаю тип задачі: код / пояснення / порівняння / текст",
    "3. Планую структуру відповіді: суть → деталі → приклад",
    "4. Перевіряю факти та приклади коду на коректність",
    "5. Формую фінальну відповідь українською",
  ].join("\n");
}

export function demoReply(userText: string, modelName: string, providerName: string, opts: ReplyOpts): DemoOut {
  const t = userText.toLowerCase();
  let text = "";

  if (/(привіт|вітаю|hello|хай|добрий)/.test(t)) {
    text = `Привіт! Я **QStudio** — форк Qwen Studio, що працює через ${providerName} (модель \`${modelName}\`).

Можу допомогти з кодом, архітектурою, текстами й поясненнями. А на вкладці **Кодер** я створюю цілі проєкти з нуля — спробуй.

- Напиши: *«зроби хук useDebounce з тестами»*
- Або: *«порівняй Ollama і vLLM»*`;
  } else if (/(usedebounce|хук|debounce)/.test(t)) {
    text = `Ось \`useDebounce\` із тестом на Vitest:

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

it("оновлюється після затримки", () => {
  vi.useFakeTimers();
  const { result, rerender } = renderHook(({ v }) => useDebounce(v, 300), {
    initialProps: { v: "а" },
  });
  rerender({ v: "б" });
  expect(result.current).toBe("а");
  act(() => void vi.advanceTimersByTime(300));
  expect(result.current).toBe("б");
});
\`\`\`

Ключове: \`clearTimeout\` у cleanup скасовує попередні таймери під час швидкого набору.`;
  } else if (/(ollama|vllm|llama\.cpp|локальн)/.test(t)) {
    text = `## Ollama проти vLLM

| Критерій | Ollama | vLLM |
|---|---|---|
| Сценарій | розробка, десктоп | продакшн, навантаження |
| Запуск | \`ollama run qwen2.5-coder:7b\` | \`vllm serve Qwen/Qwen3-8B\` |
| Швидкість | добра (llama.cpp) | відмінна (PagedAttention + batching) |
| Квантизація | GGUF, CPU+GPU | AWQ / GPTQ / FP8, GPU |

**Висновок:** для себе — Ollama (нуль конфігурації). Для сервісу з >5 RPS — vLLM: continuous batching дає 3–10× пропускної здатності.

> Обидва вже є у списку провайдерів QStudio — підключай у Налаштуваннях.`;
  } else if (/(rag|ембедінг|вектор)/.test(t)) {
    text = `## RAG простими словами

Уяви бібліотеку, де бібліотекар не читає всі книги, а миттєво знаходить потрібні сторінки:

1. **Індексація** — документи ріжуться на чанки (300–800 токенів) і стають векторами
2. **Пошук** — питання теж векторизується; косинусна подібність дає топ-K чанків
3. **Збірка** — фрагменти вставляються в промпт як контекст
4. **Генерація** — модель відповідає з контексту, а не з пам'яті

\`\`\`python
chunks = retrieve(question, top_k=6)
prompt = f"Відповідай лише з контексту:\\n{chunks}\\n\\nПитання: {question}"
answer = llm.complete(prompt)
\`\`\`

Типові помилки: завеликі чанки, відсутність reranker'а, відповіді без цитування джерел.`;
  } else if (/(вірш|поезі)/.test(t)) {
    text = `> Блимає курсор, як маяк у тумані,
> компілить думки на холоднім ядрі.
> Ми — демони, що сни про бінарні
> шукають у чорній своїй глибині.
>
> І падає сніг із нечитаних логів,
> і grep знаходить сенс у порожнечі —
> поки мій код і твій код, наче боги,
> тримають цей світ на гарячім плечі.`;
  } else if (/(код|функці|react|python|typescript|api|напиши)/.test(t)) {
    text = `Компактна реалізація з обробкою помилок:

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

Що важливо:

1. **Дженерик \`T\`** — тип відповіді перевіряється компілятором
2. **\`res.ok\`** — fetch не кидає помилку на 4xx/5xx
3. **Race з таймаутом** — захист від завислих з'єднань

Додати retry з експоненційною затримкою?`;
  } else {
    text = `Розберімо **"${userText.slice(0, 70)}${userText.length > 70 ? "…" : ""}"** по кроках.

### Підхід
Модель \`${modelName}\` через ${providerName} (контекст чату враховує попередні повідомлення). Для таких запитів я:

1. Формулюю критерій успіху
2. Декомпозую задачу на 3–5 кроків
3. Виконую з проміжною перевіркою
4. Зводжу результат із тим, що варто перевірити вручну

### Що уточнити
- Який формат результату потрібен: код, текст, план?
- Є обмеження: стек, обсяг, стиль?

> Це демо-відповідь: ключ ${providerName} не підключено. Додай його в **Налаштуваннях** (⚙) — і запит піде в справжню \`${modelName}\`.`;
  }

  if (opts.deep) {
    text = `# Дослідження: ${userText.slice(0, 60)}

## Ключові висновки
- **Стан речей** — тема активно розвивається; основні підходи сформовані, але інструменти швидко змінюються
- **Практика** — найкращі результати дає поєднання простих рішень із поступовим ускладненням
- **Ризики** — головна пастка: передчасна оптимізація без вимірювань

## Детальний розбір

### 1. Контекст і передумови
Більшість рішень у цій області зводяться до trade-off між швидкістю, простотою і контролем. Варто починати з найпростішого варіанта, який можна виміряти.

### 2. Варіанти рішень
1. **Мінімальний** — готові інструменти, нуль інфраструктури
2. **Збалансований** — кастомізація там, де є виміряна потреба
3. **Просунутий** — власна інфраструктура; виправданий при >10× навантаженні

### 3. Рекомендація
Почати з мінімального, заміряти, ускладнювати лише вузькі місця.

## Джерела та наступні кроки
- Перевірити припущення на реальних даних
- Порівняти 2–3 варіанти за однією метрикою
- Зафіксувати рішення в ADR

> *Deep Research у демо-режимі: структуровано, але без живого пошуку в мережі.*`;
  }

  if (opts.search) {
    text += `\n\n---\n\n**Джерела (демо):** qwen.ai/blog · github.com/QwenLM · docs-агрегаторів API`;
  }

  return { thinking: opts.thinking ? thinkAbout(userText) : undefined, text };
}

/* ================= Кодер: генерація проєктів ================= */

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
  `Ти — старший frontend-розробник. Створи ОДИН самодостатній веб-застосунок (один HTML-файл з <style> і <script> всередині) за описом нижче. UI українською, сучасний мінімалістичний дизайн, усе має працювати одразу. Поверни ЛИШЕ один блок коду \`\`\`html без жодних пояснень до чи після.\n\nОпис: ${desc}`;

/** Спробувати згенерувати проєкт справжньою моделлю. Повертає null, якщо не вийшло. */
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
    onLine(`⏺ Підключено: ${provider.name} · ${model.name}`);
    onLine("⏺ Надсилаю запит на генерацію коду…");
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
    if (!html) throw new Error("модель не повернула блок коду ```html");
    onLine(`✓ Отримано ${(html.length / 1024).toFixed(1)} КБ коду від ${model.name}`);
    return [
      { name: "index.html", content: html },
      {
        name: "README.md",
        content: `# Проєкт, згенерований ${model.name}\n\nОпис: ${desc}\n\nЗапуск: відкрий index.html у браузері.`,
      },
    ];
  } catch (e) {
    if (signal.aborted) throw e;
    const msg = e instanceof NoKeyError ? "немає ключа" : e instanceof Error ? e.message : String(e);
    onLine(`⚠ LLM-генерація не вдалась (${msg.slice(0, 80)})`);
    onLine("⏺ Перемикаюсь на вбудований генератор QStudio…");
    return null;
  }
}

export function extractHtmlBlock(text: string): string | null {
  const m = /```html\s*\n([\s\S]*?)```/i.exec(text) ?? /```\s*\n(<!doctype[\s\S]*?)```/i.exec(text);
  return m ? m[1].trim() : null;
}

/** Збирає index.html з інлайнованими css/js для preview в iframe. */
export function buildPreviewDoc(files: ProjectFile[]): string {
  const get = (n: string) => files.find((f) => f.name === n)?.content ?? "";
  let html = get("index.html") || files[0]?.content || "";
  const css = get("styles.css");
  const js = get("app.js");
  if (css) html = html.replace(/<link[^>]*styles\.css[^>]*>/i, `<style>\n${css}\n</style>`);
  if (js) html = html.replace(/<script[^>]*app\.js[^>]*><\/script>/i, `<script>\n${js}\n</script>`);
  return html;
}

/* ================= підказки ================= */

export const CHAT_SUGGESTIONS = [
  "Напиши хук useDebounce з тестами",
  "Порівняй Ollama і vLLM для локальних моделей",
  "Поясни RAG простими словами",
  "Напиши вірш про термінал о третій ночі",
];

export const CODER_SUGGESTIONS = [
  "To-Do застосунок зі збереженням у localStorage",
  "Лендинг кав'ярні «Зерно»",
  "Дашборд аналітики з графіком продажів",
  "Гра «Змійка» на canvas",
  "Pomodoro-таймер з кільцем прогресу",
  "Markdown-нотатник з автозбереженням",
];

export { PROVIDERS };
