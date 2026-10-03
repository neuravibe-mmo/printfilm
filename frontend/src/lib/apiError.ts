import { notifyBillingErrorIfNeeded } from './billingError'
import { getActiveLocale } from '../i18n/detect'

const ERROR_TRANSLATIONS: Array<[RegExp, { vi: string; en: string }]> = [
  [
    /未解析到可用文字模型.*TokenFree API Key/i,
    {
      vi: 'Chưa cấu hình mô hình văn bản khả dụng. Vui lòng điền TokenFree API Key trong trang quản trị, đồng bộ và chọn mô hình văn bản.',
      en: 'No available text model configured. Please enter TokenFree API Key in admin console, fetch and select a text model.',
    },
  ],
  [
    /未配置 OPENAI_API_KEY/i,
    {
      vi: 'Chưa cấu hình OPENAI_API_KEY, không thể gọi mô hình văn bản. Vui lòng điền TokenFree API Key và chọn mô hình văn bản trong trang quản trị.',
      en: 'OPENAI_API_KEY not configured. Please fill in TokenFree API Key and select text model in admin console.',
    },
  ],
  [
    /请先生成剧本摘要/i,
    {
      vi: 'Vui lòng tạo tóm tắt kịch bản trước.',
      en: 'Please generate script summary first.',
    },
  ],
  [
    /请先生成分集剧本/i,
    {
      vi: 'Vui lòng tạo kịch bản tập trước.',
      en: 'Please generate episode script first.',
    },
  ],
  [
    /请先填写.*(创意或摘要|Ý tưởng)/i,
    {
      vi: 'Vui lòng điền ý tưởng hoặc tóm tắt của tập này trước.',
      en: 'Please fill in this episode creative or summary first.',
    },
  ],
  [
    /请先输入.*剧本草稿/i,
    {
      vi: 'Vui lòng nhập bản thảo kịch bản tập này trước rồi để AI tối ưu.',
      en: 'Please enter this episode script draft before AI optimization.',
    },
  ],
  [
    /请先有本集剧本内容/i,
    {
      vi: 'Vui lòng có nội dung kịch bản tập này trước rồi mới bổ sung ý tưởng và tóm tắt.',
      en: 'Please have episode script content before adding creative and summary.',
    },
  ],
  [
    /全集剧本正在生成/i,
    {
      vi: 'Kịch bản toàn tập đang được tạo, vui lòng chờ hoàn thành trước khi thêm tập mới.',
      en: 'All episode scripts are generating, please wait until complete before adding episodes.',
    },
  ],
]

export function localizeErrorMessage(raw: string): string {
  const locale = getActiveLocale()
  if (locale === 'zh') return raw
  for (const [regex, map] of ERROR_TRANSLATIONS) {
    if (regex.test(raw)) {
      return locale === 'vi' ? map.vi : map.en
    }
  }
  return raw
}

/** Phân tích chi tiết FastAPI và đưa ra; 402/ Hướng dẫn nạp tiền hiện lên khi số dư không đủ */
export function throwApiError(status: number, detail: unknown, fallback?: string): never {
  const locale = getActiveLocale()
  const defaultFallback = locale === 'vi' ? 'Yêu cầu thất bại' : locale === 'en' ? 'Request failed' : '请求失败'
  const fb = fallback || defaultFallback
  const rawMessage =
    typeof detail === 'string'
      ? detail
      : Array.isArray(detail)
        ? detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join('; ')
        : fb
  const message = localizeErrorMessage(rawMessage || fb)
  notifyBillingErrorIfNeeded(status, message)
  throw new Error(message)
}
