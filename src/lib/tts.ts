import { ttsLang } from "./languages";

export function ttsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function stripForSpeech(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " code block. ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/[#*_>|[\]()!-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pickVoice(voices: SpeechSynthesisVoice[], tag: string): SpeechSynthesisVoice | null {
  const base = tag.slice(0, 2).toLowerCase();
  return (
    voices.find((v) => v.lang?.toLowerCase() === tag.toLowerCase()) ??
    voices.find((v) => v.lang?.toLowerCase().startsWith(base)) ??
    null
  );
}

let warm = false;
function warmVoices() {
  if (warm || !ttsSupported()) return;
  warm = true;
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}

export function speakText(text: string, langCode: string, opts?: { onEnd?: () => void; maxChars?: number }): void {
  if (!ttsSupported()) {
    opts?.onEnd?.();
    return;
  }
  warmVoices();
  window.speechSynthesis.cancel();
  const clean = stripForSpeech(text).slice(0, opts?.maxChars ?? 1400);
  if (!clean) {
    opts?.onEnd?.();
    return;
  }
  const tag = ttsLang(langCode);
  const u = new SpeechSynthesisUtterance(clean);
  u.lang = tag;
  const v = pickVoice(window.speechSynthesis.getVoices(), tag);
  if (v) u.voice = v;
  u.rate = 1;
  u.pitch = 1;
  u.onend = () => opts?.onEnd?.();
  u.onerror = () => opts?.onEnd?.();
  window.speechSynthesis.speak(u);
}

export function stopSpeaking(): void {
  if (ttsSupported()) window.speechSynthesis.cancel();
}
