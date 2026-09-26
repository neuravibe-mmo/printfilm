/** Browser language detection, storage, and document title/lang sync */

export type Locale = "zh" | "en" | "vi";

export const LOCALES: Locale[] = ["zh", "en", "vi"];

export const LOCALE_LABELS: Record<Locale, { label: string; flag: string }> = {
  zh: { label: "简体中文", flag: "🇨🇳" },
  en: { label: "English", flag: "🇺🇸" },
  vi: { label: "Tiếng Việt", flag: "🇻🇳" },
};

export const LOCALE_STORAGE_KEY = "printfilm.admin.locale";
export const FALLBACK_STORAGE_KEY = "printfilm.locale";

export const LOCALE_HTML: Record<Locale, string> = {
  zh: "zh-CN",
  en: "en",
  vi: "vi",
};

export const LOCALE_DATE: Record<Locale, string> = {
  zh: "zh-CN",
  en: "en-US",
  vi: "vi-VN",
};

let activeLocale: Locale = "zh";

export function isLocale(value: unknown): value is Locale {
  return value === "zh" || value === "en" || value === "vi";
}

export function localeFromBrowser(lang?: string): Locale {
  const raw = (lang || "").trim().toLowerCase();
  if (raw.startsWith("zh")) return "zh";
  if (raw.startsWith("vi")) return "vi";
  return "en";
}

export function readStoredLocale(): Locale | null {
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY) || localStorage.getItem(FALLBACK_STORAGE_KEY);
    return isLocale(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function detectLocale(): Locale {
  const stored = typeof window === "undefined" ? null : readStoredLocale();
  if (stored) return stored;
  if (typeof navigator === "undefined") return "zh";
  const hint = navigator.language || navigator.languages?.[0] || "zh";
  return localeFromBrowser(hint);
}

export function getActiveLocale(): Locale {
  return activeLocale;
}

export function applyLocale(locale: Locale, persist: boolean): void {
  activeLocale = locale;
  if (persist) {
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
      localStorage.setItem(FALLBACK_STORAGE_KEY, locale);
    } catch {
      /* ignore quota or private mode */
    }
  }
  if (typeof document !== "undefined") {
    document.documentElement.lang = LOCALE_HTML[locale];
  }
}

export function formatDateTime(value?: string | Date | null, locale: Locale = activeLocale): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(LOCALE_DATE[locale], {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
