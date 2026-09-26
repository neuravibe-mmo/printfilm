import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { applyLocale, detectLocale, type Locale } from "./detect";
import { interpolate, lookupMessage } from "./lookup";
import { messages, type Messages } from "./messages";
import { I18nContext, type TFunction } from "./I18nContext";

function syncDocumentMeta(m: Messages) {
  if (typeof document === "undefined") return;
  document.title = m.meta.title;
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute("content", m.meta.description);
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const next = detectLocale();
    applyLocale(next, false);
    return next;
  });

  const m = messages[locale] ?? messages.zh;

  useEffect(() => {
    applyLocale(locale, false);
    syncDocumentMeta(m);
  }, [locale, m]);

  const setLocale = useCallback((next: Locale) => {
    applyLocale(next, true);
    setLocaleState(next);
  }, []);

  const t = useCallback<TFunction>(
    (path, vars) => {
      const raw = lookupMessage(m, path) ?? lookupMessage(messages.zh, path);
      if (!raw) return path;
      return interpolate(raw, vars);
    },
    [m],
  );

  const value = useMemo(() => ({ locale, setLocale, t, m }), [locale, setLocale, t, m]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
