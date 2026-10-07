import { getActiveLocale } from '../i18n/detect'
import { messages } from '../i18n/messages'

export const CATEGORY_ORDER = [
  'TikTok / Reels',
  'Review & Bán hàng',
  'Công nghệ',
  'Người thật',
  'Hoạt hình & 3D',
  'Điện ảnh',
  'Kiến thức',
  'Đời sống',
  'Nghệ thuật',
  'Retro',
  'Thiếu nhi',
  'Khoa học viễn tưởng',
  'Kỳ ảo',
  'Phim tài liệu',
  // Khóa tương thích dữ liệu cũ
  '获客',
  '开源',
  '科普',
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

const CATEGORY_I18N: Record<string, Record<string, string>> = {
  'TikTok / Reels': {
    vi: 'TikTok / Reels',
    en: 'TikTok / Reels',
    zh: '抖音 / Reels',
  },
  'Review & Bán hàng': {
    vi: 'Review & Bán hàng',
    en: 'Reviews & Sales',
    zh: '测评带货',
  },
  'Công nghệ': {
    vi: 'Công nghệ',
    en: 'Tech & Software',
    zh: '科技软件',
  },
  'Người thật': {
    vi: 'Người thật',
    en: 'Live Action',
    zh: '真人实拍',
  },
  'Hoạt hình & 3D': {
    vi: 'Hoạt hình & 3D',
    en: 'Animation & 3D',
    zh: '动画与3D',
  },
  'Điện ảnh': {
    vi: 'Điện ảnh',
    en: 'Cinematic',
    zh: '电影感',
  },
  'Kiến thức': {
    vi: 'Kiến thức',
    en: 'Knowledge & Edu',
    zh: '硬核科普',
  },
  'Đời sống': {
    vi: 'Đời sống',
    en: 'Life & Vlog',
    zh: '生活日常',
  },
  'Nghệ thuật': {
    vi: 'Nghệ thuật',
    en: 'Art & Design',
    zh: '艺术设计',
  },
  'Retro': {
    vi: 'Retro',
    en: 'Vintage & Retro',
    zh: '复古怀旧',
  },
  'Thiếu nhi': {
    vi: 'Thiếu nhi',
    en: 'Kids',
    zh: '儿童治愈',
  },
}

/** Khóa danh mục → Nhãn hiển thị ngôn ngữ hiện tại */
export function getCategoryLabel(key: string): string {
  const locale = getActiveLocale()
  if (CATEGORY_I18N[key]?.[locale]) {
    return CATEGORY_I18N[key][locale]
  }
  const m = messages[locale] as unknown as { categories?: Record<string, string> }
  return m?.categories?.[key] ?? key
}

/** Tương thích với mã cũ: dùng key để kiểm tra Record của nhãn hiển thị */
export const HOME_CATEGORY_LABELS: Record<string, string> = new Proxy({} as Record<string, string>, {
  get(_target, prop: string) {
    return getCategoryLabel(prop)
  },
})
