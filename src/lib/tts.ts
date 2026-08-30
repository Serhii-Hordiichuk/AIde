/* Text-to-speech helpers (Web Speech API), shared by Chat and Translate modes. */

export function speakable(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " Code block omitted. ")
    .replace(/`[^`]*`/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_~|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function hasCyrillic(t: string): boolean {
  return /[а-яА-ЯіїєґІЇЄҐ]/.test(t);
}

export function pickVoice(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | null {
  const norm = lang.replace("_", "-").toLowerCase();
  const base = norm.slice(0, 2);
  const exact = voices.find((v) => v.lang.toLowerCase().replace("_", "-") === norm);
  if (exact) return exact;
  const pref = { uk: "uk-UA", en: "en-US" }[base];
  if (pref) {
    const p = voices.find((v) => v.lang.toLowerCase().replace("_", "-") === pref.toLowerCase());
    if (p) return p;
  }
  const partial = voices.find((v) => v.lang.toLowerCase().startsWith(base));
  return partial ?? voices[0] ?? null;
}

export interface SpeakHandle {
  cancel: () => void;
}

/* ISO 639-1 → sensible default BCP-47 region (fallback for voices without an exact hint). */
const ISO_BCP: Record<string, string> = {
  en: "en-US", uk: "uk-UA", ru: "ru-RU", pl: "pl-PL", de: "de-DE", fr: "fr-FR",
  es: "es-ES", pt: "pt-BR", it: "it-IT", nl: "nl-NL", tr: "tr-TR", ar: "ar-SA",
  he: "he-IL", fa: "fa-IR", hi: "hi-IN", zh: "zh-CN", yue: "zh-HK", ja: "ja-JP",
  ko: "ko-KR", vi: "vi-VN", th: "th-TH", id: "id-ID", cs: "cs-CZ", sk: "sk-SK",
  ro: "ro-RO", hu: "hu-HU", el: "el-GR", sv: "sv-SE", no: "nb-NO", da: "da-DK",
  fi: "fi-FI", bg: "bg-BG", sr: "sr-RS", hr: "hr-HR", ca: "ca-ES", kk: "kk-KZ",
};

/** Normalizes an ISO / BCP-47 code into a valid BCP-47 tag. */
export function toBcp47(lang: string): string {
  if (!lang) return "en-US";
  if (lang.includes("-")) return lang;
  return ISO_BCP[lang] ?? `${lang}-${lang.toUpperCase()}`;
}

/** Speaks `text` in `lang` (BCP-47 or ISO). Returns a handle to cancel. No-op if unsupported. */
export function speak(text: string, lang: string, onEnd?: () => void): SpeakHandle {
  const noop: SpeakHandle = { cancel: () => {} };
  if (!("speechSynthesis" in window)) return noop;
  const synth = window.speechSynthesis;
  synth.cancel();
  const clean = speakable(text).slice(0, 2400);
  if (!clean) {
    onEnd?.();
    return noop;
  }
  const u = new SpeechSynthesisUtterance(clean);
  u.lang = toBcp47(lang);
  const voice = pickVoice(synth.getVoices(), lang);
  if (voice) {
    u.voice = voice;
    u.lang = voice.lang;
  }
  u.rate = 1;
  u.pitch = 1;
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();
  synth.speak(u);
  return { cancel: () => synth.cancel() };
}

export function ttsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function sttSupported(): boolean {
  return typeof window !== "undefined" &&
    !!(window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
    !!(window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
}
