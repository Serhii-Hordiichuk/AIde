/* Language registry: ISO codes, native names, TTS voice hints,
   and a Unicode-heuristic auto-detector. */

export interface Lang {
  code: string;
  name: string;
  native: string;
  tts?: string[]; // BCP-47 hints for speechSynthesis
}

export const LANGS: Lang[] = [
  { code: "en", name: "English", native: "English", tts: ["en-US", "en-GB"] },
  { code: "uk", name: "Ukrainian", native: "Українська", tts: ["uk-UA"] },
  { code: "pl", name: "Polish", native: "Polski", tts: ["pl-PL"] },
  { code: "de", name: "German", native: "Deutsch", tts: ["de-DE"] },
  { code: "fr", name: "French", native: "Français", tts: ["fr-FR"] },
  { code: "es", name: "Spanish", native: "Español", tts: ["es-ES", "es-419"] },
  { code: "pt", name: "Portuguese", native: "Português", tts: ["pt-BR", "pt-PT"] },
  { code: "it", name: "Italian", native: "Italiano", tts: ["it-IT"] },
  { code: "nl", name: "Dutch", native: "Nederlands", tts: ["nl-NL"] },
  { code: "tr", name: "Turkish", native: "Türkçe", tts: ["tr-TR"] },
  { code: "ar", name: "Arabic", native: "العربية", tts: ["ar-SA"] },
  { code: "he", name: "Hebrew", native: "עברית", tts: ["he-IL"] },
  { code: "fa", name: "Persian", native: "فارسی", tts: ["fa-IR"] },
  { code: "ur", name: "Urdu", native: "اردو", tts: ["ur-PK"] },
  { code: "hi", name: "Hindi", native: "हिन्दी", tts: ["hi-IN"] },
  { code: "bn", name: "Bengali", native: "বাংলা", tts: ["bn-IN"] },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
  { code: "mr", name: "Marathi", native: "मराठी" },
  { code: "ta", name: "Tamil", native: "தமிழ்", tts: ["ta-IN"] },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", native: "മലയാളം" },
  { code: "si", name: "Sinhala", native: "සිංහල" },
  { code: "ne", name: "Nepali", native: "नेपाली" },
  { code: "zh", name: "Chinese (Mandarin)", native: "中文", tts: ["zh-CN", "zh-TW"] },
  { code: "yue", name: "Cantonese", native: "粵語", tts: ["zh-HK"] },
  { code: "ja", name: "Japanese", native: "日本語", tts: ["ja-JP"] },
  { code: "ko", name: "Korean", native: "한국어", tts: ["ko-KR"] },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt", tts: ["vi-VN"] },
  { code: "th", name: "Thai", native: "ไทย", tts: ["th-TH"] },
  { code: "km", name: "Khmer", native: "ខ្មែរ" },
  { code: "lo", name: "Lao", native: "ລາວ" },
  { code: "my", name: "Burmese", native: "မြန်မာ" },
  { code: "id", name: "Indonesian", native: "Bahasa Indonesia", tts: ["id-ID"] },
  { code: "ms", name: "Malay", native: "Bahasa Melayu" },
  { code: "jv", name: "Javanese", native: "Basa Jawa" },
  { code: "tl", name: "Filipino", native: "Filipino", tts: ["fil-PH"] },
  { code: "sw", name: "Swahili", native: "Kiswahili" },
  { code: "am", name: "Amharic", native: "አማርኛ" },
  { code: "yo", name: "Yoruba", native: "Yorùbá" },
  { code: "ha", name: "Hausa", native: "Hausa" },
  { code: "ig", name: "Igbo", native: "Igbo" },
  { code: "zu", name: "Zulu", native: "isiZulu" },
  { code: "af", name: "Afrikaans", native: "Afrikaans" },
  { code: "ru", name: "Russian", native: "Русский", tts: ["ru-RU"] },
  { code: "be", name: "Belarusian", native: "Беларуская" },
  { code: "bg", name: "Bulgarian", native: "Български", tts: ["bg-BG"] },
  { code: "sr", name: "Serbian", native: "Српски", tts: ["sr-RS"] },
  { code: "hr", name: "Croatian", native: "Hrvatski", tts: ["hr-HR"] },
  { code: "bs", name: "Bosnian", native: "Bosanski" },
  { code: "sl", name: "Slovenian", native: "Slovenščina" },
  { code: "mk", name: "Macedonian", native: "Македонски" },
  { code: "sq", name: "Albanian", native: "Shqip" },
  { code: "el", name: "Greek", native: "Ελληνικά", tts: ["el-GR"] },
  { code: "ro", name: "Romanian", native: "Română", tts: ["ro-RO"] },
  { code: "hu", name: "Hungarian", native: "Magyar", tts: ["hu-HU"] },
  { code: "cs", name: "Czech", native: "Čeština", tts: ["cs-CZ"] },
  { code: "sk", name: "Slovak", native: "Slovenčina", tts: ["sk-SK"] },
  { code: "fi", name: "Finnish", native: "Suomi", tts: ["fi-FI"] },
  { code: "et", name: "Estonian", native: "Eesti" },
  { code: "lv", name: "Latvian", native: "Latviešu" },
  { code: "lt", name: "Lithuanian", native: "Lietuvių" },
  { code: "sv", name: "Swedish", native: "Svenska", tts: ["sv-SE"] },
  { code: "no", name: "Norwegian", native: "Norsk", tts: ["nb-NO"] },
  { code: "da", name: "Danish", native: "Dansk", tts: ["da-DK"] },
  { code: "is", name: "Icelandic", native: "Íslenska" },
  { code: "ga", name: "Irish", native: "Gaeilge" },
  { code: "cy", name: "Welsh", native: "Cymraeg" },
  { code: "mt", name: "Maltese", native: "Malti" },
  { code: "ca", name: "Catalan", native: "Català", tts: ["ca-ES"] },
  { code: "eu", name: "Basque", native: "Euskara" },
  { code: "gl", name: "Galician", native: "Galego" },
  { code: "kk", name: "Kazakh", native: "Қазақша", tts: ["kk-KZ"] },
  { code: "uz", name: "Uzbek", native: "Oʻzbekcha" },
  { code: "ky", name: "Kyrgyz", native: "Кыргызча" },
  { code: "tg", name: "Tajik", native: "Тоҷикӣ" },
  { code: "tk", name: "Turkmen", native: "Türkmençe" },
  { code: "az", name: "Azerbaijani", native: "Azərbaycanca" },
  { code: "hy", name: "Armenian", native: "Հայերեն" },
  { code: "ka", name: "Georgian", native: "ქართული" },
  { code: "mn", name: "Mongolian", native: "Монгол" },
];

export const langByCode = new Map(LANGS.map((l) => [l.code, l]));

export function langName(code: string): string {
  const l = langByCode.get(code);
  return l ? `${l.name}` : code.toUpperCase();
}

export function ttsLang(code: string): string {
  const l = langByCode.get(code);
  return l?.tts?.[0] ?? code;
}

/* ---------- heuristic auto-detect (script-based, instant, offline) ---------- */

function countRe(s: string, re: RegExp): number {
  return (s.match(re) ?? []).length;
}

/** Returns an ISO-ish code guess, or null when unsure. */
export function detectByScript(text: string): string | null {
  const t = text.slice(0, 1200);
  if (/[\u3040-\u30ff]/.test(t)) return "ja";
  if (/[\uac00-\ud7af]/.test(t)) return "ko";
  if (/[\u4e00-\u9fff]/.test(t)) return "zh";
  if (/[\u0e00-\u0e7f]/.test(t)) return "th";
  if (/[\u1780-\u17ff]/.test(t)) return "km";
  if (/[\u0e80-\u0eff]/.test(t)) return "lo";
  if (/[\u1000-\u109f]/.test(t)) return "my";
  if (/[\u0590-\u05ff]/.test(t)) return "he";
  if (/[\u0600-\u06ff]/.test(t)) {
    if (/[ٹڈڑںےہ]/.test(t)) return "ur";
    if (/[پچژگی]/.test(t)) return "fa";
    return "ar";
  }
  if (/[\u0400-\u04ff]/.test(t)) {
    if (/[іїєґ]/i.test(t)) return "uk";
    if (/[ўі]/.test(t)) return "be";
    if (/[ъь]/.test(t) && !/[іїєґ]/i.test(t)) return "ru";
    if (/[јљњђ]/.test(t)) return "sr";
    return "ru";
  }
  if (/[\u0900-\u097f]/.test(t)) {
    if (/[ঀ-৿]/.test(t)) return "bn";
    return "hi";
  }
  if (/[\u0b80-\u0bff]/.test(t)) return "ta";
  if (/[\u0c00-\u0c7f]/.test(t)) return "te";
  if (/[\u0c80-\u0cff]/.test(t)) return "kn";
  if (/[\u0d00-\u0d7f]/.test(t)) return "ml";
  if (/[\u0a00-\u0a7f]/.test(t)) return "pa";
  if (/[\u0a80-\u0aff]/.test(t)) return "gu";
  if (/[\u0980-\u09ff]/.test(t)) return "bn";

  /* Latin: lean on frequent words */
  const w = t.toLowerCase();
  if (/\b(und|der|die|das|nicht|für|mit)\b/.test(w)) return "de";
  if (/\b(et|les|des|est|une|pour|avec)\b/.test(w)) return "fr";
  if (/\b(el|los|las|una|por|para|con)\b/.test(w)) return "es";
  if (/\b(o|os|as|uma|para|com|não)\b/.test(w) && /\b(não|ção|ões)\b/.test(w)) return "pt";
  if (/\b(e|il|la|che|per|sono|con)\b/.test(w) && /\b(perché|è|gli)\b/.test(w)) return "it";
  if (/\b(de|het|een|niet|voor|met)\b/.test(w) && /\b(zijn|ook)\b/.test(w)) return "nl";
  if (/\b(ve|bir|bu|için|ile)\b/.test(w)) return "tr";
  if (/\b(och|att|som|inte|för)\b/.test(w)) return "sv";
  if (/\b(og|er|ikke|til|med)\b/.test(w) && /\b(har|på)\b/.test(w)) return "no";
  if (/\b(og|er|ikke|til|af)\b/.test(w)) return "da";
  if (/\b(ja|ei|on|että|mutta)\b/.test(w)) return "fi";
  if (/\b(i|w|nie|to|się|na)\b/.test(w) && /\b(jest|że)\b/.test(w)) return "pl";
  if (/\b(și|este|cu|pentru|din)\b/.test(w)) return "ro";
  if (/\b(és|nem|hogy|van)\b/.test(w)) return "hu";
  if (/\b(a|že|je|na|to)\b/.test(w) && /\b(pře|ř|ů)\b/.test(w)) return "cs";
  if (/\b(the|and|is|of|to|that)\b/.test(w)) return "en";
  if (/[іїєґ]/i.test(t)) return "uk";
  return null;
}

/** Normalizes a model's reply (an ISO code) to a registry code. */
export function normalizeCode(raw: string): string | null {
  const c = raw.trim().toLowerCase().split(/[^a-z-]/)[0] ?? "";
  const base = c.slice(0, 2);
  if (langByCode.has(c)) return c;
  if (langByCode.has(base)) return base;
  const map: Record<string, string> = {
    zh: "zh", "zh-cn": "zh", "zh-tw": "zh", "cmn": "zh", yue: "yue",
    "pt-br": "pt", "pt-pt": "pt", "en-us": "en", "en-gb": "en",
    "es-419": "es", "es-mx": "es", "sr-latn": "sr", sh: "hr", tl: "tl", fil: "tl",
    iw: "he", in: "id", jw: "jv", mo: "ro", nb: "no", nn: "no",
  };
  return map[c] ?? map[base] ?? null;
}
