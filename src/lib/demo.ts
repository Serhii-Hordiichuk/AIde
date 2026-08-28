import type { ModelInfo } from "../data/models";
import type { AgentInfo } from "../data/agents";

/* Вбудований демо-рушій: генерує правдоподібні відповіді, коли ключ API відсутній
   або запит до провайдера не вдався. Чесно позначається бейджем «демо» в UI. */

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function demoReply(userText: string, model: ModelInfo, providerName: string): string {
  const t = userText.toLowerCase();

  if (/(привіт|вітаю|hello|hi|хай|добрий день)/.test(t)) {
    return `Привіт! Я працюю через **${providerName}** як модель \`${model.apiId}\` у демо-режимі QStudio.

Можу допомогти з:

- **кодом** — React, Python, SQL, Go, Rust
- **архітектурою** — підбір моделі під задачу, RAG, агенти
- **текстами** — пояснення, плани, рефакторинг думок

Спробуй: *"Напиши хук useDebounce з тестами"* або *"Порівняй Ollama і vLLM"*.`;
  }

  if (/(useDebounce|хук|debounce)/.test(t)) {
    return `Ось \`useDebounce\` з тестами на Vitest:

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

describe("useDebounce", () => {
  it("оновлюється після затримки", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ v }) => useDebounce(v, 300),
      { initialProps: { v: "а" } }
    );
    rerender({ v: "б" });
    expect(result.current).toBe("а");
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current).toBe("б");
    vi.useRealTimers();
  });
});
\`\`\`

Ключова деталь: \`clearTimeout\` у cleanup робить хук безпечним при швидкому наборі — попередні таймери скасовуються.`;
  }

  if (/(ollama|vllm|llama\.cpp|локальн)/.test(t)) {
    return `## Ollama проти vLLM

| Критерій | Ollama | vLLM |
|---|---|---|
| **Сценарій** | розробка, десктоп | продакшн, багато користувачів |
| **Швидкість** | добра (llama.cpp всередині) | відмінна (PagedAttention, continuous batching) |
| **Запуск** | \`ollama run qwen2.5-coder:7b\` | \`vllm serve Qwen/Qwen3-8B\` |
| **Квантизація** | GGUF, CPU+GPU | AWQ/GPTQ/FP8, переважно GPU |

**Висновок:** для особистої розробки бери Ollama — нуль конфігурації. Для сервісу з >5 RPS — vLLM: батчинг дає 3–10× пропускної здатності.

> У QStudio обидва підключені як провайдери — перемикайся в один клік.`;
  }

  if (/(sql|запит|когорт|баз[аи] даних)/.test(t)) {
    return `Когортний аналіз утримання (PostgreSQL):

\`\`\`sql
WITH first_purchase AS (
  SELECT user_id,
         date_trunc('month', min(created_at)) AS cohort
  FROM orders
  GROUP BY user_id
),
activity AS (
  SELECT f.cohort,
         date_trunc('month', o.created_at) AS period,
         count(DISTINCT o.user_id) AS users
  FROM orders o
  JOIN first_purchase f USING (user_id)
  GROUP BY 1, 2
)
SELECT cohort, period, users,
       round(users * 100.0 / first_value(users)
             OVER (PARTITION BY cohort ORDER BY period), 1) AS retention_pct
FROM activity
ORDER BY cohort, period;
\`\`\`

- \`first_value() OVER\` бере розмір когорти в місяць першої покупки
- \`retention_pct\` — класична трикутна матриця утримання
- Для великих даних додай \`WHERE created_at >= now() - interval '12 months'\``;
  }

  if (/(rag|ембедінг|вектор)/.test(t)) {
    return `## Як працює RAG — простими словами

Уяви бібліотеку, де бібліотекар **не читає всі книги**, а миттєво знаходить потрібні сторінки:

1. **Індексація** — документи ріжуться на чанки (300–800 токенів) і перетворюються на вектори-ембедінги
2. **Пошук** — питання теж стає вектором; косинусна подібність знаходить топ-K чанків
3. **Збірка** — знайдені фрагменти вставляються в промпт як контекст
4. **Генерація** — модель відповідає, спираючись на контекст, а не на пам'ять

\`\`\`python
chunks = retrieve(question, top_k=6)
prompt = f"Відповідай лише з контексту:\\n{chunks}\\n\\nПитання: {question}"
answer = llm.complete(prompt)
\`\`\`

**Типові помилки:** занадто великі чанки (шум), відсутність reranker'а (втрачається точність) і сліпа довіра без цитат джерел.`;
  }

  if (/(вірш|поезі|poem)/.test(t)) {
    return `*Термінал о третій ночі:*

> Блимає курсор, як маяк у тумані,
> компілить думки на холоднім ядрі.
> Ми — агенти, ми — демони, ми — програмісти,
> що сни про бінарні шукають вгорі.
>
> І падає сніг із нечитаних логів,
> і grep знаходить сенс у порожнечі —
> поки твій код і мій код, як два боги,
> тримають цей світ на гарячім плечі.`;
  }

  if (/(код|функці|напиши|react|python|typescript|javascript|api|json)/.test(t)) {
    return `Зробив компактну реалізацію з обробкою помилок:

\`\`\`ts
async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) throw new Error(\`HTTP \${res.status}: \${res.statusText}\`);
  return res.json() as Promise<T>;
}

// Використання з таймаутом:
const withTimeout = <T>(p: Promise<T>, ms = 5000) =>
  Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)),
  ]);
\`\`\`

Що тут важливо:

1. **Дженерик \`T\`** — тип відповіді перевіряється на етапі компіляції
2. **Перевірка \`res.ok\`** — fetch не кидає помилку на 4xx/5xx
3. **Race з таймаутом** — захист від завислих з'єднань

Хочеш, додам retry з експоненційною затримкою?`;
  }

  const closers = [
    `\n\n> Це демо-відповідь QStudio — підключи ключ **${providerName}** на сторінці «Провайдери», і \`${model.name}\` відповість по-справжньому.`,
    `\n\n*Демо-режим: ключ ${providerName} не знайдено. Додай його у «Провайдерах» — і запит піде напряму в \`${model.apiId}\`.*`,
  ];

  return `Розберімо **"${userText.slice(0, 80)}${userText.length > 80 ? "…" : ""}"** покроково.

### Суть
Ти запитуєш у моделі \`${model.name}\` (контекст ${model.ctx}K токенів) через ${providerName}. Ось як я мислю про такі задачі:

1. **Формулюю ціль** — який результат вважається успіхом
2. **Декомпозую** — розбиваю на 3–5 перевірних кроків
3. **Виконую з перевіркою** — кожен крок валідую, перш ніж іти далі
4. **Зводжу** — фінальна відповідь + що перевірити вручну

### Приклад структури
- Якщо це код → спочатку інтерфейс, потім реалізація, потім тести
- Якщо це рішення → варіанти з trade-off'ами, потім рекомендація
- Якщо це пояснення → аналогія, механіка, межі застосування${pick(closers)}`;
}

/* ---------- трейс для демо-запуску агентів ---------- */

export interface TraceLine {
  kind: "cmd" | "tool" | "file" | "ok" | "warn" | "info" | "diff" | "head";
  text: string;
  delay: number; // мс перед показом
}

export function demoTrace(task: string, agent: AgentInfo): TraceLine[] {
  const t = task.toLowerCase();
  const isTest = /(тест|test|vitest|jest)/.test(t);
  const isApi = /(api|endpoint|fetch|запит)/.test(t);
  const isReact = /(react|компонент|хук|hook)/.test(t);

  const target = isReact ? "src/components/SearchBar.tsx" : isApi ? "src/api/client.ts" : isTest ? "src/utils/format.test.ts" : "src/lib/core.ts";
  const second = isReact ? "src/hooks/useSearch.ts" : isApi ? "src/api/types.ts" : "src/utils/format.ts";

  const L = (kind: TraceLine["kind"], text: string, delay = 500): TraceLine => ({ kind, text, delay });

  return [
    L("cmd", `$ ${agent.cmd} --task "${task.slice(0, 64)}${task.length > 64 ? "…" : ""}"`, 300),
    L("head", `${agent.name} v${agent.open ? "2.4.1" : "1.9.0"} · модель: ${agent.models.split("/")[0].trim()} · MCP: ${agent.mcp ? "увімкнено" : "вимкнено"}`, 700),
    L("info", "⏺ Аналізую структуру репозиторію…", 600),
    L("tool", "list_dir  .                     → 14 записів", 450),
    L("file", `read      ${target}            (142 рядки)`, 500),
    L("file", `read      ${second}             (87 рядків)`, 420),
    L("file", "read      package.json              (46 рядків)", 380),
    L("info", "⏺ План: 3 кроки — рефакторинг, правки, перевірка", 750),
    L("tool", `edit      ${target}`, 700),
    L("diff", "  - export function handle(data: any) {", 320),
    L("diff", `  + export async function handle(data: unknown): Promise<Result> {`, 320),
    L("diff", "  +   const parsed = schema.safeParse(data);", 320),
    L("diff", "  +   if (!parsed.success) throw new ValidationError(parsed.error);", 320),
    L("ok", `✓ застосовано 4 правки → ${target}`, 500),
    L("tool", `write     ${second}             (+38 рядків)`, 650),
    L("warn", "⚠ виявлено 1 потенційний конфлікт типів — виправляю", 800),
    L("tool", `edit      ${second}             (1 правка)`, 500),
    L("cmd", "$ npm run typecheck", 700),
    L("ok", "✓ tsc --noEmit: 0 помилок", 900),
    L("cmd", "$ npm run test -- --run", 600),
    L("info", "  PASS  src/utils/format.test.ts (12 тестів)", 700),
    L("info", "  PASS  src/lib/core.test.ts (31 тест)", 450),
    L("ok", "✓ 43 пройдено · 0 провалено · 4.2с", 500),
    L("tool", "git       diff --stat → 3 файли, +46 −9", 550),
    L("head", `⏺ Готово за ${(38 + Math.floor(Math.random() * 30))}с · токенів: ${(14 + Math.random() * 12).toFixed(1)}k · кроків: 17`, 600),
    L("ok", agent.open ? "✓ Агент відкритий — такий самий трейс отримаєш локально після `npm i -g`" : "✓ У реальному режимі цей трейс генерує live-агент", 400),
  ];
}
