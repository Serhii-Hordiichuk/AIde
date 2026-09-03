export interface LangDef {
  code: string;
  name: string;
  native: string;
}

export const LANGS: LangDef[] = [
  { code: "en", name: "English", native: "English" },
  { code: "uk", name: "Ukrainian", native: "Українська" },
  { code: "pl", name: "Polish", native: "Polski" },
  { code: "de", name: "German", native: "Deutsch" },
  { code: "fr", name: "French", native: "Français" },
  { code: "es", name: "Spanish", native: "Español" },
  { code: "pt", name: "Portuguese", native: "Português" },
  { code: "it", name: "Italian", native: "Italiano" },
  { code: "nl", name: "Dutch", native: "Nederlands" },
  { code: "sv", name: "Swedish", native: "Svenska" },
  { code: "no", name: "Norwegian", native: "Norsk" },
  { code: "da", name: "Danish", native: "Dansk" },
  { code: "fi", name: "Finnish", native: "Suomi" },
  { code: "cs", name: "Czech", native: "Čeština" },
  { code: "sk", name: "Slovak", native: "Slovenčina" },
  { code: "sl", name: "Slovenian", native: "Slovenščina" },
  { code: "hr", name: "Croatian", native: "Hrvatski" },
  { code: "sr", name: "Serbian", native: "Српски" },
  { code: "bs", name: "Bosnian", native: "Bosanski" },
  { code: "mk", name: "Macedonian", native: "Македонски" },
  { code: "bg", name: "Bulgarian", native: "Български" },
  { code: "ru", name: "Russian", native: "Русский" },
  { code: "be", name: "Belarusian", native: "Беларуская" },
  { code: "ro", name: "Romanian", native: "Română" },
  { code: "hu", name: "Hungarian", native: "Magyar" },
  { code: "el", name: "Greek", native: "Ελληνικά" },
  { code: "tr", name: "Turkish", native: "Türkçe" },
  { code: "az", name: "Azerbaijani", native: "Azərbaycan" },
  { code: "kk", name: "Kazakh", native: "Қазақша" },
  { code: "uz", name: "Uzbek", native: "Oʻzbekcha" },
  { code: "ka", name: "Georgian", native: "ქართული" },
  { code: "hy", name: "Armenian", native: "Հայերեն" },
  { code: "ar", name: "Arabic", native: "العربية" },
  { code: "he", name: "Hebrew", native: "עברית" },
  { code: "fa", name: "Persian", native: "فارسی" },
  { code: "ur", name: "Urdu", native: "اردو" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
  { code: "mr", name: "Marathi", native: "मराठी" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", native: "മലയാളം" },
  { code: "si", name: "Sinhala", native: "සිංහල" },
  { code: "ne", name: "Nepali", native: "नेपाली" },
  { code: "zh", name: "Chinese", native: "中文" },
  { code: "yue", name: "Cantonese", native: "廣東話" },
  { code: "ja", name: "Japanese", native: "日本語" },
  { code: "ko", name: "Korean", native: "한국어" },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt" },
  { code: "th", name: "Thai", native: "ไทย" },
  { code: "lo", name: "Lao", native: "ລາວ" },
  { code: "km", name: "Khmer", native: "ខ្មែរ" },
  { code: "my", name: "Burmese", native: "မြန်မာ" },
  { code: "ms", name: "Malay", native: "Bahasa Melayu" },
  { code: "id", name: "Indonesian", native: "Bahasa Indonesia" },
  { code: "tl", name: "Filipino", native: "Filipino" },
  { code: "sw", name: "Swahili", native: "Kiswahili" },
  { code: "am", name: "Amharic", native: "አማርኛ" },
  { code: "ha", name: "Hausa", native: "Hausa" },
  { code: "yo", name: "Yoruba", native: "Yorùbá" },
  { code: "zu", name: "Zulu", native: "isiZulu" },
  { code: "af", name: "Afrikaans", native: "Afrikaans" },
  { code: "ca", name: "Catalan", native: "Català" },
  { code: "gl", name: "Galician", native: "Galego" },
  { code: "eu", name: "Basque", native: "Euskara" },
  { code: "ga", name: "Irish", native: "Gaeilge" },
  { code: "cy", name: "Welsh", native: "Cymraeg" },
  { code: "mt", name: "Maltese", native: "Malti" },
  { code: "is", name: "Icelandic", native: "Íslenska" },
  { code: "et", name: "Estonian", native: "Eesti" },
  { code: "lv", name: "Latvian", native: "Latviešu" },
  { code: "lt", name: "Lithuanian", native: "Lietuvių" },
  { code: "sq", name: "Albanian", native: "Shqip" },
  { code: "mn", name: "Mongolian", native: "Монгол" },
];

export const langName = (code: string): string => LANGS.find((l) => l.code === code)?.native ?? code;

export function ttsLang(code: string): string {
  const map: Record<string, string> = { zh: "zh-CN", yue: "zh-HK", pt: "pt-BR", no: "nb-NO", tl: "fil-PH", he: "he-IL" };
  return map[code] ?? code;
}

export function detectByScript(text: string): string | null {
  const t = text.trim();
  if (!t) return null;
  if (/[\u4e00-\u9fff]/.test(t)) return "zh";
  if (/[\u3040-\u30ff]/.test(t)) return "ja";
  if (/[\uac00-\ud7af]/.test(t)) return "ko";
  if (/[\u0590-\u05ff]/.test(t)) return "he";
  if (/[\u0600-\u06ff]/.test(t)) return "ar";
  if (/[\u0e00-\u0e7f]/.test(t)) return "th";
  if (/[\u0400-\u04ff]/.test(t)) {
    if (/[іїєґ]/i.test(t)) return "uk";
    if (/[ыэъ]/i.test(t)) return "ru";
    return "uk";
  }
  if (/[ąćęłńśźż]/i.test(t)) return "pl";
  if (/[ğışİ]/i.test(t)) return "tr";
  if (/[äöüß]/i.test(t)) return "de";
  if (/[áéíóúñ¿¡]/i.test(t)) return "es";
  if (/[àâçèêëîïôùûœ]/i.test(t)) return "fr";
  if (/[ãõ]/i.test(t)) return "pt";
  if (/\b(the|and|is|of|to|that)\b/i.test(t)) return "en";
  return null;
}
