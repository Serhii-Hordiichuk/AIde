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

/** Speaks `text` in `lang` (BCP-47 or ISO). Returns a handle to cancel. No-op if unsupported. */
export function speak(text: string, lang: string, onEnd?: () => void): SpeakHandle {
  const noop: SpeakHandle = { cancel: () => {} };
  if (!("speechSynthesis" in window)) return noop;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(speakable(text).slice(0, 2400));
  u.lang = lang.includes("-") ? lang : `${lang}-${lang.toUpperCase()}`;
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
