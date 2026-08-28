export type AgentType = "cli" | "ide" | "ext" | "web" | "lib";

export interface AgentInfo {
  id: string;
  name: string;
  vendor: string;
  type: AgentType;
  open: boolean;
  license?: string;
  stars?: number; // тис. ⭐ на GitHub
  mcp: boolean;
  models: string;
  price: string;
  cmd: string;
  blurb: string;
  features: string[];
  accent: string;
}

export const AGENT_TYPE_LABEL: Record<AgentType, string> = {
  cli: "CLI",
  ide: "IDE",
  ext: "Розширення",
  web: "Web / SaaS",
  lib: "Бібліотека",
};

export const AGENTS: AgentInfo[] = [
  {
    id: "claude-code", name: "Claude Code", vendor: "Anthropic", type: "cli",
    open: false, mcp: true, stars: 45,
    models: "Claude Opus 4.5 / Sonnet 4.5", price: "API pay-as-you-go · Max від $100/міс",
    cmd: "claude",
    blurb: "Агент у терміналі, що розуміє весь репозиторій: пише код, запускає тести, комітить і відкриває PR.",
    features: ["Саб-агенти та плани", "MCP-сервери з коробки", "Режими plan / auto-accept"],
    accent: "#ff6b6b",
  },
  {
    id: "codex-cli", name: "Codex CLI", vendor: "OpenAI", type: "cli",
    open: true, license: "Apache-2.0", mcp: true, stars: 42,
    models: "GPT-5.2 / o3 / будь-яке OpenAI-сумісне", price: "API pay-as-you-go або ChatGPT Plus",
    cmd: "codex",
    blurb: "Відкритий агент OpenAI: sandbox-виконання команд, approval-політики, робота офлайн із локальними моделями.",
    features: ["Повністю open source", "Sandbox (seatbelt / landlock)", "Підтримка локальних моделей"],
    accent: "#3ecf8e",
  },
  {
    id: "gemini-cli", name: "Gemini CLI", vendor: "Google", type: "cli",
    open: true, license: "Apache-2.0", mcp: true, stars: 48,
    models: "Gemini 3 Pro / 2.5 — 1M токенів контексту", price: "Безкоштовний тирло 60 запитів/хв",
    cmd: "gemini",
    blurb: "Найщедріший безкоштовний агент: мільйонний контекст вміщує моноліт цілком, тулзи shell/file/web з коробки.",
    features: ["1M-контекст безкоштовно", "Вбудований веб-пошук", "Extensions-маркетплейс"],
    accent: "#54c8ff",
  },
  {
    id: "qwen-code", name: "Qwen Code", vendor: "Alibaba", type: "cli",
    open: true, license: "Apache-2.0", mcp: true, stars: 11,
    models: "Qwen3-Coder-480B / 235B / локальні", price: "2000 безкоштовних запитів на день",
    cmd: "qwen",
    blurb: "Офіційний open-source агент Qwen (форк архітектури Gemini CLI), заточений під Qwen3-Coder і великі репо.",
    features: ["Безкоштовні 2000 запитів/день", "Ідеально з Qwen3-Coder", "MCP + кастомні тулзи"],
    accent: "#b795ff",
  },
  {
    id: "aider", name: "Aider", vendor: "Paul Gauthier", type: "cli",
    open: true, license: "Apache-2.0", mcp: false, stars: 33,
    models: "100+ моделей: Claude, GPT, Qwen, локальні", price: "Тільки витрати на API",
    cmd: "aider",
    blurb: "Парне програмування в терміналі з git-гігієною: кожна правка — окремий коміт з розбірливим повідомленням.",
    features: ["Git-коміти автоматично", "Edit-format для будь-якої моделі", "Режим /architect + /editor"],
    accent: "#ffd166",
  },
  {
    id: "cline", name: "Cline", vendor: "Cline Bot Inc.", type: "ext",
    open: true, license: "Apache-2.0", mcp: true, stars: 40,
    models: "Будь-яке API: Anthropic, OpenRouter, Ollama…", price: "Тільки витрати на API",
    cmd: "cline",
    blurb: "Автономний агент у VS Code: бачить термінал, браузер і файли, запитує дозвіл перед кожним кроком.",
    features: ["Покрокове approve/reject", "MCP-маркетплейс", "Робота з будь-яким API"],
    accent: "#2dd4bf",
  },
  {
    id: "roo-code", name: "Roo Code", vendor: "Roo", type: "ext",
    open: true, license: "Apache-2.0", mcp: true, stars: 16,
    models: "Будь-яке API + локальні моделі", price: "Тільки витрати на API",
    cmd: "roo",
    blurb: "Форк Cline з режимами-персонажами: Code, Architect, Ask, Debug — і 'бумеранг'-оркестрацією задач.",
    features: ["Режими Code/Architect/Debug", "Boomerang-оркестратор", "Кастомні personas"],
    accent: "#f45da0",
  },
  {
    id: "continue", name: "Continue", vendor: "Continue Dev", type: "ext",
    open: true, license: "Apache-2.0", mcp: true, stars: 27,
    models: "Будь-які: хмарні й локальні через config.yaml", price: "Тільки витрати на API",
    cmd: "continue",
    blurb: "Open-source автокомпліт і чат для VS Code/JetBrains: повний контроль конфігурації, ембедінги, документи команди.",
    features: ["Автокомпліт tab-tab", "Підключення docs команди", "Гнучкий YAML-конфіг"],
    accent: "#60a5fa",
  },
  {
    id: "cursor", name: "Cursor", vendor: "Anysphere", type: "ide",
    open: false, mcp: true, stars: undefined,
    models: "Claude, GPT, Gemini, власні Composer-моделі", price: "Від $20/міс (Pro)",
    cmd: "cursor",
    blurb: "AI-редактор на базі VS Code: агент Composer править десятки файлів паралельно, найкращий tab-автокомпліт на ринку.",
    features: ["Composer-агент на все репо", "Tab-передбачення наступної правки", "Фонові агенти у хмарі"],
    accent: "#cfd8e3",
  },
  {
    id: "windsurf", name: "Windsurf", vendor: "Codeium", type: "ide",
    open: false, mcp: true, stars: undefined,
    models: "Cascade: GPT, Claude, власні SWE-моделі", price: "Від $15/міс",
    cmd: "windsurf",
    blurb: "IDE з агентом Cascade, що 'тече' по задачі: тримає в пам'яті весь контекст сесії між кроками.",
    features: ["Cascade-агент з глибокою пам'яттю", "Supercomplete", "Вбудований термінал-агент"],
    accent: "#a3e635",
  },
  {
    id: "openhands", name: "OpenHands", vendor: "All Hands AI", type: "web",
    open: true, license: "MIT", mcp: true, stars: 55,
    models: "Claude, GPT, DeepSeek, локальні", price: "Self-host — безкоштовно",
    cmd: "openhands",
    blurb: "Платформа автономних software-інженерів у Docker-пісочницях: топ відкритих рішень на SWE-bench.",
    features: ["Ізольовані Docker-пісочниці", "Веб-UI з браузером агента", "Топ SWE-bench серед open-source"],
    accent: "#ff7000",
  },
  {
    id: "goose", name: "Goose", vendor: "Block", type: "cli",
    open: true, license: "Apache-2.0", mcp: true, stars: 14,
    models: "Будь-який OpenAI-сумісний провайдер", price: "Тільки витрати на API",
    cmd: "goose",
    blurb: "Агент від Block (ex-Square): розширення-extensions на все — від Jira до Kubernetes, плюс 'recipes' для автоматизацій.",
    features: ["Extensions-екосистема", "Recipes — повторювані сценарії", "Desktop + CLI + Web"],
    accent: "#22b8cf",
  },
  {
    id: "amp", name: "Amp", vendor: "Sourcegraph", type: "web",
    open: false, mcp: true, stars: undefined,
    models: "Авто-вибір найкращої моделі на крок", price: "Від $25/міс",
    cmd: "amp",
    blurb: "Агент без вибору моделей — сам бере найкращу для кожного кроку. Виріс із кодової пошукової машини Sourcegraph.",
    features: ["Автоматичний вибір моделі", "Пошук по всьому коду (Code Graph)", "Thread-організація сесій"],
    accent: "#b691ff",
  },
  {
    id: "kilo-code", name: "Kilo Code", vendor: "Kilo Org", type: "ext",
    open: true, license: "Apache-2.0", mcp: true, stars: 9,
    models: "100+ моделей через будь-які API", price: "Тільки витрати на API",
    cmd: "kilo",
    blurb: "Open-source агент-оркестратор: розбиває задачу на підзадачі, запускає суб-агентів і зводить результат.",
    features: ["Оркестрація суб-агентів", "Плани з checkpoint'ами", "Підтримка голосових нотаток"],
    accent: "#ffd21e",
  },
  {
    id: "devin", name: "Devin", vendor: "Cognition", type: "web",
    open: false, mcp: false, stars: undefined,
    models: "Власний стек моделей Cognition", price: "$2.25 за ACU (агента-хвилину)",
    cmd: "devin",
    blurb: "Перший 'AI software engineer': отримує задачу в Slack, сам планує, кодить, дебажить і відкриває PR.",
    features: ["Повна автономність", "Власний браузер і shell", "Інтеграція зі Slack/Jira"],
    accent: "#6f8bff",
  },
  {
    id: "swe-agent", name: "SWE-agent", vendor: "Princeton NLP", type: "lib",
    open: true, license: "MIT", mcp: false, stars: 15,
    models: "Будь-яка chat-модель", price: "Дослідницький інструмент",
    cmd: "swe-agent",
    blurb: "Дослідницький каркас агентів для SWE-bench: ACI (agent-computer interface) — еталон для науки про агентів.",
    features: ["Еталон SWE-bench", "Спеціальний ACI-інтерфейс", "Trajectory-датасети"],
    accent: "#f472b6",
  },
];
