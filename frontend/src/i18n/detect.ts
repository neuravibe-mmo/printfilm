/** Phát hiện ngôn ngữ trình duyệt, phủ sóng cục bộ và đồng bộ hóa lang html */

export type Locale = 'vi' | 'en' | 'zh'

export const LOCALES: Locale[] = ['vi', 'en', 'zh']

export const LOCALE_STORAGE_KEY = 'printfilm.locale'

export const LOCALE_HTML: Record<Locale, string> = {
  vi: 'vi',
  en: 'en',
  zh: 'zh-CN',
}

export const LOCALE_DATE: Record<Locale, string> = {
  vi: 'vi-VN',
  en: 'en-US',
  zh: 'zh-CN',
}

// Ngôn ngữ hiệu quả hiện tại (có thể đọc được bằng các chức năng của công cụ không phải React)
let activeLocale: Locale = 'vi'

// Đây có phải là mã ngôn ngữ được hỗ trợ không?
export function isLocale(value: unknown): value is Locale {
  return value === 'zh' || value === 'en' || value === 'vi'
}

// Ánh xạ từ Ngôn ngữ chấp nhận/điều hướng sang vi, en hoặc zh
export function localeFromBrowser(lang?: string): Locale {
  const raw = (lang || '').trim().toLowerCase()
  if (raw.startsWith('zh')) return 'zh'
  if (raw.startsWith('en')) return 'en'
  return 'vi'
}

// Đọc lựa chọn hướng dẫn sử dụng của người dùng; nếu không có bản ghi, trả về null (theo trình duyệt)
export function readStoredLocale(): Locale | null {
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY)
    return isLocale(raw) ? raw : null
  } catch {
    return null
  }
}

// Vào lần đầu: Nếu có manual thì dùng manual, còn không thì theo trình duyệt (mặc định ưu tiên Tiếng Việt)
export function detectLocale(): Locale {
  const stored = typeof window === 'undefined' ? null : readStoredLocale()
  if (stored) return stored
  if (typeof navigator === 'undefined') return 'vi'
  const hint = navigator.language || navigator.languages?.[0]
  if (!hint) return 'vi'
  return localeFromBrowser(hint)
}

export function getActiveLocale(): Locale {
  return activeLocale
}

// Ngôn ngữ ứng dụng: viết lang html; chỉ viết localStorage khi vẫn tồn tại
export function applyLocale(locale: Locale, persist: boolean): void {
  activeLocale = locale
  if (persist) {
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale)
    } catch {
      /* ignore quota / private mode */
    }
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = LOCALE_HTML[locale]
  }
}

// Ngày và giờ được định dạng theo ngôn ngữ hiện tại
export function formatDateTime(value?: string | Date | null, locale: Locale = activeLocale): string {
  if (!value) return '—'
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(LOCALE_DATE[locale], {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
