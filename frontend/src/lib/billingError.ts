import { dialog } from './dialog'

import { getActiveLocale } from '../i18n/detect'

export const PRICING_PATH = '/pricing'

/** Đây có phải là lỗi chặn số dư/thanh toán không đủ? */
export function isBillingError(message: string) {
  return /余额不足|请先充值|Số dư không đủ|Vui lòng nạp tiền trước|Số dư tài khoản không đủ|402|insufficient_balance/i.test(message)
}

/** Chuyển tới trang định giá để nạp tiền */
export function goToTopup() {
  if (typeof window !== 'undefined') {
    window.location.assign(PRICING_PATH)
  }
}

/**
 * Một thông báo nhắc nhở về số dư không đủ sẽ hiện lên; nếu người dùng chọn nạp tiền, trang định giá sẽ được chuyển hướng.
 * @returns Liệu lỗi thanh toán đã được xử lý chưa
 */
export async function handleBillingError(
  err: unknown,
  navigate?: (path: string) => void,
): Promise<boolean> {
  const message = err instanceof Error ? err.message : String(err || '')
  if (!isBillingError(message)) return false
  const locale = getActiveLocale()
  const isZh = locale === 'zh'
  const isEn = locale === 'en'

  const title = isZh ? '余额不足' : isEn ? 'Insufficient Balance' : 'Số dư không đủ'
  const defaultMsg = isZh
    ? '当前余额不足以开始生成，请先充值。'
    : isEn
    ? 'Your current balance is insufficient to start generation. Please top up first.'
    : 'Số dư hiện tại không đủ để bắt đầu tạo, vui lòng nạp tiền trước.'
  const confirmText = isZh ? '去充值' : isEn ? 'Top up' : 'Đi nạp tiền'
  const cancelText = isZh ? '知道了' : isEn ? 'OK' : 'Đã hiểu'

  const go = await dialog.confirm({
    title,
    message: message || defaultMsg,
    confirmText,
    cancelText,
    tone: 'danger',
  })
  if (go) {
    if (navigate) navigate(PRICING_PATH)
    else goToTopup()
  }
  return true
}

/**
 * Chặn toàn cầu lớp API: 402 / Hướng dẫn nạp tiền sẽ bật lên khi số dư không đủ (lỗi ban đầu sẽ không được nuốt).
 */
export function notifyBillingErrorIfNeeded(status: number, message: string) {
  if (status === 402 || isBillingError(message)) {
    void handleBillingError(new Error(message))
  }
}
