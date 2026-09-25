import { getActiveLocale } from '../i18n/detect'
import { messages } from '../i18n/messages'

export const CATEGORY_ORDER = [
  '开源',
  '科普',
  '获客',
  '纪录片',
  '写实感',
  '真人感',
  '电影感',
  '儿童',
  '动漫',
  '国风',
  '科幻',
  '奇幻',
  '悬疑',
  '商业',
  '复古',
  '图文',
]

/** zh中文内部键 → 当前语言显示标签 */
export function getCategoryLabel(key: string): string {
  const locale = getActiveLocale()
  const m = messages[locale] as unknown as { categories?: Record<string, string> }
  return m?.categories?.[key] ?? key
}

/** 兼容旧代码：用 key 查显示标签的 Record */
export const HOME_CATEGORY_LABELS: Record<string, string> = new Proxy({} as Record<string, string>, {
  get(_target, prop: string) {
    return getCategoryLabel(prop)
  },
})
