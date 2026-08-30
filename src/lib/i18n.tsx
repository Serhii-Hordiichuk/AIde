import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "en" | "uk";

export const LANG_OPTIONS: { code: Lang; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "uk", label: "Ukrainian", native: "Українська" },
];

type Dict = Record<string, string>;

const en: Dict = {
  // shell
  "app.tagline": "self-sovereign ai studio",
  "nav.newChat": "New chat",
  "nav.chats": "Chats",
  "nav.projects": "Projects",
  "nav.noProjects": "no projects yet",
  "nav.settings": "Settings",
  "nav.freePlan": "free plan · settings",
  "nav.openMenu": "Open menu",
  "nav.closeMenu": "Close menu",
  "nav.expand": "Expand sidebar",
  "nav.collapse": "Collapse sidebar",
  "common.delete": "Delete",
  "common.rename": "Rename",
  "common.open": "Open",
  "common.cancel": "Cancel",
  "common.close": "Close",
  "common.copy": "Copy",
  "common.copied": "Copied",
  "common.free": "free",
  "common.options": "Options",
  "confirm.deleteTitle": "Delete",
  "confirm.deleteAsk": "This can't be undone.",

  // appearance
  "ui.theme": "Theme",
  "ui.themeAuto": "Auto",
  "ui.themeLight": "Light",
  "ui.themeDark": "Dark",
  "ui.language": "Language",
  "ui.appearance": "Appearance",

  // modes
  "mode.chat": "Chat",

  // chat
  "chat.hello": "Hello, I'm",
  "chat.help": "How can I help you today?",
  "chat.placeholder": "Message AiDe…",
  "chat.think": "Think",
  "chat.search": "Search",
  "chat.deep": "Deep Research",
  "chat.send": "Send",
  "chat.stop": "Stop",
  "chat.regenerate": "Regenerate",
  "chat.readAloud": "Read aloud",
  "chat.stopReading": "Stop reading",
  "chat.sugg.code": "Write code",
  "chat.sugg.explain": "Explain a concept",
  "chat.sugg.write": "Help me write",
  "chat.sugg.compare": "Compare tools",
  "chat.codeT": "Write a useDebounce hook with tests",
  "chat.explainT": "Explain RAG in plain words",
  "chat.writeT": "Write a short poem about a terminal at 3 a.m.",
  "chat.compareT": "Compare Ollama and vLLM for local models",

  // coder
  "coder.title": "Coder",
  "coder.code": "Code",
  "coder.preview": "Preview",
  "coder.terminal": "Terminal",
  "coder.plan": "Plan",
  "coder.rebuild": "Rebuild",
  "coder.files": "Files",
  "coder.emptyTitle": "AiDe Coder",
  "coder.placeholder": "For example: a landing page for a coffee shop",
  "coder.create": "Create project",
  "coder.writing": "specialists are writing files…",
  "coder.askChange": "Ask the crew for a change…",
  "coder.working": "The crew is working…",

  // translate
  "tr.title": "Translate",
  "tr.text": "Text",
  "tr.live": "Live conversation",
  "tr.docs": "Documents",

  // auth
  "auth.createDid": "Create DID identity",
  "auth.restore": "Restore from backup",
  "auth.enter": "Enter AiDe",
  "auth.backToSite": "Back to site",
  "auth.verify": "Verify & enter",

  // landing
  "land.heroKicker": "free · open · yours",
  "land.heroA": "One studio.",
  "land.heroB": "Every free model.",
  "land.heroC": "Apps from a sentence.",
  "land.heroSub": "AiDe talks to the free tiers of the providers you already know, and its Coder crew ships a working app from a single line.",
  "land.ctaStart": "Create your DID — enter free",
  "land.ctaRestore": "I have an identity",
  "land.modes": "Three rooms, one brain",
  "land.didTitle": "No accounts. Just a key that's yours.",
  "land.didSub": "Access is a decentralized identity generated on this device. Nothing to sign up for, nothing to leak.",
  "land.faqTitle": "Questions",
  "land.footer": "Built as a fork-minded studio · MIT",
};

const uk: Dict = {
  // shell
  "app.tagline": "суверенна ai-студія",
  "nav.newChat": "Новий чат",
  "nav.chats": "Чати",
  "nav.projects": "Проєкти",
  "nav.noProjects": "поки що немає проєктів",
  "nav.settings": "Налаштування",
  "nav.freePlan": "безкоштовний план · налаштування",
  "nav.openMenu": "Відкрити меню",
  "nav.closeMenu": "Закрити меню",
  "nav.expand": "Розгорнути панель",
  "nav.collapse": "Згорнути панель",
  "common.delete": "Видалити",
  "common.rename": "Перейменувати",
  "common.open": "Відкрити",
  "common.cancel": "Скасувати",
  "common.close": "Закрити",
  "common.copy": "Копіювати",
  "common.copied": "Скопійовано",
  "common.free": "безкоштовно",
  "common.options": "Опції",
  "confirm.deleteTitle": "Видалити",
  "confirm.deleteAsk": "Цю дію не можна скасувати.",

  // appearance
  "ui.theme": "Тема",
  "ui.themeAuto": "Авто",
  "ui.themeLight": "Світла",
  "ui.themeDark": "Темна",
  "ui.language": "Мова",
  "ui.appearance": "Вигляд",

  // modes
  "mode.chat": "Чат",

  // chat
  "chat.hello": "Привіт, я",
  "chat.help": "Чим можу допомогти сьогодні?",
  "chat.placeholder": "Напишіть AiDe…",
  "chat.think": "Думати",
  "chat.search": "Пошук",
  "chat.deep": "Глибокий аналіз",
  "chat.send": "Надіслати",
  "chat.stop": "Зупинити",
  "chat.regenerate": "Перегенерувати",
  "chat.readAloud": "Озвучити",
  "chat.stopReading": "Зупинити читання",
  "chat.sugg.code": "Написати код",
  "chat.sugg.explain": "Пояснити концепцію",
  "chat.sugg.write": "Допомогти з текстом",
  "chat.sugg.compare": "Порівняти інструменти",
  "chat.codeT": "Напиши хук useDebounce з тестами",
  "chat.explainT": "Поясни RAG простими словами",
  "chat.writeT": "Напиши короткий вірш про термінал о 3-й ночі",
  "chat.compareT": "Порівняй Ollama і vLLM для локальних моделей",

  // coder
  "coder.title": "Кодер",
  "coder.code": "Код",
  "coder.preview": "Прев'ю",
  "coder.terminal": "Термінал",
  "coder.plan": "План",
  "coder.rebuild": "Перебудувати",
  "coder.files": "Файли",
  "coder.emptyTitle": "AiDe Кодер",
  "coder.placeholder": "Наприклад: лендінг кав'ярні",
  "coder.create": "Створити проєкт",
  "coder.writing": "спеціалісти пишуть файли…",
  "coder.askChange": "Попросіть команду про зміну…",
  "coder.working": "Команда працює…",

  // translate
  "tr.title": "Перекладач",
  "tr.text": "Текст",
  "tr.live": "Жива розмова",
  "tr.docs": "Документи",

  // auth
  "auth.createDid": "Створити DID-ідентичність",
  "auth.restore": "Відновити з бекапу",
  "auth.enter": "Увійти в AiDe",
  "auth.backToSite": "Назад на сайт",
  "auth.verify": "Перевірити й увійти",

  // landing
  "land.heroKicker": "безкоштовно · відкрито · твоє",
  "land.heroA": "Одна студія.",
  "land.heroB": "Усі безкоштовні моделі.",
  "land.heroC": "Додатки з одного рядка.",
  "land.heroSub": "AiDe спілкується з безкоштовними тарифами провайдерів, які ви знаєте, а його команда Кодера будує робочий додаток з одного речення.",
  "land.ctaStart": "Створити DID — увійти безкоштовно",
  "land.ctaRestore": "У мене є ідентичність",
  "land.modes": "Три кімнати, один мозок",
  "land.didTitle": "Жодних акаунтів. Лише ваш ключ.",
  "land.didSub": "Доступ — це децентралізована ідентичність, згенерована на цьому пристрої. Нічого реєструвати, нічого втрачати.",
  "land.faqTitle": "Питання",
  "land.footer": "Створено як студію з відкритим духом · MIT",
};

const dicts: Record<Lang, Dict> = { en, uk };

export function detectLang(): Lang {
  try {
    const stored = localStorage.getItem("aide.lang");
    if (stored === "en" || stored === "uk") return stored;
  } catch {
    /* ignore */
  }
  const nav = (navigator.language || "en").toLowerCase();
  return nav.startsWith("uk") ? "uk" : "en";
}

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const Ctx = createContext<I18nCtx>({ lang: "en", setLang: () => {}, t: (k) => k });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang);

  useEffect(() => {
    try {
      localStorage.setItem("aide.lang", lang);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const t = useCallback((key: string) => dicts[lang][key] ?? en[key] ?? key, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  return useContext(Ctx);
}
