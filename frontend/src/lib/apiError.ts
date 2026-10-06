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
    /登录已失效|登录过期|登录已过期|未登录或登录已失效/i,
    {
      vi: 'Đăng nhập đã hết hạn, vui lòng đăng nhập lại.',
      en: 'Login session has expired, please log in again.',
    },
  ],
  [
    /未登录/i,
    {
      vi: 'Chưa đăng nhập, vui lòng đăng nhập để tiếp tục.',
      en: 'Not logged in, please log in to continue.',
    },
  ],
  [
    /邮箱或密码错误/i,
    {
      vi: 'Email hoặc mật khẩu không chính xác.',
      en: 'Incorrect email or password.',
    },
  ],
  [
    /邮箱已注册|该邮箱已被使用/i,
    {
      vi: 'Email này đã được đăng ký hoặc sử dụng.',
      en: 'This email is already in use.',
    },
  ],
  [
    /当前密码不正确/i,
    {
      vi: 'Mật khẩu hiện tại không chính xác.',
      en: 'Current password is incorrect.',
    },
  ],
  [
    /新密码不能与当前密码相同/i,
    {
      vi: 'Mật khẩu mới không được trùng với mật khẩu hiện tại.',
      en: 'New password cannot be the same as the current password.',
    },
  ],
  [
    /缺少.*API Key/i,
    {
      vi: 'Thiếu API Key.',
      en: 'Missing API Key.',
    },
  ],
  [
    /API Key.*(无效|已撤销)/i,
    {
      vi: 'API Key không hợp lệ hoặc đã bị thu hồi.',
      en: 'API Key is invalid or has been revoked.',
    },
  ],
  [
    /需要管理员权限|该账号没有管理员权限/i,
    {
      vi: 'Cần có quyền quản trị viên.',
      en: 'Admin privileges required.',
    },
  ],
  [
    /用户不存在/i,
    {
      vi: 'Tài khoản không tồn tại.',
      en: 'User does not exist.',
    },
  ],
  [
    /用户已被禁用/i,
    {
      vi: 'Tài khoản đã bị vô hiệu hóa.',
      en: 'User has been disabled.',
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
