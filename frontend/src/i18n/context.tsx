import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { applyLocale, detectLocale, type Locale } from './detect'
import { interpolate, lookupMessage, type TVars } from './lookup'
import { messages, type Messages } from './messages'

export type TFunction = (path: string, vars?: TVars) => string

type I18nValue = {
  locale: Locale
  setLocale: (next: Locale) => void
  t: TFunction
  m: Messages
}

const I18nContext = createContext<I18nValue | null>(null)

// Đồng bộ hóa tiêu đề/mô tả tài liệu
function syncDocumentMeta(m: Messages) {
  if (typeof document === 'undefined') return
  document.title = m.meta.title
  const desc = document.querySelector('meta[name="description"]')
  if (desc) desc.setAttribute('content', m.meta.description)
}

/** Ngôn ngữ trang web đầy đủ: Được trình duyệt tự động nhận dạng, được chọn thủ công và ghi vào localStorage */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const next = detectLocale()
    applyLocale(next, false)
    return next
  })

  const m = messages[locale]

  useEffect(() => {
    applyLocale(locale, false)
    syncDocumentMeta(m)
  }, [locale, m])

  const setLocale = useCallback((next: Locale) => {
    applyLocale(next, true)
    setLocaleState(next)
  }, [])

  const t = useCallback<TFunction>(
    (path, vars) => {
      let raw = lookupMessage(m, path)
      if (!raw && locale !== 'vi') {
        raw = lookupMessage(messages.vi, path)
      }
      if (!raw && locale !== 'zh') {
        raw = lookupMessage(messages.zh, path)
      }
      if (!raw && locale !== 'en') {
        raw = lookupMessage(messages.en, path)
      }
      if (!raw) return path
      return interpolate(raw, vars)
    },
    [locale, m],
  )

  const value = useMemo(() => ({ locale, setLocale, t, m }), [locale, setLocale, t, m])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
